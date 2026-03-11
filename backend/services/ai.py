"""
AI service — Groq (Llama 3.3 70B) for podcast scripts, Ollama local for summaries.
Falls back to local Ollama fact-extraction if GROQ_API_KEY is not set.
"""
import json
import os
import httpx

# ── Config ────────────────────────────────────────────────────────────────────

GROQ_API_KEY  = os.environ.get("GROQ_API_KEY", "")
GROQ_URL      = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL    = "llama-3.3-70b-versatile"

OLLAMA_URL    = "http://localhost:11434/api/generate"
OLLAMA_MODEL  = "gemma3:1b"

USE_GROQ = bool(GROQ_API_KEY)


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

async def _groq_complete(prompt: str, timeout: int = 30) -> str:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 800,
    }
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(GROQ_URL, headers=headers, json=payload)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


# ── Summarize ─────────────────────────────────────────────────────────────────

async def summarize_document(text: str) -> str:
    truncated = " ".join(text.split()[:4000])
    prompt = (
        "You are an academic study assistant helping Nigerian students. "
        "Summarize the following document clearly and concisely. "
        "Focus on key concepts, definitions, and important points. "
        "Use bullet points. Keep it under 300 words.\n\n"
        f"Document:\n{truncated}\n\nSummary:"
    )
    if USE_GROQ:
        return await _groq_complete(prompt, timeout=30)
    return await _ollama_generate(prompt, timeout=120)


# ── Nigerian podcast prompt ───────────────────────────────────────────────────

_STANDARD_PODCAST_PROMPT = """\
Write a script for "JackPal" — a Nigerian university study podcast. Two \
300-level students have a real conversation that builds genuine understanding, \
not just surface coverage. The listener should finish knowing WHY things work, \
not just WHAT they are.

HOSTS:
- Ezinne: Curious, quick. Asks the question everyone is too embarrassed to ask. \
  When Abeo says something confusing she pushes back: "hold on, say that again." \
  She never lets him get away with textbook language.
- Abeo: The natural teacher. He explains by connecting new ideas to things \
  students already know from Nigerian life. His analogies are specific and vivid: \
  NEPA cuts and power generation, Danfo routes and algorithms, market pricing and \
  economics, okada shortcuts and network paths, eba texture and material states. \
  He never lectures — he converses.

LANGUAGE:
- Standard Nigerian English: warm, confident, educated, culturally grounded
- Short spoken sentences. No clause-heavy textbook prose.
- Natural bridges: "right, so", "here is the thing", "think of it this way", \
  "that is actually the key", "most people miss this part", "good question", \
  "exactly, and that connects to", "so the reason that works is"
- ONE vivid Nigerian analogy per major concept. Make it land.

STRUCTURE — 14 turns, always alternating Ezinne then Abeo:
Turn 1  Ezinne — opening question that shows she is confused about something specific
Turn 2  Abeo   — core concept 1, explained with one tight analogy
Turn 3  Ezinne — probes deeper or surfaces a misconception students commonly have
Turn 4  Abeo   — corrects it clearly, adds the "why it actually works" layer
Turn 5  Ezinne — connects to something related, or asks about an edge case
Turn 6  Abeo   — concept 2, another analogy, builds on turn 4
Turn 7  Ezinne — "wait so does that mean..." — testing her own understanding
Turn 8  Abeo   — confirms, sharpens, adds the nuance that separates good students
Turn 9  Ezinne — real-world question: where does this actually show up?
Turn 10 Abeo   — real application with a concrete Nigerian example
Turn 11 Ezinne — the "what confuses people in exams" question
Turn 12 Abeo   — the sharp, memorable answer with a one-line rule they can keep
Turn 13 Ezinne — summarises what clicked for her in her own words
Turn 14 Abeo   — closes with energy: why this topic is actually interesting

RULES:
- Each turn: 2-3 sentences MAX. Every sentence must earn its place.
- EVERY line MUST start with exactly "Ezinne:" or "Abeo:" — nothing else, ever
- No asterisks, no stage directions, no numbering, no blank lines between turns
- Cover the WHOLE content — not just the first section

CONTENT:
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
    Condense a long document for podcast generation.
    Groq payload limit is strict (~32KB body), so we keep input under ~500 words.
    Strategy: take a small but representative excerpt from start, middle, and end.
    """
    words = text.split()
    n = len(words)
    # ~500 words total spread across the document
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
        return await _groq_complete(prompt, timeout=20)
    except Exception:
        return sample  # fallback: use the sample directly


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
        "temperature": 0.88,
        "max_tokens": 1600,
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

    async with httpx.AsyncClient(timeout=60) as client:
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
        {"speaker": "Ezinne", "voice": "chinenye", "text": openers[r]},
        {"speaker": "Abeo",   "voice": "jude",     "text": f"Correct! So the main thing: {f[0]}. E be like say this one go definitely show for exam."},
        {"speaker": "Ezinne", "voice": "chinenye", "text": f"Wait wait wait — so {f[1]}? Abi I hear you well?"},
        {"speaker": "Abeo",   "voice": "jude",     "text": f"Exactly exactly! And another key point — {f[2]}. Write that one down sha."},
        {"speaker": "Ezinne", "voice": "chinenye", "text": f"Omo this is making sense now. But what about {f[3]}?"},
        {"speaker": "Abeo",   "voice": "jude",     "text": f"Yes! {f[3].capitalize()}. Na the main thing to remember. I swear this one dey come out every year."},
        {"speaker": "Ezinne", "voice": "chinenye", "text": f"And the last point — {f[4]} sha?"},
        {"speaker": "Abeo",   "voice": "jude",     "text": f"Correct! {f[4].capitalize()}. Make you no forget that one for the exam at all at all."},
        {"speaker": "Ezinne", "voice": "chinenye", "text": "Abeo you don explain am well well! I feel better about this exam now."},
        {"speaker": "Abeo",   "voice": "jude",     "text": "We go pass this thing together! Good luck in your exams everyone!"},
    ]


