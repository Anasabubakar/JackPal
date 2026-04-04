"""
RAG (Retrieval-Augmented Generation) service for JackPal.

Embeds document chunks with sentence-transformers (all-MiniLM-L6-v2).
Runs entirely locally — no API keys, no external calls.
Model: 22MB, CPU-fast, ~50ms per query after first load.

Pipeline:
  1. clean_text()       — strip noise (page numbers, headers, bibliography, etc.)
  2. index_document()   — chunk + embed + persist to disk as .npz
  3. retrieve_relevant() — cosine similarity retrieval, returns doc-order chunks

Usage:
  # Background indexing after upload
  threading.Thread(target=index_document, args=(doc_id, text), daemon=True).start()

  # Topic-focused podcast / summarization
  chunks = retrieve_relevant(doc_id, "photosynthesis and chloroplasts", top_k=15)
  text_for_podcast = " ".join(chunks)
"""
import re
import numpy as np
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────────

EMBED_MODEL   = "all-MiniLM-L6-v2"   # 22MB, multilingual-friendly, fast CPU
CHUNK_WORDS   = 150                    # ~45s of TTS audio per chunk
CHUNK_OVERLAP = 25                     # overlap prevents concept splitting at boundaries

RAG_DIR = Path(__file__).parent.parent / "dev_storage" / "rag"
RAG_DIR.mkdir(parents=True, exist_ok=True)

_model = None
_index: dict[str, dict] = {}   # doc_id → {embeddings: np.ndarray, chunks: list[str]}


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
    Safe to call multiple times — skips if already indexed.
    Returns chunk count. Designed to run in a daemon thread.
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
            normalize_embeddings=True,   # pre-normalize → cosine = dot product
        ).astype(np.float32)

        _index[doc_id] = {"embeddings": embeddings, "chunks": chunks}

        # Persist — allow_pickle needed for string object arrays
        np.savez_compressed(
            index_file,
            embeddings=embeddings,
            chunks=np.array(chunks, dtype=object),
        )
        size_kb = index_file.stat().st_size // 1024
        print(f"[RAG] Indexed {len(chunks)} chunks for {doc_id} → {size_kb}KB on disk")
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
    Return the top_k most semantically relevant chunks in document order.

    Args:
        doc_id:  Document ID (used to look up pre-built index).
        query:   The topic or question to retrieve content for.
        top_k:   Number of chunks to return (~2250 words at top_k=15).
        text:    Raw document text — used to build index on-the-fly if not yet indexed.

    Returns:
        List of text chunks in original document order (coherent reading).
    """
    if not _load_index(doc_id):
        if text:
            n = index_document(doc_id, text)
            if n == 0:
                return []
        else:
            return []

    entry = _index.get(doc_id)
    if not entry:
        return []

    embeddings: np.ndarray = entry["embeddings"]
    chunks: list[str] = entry["chunks"]

    try:
        model = _get_model()
        query_emb = model.encode([query], normalize_embeddings=True)[0].astype(np.float32)

        # Cosine similarity (embeddings are pre-normalized → just dot product)
        scores = embeddings @ query_emb

        n = min(top_k, len(chunks))
        # argpartition is O(n) vs argsort O(n log n) — faster for large indices
        top_idx = np.argpartition(scores, -n)[-n:]
        # Sort by document position (not score) → coherent reading order
        top_idx_sorted = sorted(top_idx.tolist())

        return [chunks[i] for i in top_idx_sorted]

    except Exception as e:
        print(f"[RAG] Retrieval failed for {doc_id}: {e}")
        return []


# ── Utilities ───────────────────────────────────────────────────────────────────

def clear_index(doc_id: str):
    """Remove a document's index from memory and disk."""
    _index.pop(doc_id, None)
    index_file = RAG_DIR / f"{doc_id}.npz"
    if index_file.exists():
        index_file.unlink()
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
        }
    return {"indexed": False, "chunks": 0, "words": 0}
