"""
AI service — Groq (Llama 3.3 70B) for podcast scripts, Ollama local for summaries.
Gemini 2.0 Flash handles long documents (1M context window, no chunking needed).

Priority:
  Short docs (≤4000 words): Groq (fast, free)
  Long docs (>4000 words):  Gemini (full context) → map-reduce+Groq if no Gemini key
  Groq 429 rate-limit:      Gemini fallback
  No API keys:              Ollama local
"""
import asyncio
import json
import os
import httpx

from services.cache import (
    content_hash,
    get_json,
    set_json,
    key_script_by_hash,
    key_listen_by_hash,
    key_summary_by_hash,
    TTL_SCRIPT_HASH,
    TTL_SUMMARY_HASH,
)

# ── Config ────────────────────────────────────────────────────────────────────

GROQ_API_KEY  = os.environ.get("GROQ_API_KEY", "")
GROQ_URL      = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL    = "llama-3.3-70b-versatile"

GOOGLE_AI_API_KEY = os.environ.get("GOOGLE_AI_API_KEY", "")
GEMINI_URL    = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
GEMINI_MODEL  = "gemini-2.0-flash"
GEMINI_MAX_WORDS = 80_000  # ~104k tokens, well within 1M context

OLLAMA_URL    = "http://localhost:11434/api/generate"
OLLAMA_MODEL  = "gemma3:1b"

USE_GROQ   = bool(GROQ_API_KEY)
USE_GEMINI = bool(GOOGLE_AI_API_KEY)


# ── Ollama helpers ────────────────────────────────────────────────────────────

async def _ollama_generate(prompt: str, timeout: int = 180) -> str:
    parts: list[str] = []
    async with httpx.AsyncClient(timeout=timeout) as client:
        async with client.stream(
            "POST", OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": True},
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                    parts.append(chunk.get("response", ""))
                    if chunk.get("done"):
                        break
                except json.JSONDecodeError:
                    continue
    return "".join(parts).strip()


# ── Groq helper ───────────────────────────────────────────────────────────────

async def _groq_complete(prompt: str, max_tokens: int = 800, timeout: int = 30) -> str:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": max_tokens,
    }
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(GROQ_URL, headers=headers, json=payload)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


# ── Gemini helpers ────────────────────────────────────────────────────────────

async def _gemini_complete(prompt: str, max_tokens: int = 800, timeout: int = 60) -> str:
    headers = {
        "Authorization": f"Bearer {GOOGLE_AI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GEMINI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": max_tokens,
    }
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(GEMINI_URL, headers=headers, json=payload)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


async def _gemini_stream_podcast(content: str, mode: str = "standard"):
    """Stream podcast lines from Gemini 2.0 Flash. Same format as _groq_stream_podcast."""
    template = _PIDGIN_PODCAST_PROMPT if mode == "pidgin" else _STANDARD_PODCAST_PROMPT
    prompt = template.format(content=content)
    headers = {
        "Authorization": f"Bearer {GOOGLE_AI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GEMINI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
        "temperature": 0.88,
        "max_tokens": 1600,
    }

    current_speaker = "Ezinne"
    current_parts: list[str] = []
    line_buf = ""

    def _flush(speaker: str, parts: list[str]):
        text = " ".join(parts).strip()
        lo = text.lower()
        if lo.startswith("ezinne:"):
            text = text[7:].strip()
        elif lo.startswith("abeo:"):
            text = text[5:].strip()
        if not text:
            return None
        voice = "chinenye" if speaker == "Ezinne" else "jude"
        return {"speaker": speaker, "voice": voice, "text": text}

    async with httpx.AsyncClient(timeout=90) as client:
        async with client.stream("POST", GEMINI_URL, headers=headers, json=payload) as response:
            response.raise_for_status()
            async for raw_line in response.aiter_lines():
                if not raw_line or raw_line == "data: [DONE]":
                    continue
                if not raw_line.startswith("data: "):
                    continue
                try:
                    chunk = json.loads(raw_line[6:])
                    token = chunk["choices"][0].get("delta", {}).get("content", "")
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue

                if not token:
                    continue

                line_buf += token

                while "\n" in line_buf:
                    completed, line_buf = line_buf.split("\n", 1)
                    completed = completed.strip()
                    if not completed:
                        continue

                    lo = completed.lower()
                    if lo.startswith("ezinne:"):
                        if current_speaker and current_parts:
                            line = _flush(current_speaker, current_parts)
                            if line:
                                yield line
                        current_speaker = "Ezinne"
                        current_parts = [completed[7:].strip()]
                    elif lo.startswith("abeo:"):
                        if current_speaker and current_parts:
                            line = _flush(current_speaker, current_parts)
                            if line:
                                yield line
                        current_speaker = "Abeo"
                        current_parts = [completed[5:].strip()]
                    elif current_speaker:
                        current_parts.append(completed)

    if line_buf.strip() and current_speaker:
        current_parts.append(line_buf.strip())
    if current_speaker and current_parts:
        line = _flush(current_speaker, current_parts)
        if line:
            yield line


