"""
RAG (Retrieval-Augmented Generation) service for JackPal.

Two retrieval modes:
  1. Vector RAG  — sentence-transformers all-MiniLM-L6-v2, local, instant
  2. LightRAG    — knowledge graph + vector, uses Gemini/Groq for entity extraction
                   Better cross-chapter reasoning; slower to index (background)

Pipeline:
  1. clean_text()        — strip noise (page numbers, headers, bibliography, etc.)
  2. index_document()    — vector embed + kick off LightRAG indexing in background
  3. retrieve_relevant() — LightRAG hybrid query if ready, else vector RAG fallback

Usage:
  threading.Thread(target=index_document, args=(doc_id, text), daemon=True).start()
  chunks = retrieve_relevant(doc_id, "photosynthesis and chloroplasts", top_k=15)
"""
import asyncio
import os
import re
import numpy as np
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────────

EMBED_MODEL   = "all-MiniLM-L6-v2"   # 22MB, multilingual-friendly, fast CPU
CHUNK_WORDS   = 150                    # ~45s of TTS audio per chunk
CHUNK_OVERLAP = 25                     # overlap prevents concept splitting at boundaries

RAG_DIR       = Path(__file__).parent.parent / "dev_storage" / "rag"
LIGHTRAG_DIR  = Path(__file__).parent.parent / "dev_storage" / "lightrag"
RAG_DIR.mkdir(parents=True, exist_ok=True)
LIGHTRAG_DIR.mkdir(parents=True, exist_ok=True)

# LLM keys for LightRAG entity extraction (prefers Gemini, falls back to Groq)
_GOOGLE_AI_KEY = os.environ.get("GOOGLE_AI_API_KEY", "")
_GROQ_KEY      = os.environ.get("GROQ_API_KEY", "")

_model = None
_index: dict[str, dict] = {}   # doc_id → {embeddings: np.ndarray, chunks: list[str]}
_lightrag_ready: set[str] = set()   # doc_ids with completed LightRAG graph


# ── Model ──────────────────────────────────────────────────────────────────────

def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        print("[RAG] Loading all-MiniLM-L6-v2 (22MB, one-time)...")
        _model = SentenceTransformer(EMBED_MODEL)
        print("[RAG] Embedding model ready.")
    return _model


# ── Text cleaning ───────────────────────────────────────────────────────────────

_NOISE_RE = [
    re.compile(r'^\d{1,4}$'),                                              # lone page numbers
    re.compile(r'^page\s+\d+', re.I),                                     # "Page 12"
    re.compile(r'^\s*[-–—]+\s*\d+\s*[-–—]+\s*$'),                        # — 12 —
    re.compile(r'^(fig(ure)?|table|chart|diagram)\.?\s*\d+[\.\d]*\s*[:\-]', re.I),  # Figure 3.1:
    re.compile(r'^\s*©.+$'),                                              # copyright
    re.compile(r'^\s*isbn\s+[\d\-x]+', re.I),                            # ISBN
    re.compile(r'^\s*doi\s*:\s*10\.\d+', re.I),                          # DOI
    re.compile(r'^\s*https?://', re.I),                                   # bare URLs
    re.compile(r'^\s*e-?mail\s*:', re.I),                                 # email labels
    re.compile(r'^\s*printed in\s+', re.I),                              # "Printed in UK"
    re.compile(r'^\s*(published|first published|reprinted)', re.I),      # publication info
]

_SKIP_SECTION_RE = re.compile(
    r'^(references|bibliography|works cited|further reading|'
    r'notes|endnotes|footnotes|acknowledgements?|'
    r'list of (figures|tables|abbreviations))\s*$',
    re.I,
)

# Front matter sections to skip before main content begins
_FRONT_MATTER_RE = re.compile(
    r'^(table of contents|contents|preface|foreword|dedication|'
    r'abstract|about the author|about this book|how to use this book|'
    r'copyright|legal notice|disclaimer|permissions)\s*$',
    re.I,
)

# A line that looks like a Table of Contents entry: "Chapter 1 ..... 14"
_TOC_LINE_RE = re.compile(r'^.{3,60}\.{2,}\s*\d{1,4}\s*$')

# Lines that signal main content has started
_CONTENT_START_RE = re.compile(
    r'^(chapter\s+[1one]|unit\s+[1one]|section\s+[1one]|introduction|'
    r'1\.\s+|1\s+[A-Z])',
    re.I,
)


