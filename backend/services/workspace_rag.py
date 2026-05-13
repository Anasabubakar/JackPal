"""
Workspace RAG — notebook-scoped multi-source retrieval with citations.

The single-document RAG in ``services.rag`` is per-doc (chunk → embed → query).
A workspace notebook has *many* sources (uploaded files, pasted text, URLs,
YouTube transcripts, Drive imports). For NotebookLM-style chat with citations
we need to:

  1. Index every source independently (reusing ``services.rag``).
  2. Retrieve the top-K most relevant excerpts *per source*.
  3. Merge, deduplicate, and rerank across sources so the prompt sees the
     globally best passages — not just the top hits from one fat source.
  4. Carry provenance (source_id, title, type, excerpt) through to the
     caller so the LLM answer can be cited.

This module is sync-only and safe to call from FastAPI handlers. It never
loads the embedding model unless at least one source has content.
"""
from __future__ import annotations

import re
from typing import Iterable

from services import rag


# ── Tunables ───────────────────────────────────────────────────────────────────

DEFAULT_TOP_K_PER_SOURCE = 4
DEFAULT_MAX_CHUNKS       = 12
DEFAULT_EXCERPT_WORDS    = 110   # how much of a chunk to surface in citations


# ── Public types ───────────────────────────────────────────────────────────────

Passage = dict
"""
Shape:
    {
        "source_id":  str,
        "title":      str,
        "type":       str,            # "file" / "url" / "youtube" / "drive" / "text" / "note"
        "url":        str | None,
        "chunk":      str,            # full retrieved chunk (used as prompt context)
        "excerpt":    str,            # short quote suitable for UI display
        "score":      float,          # cosine similarity to the query (0..1)
        "rank":       int,            # final rank after cross-source merge
    }
"""


# ── Retrieval ──────────────────────────────────────────────────────────────────

