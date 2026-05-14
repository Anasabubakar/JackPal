"""
AI service — NVIDIA NIM (Llama 3.3 70B) primary, Groq + Gemini + Ollama fallbacks.

Provider priority (configurable via env):
  1. NVIDIA NIM   (NVIDIA_API_KEY set)        — primary, Llama 3.3 70B Instruct
  2. Groq         (GROQ_API_KEY set)          — fast fallback, same Llama family
  3. Gemini 2.0   (GOOGLE_AI_API_KEY set)     — long-context fallback (~1M tokens)
  4. Ollama local (always last)               — offline fallback

The provider router selects the first-available chain for each task. NVIDIA is
preferred because it gives stable rate limits and the same OpenAI-compatible
chat-completion shape as Groq, so streaming code paths are reused.
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

NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "") or os.environ.get("NVIDIA_NIM_API_KEY", "")
NVIDIA_URL     = os.environ.get(
    "NVIDIA_API_URL", "https://integrate.api.nvidia.com/v1/chat/completions"
)
NVIDIA_MODEL   = os.environ.get("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct")

GROQ_API_KEY  = os.environ.get("GROQ_API_KEY", "")
GROQ_URL      = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL    = "llama-3.3-70b-versatile"

GOOGLE_AI_API_KEY = os.environ.get("GOOGLE_AI_API_KEY", "")
GEMINI_URL    = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
GEMINI_MODEL  = "gemini-2.0-flash"
GEMINI_MAX_WORDS = 80_000  # ~104k tokens, well within 1M context

OLLAMA_URL    = "http://localhost:11434/api/generate"
OLLAMA_MODEL  = "gemma3:1b"

USE_NVIDIA = bool(NVIDIA_API_KEY)
USE_GROQ   = bool(GROQ_API_KEY)
USE_GEMINI = bool(GOOGLE_AI_API_KEY)


def get_ai_capabilities() -> dict:
    """Report which providers are configured so the frontend can show status."""
    return {
        "nvidia": USE_NVIDIA,
        "nvidia_model": NVIDIA_MODEL if USE_NVIDIA else None,
        "groq": USE_GROQ,
        "groq_model": GROQ_MODEL if USE_GROQ else None,
        "gemini": USE_GEMINI,
        "gemini_model": GEMINI_MODEL if USE_GEMINI else None,
        "ollama_local": True,
        "primary": "nvidia" if USE_NVIDIA else (
            "groq" if USE_GROQ else ("gemini" if USE_GEMINI else "ollama")
        ),
    }


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


# ── NVIDIA NIM helper (primary provider) ──────────────────────────────────────

async def _nvidia_complete(
    prompt: str,
    max_tokens: int = 800,
    timeout: int = 60,
    temperature: float = 0.7,
) -> str:
    """OpenAI-compatible chat completion against NVIDIA NIM (build.nvidia.com)."""
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {
        "model": NVIDIA_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": 0.95,
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(NVIDIA_URL, headers=headers, json=payload)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


async def _nvidia_stream_podcast(content: str, mode: str = "standard"):
    """Stream podcast lines from NVIDIA NIM. Same yield shape as Groq."""
    template = _PIDGIN_PODCAST_PROMPT if mode == "pidgin" else _STANDARD_PODCAST_PROMPT
    prompt = template.format(content=content)
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    payload = {
        "model": NVIDIA_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
        "temperature": 0.7,
        "max_tokens": 2400,
        "top_p": 0.95,
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

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", NVIDIA_URL, headers=headers, json=payload) as response:
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


async def _llm_complete(prompt: str, max_tokens: int = 800, timeout: int = 60) -> str:
    """Provider router for non-streaming completions.

    Order: NVIDIA → Groq → Gemini → Ollama. Any 4xx/5xx triggers the next
    provider, so a stale or rate-limited primary never blocks a request.
    """
    last_err: Exception | None = None
    if USE_NVIDIA:
        try:
            return await _nvidia_complete(prompt, max_tokens=max_tokens, timeout=timeout)
        except Exception as e:
            last_err = e
            print(f"[AI] NVIDIA primary failed ({type(e).__name__}: {e}) — falling through")
    if USE_GROQ:
        try:
            return await _groq_complete(prompt, max_tokens=max_tokens, timeout=timeout)
        except Exception as e:
            last_err = e
            print(f"[AI] Groq fallback failed ({type(e).__name__}: {e}) — falling through")
    if USE_GEMINI:
        try:
            return await _gemini_complete(prompt, max_tokens=max_tokens, timeout=timeout)
        except Exception as e:
            last_err = e
            print(f"[AI] Gemini fallback failed ({type(e).__name__}: {e}) — falling through")
    try:
        return await _ollama_generate(prompt, timeout=max(120, timeout))
    except Exception as e:
        if last_err:
            raise last_err
        raise e


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


# ── Listen-mode narration (Speechify-style explainer) ────────────────────────

_LISTEN_NARRATION_PROMPT = """\
You are the best teacher this Nigerian student has ever heard explain this \
material. Not summarising. Not reading. EXPLAINING — like a brilliant tutor \
who has thought about why this stuff matters, where students get stuck, and \
how the ideas actually connect. The student is hearing this in audio. They \
have one shot to understand it.

