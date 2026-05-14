"""
Artifact engine — LLM-driven generators for the NotebookLM-style artifact
catalogue. Each generator returns a typed payload that the router persists
through services.local_storage.create_artifact.

Why this lives outside routers/workspace.py
-------------------------------------------
The previous in-router implementations were placeholders (e.g. "What is a key
idea from sentence N?") that produced useless artifacts. Pulling each artifact
type into its own well-prompted function gives us:

* one LLM round-trip per artifact (no N+1 prompting),
* deterministic JSON shapes that the dashboard can render natively,
* graceful fallback when the model returns malformed JSON, so the user always
  sees *something* even on a bad day.

Conventions
-----------
Every public ``make_*`` coroutine returns a tuple of
``(title: str, content: str, fmt: str)``.

* ``title`` — short human title for the artifact list.
* ``content`` — the artifact body, already serialised. Markdown for prose
  artifacts (report / slide-deck / infographic), JSON for structured ones
  (quiz / flashcards / mind-map / data-table / video / audio script), CSV
  for the data-table CSV path.
* ``fmt``    — one of ``"markdown" | "json" | "csv"``; the dashboard
  switches its viewer on this.

Corpus contract
---------------
Callers pass:
* ``corpus``  — concatenated notebook text. Already trimmed to a safe size by
  workspace.py's ``_collect_corpus`` so we don't re-trim aggressively here.
* ``sources`` — list of source dicts (title + fulltext) used for artifacts
  that need a per-source structure (mind map, video script, slide deck).
* ``prompt``  — optional user-supplied focus / angle.

The generators *do not* re-import workspace.py — they only call into
services.ai (LLM) and services.local_storage (read-only, optional). This
keeps the dependency graph one-way.
"""
from __future__ import annotations

import csv
import io
import json
import logging
import re
from typing import Any

from .ai import _llm_complete, generate_podcast_script, summarize_document

logger = logging.getLogger(__name__)

# Max tokens budgets are deliberately conservative — we prefer crisp output over
# wandering. They can be widened per-artifact if real-world feedback says so.
_BUDGET_REPORT = 1800
_BUDGET_QUIZ = 1400
_BUDGET_FLASHCARDS = 1400
_BUDGET_MINDMAP = 1200
_BUDGET_SLIDES = 1800
_BUDGET_INFOGRAPHIC = 1200
_BUDGET_TABLE = 1200
_BUDGET_VIDEO = 1800


# ── Public API ────────────────────────────────────────────────────────────────


async def make_report(corpus: str, prompt: str | None) -> tuple[str, str, str]:
    """A polished, multi-section study report."""
    title = _title(prompt, fallback="Research Report")
    base = await summarize_document(corpus[:14000])
    sectioner = (
        f"You are an expert academic editor turning a study summary into a professional structured report.\n\n"
        f"Title: {title}\n"
        f"User angle (optional): {prompt or '(none — be neutral)'}\n\n"
        f"Source summary:\n{base[:6000]}\n\n"
        "Rewrite as a Markdown report with: an H1 title; a clear 2-sentence TL;DR; "
        "3-5 H2 sections, each with 3-6 bullet points highlighting deep insights; "
        "a 'Key Takeaways' section with actionable points; and an 'Open Questions' "
        "section for further study. Use professional Standard English. No filler."
    )
    try:
        body = await _llm_complete(sectioner, max_tokens=_BUDGET_REPORT)
    except Exception as exc:
        logger.warning("artifact.report: structuring failed (%s), falling back to raw summary", exc)
        body = f"# {title}\n\n{base}"
    return title, body, "markdown"


