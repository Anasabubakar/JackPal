"""
Smart content filter for JackPal.

Strips the parts of a document nobody wants to listen to:
- Title pages, copyright pages, ISBN blocks
- Table of contents / list of figures / list of tables
- Dedication, acknowledgements, foreword, preface (unless explicitly kept)
- Back-matter: bibliography, references, appendices, index
- Running headers/footers repeated on every page
- Blank / mostly-whitespace pages

Returns cleaned text + a summary of what was skipped.

Usage:
    from services.content_filter import filter_document
    result = filter_document(file_bytes, filename)
    # result.text      — listenable text
    # result.skipped   — list of section names that were removed
    # result.kept      — list of section names that were kept
"""

import io
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


# ── Config ────────────────────────────────────────────────────────────────────

# Sections whose titles match these → always strip (front/back matter)
_STRIP_TITLE_KEYWORDS = {
    "table of contents", "contents", "list of figures", "list of tables",
    "list of abbreviations", "abbreviations", "symbols",
    "copyright", "all rights reserved", "isbn", "publisher",
    "dedication", "dedicated to",
    "acknowledgement", "acknowledgements", "acknowledgment", "acknowledgments",
    "foreword", "preface",
    "bibliography", "references", "works cited", "further reading",
    "appendix", "appendices",
    "index", "glossary", "about the author", "about the authors",
    "colophon", "permissions",
}

# Page-level patterns that strongly indicate front/back matter
_PAGE_PATTERNS = [
    # TOC lines: "Some Title ............... 12" or "Chapter 1 .... 5"
    re.compile(r'^.{3,60}[\s\.]{4,}\d{1,4}\s*$', re.MULTILINE),
    # Copyright / ISBN block
    re.compile(r'isbn[\s\-:]?\d', re.IGNORECASE),
    re.compile(r'©\s*\d{4}', re.IGNORECASE),
    re.compile(r'all rights reserved', re.IGNORECASE),
    re.compile(r'first published', re.IGNORECASE),
    re.compile(r'printed in', re.IGNORECASE),
    # Index entries: "word, 12, 45–67"
    re.compile(r'^\w[\w\s,\-]{2,40},\s*\d', re.MULTILINE),
]

# These signal a page is REAL content (override strip rules)
_CONTENT_SIGNALS = [
    re.compile(r'[.!?]\s+[A-Z]'),          # sentences
    re.compile(r'\b(the|and|of|to|a|in|is|it|that|was|for)\b', re.IGNORECASE),
]

# Minimum avg chars per line to consider a page "dense" content
_MIN_CONTENT_DENSITY = 40


@dataclass
class FilterResult:
    text: str
    skipped: list[str] = field(default_factory=list)
    kept: list[str] = field(default_factory=list)
    original_word_count: int = 0
    filtered_word_count: int = 0

    @property
    def reduction_pct(self) -> float:
        if self.original_word_count == 0:
            return 0.0
        return round((1 - self.filtered_word_count / self.original_word_count) * 100, 1)


# ── Public entry point ────────────────────────────────────────────────────────

def filter_document(file_bytes: bytes, filename: str) -> FilterResult:
    """
    Main entry. Detects file type, extracts text with smart filtering.
    Falls back to plain text extraction if structural analysis fails.
    """
    ext = filename.rsplit(".", 1)[-1].lower()
    try:
        if ext == "pdf":
            return _filter_pdf(file_bytes)
        elif ext in ("doc", "docx"):
            return _filter_docx(file_bytes)
        else:
            text = file_bytes.decode("utf-8", errors="ignore")
            return _filter_plain_text(text)
    except Exception as e:
        # Never crash the whole pipeline — return raw text with a warning
        print(f"[ContentFilter] Filter failed ({e}), returning raw text")
        try:
            from services.extractor import extract_text
            raw = extract_text(file_bytes, filename)
        except Exception:
            raw = file_bytes.decode("utf-8", errors="ignore")
        return FilterResult(
            text=raw,
            skipped=[],
            kept=["(unfiltered — fallback)"],
            original_word_count=len(raw.split()),
            filtered_word_count=len(raw.split()),
        )


# ── PDF filtering ─────────────────────────────────────────────────────────────