WHAT TO PRODUCE:
A continuous spoken-style explanation that walks the listener THROUGH the \
document IN THE ORDER IT IS PRESENTED. If the document has an introduction, \
start by explaining what the topic is and why it's worth their attention. \
Then go module by module / chapter by chapter / section by section. Don't \
jump around. Don't restructure into your own framework. Follow the document's \
flow but TEACH each part instead of reciting it.

For every meaningful concept the document covers:
1. Name it concretely (use the document's own term).
2. Explain what it actually means in plain words.
3. Say WHY it matters or where it comes up.
4. If it's the kind of thing students confuse, name the confusion and clear it up.
5. Connect it to other ideas in the document when it links.

This should feel like a great YouTube explainer essay — substantive, insight- \
dense, paced. Walking the listener forward through the material.

LENGTH:
- Be substantive. Don't truncate to a stub. A long, dense document deserves \
  a long, dense explanation. Aim for 50-70% of the original word count.
- Hard cap: ~5000 words for very long docs. If the document is longer, \
  prioritise the conceptually important sections and teach those properly.

VOICE:
- Plain spoken English with light Nigerian warmth ("the thing is", "you see", \
  "here's the part that catches people"). Not heavy slang.
- Short, listenable sentences — not academic prose.
- Use "the reason this matters is", "the part students miss is", "this \
  connects to what we just said about", "now here's where it gets clever".
- ONE Nigerian analogy MAX, only if it genuinely clarifies a hard concept.

NEVER:
- Don't skip the introduction or jump to the middle.
- No "let me tell you about", "the document states", "in this document". \
  Just teach.
- No headings, bullets, numbered lists, markdown, asterisks, parentheticals.
- No invented facts, stats, or sources. Stay grounded in the document.
- Don't open with "today" or "welcome." Open by naming the topic and one \
  concrete reason it's worth understanding.
- Do not stop early. If the document covers many sections, walk through them \
  all (within the word cap). A truncated 200-word reply is a failure.

DOCUMENT:
{content}

Write the explanation now (just the spoken text — start with the introduction \
and walk the listener through the material in order):
"""


async def generate_listen_narration(text: str) -> str:
    """Run document text through Groq to produce a narrated explainer.
    Cached by content hash so the same doc is only narrated once across
    all users."""
    c_hash = content_hash(text)
    cache_k = key_listen_by_hash(c_hash)
    cached = get_json(cache_k)
    if cached and isinstance(cached, str):
        wc = len(cached.split())
        print(f"[AI] Listen-narration cache HIT ({c_hash}) — {wc} words")
        # Defensive: if a tiny stub got cached by a prior buggy run, ignore it
        # and regenerate. A real explanation is at least 100 words.
        if wc >= 100:
            return cached
        print(f"[AI] Cached narration too short ({wc} words) — regenerating")

    words = text.split()
    original_wc = len(words)
    if original_wc > 35_000:
        text = " ".join(words[:35_000])
        print(f"[AI] Listen narration input truncated {original_wc} -> 35000 words")
    print(f"[AI] Listen narration starting — input {min(original_wc, 35_000)} words ({c_hash})")

    prompt = _LISTEN_NARRATION_PROMPT.format(content=text)

    if USE_NVIDIA:
        try:
            result = await _nvidia_complete(prompt, max_tokens=6500, timeout=180)
            wc = len(result.split()) if result else 0
            print(f"[AI] Listen narration NVIDIA returned {wc} words")
            if result and wc >= 50:
                set_json(cache_k, result, TTL_SCRIPT_HASH)
                return result
            print(f"[AI] NVIDIA narration too short ({wc} words) — trying fallback")
        except Exception as e:
            print(f"[AI] Listen narration NVIDIA failed: {type(e).__name__}: {e}")

    if USE_GROQ:
        try:
            result = await _groq_complete(prompt, max_tokens=6500, timeout=120)
            wc = len(result.split()) if result else 0
            print(f"[AI] Listen narration Groq returned {wc} words")
            if result and wc >= 50:
                set_json(cache_k, result, TTL_SCRIPT_HASH)
                return result
            print(f"[AI] Groq narration too short ({wc} words) — trying fallback")
        except Exception as e:
            print(f"[AI] Listen narration Groq failed: {type(e).__name__}: {e}")

    if USE_GEMINI:
        try:
            result = await _gemini_complete(prompt, max_tokens=6500, timeout=120)
            wc = len(result.split()) if result else 0
            print(f"[AI] Listen narration Gemini returned {wc} words")
            if result and wc >= 50:
                set_json(cache_k, result, TTL_SCRIPT_HASH)
                return result
        except Exception as e:
            print(f"[AI] Listen narration Gemini failed: {type(e).__name__}: {e}")

    # Last-resort fallback: return cleaned doc text. Worse listen experience
    # but avoids 500 if every LLM is down.
    print("[AI] Listen narration: all LLMs failed or returned too little — falling back to raw doc text")
    return text


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
    # Gemini wins for very long docs because of its 1M-token context window.
    if USE_GEMINI and len(text.split()) > 12_000:
        capped = " ".join(text.split()[:GEMINI_MAX_WORDS])
        try:
            result = await _gemini_complete(
                prompt_body.format(content=capped), max_tokens=600, timeout=30
            )
            if result:
                set_json(cache_k, result, TTL_SUMMARY_HASH)
            return result
        except Exception as e:
            print(f"[AI] Summary Gemini failed: {type(e).__name__}: {e}")

    truncated = " ".join(text.split()[:10_000])
    prompt = prompt_body.format(content=truncated)
    if USE_NVIDIA:
        try:
            result = await _nvidia_complete(prompt, max_tokens=600, timeout=60)
            if result:
                set_json(cache_k, result, TTL_SUMMARY_HASH)
                return result
        except Exception as e:
            print(f"[AI] Summary NVIDIA failed: {type(e).__name__}: {e}")
    if USE_GROQ:
        try:
            result = await _groq_complete(prompt, max_tokens=600, timeout=30)
            if result:
                set_json(cache_k, result, TTL_SUMMARY_HASH)
                return result
        except Exception as e:
            print(f"[AI] Summary Groq failed: {type(e).__name__}: {e}")
    if USE_GEMINI:
        try:
            result = await _gemini_complete(prompt, max_tokens=600, timeout=30)
            if result:
                set_json(cache_k, result, TTL_SUMMARY_HASH)
                return result
        except Exception as e:
            print(f"[AI] Summary Gemini fallback failed: {type(e).__name__}: {e}")
    try:
        result = await _ollama_generate(prompt, timeout=120)
        if result:
            set_json(cache_k, result, TTL_SUMMARY_HASH)
            return result
    except Exception as e:
        print(f"[AI] Summary Ollama failed ({type(e).__name__}): Ollama not running locally.")
    return ""


# ── Nigerian podcast prompt ───────────────────────────────────────────────────

_STANDARD_PODCAST_PROMPT = """\
You are writing a study podcast that feels like a YouTube documentary breakdown — \
two sharp Nigerian university students arguing through the actual content of \
the document below until the listener understands it. Not a lecture. Not a quiz. \
A conversation worth eavesdropping on.

HOSTS:
- Ezinne: Sharp, slightly skeptical. Asks the question the listener is actually \
  thinking. Pushes back when Abeo oversimplifies — "wait, that's not quite right" \
  or "okay but the document specifically says X." Names exact terms from the doc.
- Abeo: The one who's been teaching himself this material for a week. Confident \
  but earns it — quotes the document, gives concrete examples, uses ONE Nigerian \
  analogy in the whole episode if the concept genuinely needs one. Otherwise \
  direct teaching.

THE OPENING (Turn 1) IS NON-NEGOTIABLE:
Ezinne does NOT say "hi" or "today we're talking about" or "welcome." She \
opens with a hook — a surprising fact, a specific question from the document, \
or a confusion she's actually wrestling with. Examples of openers:
- "Okay Abeo, the document says X causes Y — but how can that be when..."
- "Wait — I've been reading this thing for an hour and I still don't get \
  what they mean by [specific term from doc]."
- "Abeo, real quick — between [concept A] and [concept B] from this material, \
  which one do you think actually shows up in the exam?"
The listener should hear turn 1 and want to know the answer.

LANGUAGE:
- Plain Standard English with light Nigerian warmth — not heavy slang.
- Short spoken sentences. Listenable, not readable.
- Real disagreement is allowed and good. Ezinne should challenge Abeo at \
  least twice across the script.
- Conversational bridges: "right so", "okay but", "exactly", "that's the part \
  I missed", "wait — that connects to", "yeah but the doc actually says".
- AT MOST one Nigerian analogy in the whole script. Programming/math/science \
  almost never need them.

CONTENT FIDELITY (the rule that everything else serves):
- Every turn must reference SPECIFIC content from the document — actual terms, \
  definitions, classifications, examples, dates, names, equations.
- DO NOT invent facts, stats, or sources. If it's not in the doc, don't say it.
- Cover the FULL document. By turn 8 you should be in the middle/end material, \
  not still on chapter 1.

NARRATIVE ARC (18 turns, alternating Ezinne then Abeo):
Turn 1  Ezinne — cold-open hook (see above). Names a specific term from the doc.
Turn 2  Abeo   — addresses the hook directly, defines the term using the doc's framing.
Turn 3  Ezinne — pushes: "okay but how is that different from [related concept]?"
Turn 4  Abeo   — distinguishes them with concrete examples FROM the document.
Turn 5  Ezinne — surfaces the misconception students always have here.
Turn 6  Abeo   — corrects it precisely, gives the reason.
Turn 7  Ezinne — challenges him on something he just said: "wait, the doc actually says X — that's not the same."
Turn 8  Abeo   — concedes the nuance, refines his answer using the doc's exact framing.
Turn 9  Ezinne — moves to the next big concept, asks why it matters.
Turn 10 Abeo   — explains, anchored in the doc's specifics.
Turn 11 Ezinne — "give me a concrete case from the document."
Turn 12 Abeo   — gives the specific example/case the doc uses.
Turn 13 Ezinne — callback to turn 5: "so does that connect to what we said earlier about [misconception]?"
Turn 14 Abeo   — yes — explains the connection, ties two ideas together.
Turn 15 Ezinne — "what's the one thing on this most likely to show up in the exam?"
Turn 16 Abeo   — names 2-3 sharp testable points from the document.
Turn 17 Ezinne — summarises in her own words: "okay so what I'm hearing is..."
Turn 18 Abeo   — closes with why this matters beyond the exam — real world stake.

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
        return await _llm_complete(prompt, max_tokens=400, timeout=30)
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
        if USE_NVIDIA:
            result = await _nvidia_complete(prompt, max_tokens=180, timeout=30)
        else:
            result = await _groq_complete(prompt, max_tokens=180, timeout=20)
        return result.strip()
    except Exception as e:
        print(f"[AI] Chapter '{title}' extraction failed: {e}")
        # Last-ditch fallback: try the other primary if available
        try:
            if USE_NVIDIA and USE_GROQ:
                return (await _groq_complete(prompt, max_tokens=180, timeout=20)).strip()
        except Exception:
            pass
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
    try:
        raw = await _ollama_generate(prompt, timeout=90)
    except Exception:
        raw = ""
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

    if not USE_NVIDIA and not USE_GROQ and not USE_GEMINI:
        async for line in _yield_and_collect(_ollama_stream_podcast(text)):
            yield line
        if collected:
            set_json(cache_k, collected, TTL_SCRIPT_HASH)
        return

    words = text.split()
    word_count = len(words)

    # ── Short/medium doc: feed full text directly to the LLM ─────────────────
    # Llama 3.3 70B (NVIDIA + Groq) has 128k ctx; Gemini handles much more.
    if word_count <= 40000:
        content = " ".join(words)
        # NVIDIA primary
        if USE_NVIDIA:
            ok = False
            try:
                async for line in _yield_and_collect(_nvidia_stream_podcast(content, mode=mode)):
                    yield line
                ok = True
            except Exception as e:
                print(f"[AI] NVIDIA podcast stream failed: {type(e).__name__}: {e}")
                collected.clear()
            if ok:
                if collected:
                    set_json(cache_k, collected, TTL_SCRIPT_HASH)
                return
        # Groq fallback
        if USE_GROQ:
            ok = False
            try:
                async for line in _yield_and_collect(_groq_stream_podcast(content, mode=mode)):
                    yield line
                ok = True
            except httpx.HTTPStatusError as e:
                if e.response.status_code != 429:
                    print(f"[AI] Groq error {e.response.status_code} — trying Gemini")
                collected.clear()
            except Exception as e:
                print(f"[AI] Groq podcast stream failed: {type(e).__name__}: {e}")
                collected.clear()
            if ok:
                if collected:
                    set_json(cache_k, collected, TTL_SCRIPT_HASH)
                return
        # Gemini fallback
        if USE_GEMINI:
            async for line in _yield_and_collect(_gemini_stream_podcast(content, mode=mode)):
                yield line
            if collected:
                set_json(cache_k, collected, TTL_SCRIPT_HASH)
            return
        # Final fallback
        async for line in _yield_and_collect(_ollama_stream_podcast(text)):
            yield line
        if collected:
            set_json(cache_k, collected, TTL_SCRIPT_HASH)
        return

    # ── Long doc: prefer RAG when a topic is supplied, else map-reduce ───────
    if topic and doc_id:
        from services.rag import retrieve_relevant, is_indexed
        if is_indexed(doc_id):
            rag_chunks = retrieve_relevant(doc_id, topic, top_k=15, text=text)
            if rag_chunks:
                content = " ".join(rag_chunks)
                print(f"[AI] RAG retrieval: {len(rag_chunks)} chunks ({len(content.split())} words) for topic: '{topic[:60]}'")
                if USE_NVIDIA:
                    try:
                        async for line in _yield_and_collect(_nvidia_stream_podcast(content, mode=mode)):
                            yield line
                        if collected:
                            set_json(cache_k, collected, TTL_SCRIPT_HASH)
                        return
                    except Exception as e:
                        print(f"[AI] NVIDIA RAG stream failed: {e} — trying Groq")
                        collected.clear()
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
    if USE_NVIDIA:
        try:
            async for line in _yield_and_collect(_nvidia_stream_podcast(content, mode=mode)):
                yield line
            if collected:
                set_json(cache_k, collected, TTL_SCRIPT_HASH)
            return
        except Exception as e:
            print(f"[AI] NVIDIA map-reduce stream failed: {e} — trying Groq")
            collected.clear()
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
    # Q&A prefers NVIDIA (consistent answers, generous context) then Gemini for
    # very long context windows, then Groq, then Ollama.
    if USE_NVIDIA:
        try:
            return await _nvidia_complete(prompt, max_tokens=450, timeout=45)
        except Exception as e:
            print(f"[AI] answer_question NVIDIA failed: {type(e).__name__}: {e}")
    if USE_GEMINI:
        try:
            return await _gemini_complete(prompt, max_tokens=450, timeout=30)
        except Exception as e:
            print(f"[AI] answer_question Gemini failed: {type(e).__name__}: {e}")
    if USE_GROQ:
        try:
            return await _groq_complete(prompt, max_tokens=450, timeout=30)
        except Exception as e:
            print(f"[AI] answer_question Groq failed: {type(e).__name__}: {e}")
    try:
        return await _ollama_generate(prompt, timeout=120)
    except Exception:
        return "No AI provider available — set NVIDIA_API_KEY, GROQ_API_KEY, or GOOGLE_AI_API_KEY."


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