async def make_study_guide(corpus: str, prompt: str | None) -> tuple[str, str, str]:
    """A study guide tuned for revision — concept list, Q&A, glossary."""
    title = _title(prompt, fallback="Study Guide")
    instr = (
        "Build a comprehensive Markdown study guide for the material below. Output four "
        "sections with these exact H2 headings: '## Key Concepts' (5-8 bullets, "
        "each a concept + one-line definition), '## Practice Questions' (4-6 "
        "challenging exam-style questions), '## Worked Answers' (concise, step-by-step), "
        "'## Glossary' (6-10 terms as bold-term: definition). "
        "Include one helpful analogy per section to aid memory (e.g. comparing a network to a market).\n\n"
        f"Topic / angle: {prompt or '(use the dominant theme)'}\n\n"
        f"Material:\n{corpus[:12000]}"
    )
    body = await _llm_complete(instr, max_tokens=_BUDGET_REPORT)
    return title, f"# {title}\n\n{body.strip()}", "markdown"


async def make_quiz(corpus: str, prompt: str | None, *, count: int = 8) -> tuple[str, str, str]:
    """Multiple-choice quiz with explanations.

    Output JSON:
        [
          {"question": "...", "options": ["A","B","C","D"],
           "answer_index": 0, "explanation": "..."},
          ...
        ]
    """
    title = _title(prompt, fallback="Quiz")
    instr = (
        f"Create a multiple-choice quiz of {count} questions from the material. "
        "Each question must test understanding, not trivia. Return ONLY a JSON "
        "array (no markdown fences) of objects with keys: question (string), "
        "options (array of 4 strings), answer_index (0-3 integer pointing to "
        "the correct option), explanation (one sentence stating why the answer "
        "is correct). Do NOT include any commentary before or after the JSON.\n\n"
        f"Material:\n{corpus[:12000]}"
    )
    raw = await _llm_complete(instr, max_tokens=_BUDGET_QUIZ)
    data = _parse_json_list(raw) or _quiz_fallback(corpus, count)
    return title, json.dumps(data, indent=2), "json"


async def make_flashcards(corpus: str, prompt: str | None, *, count: int = 12) -> tuple[str, str, str]:
    """Flashcards: ``[{front, back, tag}]``."""
    title = _title(prompt, fallback="Flashcards")
    instr = (
        f"Create {count} flashcards from the material. Front side is a concise "
        "prompt (question, term, or cue); back side is the answer / definition. "
        "Add a 1-2 word `tag` grouping similar cards. Return ONLY a JSON array "
        "(no markdown fences) of objects with keys: front (string), back "
        "(string), tag (string).\n\n"
        f"Material:\n{corpus[:12000]}"
    )
    raw = await _llm_complete(instr, max_tokens=_BUDGET_FLASHCARDS)
    data = _parse_json_list(raw) or _flashcards_fallback(corpus, count)
    return title, json.dumps(data, indent=2), "json"


async def make_mind_map(corpus: str, prompt: str | None) -> tuple[str, str, str]:
    """Hierarchical mind map: ``{title, children: [{title, children:[...]}]}``.

    The LLM is told to keep depth <= 3 so the dashboard can render it without
    overflowing. If parsing fails we synthesise a simple tree from corpus
    sentences — useful enough that the user isn't left with a blank artifact.
    """
    title = _title(prompt, fallback="Mind Map")
    instr = (
        "Build a hierarchical mind map summarising the material. Root is the "
        "topic. Each child is a major theme; each grandchild is a specific "
        "concept under that theme. Max depth 3. Aim for 4-6 themes, each with "
        "3-6 concepts. Return ONLY a JSON object (no fences) with shape: "
        '{"title": "<root>", "children": [{"title": "<theme>", "children": '
        '[{"title": "<concept>"}, ...]}, ...]}\n\n'
        f"Topic / angle: {prompt or '(use the dominant theme)'}\n\n"
        f"Material:\n{corpus[:10000]}"
    )
    raw = await _llm_complete(instr, max_tokens=_BUDGET_MINDMAP)
    data = _parse_json_obj(raw) or _mindmap_fallback(title, corpus)
    if not isinstance(data, dict) or "children" not in data:
        data = _mindmap_fallback(title, corpus)
    return title, json.dumps(data, indent=2), "json"