# ── Summarize ─────────────────────────────────────────────────────────────────

async def summarize_document(text: str) -> str:
    c_hash = content_hash(text)
    cache_k = key_summary_by_hash(c_hash)
    cached = get_json(cache_k)
    if cached and isinstance(cached, str):
        print(f"[AI] Summary cache HIT ({c_hash})")
        return cached

    prompt_body = (
        "You are an expert academic tutor for Nigerian university students.\n"
        "Write a study guide for the document below using EXACTLY this format:\n\n"
        "TOPIC: <one sentence>\n\n"
        "KEY CONCEPTS:\n"
        "• <concept>: <plain-English explanation>\n"
        "• <concept>: <explanation>\n"
        "• <concept>: <explanation>\n"
        "(4-5 concepts total)\n\n"
        "IMPORTANT TERMS:\n"
        "• <term>: <definition>\n"
        "• <term>: <definition>\n"
        "(3-4 terms)\n\n"
        "EXAM FOCUS:\n"
        "• <specific exam-relevant point from this document>\n"
        "• <another point>\n"
        "• <another point>\n\n"
        "QUICK SUMMARY:\n"
        "<2-3 sentences on the main argument or flow>\n\n"
        "Be specific to THIS document. No filler. Plain English.\n\n"
        "Document:\n{content}\n\nStudy Guide:"
    )
    if USE_GEMINI:
        capped = " ".join(text.split()[:GEMINI_MAX_WORDS])
        result = await _gemini_complete(prompt_body.format(content=capped), max_tokens=600, timeout=30)
        if result:
            set_json(cache_k, result, TTL_SUMMARY_HASH)
        return result
    truncated = " ".join(text.split()[:10_000])
    prompt = prompt_body.format(content=truncated)
    if USE_GROQ:
        result = await _groq_complete(prompt, max_tokens=600, timeout=30)
        if result:
            set_json(cache_k, result, TTL_SUMMARY_HASH)
        return result
    result = await _ollama_generate(prompt, timeout=120)
    if result:
        set_json(cache_k, result, TTL_SUMMARY_HASH)
    return result


# ── Nigerian podcast prompt ───────────────────────────────────────────────────

_STANDARD_PODCAST_PROMPT = """\
Write a study-podcast script for two Nigerian university students discussing the \
document below. They MUST teach the actual content of THIS document. The \
listener should finish understanding the real ideas, terms, and frameworks in \
the material — not just hear vibes.

HOSTS:
- Ezinne: Curious, sharp. Asks the questions students actually have. Names \
  specific terms from the document. When Abeo gets vague she pushes: "wait, \
  what exactly does that mean?"
- Abeo: The patient teacher. He explains the actual concepts in the document \
  using clear plain English. He uses ONE Nigerian analogy when it genuinely \
  helps clarify a hard concept — not as decoration. Most of his explanation \
  is direct teaching of what the document actually says.

LANGUAGE:
- Plain Standard English with light Nigerian warmth — not heavy slang.
- Short spoken sentences, easy to follow when listening.
- Conversational bridges: "right, so", "okay so", "the key thing is", \
  "good question", "exactly", "that connects to", "the reason this matters is".
- AT MOST 2 Nigerian analogies in the whole script — only when the concept is \
  abstract enough to need one. Programming, math, science: usually direct \
  teaching beats forced metaphors.

CONTENT FIDELITY (most important rule):
- Every turn must reference SPECIFIC content from the document — actual terms, \
  definitions, classifications, examples, dates, names, equations.
- DO NOT invent facts. If the document says something, use it. Don't replace \
  document concepts with generic ones.
- Cover the FULL document, not just the opening sections. By turn 8 you \
  should be discussing material from the middle/end.

STRUCTURE — exactly 14 turns, alternating Ezinne then Abeo:
Turn 1  Ezinne — opens with a specific confusion about a real term/concept from the doc
Turn 2  Abeo   — defines it precisely, using the document's own framing
Turn 3  Ezinne — asks how it differs from a related concept (also from the doc)
Turn 4  Abeo   — distinguishes them clearly with examples FROM the document
Turn 5  Ezinne — surfaces a common student misconception about this topic
Turn 6  Abeo   — corrects it, gives the precise reason
Turn 7  Ezinne — moves to the next major concept covered in the document
Turn 8  Abeo   — explains it with the specifics the document gives
Turn 9  Ezinne — asks about a concrete example or application
Turn 10 Abeo   — uses examples FROM the document, or one Nigerian analogy if helpful
Turn 11 Ezinne — asks "what is most likely to come up in exams from this material?"
Turn 12 Abeo   — gives 2-3 sharp specific points students MUST know from this doc
Turn 13 Ezinne — summarises the 3 biggest takeaways in her own words
Turn 14 Abeo   — closes with WHY this topic matters in the real world

FORMAT RULES:
- Each turn: 2-4 sentences. Substantive but not bloated.
- EVERY line MUST start with exactly "Ezinne:" or "Abeo:" — nothing else.
- No asterisks, no stage directions, no numbering, no blank lines.
- No fake stats or invented sources. Stay grounded in the document.

DOCUMENT:
{content}

Script:
Ezinne:"""

