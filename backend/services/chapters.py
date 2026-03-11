"""
Chapter/section detection and splitting.
Splits documents into navigable sections students can jump between.
"""
import re

WORDS_PER_CHAPTER = 500  # ~3 mins audio per chapter

# Sections that are non-core content — students can safely skip these
_SKIP_KEYWORDS = {
    "reference", "bibliography", "appendix", "table of contents",
    "abstract", "acknowledgement", "acknowledgment", "index",
    "glossary", "preface", "foreword", "dedication", "copyright",
    "list of figure", "list of table",
}


def _is_skippable(title: str) -> bool:
    t = title.lower()
    return any(kw in t for kw in _SKIP_KEYWORDS)


def detect_chapters(text: str) -> list[dict]:
    """
    Try to detect real chapter/section headings first.
    Fall back to equal word-count splits if no headings found.
    Returns list of {title, text, word_count, start_word}
    """
    chapters = _detect_headings(text)
    if len(chapters) >= 2:
        return chapters
    return _split_by_words(text)


def _detect_headings(text: str) -> list[dict]:
    """Detect chapter/section headings from common academic document patterns."""
    heading_patterns = [
        r'^(CHAPTER\s+\w+[:\s].{3,60})$',
        r'^(Chapter\s+\w+[:\s].{3,60})$',
        r'^(\d+\.\s+[A-Z][^\n]{3,60})$',
        r'^(\d+\.\d+\s+[A-Z][^\n]{3,60})$',
        r'^([A-Z][A-Z\s]{4,40})$',           # ALL CAPS headings
        r'^(UNIT\s+\w+[:\s].{3,60})$',
        r'^(TOPIC\s+\w+[:\s].{3,60})$',
        r'^(SECTION\s+\w+[:\s].{3,60})$',
    ]

    combined = '|'.join(heading_patterns)
    lines = text.split('\n')
    splits = []
    current_title = "Introduction"
    current_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped and re.match(combined, stripped, re.MULTILINE):
            if current_lines:
                body = '\n'.join(current_lines).strip()
                if body:
                    splits.append({"title": current_title, "text": body})
            current_title = stripped.title()
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        body = '\n'.join(current_lines).strip()
        if body:
            splits.append({"title": current_title, "text": body})

    # Annotate with word counts and start positions
    result = []
    start_word = 0
    for s in splits:
        wc = len(s["text"].split())
        result.append({
            "title": s["title"],
            "text": s["text"],
            "word_count": wc,
            "start_word": start_word,
            "is_skippable": _is_skippable(s["title"]),
        })
        start_word += wc

    return result


def _split_by_words(text: str) -> list[dict]:
    """Split into equal chunks when no headings detected."""
    words = text.split()
    chapters = []
    chapter_num = 1
    i = 0

    while i < len(words):
        chunk_words = words[i:i + WORDS_PER_CHAPTER]
        chunk_text = ' '.join(chunk_words)
        chapters.append({
            "title": f"Section {chapter_num}",
            "text": chunk_text,
            "word_count": len(chunk_words),
            "start_word": i,
            "is_skippable": False,
        })
        i += WORDS_PER_CHAPTER
        chapter_num += 1

    return chapters