def _filter_pdf(file_bytes: bytes) -> FilterResult:
    import fitz  # PyMuPDF

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    total_pages = len(doc)

    # ── Step 1: Get structural TOC from PDF metadata ──────────────────────────
    toc = doc.get_toc()          # [[level, title, page_num], ...]
    toc_page_titles: dict[int, str] = {}  # 0-indexed page → section title
    for level, title, page_num in toc:
        pg = page_num - 1  # fitz TOC is 1-indexed
        if 0 <= pg < total_pages:
            toc_page_titles[pg] = title

    # ── Step 2: Detect repeated headers/footers to strip ─────────────────────
    headers, footers = _detect_repeating_hf(doc)

    # ── Step 3: Score each page ───────────────────────────────────────────────
    pages: list[dict] = []
    for pg_idx in range(total_pages):
        page   = doc[pg_idx]
        blocks = page.get_text("blocks")   # [(x0,y0,x1,y1,text,block_no,block_type)]
        raw    = page.get_text()

        # Strip known headers/footers from raw
        for hf in headers | footers:
            raw = raw.replace(hf, "")
        raw = raw.strip()

        # Classify
        toc_title = toc_page_titles.get(pg_idx)
        classification, reason = _classify_page(raw, toc_title, pg_idx, total_pages)

        pages.append({
            "idx":    pg_idx,
            "raw":    raw,
            "title":  toc_title or _guess_page_title(raw),
            "keep":   classification == "content",
            "reason": reason,
        })

    doc.close()

    # ── Step 4: Find content start — skip leading front matter ────────────────
    # A document almost always starts with front matter then real content.
    # Once we hit 3+ consecutive content pages, we don't skip backwards.
    first_content = _find_content_start(pages)

    # ── Step 5: Build output ──────────────────────────────────────────────────
    kept_parts: list[str] = []
    skipped_names: list[str] = []
    kept_names:    list[str] = []

    for i, p in enumerate(pages):
        if i < first_content or not p["keep"]:
            skipped_names.append(p["title"] or f"Page {i+1}")
        else:
            kept_parts.append(p["raw"])
            kept_names.append(p["title"] or f"Page {i+1}")

    full_original = "\n".join(p["raw"] for p in pages)
    filtered_text = "\n\n".join(kept_parts)

    # De-duplicate blank lines
    filtered_text = re.sub(r'\n{3,}', '\n\n', filtered_text).strip()

    return FilterResult(
        text=filtered_text,
        skipped=_dedupe(skipped_names),
        kept=_dedupe(kept_names),
        original_word_count=len(full_original.split()),
        filtered_word_count=len(filtered_text.split()),
    )


def _classify_page(raw: str, toc_title: Optional[str], pg_idx: int, total_pages: int) -> tuple[str, str]:
    """Returns ('content'|'skip', reason_string)."""
    if not raw or len(raw) < 20:
        return "skip", "blank"

    # Use structural TOC title if available
    check_title = (toc_title or "").lower()
    for kw in _STRIP_TITLE_KEYWORDS:
        if kw in check_title:
            return "skip", f"title match: {kw}"

    # Detect TOC-style page: many lines ending with page numbers
    lines = [l.strip() for l in raw.split("\n") if l.strip()]
    toc_lines = sum(1 for l in lines if re.search(r'[\.\s]{3,}\d{1,4}\s*$', l))
    if len(lines) > 3 and toc_lines / len(lines) > 0.35:
        return "skip", "toc_pattern"

    # Detect copyright page
    for pat in _PAGE_PATTERNS[1:4]:  # isbn, ©, all rights reserved
        if pat.search(raw):
            return "skip", "copyright_block"

    # Detect index page (back matter): short alpha entries with page refs
    # Index pages typically have 2-3 columns and many ", 12" entries
    if pg_idx > total_pages * 0.75:  # only check last 25% of doc
        index_lines = sum(1 for l in lines if re.search(r',\s*\d{1,4}', l))
        if len(lines) > 10 and index_lines / len(lines) > 0.4:
            return "skip", "index_pattern"

    # Fallback: is it dense enough to be real content?
    if lines:
        avg_len = sum(len(l) for l in lines) / len(lines)
        if avg_len < 15 and len(lines) < 8:
            # Very short lines, very few of them → likely title/dedication page
            # But allow if it's not in the first few pages (could be chapter headings)
            if pg_idx < 10:
                return "skip", "sparse_front_matter"

    # Has sentence structure → keep
    for sig in _CONTENT_SIGNALS:
        if sig.search(raw):
            return "content", "sentence_detected"

    return "content", "default_keep"