_PIDGIN_PODCAST_PROMPT = """\
Write a script for "JackPal" — a Nigerian university study podcast in authentic \
Nigerian Pidgin. Two 300-level students dey reason the topic together like say \
na dem room dem dey — totally natural, zero pretension, but genuinely educational. \
Listener go finish the episode and actually understand the topic.

HOSTS:
- Ezinne: Sharp, funny, no filter. She go ask the question wey everybody dey \
  think but nobody wan ask for class. When Abeo overcomplicates something she \
  go call am: "abeg explain am like I be jss3 student."
- Abeo: The explainer. He dey use Nigerian life to explain everything — \
  NEPA light, danfo bus, eba and soup, Lagos go-slow, garri, market woman, \
  generator fuel, JAMB, Lagos Island bridge. His analogies dey always land.

LANGUAGE — authentic flowing Pidgin:
- Natural Pidgin words: "omo", "abeg", "sha", "abi", "ehn", "chai", "wahala", \
  "e be like say", "the thing be say", "make we", "no be so", "exactly exactly", \
  "wait wait wait", "I swear", "see ehn", "e don make sense now", "wetin", \
  "dey", "don", "na", "am", "sabi", "ginger", "correct"
- Mix Pidgin naturally — not every word, but the rhythm and grammar is Pidgin
- Every major concept gets a specific Nigerian daily-life analogy
- Short punchy sentences — this na audio, rhythm matters

STRUCTURE — 14 turns, strictly Ezinne then Abeo alternating:
Turn 1  Ezinne — opens with a confused or funny observation about the topic
Turn 2  Abeo   — hits concept 1, one vivid Pidgin analogy
Turn 3  Ezinne — "wait so..." probes or surfaces a common wrong belief
Turn 4  Abeo   — corrects am sharp, explains the real reason
Turn 5  Ezinne — connects to something she knows, or asks edge case
Turn 6  Abeo   — concept 2, builds on turn 4 with fresh analogy
Turn 7  Ezinne — tests her own understanding out loud
Turn 8  Abeo   — confirms and adds the detail wey separate A students
Turn 9  Ezinne — asks where e show up for real life
Turn 10 Abeo   — concrete Nigerian real-world example
Turn 11 Ezinne — "wetin dey confuse people for exam" question
Turn 12 Abeo   — the sharp one-line rule dem go remember
Turn 13 Ezinne — summarises in her own Pidgin words
Turn 14 Abeo   — closes with energy, makes the topic feel relevant

RULES:
- Each turn: 2-3 sentences MAX. Every sentence must add value.
- EVERY line MUST start with exactly "Ezinne:" or "Abeo:" — nothing else, ever
- No asterisks, no stage directions, no numbering, no blank lines between turns
- Cover the WHOLE content — not just the first section

CONTENT:
{content}

Script:
Ezinne:"""


# ── Groq streaming podcast ────────────────────────────────────────────────────