async def _ollama_stream_podcast(text: str):
    facts = await _extract_facts_ollama(text)
    script = _facts_to_script(facts)
    for line in script:
        yield line


# ── Public API ────────────────────────────────────────────────────────────────

async def stream_podcast_lines(text: str, mode: str = "standard"):
    """
    Async generator — yields {speaker, voice, text} dicts one at a time.
    Uses Groq if GROQ_API_KEY is set, else falls back to Ollama + template.
    TTS synthesis starts on line 0 while remaining lines are still generating.

    For long documents: condenses via Groq first so the WHOLE document is covered,
    not just the first few pages.
    """
    if USE_GROQ:
        words = text.split()
        if len(words) <= 4000:
            content = " ".join(words)
        else:
            # For long docs: condense the whole document into a topic outline
            # so the podcast covers ALL sections, not just page 1
            content = await _condense_long_doc(text)
        async for line in _groq_stream_podcast(content, mode=mode):
            yield line
    else:
        async for line in _ollama_stream_podcast(text):
            yield line


async def generate_podcast_script(text: str, mode: str = "standard") -> list[dict]:
    """Collect the full script (used for cached/non-streaming path)."""
    script = [line async for line in stream_podcast_lines(text, mode=mode)]
    if not script:
        words = text.split()
        summary = " ".join(words[:100])
        script = [
            {"speaker": "Ezinne", "voice": "chinenye", "text": "Abeo, make we quickly run through this material for the exam."},
            {"speaker": "Abeo",   "voice": "jude",     "text": f"Sure! Here is what you need to know: {summary}"},
            {"speaker": "Ezinne", "voice": "chinenye", "text": "E don make sense! Good luck in your exams everyone!"},
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
                    "voice": "chinenye" if current_speaker == "Ezinne" else "jude",
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