async def make_slide_deck(corpus: str, prompt: str | None, *, count: int = 10) -> tuple[str, str, str]:
    """Slide deck JSON: ``{title, slides: [{title, bullets, speaker_notes}]}``."""
    title = _title(prompt, fallback="Slide Deck")
    instr = (
        f"Build a slide deck of about {count} slides from the material below. "
        "Slide 1 is a title slide. Slide 2 is an agenda. The rest are content "
        "slides each with 3-5 bullets and 2-3 sentences of speaker notes. The "
        "final slide is a 'Summary' slide. Return ONLY a JSON object (no "
        "fences) with shape: "
        '{"title": "<deck title>", "slides": [{"title": "<slide title>", '
        '"bullets": ["..."], "speaker_notes": "..."}, ...]}\n\n'
        f"Angle: {prompt or '(neutral overview)'}\n\n"
        f"Material:\n{corpus[:12000]}"
    )
    raw = await _llm_complete(instr, max_tokens=_BUDGET_SLIDES)
    data = _parse_json_obj(raw) or {"title": title, "slides": []}
    if not data.get("slides"):
        # Salvage: synthesise a minimal deck from the corpus rather than 0-slide
        data = {
            "title": title,
            "slides": _slides_fallback(title, corpus),
        }
    return title, json.dumps(data, indent=2), "json"


async def make_infographic(corpus: str, prompt: str | None) -> tuple[str, str, str]:
    """Infographic spec: ``{title, sections: [{heading, stat, body, icon}]}``.

    `icon` is a hint string ("chart", "graph", "globe", etc.) that the
    dashboard's renderer can map to an SVG. Keeping it a hint instead of a
    URL lets us swap icon libraries later without touching artifacts.
    """
    title = _title(prompt, fallback="Infographic")
    instr = (
        "Create an infographic spec from the material. Pick 4-6 of the most "
        "interesting facts, stats, or claims. For each, write a heading, a "
        "short standout 'stat' phrase (e.g. '3x faster', '70%', '12 months'), "
        "1-2 sentences of supporting body, and one icon hint from this set: "
        "chart, graph, globe, lightbulb, shield, clock, target, scale, network, "
        "book. Return ONLY a JSON object (no fences) of shape: "
        '{"title": "<title>", "sections": [{"heading": "...", "stat": "...", '
        '"body": "...", "icon": "..."}, ...]}\n\n'
        f"Material:\n{corpus[:10000]}"
    )
    raw = await _llm_complete(instr, max_tokens=_BUDGET_INFOGRAPHIC)
    data = _parse_json_obj(raw) or {"title": title, "sections": []}
    return title, json.dumps(data, indent=2), "json"


async def make_data_table(
    corpus: str,
    sources: list[dict],
    prompt: str | None,
) -> tuple[str, str, str]:
    """Comparative data table inferred from the corpus.

    Returns CSV. The LLM picks the schema dynamically so the table reflects
    what the material actually compares (e.g. for a "compare three databases"
    notebook you get columns like Database / Storage Model / Query Language /
    License). Falls back to a per-source manifest if the LLM doesn't return
    parseable JSON.
    """
    title = _title(prompt, fallback="Data Table")
    instr = (
        "Build a comparison data table from the material. Pick 3-6 columns that "
        "best capture the comparison the material implies. 4-10 rows. Numeric "
        "values stay as plain strings (no units stripped). Return ONLY a JSON "
        "object (no fences) of shape: "
        '{"columns": ["..."], "rows": [["..."], ...]} where row length == '
        "columns length.\n\n"
        f"Angle: {prompt or '(infer the most useful comparison)'}\n\n"
        f"Material:\n{corpus[:10000]}"
    )
    raw = await _llm_complete(instr, max_tokens=_BUDGET_TABLE)
    data = _parse_json_obj(raw)
    columns: list[str]
    rows: list[list[str]]
    if (
        isinstance(data, dict)
        and isinstance(data.get("columns"), list)
        and isinstance(data.get("rows"), list)
        and data["columns"]
    ):
        columns = [str(c) for c in data["columns"]]
        rows = [[str(c) for c in row] for row in data["rows"]]
    else:
        # Fallback: manifest of notebook sources — always useful, never blank.
        columns = ["title", "type", "status", "created_at"]
        rows = [
            [
                str(src.get("title", "")),
                str(src.get("type", "")),
                str(src.get("status", "ready")),
                str(src.get("created_at", "")),
            ]
            for src in sources
        ]

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)
    writer.writerows(rows)
    return title, buf.getvalue(), "csv"