async def _condense_long_doc(text: str) -> str:
    """
    Simple fallback condensation: sample from start, middle, end.
    Used when map-reduce fails or document has no detectable chapters.
    """
    words = text.split()
    n = len(words)
    first = words[:200]
    mid_start = n // 3
    middle = words[mid_start:mid_start + 200]
    last = words[-100:]
    sample = " ".join(first + middle + last)

    prompt = (
        "List the main topics and key concepts from this university textbook excerpt.\n"
        "One sentence per topic. Cover all major ideas. Max 300 words.\n\n"
        f"Excerpt:\n{sample}\n\nMain topics and concepts:"
    )
    try:
        return await _groq_complete(prompt, max_tokens=400, timeout=20)
    except Exception:
        return sample


async def _extract_chapter_concepts(title: str, chapter_words: list[str]) -> str:
    """
    Extract 3-4 key exam concepts from one chapter.
    Input is capped at 400 words to keep each Groq call small and fast.
    """
    # Take first 250 words + middle 150 words as the most representative sample
    n = len(chapter_words)
    sample_words = chapter_words[:250]
    if n > 300:
        mid = n // 2
        sample_words += chapter_words[mid: mid + 150]
    sample = " ".join(sample_words)

    prompt = (
        f"Chapter: {title}\n"
        f"Extract exactly 3 key exam concepts. Each concept: one clear sentence "
        f"a university student can understand. No intro, no numbering prefix.\n\n"
        f"Text:\n{sample}\n\n"
        f"Key concepts (one per line):"
    )
    try:
        result = await _groq_complete(prompt, max_tokens=180, timeout=20)
        return result.strip()
    except Exception as e:
        print(f"[AI] Chapter '{title}' extraction failed: {e}")
        return " ".join(chapter_words[:60])   # fallback: first 60 words


async def _map_reduce_condense(text: str) -> str:
    """
    Intelligent condensation for long documents (>4000 words).

    Strategy:
      1. Detect chapters / sections with detect_chapters()
      2. Skip non-educational sections (references, bibliography, appendix)
      3. Select up to 10 representative chapters spread evenly
      4. Extract 3 key concepts from each chapter in parallel (semaphore=3)
      5. Merge all extractions into structured study notes

    Result: ~600-1000 words of dense, exam-relevant study material covering
    the WHOLE document — perfect input for podcast generation.
    Falls back to _condense_long_doc() on any failure.
    """
    from services.chapters import detect_chapters
    from services.rag import clean_text as rag_clean

    try:
        # Clean the text first — removes noise before Groq sees it
        cleaned = rag_clean(text)
        chapters = detect_chapters(cleaned)

        # Keep only educational content chapters
        content_chapters = [ch for ch in chapters if not ch.get("is_skippable", False)]

        if len(content_chapters) < 2:
            print("[AI] Map-reduce: too few chapters detected, using simple condensation")
            return await _condense_long_doc(text)

        # Sample up to 5 chapters spread evenly — faster and enough for a 14-turn podcast
        if len(content_chapters) <= 5:
            selected = content_chapters
        else:
            step = len(content_chapters) / 5
            selected = [content_chapters[int(i * step)] for i in range(5)]

        print(f"[AI] Map-reduce: extracting concepts from {len(selected)}/{len(content_chapters)} chapters in parallel...")

        words = cleaned.split()
        sem = asyncio.Semaphore(5)   # 5 concurrent Groq calls

        async def _extract_one(ch: dict) -> tuple[str, str]:
            chapter_words = words[ch["start_word"]: ch["start_word"] + ch["word_count"]]
            async with sem:
                concepts = await _extract_chapter_concepts(ch["title"], chapter_words)
            return ch["title"], concepts

        results = await asyncio.gather(
            *[_extract_one(ch) for ch in selected],
            return_exceptions=True,
        )

        parts: list[str] = []
        for result in results:
            if isinstance(result, tuple):
                title, concepts = result
                if concepts.strip():
                    parts.append(f"[{title}]\n{concepts.strip()}")

        if not parts:
            print("[AI] Map-reduce: all extractions failed, falling back")
            return await _condense_long_doc(text)

        study_notes = "\n\n".join(parts)
        word_count = len(study_notes.split())
        print(f"[AI] Map-reduce complete — {word_count} words of study notes from {len(parts)} chapters")
        return study_notes

    except Exception as e:
        print(f"[AI] Map-reduce failed ({e}), falling back to simple condensation")
        return await _condense_long_doc(text)