def clean_text(text: str) -> str:
    """
    Remove noise from extracted PDF/DOCX text before embedding or Groq.

    Strips:
      - Front matter (title page, TOC, preface, dedication, copyright)
      - Table of contents entries (dotted lines)
      - Page numbers (standalone digits)
      - Figure/table captions
      - Bibliography / references section (at end)
      - Copyright/ISBN/DOI/URL lines
      - ALL-CAPS short decorative headers

    Preserves: all actual educational content from Chapter 1 onwards.
    """
    lines = text.split('\n')
    cleaned: list[str] = []
    in_skip_section = False
    content_started = False

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Always keep blank lines once content has started
        if not stripped:
            if content_started:
                cleaned.append('')
            continue

        # ── Front-matter detection (before main content) ──────────────────────
        if not content_started:
            # Detect front-matter section headers
            if _FRONT_MATTER_RE.match(stripped):
                continue

            # Skip TOC dotted entries like "Chapter 1 ............. 14"
            if _TOC_LINE_RE.match(stripped):
                continue

            # Check if main content has started
            if _CONTENT_START_RE.match(stripped):
                content_started = True
            elif len(lines) > 100 and i > len(lines) // 6:
                # Heuristic: if we're past the first 1/6 of the doc and
                # no clear chapter marker, assume content has started
                content_started = True
            else:
                # Skip pre-content lines (title page, etc.)
                continue

        # ── End-of-document noise detection ──────────────────────────────────
        if _SKIP_SECTION_RE.match(stripped):
            in_skip_section = True
            continue
        if in_skip_section:
            continue

        # ── Line-level noise removal ──────────────────────────────────────────
        if any(p.match(stripped) for p in _NOISE_RE):
            continue

        # Skip TOC dotted entries that appear mid-document
        if _TOC_LINE_RE.match(stripped):
            continue

        words = stripped.split()
        # Skip very short ALL-CAPS lines (running headers, decorative labels)
        if (
            1 <= len(words) <= 4
            and stripped.upper() == stripped
            and not stripped[0].isdigit()
            and not any(c in stripped for c in '()[]{}=+%')
        ):
            continue

        cleaned.append(line)

    # Collapse 3+ consecutive blank lines to 1
    result = re.sub(r'(\n\s*){3,}', '\n\n', '\n'.join(cleaned))
    return result.strip()


# ── Chunking ────────────────────────────────────────────────────────────────────

def _chunk_text(text: str) -> list[str]:
    """Split into overlapping word-chunks for embedding."""
    words = text.split()
    chunks: list[str] = []
    step = CHUNK_WORDS - CHUNK_OVERLAP
    for i in range(0, len(words), step):
        chunk = ' '.join(words[i: i + CHUNK_WORDS])
        if chunk.strip():
            chunks.append(chunk)
    return chunks


# ── Indexing ────────────────────────────────────────────────────────────────────

def index_document(doc_id: str, text: str) -> int:
    """
    Clean, chunk, and embed the document. Persists to disk as compressed .npz.
    Also kicks off LightRAG knowledge graph indexing in a background thread.
    Safe to call multiple times — skips if already indexed.
    Returns chunk count.
    """
    index_file = RAG_DIR / f"{doc_id}.npz"

    # Load from disk if already indexed
    if index_file.exists() and doc_id not in _index:
        try:
            data = np.load(index_file, allow_pickle=True)
            _index[doc_id] = {
                "embeddings": data["embeddings"],
                "chunks": data["chunks"].tolist(),
            }
            print(f"[RAG] Loaded index for {doc_id} ({len(_index[doc_id]['chunks'])} chunks from disk)")
            _maybe_start_lightrag_indexing(doc_id, text)
            return len(_index[doc_id]["chunks"])
        except Exception as e:
            print(f"[RAG] Failed to load disk index for {doc_id}: {e} — re-indexing")

    if doc_id in _index:
        return len(_index[doc_id]["chunks"])

    clean = clean_text(text)
    chunks = _chunk_text(clean)
    if not chunks:
        return 0

    try:
        model = _get_model()
        print(f"[RAG] Embedding {len(chunks)} chunks for {doc_id}...")
        embeddings = model.encode(
            chunks,
            batch_size=64,
            show_progress_bar=False,
            normalize_embeddings=True,
        ).astype(np.float32)

        _index[doc_id] = {"embeddings": embeddings, "chunks": chunks}

        np.savez_compressed(
            index_file,
            embeddings=embeddings,
            chunks=np.array(chunks, dtype=object),
        )
        size_kb = index_file.stat().st_size // 1024
        print(f"[RAG] Indexed {len(chunks)} chunks for {doc_id} → {size_kb}KB on disk")

        # Start LightRAG knowledge graph build in background
        _maybe_start_lightrag_indexing(doc_id, text)

        return len(chunks)

    except Exception as e:
        print(f"[RAG] Indexing failed for {doc_id}: {e}")
        return 0