async def make_video_script(
    corpus: str,
    sources: list[dict],
    prompt: str | None,
) -> tuple[str, str, str]:
    """Video script with scenes, narration, b-roll cues, and per-scene length.

    Returns JSON:
        {
          "title": "...",
          "scenes": [
            {"scene": 1, "title": "...", "narration": "...",
             "b_roll": ["..."], "duration_sec": 12}
          ]
        }
    """
    title = _title(prompt, fallback="Video Script")
    source_hint = "; ".join((src.get("title") or "Source") for src in sources[:8])
    instr = (
        "Write a video script that explains the material in 6-10 scenes. Each "
        "scene needs: a short title, 2-4 sentences of narration, 2-3 'b_roll' "
        "cues describing visuals or screen content, and a duration_sec integer "
        "(10-25 seconds). Total runtime under 3 minutes. Return ONLY a JSON "
        "object (no fences) of shape: "
        '{"title": "<title>", "scenes": [{"scene": 1, "title": "...", '
        '"narration": "...", "b_roll": ["..."], "duration_sec": 15}, ...]}\n\n'
        f"Sources covered: {source_hint or '(general)'}\n"
        f"Angle: {prompt or '(neutral, audience: curious general public)'}\n\n"
        f"Material:\n{corpus[:12000]}"
    )
    raw = await _llm_complete(instr, max_tokens=_BUDGET_VIDEO)
    data = _parse_json_obj(raw) or {
        "title": title,
        "scenes": _video_fallback(sources),
    }
    if not data.get("scenes"):
        data["scenes"] = _video_fallback(sources)
    return title, json.dumps(data, indent=2), "json"


async def make_audio_script(corpus: str, prompt: str | None) -> tuple[str, str, str]:
    """Two-voice podcast script — reuses the existing generator on services.ai."""
    title = _title(prompt, fallback="Audio Overview")
    script = await generate_podcast_script(corpus[:14000])
    return title, json.dumps(script, indent=2), "json"


# ── JSON parsing / fallbacks ──────────────────────────────────────────────────


_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE | re.MULTILINE)


def _strip_fences(text: str) -> str:
    """Remove ```json … ``` wrappers some providers insist on emitting."""
    return _FENCE_RE.sub("", text or "").strip()


def _extract_block(text: str, open_ch: str, close_ch: str) -> str | None:
    """Find the first balanced ``open_ch...close_ch`` block in ``text``.

    Tolerant against trailing prose so an LLM that adds "Here is the JSON:" or
    "Hope this helps!" still parses. Returns None if no balanced block exists.
    """
    if not text:
        return None
    start = text.find(open_ch)
    if start < 0:
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == open_ch:
                depth += 1
            elif ch == close_ch:
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]
    return None


def _parse_json_list(raw: str) -> list | None:
    cleaned = _strip_fences(raw)
    try:
        out = json.loads(cleaned)
        return out if isinstance(out, list) else None
    except Exception:
        pass
    block = _extract_block(cleaned, "[", "]")
    if not block:
        return None
    try:
        out = json.loads(block)
        return out if isinstance(out, list) else None
    except Exception as exc:
        logger.warning("artifact: json list parse failed (%s)", exc)
        return None


def _parse_json_obj(raw: str) -> dict | None:
    cleaned = _strip_fences(raw)
    try:
        out = json.loads(cleaned)
        return out if isinstance(out, dict) else None
    except Exception:
        pass
    block = _extract_block(cleaned, "{", "}")
    if not block:
        return None
    try:
        out = json.loads(block)
        return out if isinstance(out, dict) else None
    except Exception as exc:
        logger.warning("artifact: json obj parse failed (%s)", exc)
        return None