async def _groq_stream_podcast(content: str, mode: str = "standard"):
    """Stream podcast lines from Groq Llama 3.3 70B. Yields {speaker, voice, text}."""
    template = _PIDGIN_PODCAST_PROMPT if mode == "pidgin" else _STANDARD_PODCAST_PROMPT
    prompt = template.format(content=content)
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
        "temperature": 0.7,
        "max_tokens": 2400,
    }

    current_speaker = "Ezinne"  # primed in prompt
    current_parts: list[str] = []
    line_buf = ""

    def _flush(speaker: str, parts: list[str]):
        text = " ".join(parts).strip()
        # Strip any repeated speaker prefix the model sometimes adds
        lo = text.lower()
        if lo.startswith("ezinne:"):
            text = text[7:].strip()
        elif lo.startswith("abeo:"):
            text = text[5:].strip()
        if not text:
            return None
        voice = "chinenye" if speaker == "Ezinne" else "jude"
        return {"speaker": speaker, "voice": voice, "text": text}

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", GROQ_URL, headers=headers, json=payload) as response:
            response.raise_for_status()
            async for raw_line in response.aiter_lines():
                if not raw_line or raw_line == "data: [DONE]":
                    continue
                if not raw_line.startswith("data: "):
                    continue
                try:
                    chunk = json.loads(raw_line[6:])
                    token = chunk["choices"][0].get("delta", {}).get("content", "")
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue

                if not token:
                    continue

                line_buf += token

                while "\n" in line_buf:
                    completed, line_buf = line_buf.split("\n", 1)
                    completed = completed.strip()
                    if not completed:
                        continue

                    lo = completed.lower()
                    if lo.startswith("ezinne:"):
                        if current_speaker and current_parts:
                            line = _flush(current_speaker, current_parts)
                            if line:
                                yield line
                        current_speaker = "Ezinne"
                        current_parts = [completed[7:].strip()]
                    elif lo.startswith("abeo:"):
                        if current_speaker and current_parts:
                            line = _flush(current_speaker, current_parts)
                            if line:
                                yield line
                        current_speaker = "Abeo"
                        current_parts = [completed[5:].strip()]
                    elif current_speaker:
                        current_parts.append(completed)

    if line_buf.strip() and current_speaker:
        current_parts.append(line_buf.strip())
    if current_speaker and current_parts:
        line = _flush(current_speaker, current_parts)
        if line:
            yield line


# ── Ollama fallback (no Groq key) ─────────────────────────────────────────────

_PREAMBLE_PATTERNS = (
    "here are", "the following", "important facts", "key facts",
    "from the text", "extracted from", "based on the", "sure",
)


async def _extract_facts_ollama(text: str) -> list[str]:
    import re
    words = text.split()
    truncated = " ".join(words[:1500])
    prompt = (
        "List 5 key facts from this text. Number them 1 to 5. One sentence each. No intro.\n\n"
        f"Text:\n{truncated}\n\n"
        "1."
    )
    raw = await _ollama_generate(prompt, timeout=90)
    facts = []
    for line in ("1." + raw).splitlines():
        line = line.strip()
        line = re.sub(r'^[\d]+[.)]\s*', '', line)
        line = re.sub(r'^[-*]\s*', '', line)
        line = re.sub(r'\*+', '', line).strip(" -")
        lo = line.lower()
        if any(p in lo for p in _PREAMBLE_PATTERNS):
            continue
        if line and len(line) > 15:
            facts.append(line)

    if len(facts) < 5:
        import re as _re
        sentences = _re.split(r'(?<=[.!?])\s+', truncated)
        sentences = [s.strip() for s in sentences if len(s.split()) >= 6]
        for s in sentences:
            if len(facts) >= 5:
                break
            if s not in facts:
                facts.append(s)

    return facts[:5] if facts else [" ".join(words[:30])]