def notebook_retrieve(
    sources: Iterable[dict],
    query: str,
    *,
    top_k_per_source: int = DEFAULT_TOP_K_PER_SOURCE,
    max_chunks: int = DEFAULT_MAX_CHUNKS,
    excerpt_words: int = DEFAULT_EXCERPT_WORDS,
) -> list[Passage]:
    """
    Retrieve the most relevant excerpts from a list of workspace sources.

    ``sources`` is the raw output of ``local_storage.list_sources`` — each
    record needs ``id``, ``title``, ``type`` and ``fulltext``.

    Sources with no ``fulltext`` are skipped silently (they may still be
    extracting). Indexing is lazy — each source gets ``rag.index_document``
    called once on first query; subsequent queries hit the in-memory index.
    """
    query = (query or "").strip()
    if not query:
        return []

    # 1. Make sure every source with content is indexed.
    indexed: list[dict] = []
    for source in sources:
        text = (source.get("fulltext") or "").strip()
        if not text:
            continue
        try:
            rag.index_document(source["id"], text)
            indexed.append(source)
        except Exception as exc:
            # Bad source shouldn't kill the whole retrieve; log and skip.
            print(f"[workspace-rag] index failed for {source.get('id')}: {exc}")

    if not indexed:
        return []

    # 2. Per-source vector retrieval. We deliberately bypass LightRAG here —
    #    we need raw chunks for citations, not a synthesized graph answer.
    candidates: list[Passage] = []
    for source in indexed:
        chunks = _vector_top_k(source["id"], query, top_k_per_source)
        for chunk, score in chunks:
            candidates.append({
                "source_id": source["id"],
                "title":     source.get("title") or "Untitled source",
                "type":      source.get("type", "text"),
                "url":       source.get("url"),
                "chunk":     chunk,
                "excerpt":   _make_excerpt(chunk, query, excerpt_words),
                "score":     float(score),
                "rank":      0,
            })

    if not candidates:
        return []

    # 3. Dedupe near-identical chunks (same first 60 chars) across sources.
    seen: set[str] = set()
    deduped: list[Passage] = []
    for cand in sorted(candidates, key=lambda p: -p["score"]):
        key = _dedup_key(cand["chunk"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(cand)

    # 4. Cap to ``max_chunks`` and assign final rank (1-based, used as the
    #    citation index in the prompt + UI).
    top = deduped[:max_chunks]
    for i, p in enumerate(top, start=1):
        p["rank"] = i
    return top


def _vector_top_k(doc_id: str, query: str, top_k: int) -> list[tuple[str, float]]:
    """Return ``(chunk, score)`` pairs ranked by cosine similarity."""
    # Reuse the loaded index for similarity computation. We can't use
    # ``rag.retrieve_relevant`` directly because (a) it may dispatch to
    # LightRAG (synthesized prose, not chunks) and (b) it doesn't return
    # scores. So we replicate the vector path here.
    if not rag._load_index(doc_id):
        return []
    entry = rag._index.get(doc_id)
    if not entry:
        return []
    embeddings = entry["embeddings"]
    chunks: list[str] = entry["chunks"]
    if not chunks:
        return []
    try:
        import numpy as np
        model = rag._get_model()
        q = model.encode([query], normalize_embeddings=True)[0].astype(np.float32)
        scores = embeddings @ q
        n = min(top_k, len(chunks))
        # argpartition is faster than full sort for large indexes
        top_idx = np.argpartition(scores, -n)[-n:]
        top_idx = top_idx[np.argsort(-scores[top_idx])]
        return [(chunks[i], float(scores[i])) for i in top_idx.tolist()]
    except Exception as exc:
        print(f"[workspace-rag] vector retrieve failed for {doc_id}: {exc}")
        return []


# ── Prompt formatting ─────────────────────────────────────────────────────────

def build_numbered_context(passages: list[Passage]) -> str:
    """
    Render passages as a numbered context block for the answer prompt:

        [1] from "Photosynthesis Notes" (file):
        Light reaches the chloroplasts where chlorophyll captures …

        [2] from "Khan Academy — ATP" (youtube):
        ATP is the energy currency of the cell …
    """
    if not passages:
        return ""
    parts: list[str] = []
    for p in passages:
        head = f"[{p['rank']}] from \"{p['title']}\" ({p['type']})"
        if p.get("url"):
            head += f" — {p['url']}"
        parts.append(f"{head}:\n{p['chunk'].strip()}")
    return "\n\n".join(parts)


CITATION_INSTRUCTION = (
    "When you use information from the excerpts above, cite the relevant "
    "passage by its bracketed number, e.g. \"... captured by chlorophyll [1] "
    "and converted into ATP [2].\" Place citations immediately after the "
    "claim they support. Do NOT invent citations or use numbers that are "
    "not in the excerpts."
)


def build_cited_question(question: str) -> str:
    """Suffix the user question with the citation instruction."""
    return f"{question.strip()}\n\n({CITATION_INSTRUCTION})"


# ── UI-friendly citation payload ──────────────────────────────────────────────

def to_citations(passages: list[Passage]) -> list[dict]:
    """Slim, JSON-safe citation list for the chat API + UI."""
    return [
        {
            "index":     p["rank"],
            "source_id": p["source_id"],
            "title":     p["title"],
            "type":      p["type"],
            "url":       p.get("url"),
            "excerpt":   p["excerpt"],
            "score":     round(p["score"], 4),
        }
        for p in passages
    ]


# ── Helpers ────────────────────────────────────────────────────────────────────

_WS_RE = re.compile(r"\s+")


def _make_excerpt(chunk: str, query: str, max_words: int) -> str:
    """Trim a chunk down to a query-centred excerpt for UI display."""
    chunk = _WS_RE.sub(" ", chunk).strip()
    words = chunk.split(" ")
    if len(words) <= max_words:
        return chunk

    # Try to centre the window on the first matching query word.
    q_words = {w.lower() for w in re.findall(r"\w+", query) if len(w) > 3}
    pivot = 0
    if q_words:
        for i, w in enumerate(words):
            if re.sub(r"\W", "", w.lower()) in q_words:
                pivot = i
                break

    half = max_words // 2
    start = max(0, pivot - half)
    end = min(len(words), start + max_words)
    start = max(0, end - max_words)
    snippet = " ".join(words[start:end])
    prefix = "… " if start > 0 else ""
    suffix = " …" if end < len(words) else ""
    return f"{prefix}{snippet}{suffix}"


def _dedup_key(chunk: str) -> str:
    """Short signature of a chunk used to detect near-duplicates across sources."""
    norm = _WS_RE.sub(" ", chunk).strip().lower()
    return norm[:120]