def _load_index(doc_id: str) -> bool:
    """Load index from disk into memory if not already loaded. Returns success."""
    if doc_id in _index:
        return True
    index_file = RAG_DIR / f"{doc_id}.npz"
    if not index_file.exists():
        return False
    try:
        data = np.load(index_file, allow_pickle=True)
        _index[doc_id] = {
            "embeddings": data["embeddings"],
            "chunks": data["chunks"].tolist(),
        }
        return True
    except Exception as e:
        print(f"[RAG] Failed to load index for {doc_id}: {e}")
        return False


# ── Retrieval ───────────────────────────────────────────────────────────────────

def retrieve_relevant(
    doc_id: str,
    query: str,
    top_k: int = 15,
    text: str | None = None,
) -> list[str]:
    """
    Return the most semantically relevant content for a query.

    Tries LightRAG hybrid retrieval first (knowledge graph + vector).
    Falls back to pure vector cosine similarity if LightRAG isn't ready.
    """
    if not _load_index(doc_id):
        if text:
            n = index_document(doc_id, text)
            if n == 0:
                return []
        else:
            return []

    # ── LightRAG path: knowledge graph + vector hybrid ────────────────────────
    if doc_id in _lightrag_ready or _is_lightrag_indexed(doc_id):
        try:
            result = _lightrag_query_sync(doc_id, query)
            if result and len(result.strip()) > 50:
                _lightrag_ready.add(doc_id)
                print(f"[RAG] LightRAG hybrid retrieval for '{query[:50]}'")
                return [result]
        except Exception as e:
            print(f"[RAG] LightRAG query failed ({e}), falling back to vector RAG")

    # ── Vector RAG fallback ───────────────────────────────────────────────────
    entry = _index.get(doc_id)
    if not entry:
        return []

    embeddings: np.ndarray = entry["embeddings"]
    chunks: list[str] = entry["chunks"]

    try:
        model = _get_model()
        query_emb = model.encode([query], normalize_embeddings=True)[0].astype(np.float32)
        scores = embeddings @ query_emb
        n = min(top_k, len(chunks))
        top_idx = np.argpartition(scores, -n)[-n:]
        top_idx_sorted = sorted(top_idx.tolist())
        return [chunks[i] for i in top_idx_sorted]

    except Exception as e:
        print(f"[RAG] Vector retrieval failed for {doc_id}: {e}")
        return []


# ── Fast keyword fallback ───────────────────────────────────────────────────────

def keyword_fallback(text: str, query: str, max_words: int = 4000) -> str:
    """O(n) keyword search — used when vector index isn't ready yet.
    Scores lines by query-word overlap, returns top hits up to max_words.
    No model needed — instant.
    """
    query_words = {w.lower() for w in query.split() if len(w) > 2}
    if not query_words:
        return " ".join(text.split()[:max_words])

    lines = [ln.strip() for ln in text.split('\n') if len(ln.strip()) > 30]
    if not lines:
        words = text.split()
        lines = [" ".join(words[i:i+100]) for i in range(0, len(words), 100)]

    scored = sorted(
        ((sum(1 for w in query_words if w in ln.lower()), ln) for ln in lines),
        key=lambda x: -x[0],
    )

    parts: list[str] = []
    count = 0
    for _, ln in scored:
        wc = len(ln.split())
        if count + wc > max_words:
            break
        parts.append(ln)
        count += wc

    return "\n\n".join(parts) if parts else " ".join(text.split()[:max_words])


# ── Utilities ───────────────────────────────────────────────────────────────────

def clear_index(doc_id: str):
    """Remove a document's vector index and LightRAG graph from memory and disk."""
    _index.pop(doc_id, None)
    _lightrag_ready.discard(doc_id)
    index_file = RAG_DIR / f"{doc_id}.npz"
    if index_file.exists():
        index_file.unlink()
    lg_dir = LIGHTRAG_DIR / doc_id
    if lg_dir.exists():
        import shutil
        shutil.rmtree(lg_dir, ignore_errors=True)
    print(f"[RAG] Cleared index for {doc_id}")


def is_indexed(doc_id: str) -> bool:
    """Check if a document has been indexed (in memory or on disk)."""
    return doc_id in _index or (RAG_DIR / f"{doc_id}.npz").exists()


def get_index_stats(doc_id: str) -> dict:
    """Return index stats for a document."""
    if _load_index(doc_id):
        entry = _index.get(doc_id, {})
        chunks = entry.get("chunks", [])
        return {
            "indexed": True,
            "chunks": len(chunks),
            "words": sum(len(c.split()) for c in chunks),
            "lightrag": doc_id in _lightrag_ready or _is_lightrag_indexed(doc_id),
        }
    return {"indexed": False, "chunks": 0, "words": 0, "lightrag": False}