def _facts_to_script(facts: list[str]) -> list[dict]:
    import re, random

    while len(facts) < 5:
        facts.append(facts[-1] if facts else "This is an important concept.")
    facts = facts[:5]

    def _clean(s: str) -> str:
        s = re.sub(r'\*+', '', s)
        s = re.sub(r'^[\d]+[.)]\s*', '', s).strip(" -").rstrip(".")
        return s[0].lower() + s[1:] if s else s

    f = [_clean(fact) for fact in facts]
    r = random.randint(0, 2)

    openers = [
        "Abeo, make we quickly run through this material sha. Exam is tomorrow o.",
        "Abeo, I dey read this thing since morning. Help me understand am abeg.",
        "Abeo, exam is next week — let us break this down together quick quick.",
    ]
    return [
        {"speaker": "Ezinne", "voice": "doyinsola", "text": openers[r]},
        {"speaker": "Abeo",   "voice": "dayo",      "text": f"Correct! So the main thing: {f[0]}. E be like say this one go definitely show for exam."},
        {"speaker": "Ezinne", "voice": "doyinsola", "text": f"Wait wait wait — so {f[1]}? Abi I hear you well?"},
        {"speaker": "Abeo",   "voice": "dayo",      "text": f"Exactly exactly! And another key point — {f[2]}. Write that one down sha."},
        {"speaker": "Ezinne", "voice": "doyinsola", "text": f"Omo this is making sense now. But what about {f[3]}?"},
        {"speaker": "Abeo",   "voice": "dayo",      "text": f"Yes! {f[3].capitalize()}. Na the main thing to remember. I swear this one dey come out every year."},
        {"speaker": "Ezinne", "voice": "doyinsola", "text": f"And the last point — {f[4]} sha?"},
        {"speaker": "Abeo",   "voice": "dayo",      "text": f"Correct! {f[4].capitalize()}. Make you no forget that one for the exam at all at all."},
        {"speaker": "Ezinne", "voice": "doyinsola", "text": "Abeo you don explain am well well! I feel better about this exam now."},
        {"speaker": "Abeo",   "voice": "dayo",      "text": "We go pass this thing together! Good luck in your exams everyone!"},
    ]


async def _ollama_stream_podcast(text: str):
    facts = await _extract_facts_ollama(text)
    script = _facts_to_script(facts)
    for line in script:
        yield line


# ── Public API ────────────────────────────────────────────────────────────────

async def stream_podcast_lines(
    text: str,
    mode: str = "standard",
    doc_id: str | None = None,
    topic: str | None = None,
):
    """
    Async generator — yields {speaker, voice, text} dicts one at a time.

    Routing:
      Cache hit (content hash): yield cached lines instantly — no LLM call
      Short (≤4000 words):  Groq → Gemini on 429
      Long + Gemini key:    Gemini full-context (no map-reduce)
      Long + topic + RAG:   RAG retrieval → Groq → Gemini on 429
      Long, no Gemini:      map-reduce → Groq
      No API keys:          Ollama template
    """
    # ── Cross-user content-hash cache ─────────────────────────────────────────
    # Same doc text + same mode => identical Groq output. Skip the LLM call
    # entirely and yield the cached script. Saves 8-15s per call and frees
    # Groq quota for new content.
    cache_text = topic if topic else text
    c_hash = content_hash(f"{cache_text}|{mode}")
    cache_k = key_script_by_hash(c_hash, mode)
    cached_script = get_json(cache_k)
    if cached_script and isinstance(cached_script, list) and cached_script:
        print(f"[AI] Script cache HIT ({c_hash}) — {len(cached_script)} lines, skipping Groq")
        for line in cached_script:
            yield line
        return

    # ── Cache miss: stream from LLM and collect for cache write ───────────────
    collected: list[dict] = []

    async def _yield_and_collect(gen):
        async for line in gen:
            collected.append(line)
            yield line

    if not USE_GROQ and not USE_GEMINI:
        async for line in _yield_and_collect(_ollama_stream_podcast(text)):
            yield line
        if collected:
            set_json(cache_k, collected, TTL_SCRIPT_HASH)
        return

    words = text.split()
    word_count = len(words)

    # ── Short/medium/long doc: feed full text to Groq (Llama 3.3 = 128k ctx) ──
    # ~40k words ≈ 55k tokens, fits comfortably in 128k context.
    # Full-context generation produces FAR better podcasts than map-reduce
    # because the model sees the whole document at once.
    if word_count <= 40000:
        content = " ".join(words)
        if USE_GROQ:
            try:
                async for line in _yield_and_collect(_groq_stream_podcast(content, mode=mode)):
                    yield line
                if collected:
                    set_json(cache_k, collected, TTL_SCRIPT_HASH)
                return
            except httpx.HTTPStatusError as e:
                if e.response.status_code != 429 or not USE_GEMINI:
                    raise
                print("[AI] Groq 429 — falling back to Gemini for short doc")
                collected.clear()
        async for line in _yield_and_collect(_gemini_stream_podcast(content, mode=mode)):
            yield line
        if collected:
            set_json(cache_k, collected, TTL_SCRIPT_HASH)
        return

    # ── Long doc: map-reduce + Groq (Gemini bypassed — rate-limited on free tier) ─
    if topic and doc_id:
        from services.rag import retrieve_relevant, is_indexed
        if is_indexed(doc_id):
            rag_chunks = retrieve_relevant(doc_id, topic, top_k=15, text=text)
            if rag_chunks:
                content = " ".join(rag_chunks)
                print(f"[AI] RAG retrieval: {len(rag_chunks)} chunks ({len(content.split())} words) for topic: '{topic[:60]}'")
                async for line in _yield_and_collect(_groq_stream_podcast(content, mode=mode)):
                    yield line
                if collected:
                    set_json(cache_k, collected, TTL_SCRIPT_HASH)
                return
        import threading
        threading.Thread(
            target=__import__('services.rag', fromlist=['index_document']).index_document,
            args=(doc_id, text), daemon=True
        ).start()

    content = await _map_reduce_condense(text)
    async for line in _yield_and_collect(_groq_stream_podcast(content, mode=mode)):
        yield line
    if collected:
        set_json(cache_k, collected, TTL_SCRIPT_HASH)