def _title(prompt: str | None, *, fallback: str) -> str:
    if not prompt:
        return fallback
    cleaned = prompt.strip()
    return cleaned[:96] if cleaned else fallback


# Lightweight fallbacks used when the LLM returns malformed JSON. The point is
# to never hand the user a 500 — they get a usable (if sparser) artifact.


def _sentences(corpus: str, *, limit: int) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", corpus.strip())
    seen: list[str] = []
    for p in parts:
        p = p.strip()
        if 30 < len(p) < 240 and p not in seen:
            seen.append(p)
        if len(seen) >= limit:
            break
    return seen


def _quiz_fallback(corpus: str, count: int) -> list[dict]:
    out: list[dict] = []
    for i, sent in enumerate(_sentences(corpus, limit=count), 1):
        out.append({
            "question": f"Which statement best matches the material? (#{i})",
            "options": [
                sent[:160],
                "None of the above",
                "The opposite of the correct answer",
                "Cannot be determined from the sources",
            ],
            "answer_index": 0,
            "explanation": "Directly drawn from the source material.",
        })
    return out


def _flashcards_fallback(corpus: str, count: int) -> list[dict]:
    out: list[dict] = []
    for i, sent in enumerate(_sentences(corpus, limit=count), 1):
        words = sent.split()
        front = " ".join(words[:6]) + "…" if len(words) > 6 else sent
        out.append({"front": front, "back": sent, "tag": f"set-{(i - 1) // 4 + 1}"})
    return out


def _mindmap_fallback(title: str, corpus: str) -> dict:
    sents = _sentences(corpus, limit=12)
    themes: list[dict] = []
    for chunk_start in range(0, min(12, len(sents)), 3):
        chunk = sents[chunk_start : chunk_start + 3]
        if not chunk:
            continue
        themes.append({
            "title": chunk[0][:60],
            "children": [{"title": s[:80]} for s in chunk[1:]],
        })
    return {"title": title, "children": themes}


def _slides_fallback(title: str, corpus: str) -> list[dict]:
    sents = _sentences(corpus, limit=10)
    slides = [{
        "title": title,
        "bullets": [],
        "speaker_notes": "Title slide.",
    }]
    for idx, sent in enumerate(sents, 1):
        slides.append({
            "title": f"Point {idx}",
            "bullets": [sent[:140]],
            "speaker_notes": sent,
        })
    slides.append({
        "title": "Summary",
        "bullets": ["Key concepts covered.", "Open questions remain."],
        "speaker_notes": "Wrap up and invite questions.",
    })
    return slides


def _video_fallback(sources: list[dict]) -> list[dict]:
    scenes: list[dict] = []
    for idx, src in enumerate(sources[:8], 1):
        text = (src.get("fulltext") or "")[:500]
        scenes.append({
            "scene": idx,
            "title": src.get("title") or f"Scene {idx}",
            "narration": text or "Brief overview of this source.",
            "b_roll": ["screen recording", "title card"],
            "duration_sec": 15,
        })
    return scenes


# ── Dispatch table ────────────────────────────────────────────────────────────

# Keep in sync with the routes the dashboard hits. The router uses this to
# resolve the user's ``artifact_type`` to a generator.
DISPATCH: dict[str, str] = {
    "report":      "make_report",
    "summary":     "make_report",
    "study-guide": "make_study_guide",
    "quiz":        "make_quiz",
    "flashcard":   "make_flashcards",
    "flashcards":  "make_flashcards",
    "mind-map":    "make_mind_map",
    "slide-deck":  "make_slide_deck",
    "infographic": "make_infographic",
    "data-table":  "make_data_table",
    "video":       "make_video_script",
    "audio":       "make_audio_script",
}


__all__ = [
    "make_report",
    "make_study_guide",
    "make_quiz",
    "make_flashcards",
    "make_mind_map",
    "make_slide_deck",
    "make_infographic",
    "make_data_table",
    "make_video_script",
    "make_audio_script",
    "DISPATCH",
]