# ── LightRAG (knowledge graph + vector hybrid) ─────────────────────────────────

def _is_lightrag_indexed(doc_id: str) -> bool:
    """Check if LightRAG graph has been built for this document."""
    lg_dir = LIGHTRAG_DIR / doc_id
    return lg_dir.exists() and any(lg_dir.iterdir())


def _build_lightrag_instance(doc_id: str):
    """Create a configured LightRAG instance for a document. Returns None if unavailable."""
    try:
        from lightrag import LightRAG, QueryParam  # noqa: F401 — availability check
        from lightrag.llm.openai import openai_complete_if_cache
        from lightrag.utils import EmbeddingFunc
    except ImportError:
        return None, None

    working_dir = str(LIGHTRAG_DIR / doc_id)
    Path(working_dir).mkdir(parents=True, exist_ok=True)

    # Pick LLM: Gemini preferred (large context), Groq fallback
    if _GOOGLE_AI_KEY:
        async def _llm_func(prompt, system_prompt=None, history_messages=[], **kwargs):
            return await openai_complete_if_cache(
                "gemini-2.0-flash", prompt,
                system_prompt=system_prompt,
                history_messages=history_messages,
                api_key=_GOOGLE_AI_KEY,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                **kwargs,
            )
    elif _GROQ_KEY:
        async def _llm_func(prompt, system_prompt=None, history_messages=[], **kwargs):
            return await openai_complete_if_cache(
                "llama-3.3-70b-versatile", prompt,
                system_prompt=system_prompt,
                history_messages=history_messages,
                api_key=_GROQ_KEY,
                base_url="https://api.groq.com/openai/v1/",
                **kwargs,
            )
    else:
        return None, None

    async def _embed_func(texts: list[str]) -> np.ndarray:
        model = _get_model()
        return model.encode(texts, normalize_embeddings=True).astype(np.float32)

    from lightrag import LightRAG
    from lightrag.utils import EmbeddingFunc

    rag = LightRAG(
        working_dir=working_dir,
        llm_model_func=_llm_func,
        embedding_func=EmbeddingFunc(
            embedding_dim=384,   # all-MiniLM-L6-v2 output dimension
            max_token_size=512,
            func=_embed_func,
        ),
    )
    from lightrag import QueryParam
    return rag, QueryParam


def _run_lightrag_index(doc_id: str, text: str):
    """Run LightRAG async insert in a dedicated event loop (called from thread)."""
    rag, _ = _build_lightrag_instance(doc_id)
    if rag is None:
        return
    try:
        print(f"[RAG] LightRAG: building knowledge graph for {doc_id}...")
        clean = clean_text(text)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(rag.ainsert(clean))
        loop.close()
        _lightrag_ready.add(doc_id)
        print(f"[RAG] LightRAG: knowledge graph ready for {doc_id}")
    except Exception as e:
        print(f"[RAG] LightRAG indexing failed for {doc_id}: {e}")


def _maybe_start_lightrag_indexing(doc_id: str, text: str):
    """Start LightRAG graph build in a daemon thread if not already done."""
    if not (_GOOGLE_AI_KEY or _GROQ_KEY):
        return
    if doc_id in _lightrag_ready or _is_lightrag_indexed(doc_id):
        _lightrag_ready.add(doc_id)
        return
    import threading
    threading.Thread(target=_run_lightrag_index, args=(doc_id, text), daemon=True).start()


def _lightrag_query_in_thread(doc_id: str, query: str) -> str:
    """Run LightRAG query in a dedicated thread with its own event loop.
    Must be called from a worker thread (not the event loop thread).
    """
    rag, QueryParam = _build_lightrag_instance(doc_id)
    if rag is None:
        return ""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            rag.aquery(query, param=QueryParam(mode="hybrid"))
        )
        loop.close()
        return result or ""
    except Exception as e:
        print(f"[RAG] LightRAG query error: {e}")
        return ""


def _lightrag_query_sync(doc_id: str, query: str) -> str:
    """Run a LightRAG hybrid query safely from any context (sync or async).
    Dispatches to a worker thread to avoid conflicting with the running event loop.
    """
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        try:
            future = executor.submit(_lightrag_query_in_thread, doc_id, query)
            return future.result(timeout=30)
        except concurrent.futures.TimeoutError:
            print("[RAG] LightRAG query timed out after 30s")
            return ""
        except Exception as e:
            print(f"[RAG] LightRAG query failed: {e}")
            return ""