async def answer_question(context: str, question: str) -> str:
    """Answer a student's question about a document using retrieved context."""
    prompt = (
        "You are a knowledgeable academic tutor for Nigerian university students.\n\n"
        "A student is asking a question about a document they are studying. "
        "Use the document excerpts below to give a thorough, educational answer.\n\n"
        "Instructions:\n"
        "- Answer the question directly — no preamble like 'Based on the document...'\n"
        "- Explain the concept clearly, as a good teacher would\n"
        "- If the answer is in the text, use it; if it only partially covers the question, say so\n"
        "- If the content doesn't cover the question at all, say: "
        "'This specific topic is not covered in the document. Generally speaking, ...' "
        "and give a brief general answer\n"
        "- 150-300 words. Be thorough but focused.\n\n"
        f"Document excerpts:\n{context}\n\n"
        f"Student's question: {question}\n\n"
        "Answer:"
    )
    if USE_GEMINI:
        return await _gemini_complete(prompt, max_tokens=450, timeout=30)
    if USE_GROQ:
        return await _groq_complete(prompt, max_tokens=450, timeout=30)
    return "No AI available — please set GOOGLE_AI_API_KEY or GROQ_API_KEY."


async def generate_podcast_script(text: str, mode: str = "standard") -> list[dict]:
    """Collect the full script (used for cached/non-streaming path)."""
    script = [line async for line in stream_podcast_lines(text, mode=mode)]
    if not script:
        words = text.split()
        summary = " ".join(words[:100])
        script = [
            {"speaker": "Ezinne", "voice": "doyinsola", "text": "Abeo, make we quickly run through this material for the exam."},
            {"speaker": "Abeo",   "voice": "dayo",      "text": f"Sure! Here is what you need to know: {summary}"},
            {"speaker": "Ezinne", "voice": "doyinsola", "text": "E don make sense! Good luck in your exams everyone!"},
        ]
    return script


def _parse_podcast_script(raw: str) -> list[dict]:
    import re
    lines = []
    current_speaker = None
    current_parts: list[str] = []

    def _flush():
        if current_speaker and current_parts:
            text = re.sub(r'\*+', '', " ".join(current_parts)).strip(" -")
            if text:
                lines.append({
                    "speaker": current_speaker,
                    "voice": "doyinsola" if current_speaker == "Ezinne" else "dayo",
                    "text": text,
                })

    for line in raw.splitlines():
        line = re.sub(r'^[\d]+\.\s*', '', line.strip())
        line = re.sub(r'^[-*]\s*', '', line)
        lo = line.lower()
        if lo.startswith("ezinne:"):
            _flush(); current_speaker = "Ezinne"; current_parts = [line[7:].strip()]
        elif lo.startswith("abeo:"):
            _flush(); current_speaker = "Abeo"; current_parts = [line[5:].strip()]
        elif current_speaker:
            current_parts.append(line)

    _flush()
    return lines