def _find_content_start(pages: list[dict]) -> int:
    """Find the first page index where real content begins."""
    # Walk forward and find first run of 3+ content pages
    run = 0
    for i, p in enumerate(pages):
        if p["keep"]:
            run += 1
            if run >= 2:
                # Return start of this run
                return max(0, i - run + 1)
        else:
            run = 0
    # Nothing found — return 0 (keep everything)
    return 0


def _detect_repeating_hf(doc) -> tuple[set, set]:
    """
    Detect text that appears on almost every page (headers/footers).
    Uses PyMuPDF block positions — top 8% = header, bottom 8% = footer.
    """
    from collections import Counter
    header_cands: Counter = Counter()
    footer_cands: Counter = Counter()
    total = len(doc)

    for page in doc:
        h = page.rect.height
        blocks = page.get_text("blocks")
        for x0, y0, x1, y1, text, *_ in blocks:
            t = text.strip()
            if not t or len(t) > 120:
                continue
            if y0 < h * 0.08:
                header_cands[t] += 1
            elif y1 > h * 0.92:
                footer_cands[t] += 1

    threshold = max(3, total * 0.4)
    headers = {t for t, c in header_cands.items() if c >= threshold}
    footers = {t for t, c in footer_cands.items() if c >= threshold}
    return headers, footers


def _guess_page_title(raw: str) -> str:
    """Try to guess a page title from its first non-empty line."""
    for line in raw.split("\n"):
        l = line.strip()
        if l and len(l) < 80:
            return l[:60]
    return ""


# ── DOCX filtering ────────────────────────────────────────────────────────────

def _filter_docx(file_bytes: bytes) -> FilterResult:
    from docx import Document

    doc      = Document(io.BytesIO(file_bytes))
    sections: list[dict] = []
    current_title = "Document"
    current_paras: list[str] = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        # Heading detection via paragraph style
        style = (para.style.name or "").lower()
        if "heading" in style or _looks_like_heading(text):
            if current_paras:
                sections.append({"title": current_title, "text": "\n".join(current_paras)})
            current_title = text
            current_paras = []
        else:
            current_paras.append(text)

    if current_paras:
        sections.append({"title": current_title, "text": "\n".join(current_paras)})

    original_words = sum(len(s["text"].split()) for s in sections)
    kept_parts, skipped_names, kept_names = [], [], []

    for s in sections:
        title_lc = s["title"].lower()
        if any(kw in title_lc for kw in _STRIP_TITLE_KEYWORDS):
            skipped_names.append(s["title"])
        else:
            kept_parts.append(s["text"])
            kept_names.append(s["title"])

    filtered = "\n\n".join(kept_parts)
    filtered = re.sub(r'\n{3,}', '\n\n', filtered).strip()

    return FilterResult(
        text=filtered,
        skipped=_dedupe(skipped_names),
        kept=_dedupe(kept_names),
        original_word_count=original_words,
        filtered_word_count=len(filtered.split()),
    )


def _looks_like_heading(text: str) -> bool:
    """Heuristic: short ALL CAPS or Title Case line likely a heading."""
    if len(text) > 80:
        return False
    if text.isupper() and len(text) > 3:
        return True
    if re.match(r'^(CHAPTER|UNIT|SECTION|PART|MODULE)\s+\w', text, re.IGNORECASE):
        return True
    return False


# ── Plain text filtering ──────────────────────────────────────────────────────

def _filter_plain_text(text: str) -> FilterResult:
    """
    For raw .txt files — detect section headings and strip known front/back matter.
    """
    from services.chapters import _detect_headings  # reuse existing logic

    sections = _detect_headings(text)
    original_words = len(text.split())

    if not sections:
        return FilterResult(
            text=text,
            skipped=[],
            kept=["Full document"],
            original_word_count=original_words,
            filtered_word_count=original_words,
        )

    kept_parts, skipped_names, kept_names = [], [], []
    for s in sections:
        title_lc = s["title"].lower()
        if any(kw in title_lc for kw in _STRIP_TITLE_KEYWORDS):
            skipped_names.append(s["title"])
        else:
            kept_parts.append(s["text"])
            kept_names.append(s["title"])

    filtered = "\n\n".join(kept_parts)
    filtered = re.sub(r'\n{3,}', '\n\n', filtered).strip()

    return FilterResult(
        text=filtered,
        skipped=_dedupe(skipped_names),
        kept=_dedupe(kept_names),
        original_word_count=original_words,
        filtered_word_count=len(filtered.split()),
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _dedupe(names: list[str]) -> list[str]:
    seen = set()
    out  = []
    for n in names:
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out
