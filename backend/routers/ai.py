import os
import asyncio
from fastapi import APIRouter, HTTPException, Header, BackgroundTasks, Request
from pydantic import BaseModel
from services.ai import summarize_document, generate_podcast_script, stream_podcast_lines
from services.cache import (
    delete_keys,
    get_json,
    set_json,
    key_doc_summary,
    key_podcast_chunks,
)
from services.supabase_storage import (
    upload_audio_chunk,
    list_audio_chunks as list_audio_chunks_supabase,
    delete_audio_chunks as delete_audio_chunks_supabase,
)


class PodcastRequest(BaseModel):
    topic: str | None = None          # Optional: specific topic/section to focus on
    ezinne_voice: str = "chinenye"   # YarnGPT voice for Ezinne (female host)
    abeo_voice: str = "jude"         # YarnGPT voice for Abeo (male host)

from services.auth_utils import get_user_id, is_local_mode
router = APIRouter(prefix="/ai", tags=["ai"])
USE_LOCAL = is_local_mode()

# ElevenLabs Flash is ~75ms/call — 5 concurrent is safe on free tier
_TTS_CONCURRENCY = 5


# Centered auth moved to services.auth_utils


async def _podcast_pipeline(
    doc_id: str,
    user_id: str,
    text: str,
    mode: str = "standard",
    ezinne_voice: str = "chinenye",
    abeo_voice: str = "jude",
    topic: str | None = None,
):
    """
    Fast parallel pipeline:
      1. Collect full script from Groq (~10-15s) — start line 0 TTS immediately
      2. Synthesize all remaining lines in parallel (batch of 10)
      3. Signal first_ready as soon as line 0 audio is saved
      4. Full podcast ready in ~25s vs ~84s sequential

    Returns (script, first_ready_event, task).
    """
    from services.tts import synthesize_chunk, get_tts_capabilities, normalize_voice
    from services.local_storage import save_podcast_chunk, save_podcast_script, update_document

    caps = get_tts_capabilities()
    engine = "premium" if caps.get("premium_available") else "fast"
    tts_engine_name = "ElevenLabs" if caps.get("premium_elevenlabs") else ("YarnGPT2 local" if caps.get("premium_yarngpt_local") else "edge-tts")
    print(f"[Podcast] Using {tts_engine_name} ({engine}) for {mode} mode")
    print(f"[Podcast] Voices — Ezinne: {ezinne_voice}, Abeo: {abeo_voice}")

    lang = "pcm" if mode == "pidgin" else "en"

    # Map speaker name → voice key
    host_voices = {
        "Ezinne": normalize_voice(ezinne_voice),
        "Abeo": normalize_voice(abeo_voice),
    }

    script: list[dict] = []
    first_ready = asyncio.Event()

    async def _synth_line(idx: int, line: dict) -> None:
        # Apply user-chosen host voice (overrides AI-generated default)
        voice = host_voices.get(line["speaker"], line["voice"])
        try:
            try:
                audio = await synthesize_chunk(line["text"], voice, engine, lang=lang)
            except Exception as tts_err:
                print(f"[Podcast] Line {idx} premium TTS failed ({tts_err}), falling back")
                audio = await synthesize_chunk(line["text"], voice, "fast", lang=lang)
            save_podcast_chunk(user_id, doc_id, idx, audio, line["speaker"])
            update_document(doc_id, {"podcast_ready": idx + 1})
            save_podcast_script(doc_id, list(script))
        except Exception as e:
            print(f"[Podcast] Line {idx} TTS failed: {e}")
        finally:
            if idx == 0:
                first_ready.set()

    async def _run():
        # Step 1: collect script from Groq, start line 0 TTS immediately
        line0_task = None
        async for line in stream_podcast_lines(text, mode=mode, doc_id=doc_id, topic=topic):
            script.append(line)
            if len(script) == 1:
                line0_task = asyncio.create_task(_synth_line(0, line))

        if not script:
            first_ready.set()
            return

        # Wait for line 0 to finish (it was running while Groq streamed the rest)
        if line0_task:
            await line0_task

        # Step 2: synthesize lines 1+ in parallel batches
        sem = asyncio.Semaphore(_TTS_CONCURRENCY)

        async def _bounded(idx: int, line: dict):
            async with sem:
                await _synth_line(idx, line)

        await asyncio.gather(*[
            _bounded(i, line) for i, line in enumerate(script[1:], start=1)
        ])

        update_document(doc_id, {"podcast_status": "ready", "podcast_total": len(script)})
        if not first_ready.is_set():
            first_ready.set()
        print(f"[Podcast] Pipeline complete — {len(script)} lines for {doc_id}")

    task = asyncio.create_task(_run())
    return script, first_ready, task


async def _podcast_pipeline_supabase(doc_id: str, user_id: str, text: str, mode: str = "standard"):
    """
    Supabase pipeline: stream lines, synthesize, store chunks in storage,
    and persist script/progress on the document record.
    """
    from services.tts import synthesize_chunk, get_tts_capabilities
    from services.supabase import get_supabase_admin

    caps = get_tts_capabilities()
    engine = "premium" if caps.get("premium_available") else "fast"
    if engine == "premium":
        tts_engine_name = "ElevenLabs" if caps.get("premium_elevenlabs") else ("YarnGPT2 local" if caps.get("premium_yarngpt_local") else "YarnGPT")
        print(f"[Podcast] Using {tts_engine_name} premium engine for {mode} mode")
    else:
        print(f"[Podcast] Using edge-tts fast engine for {mode} mode (Premium not available)")

    lang = "pcm" if mode == "pidgin" else "en"

    supabase = get_supabase_admin()
    script: list[dict] = []
    first_ready = asyncio.Event()

    async def _run():
        idx = 0
        async for line in stream_podcast_lines(text, mode=mode):
            script.append(line)
            try:
                try:
                    audio = await synthesize_chunk(line["text"], line["voice"], engine, lang=lang)
                except Exception as tts_err:
                    print(f"[Podcast] Line {idx} premium TTS failed ({tts_err}), falling back to edge-tts")
                    audio = await synthesize_chunk(line["text"], line["voice"], "fast", lang=lang)
                upload_audio_chunk(user_id, doc_id, idx, audio, "podcast")
                supabase.table("documents").update({
                    "podcast_ready": idx + 1,
                    "podcast_status": "generating",
                    "podcast_script": script,
                }).eq("id", doc_id).execute()
            except Exception as e:
                print(f"[Podcast] Line {idx} TTS failed: {e}")
            finally:
                if idx == 0:
                    first_ready.set()
                idx += 1

        supabase.table("documents").update({
            "podcast_status": "ready",
            "podcast_total": len(script),
            "podcast_script": script,
        }).eq("id", doc_id).execute()
        if not first_ready.is_set():
            first_ready.set()
        print(f"[Podcast] Pipeline complete — {len(script)} lines for {doc_id}")

    task = asyncio.create_task(_run())
    return script, first_ready, task


@router.post("/podcast/{doc_id}")
async def generate_podcast(
    doc_id: str,
    background_tasks: BackgroundTasks,
    authorization: str = Header(...),
    regenerate: bool = False,
    mode: str = "standard",
    chapter: int | None = None,
    body: PodcastRequest = PodcastRequest(),
):
    """
    Pipeline podcast generation. Returns as soon as the first audio chunk is ready.
    ?regenerate=true  — force fresh generation even if cached
    ?mode=standard    — Standard Nigerian English (default, free)
    ?mode=pidgin      — Nigerian Pidgin English (premium)
    Body: { topic?: string } — optional specific section text to podcast about
    """
    user_id = get_user_id(authorization)

    if not USE_LOCAL:
        from services.supabase import get_supabase_admin
        from services.chapters import detect_chapters

        supabase = get_supabase_admin()
        doc = supabase.table("documents") \
            .select("extracted_text, podcast_status, podcast_script, podcast_total") \
            .eq("id", doc_id).eq("user_id", user_id).single().execute()
        if not doc.data:
            raise HTTPException(status_code=404, detail="Document not found.")

        topic_text = body.topic if body.topic and body.topic.strip() else None
        force_regen = regenerate or bool(topic_text) or chapter is not None

        existing_script = doc.data.get("podcast_script") or []
        existing_chunks = list_audio_chunks_supabase(user_id, doc_id, "podcast")

        if not force_regen and existing_script and doc.data.get("podcast_status") == "ready":
            return {
                "status": "ready",
                "total_lines": doc.data.get("podcast_total", len(existing_script)),
                "ready_lines": len(existing_chunks),
                "script": existing_script,
                "cached": True,
            }

        if not force_regen and existing_script and doc.data.get("podcast_status") == "generating":
            return {
                "status": "generating",
                "total_lines": doc.data.get("podcast_total", len(existing_script)),
                "ready_lines": len(existing_chunks),
                "script": existing_script,
                "cached": True,
            }

        full_text = doc.data.get("extracted_text") or ""
        if not full_text.strip():
            raise HTTPException(status_code=422, detail="Document has no extracted text.")

        if topic_text:
            text = topic_text
        elif chapter is not None:
            chapter_list = detect_chapters(full_text)
            if 0 <= chapter < len(chapter_list):
                ch = chapter_list[chapter]
                words = full_text.split()
                text = " ".join(words[ch["start_word"]: ch["start_word"] + ch["word_count"]])
            else:
                text = full_text
        else:
            text = full_text

        delete_audio_chunks_supabase(user_id, doc_id, "podcast")
        supabase.table("documents").update({
            "podcast_status": "generating",
            "podcast_ready": 0,
            "podcast_total": 0,
            "podcast_script": None,
        }).eq("id", doc_id).execute()
        delete_keys(key_podcast_chunks(user_id, doc_id))

        script_ref, first_ready, _task = await _podcast_pipeline_supabase(doc_id, user_id, text, mode=mode)

        try:
            await asyncio.wait_for(first_ready.wait(), timeout=120)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="Podcast generation timed out.")

        ready_chunks = list_audio_chunks_supabase(user_id, doc_id, "podcast")

        return {
            "status": "generating",
            "total_lines": len(script_ref),
            "ready_lines": len(ready_chunks),
            "script": script_ref,
            "cached": False,
        }

    from services.local_storage import (
        get_document, get_podcast_script, list_podcast_chunks, update_document,
    )

    doc = get_document(doc_id, user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # If a specific topic/section was provided, always regenerate for it
    topic_text = body.topic if body.topic and body.topic.strip() else None
    force_regen = regenerate or bool(topic_text) or chapter is not None

    existing_script = get_podcast_script(doc_id)
    existing_chunks = list_podcast_chunks(doc_id, user_id)

    # Already fully ready — serve from cache (unless regenerate requested)
    if not force_regen and existing_script and doc.get("podcast_status") == "ready":
        return {
            "status": "ready",
            "total_lines": len(existing_script),
            "ready_lines": len(existing_chunks),
            "script": existing_script,
            "cached": True,
        }

    # Still generating from a previous call — return current progress
    if not force_regen and existing_script and doc.get("podcast_status") == "generating":
        return {
            "status": "generating",
            "total_lines": len(existing_script),
            "ready_lines": len(existing_chunks),
            "script": existing_script,
            "cached": True,
        }

    full_text = doc.get("extracted_text", "")
    if not full_text.strip():
        raise HTTPException(status_code=422, detail="Document has no extracted text.")

    # Determine what text to podcast about
    if topic_text:
        text = topic_text
    elif chapter is not None:
        # Extract just that chapter's text by word position
        from services.chapters import detect_chapters
        chapter_list = detect_chapters(full_text)
        if 0 <= chapter < len(chapter_list):
            ch = chapter_list[chapter]
            words = full_text.split()
            text = " ".join(words[ch["start_word"]: ch["start_word"] + ch["word_count"]])
        else:
            text = full_text
    else:
        text = full_text

    from services.local_storage import clear_podcast_chunks
    clear_podcast_chunks(doc_id, user_id)
    update_document(doc_id, {"podcast_status": "generating", "podcast_ready": 0, "podcast_total": 0})
    delete_keys(key_podcast_chunks(user_id, doc_id))

    # Start pipeline — script generation + TTS run concurrently
    script_ref, first_ready, _task = await _podcast_pipeline(
        doc_id, user_id, text, mode=mode,
        ezinne_voice=body.ezinne_voice,
        abeo_voice=body.abeo_voice,
        topic=topic_text,
    )

    # Wait only until the FIRST audio chunk is synthesized (~8-12s)
    try:
        await asyncio.wait_for(first_ready.wait(), timeout=120)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Podcast generation timed out. Is Ollama running?")

    from services.local_storage import get_podcast_script as _get_script, list_podcast_chunks
    current_script = _get_script(doc_id) or script_ref
    ready_chunks = list_podcast_chunks(doc_id, user_id)

    return {
        "status": "generating",
        "total_lines": len(current_script),
        "ready_lines": len(ready_chunks),
        "script": current_script,
        "cached": False,
    }


@router.get("/podcast/{doc_id}/chunks")
async def get_podcast_chunks(doc_id: str, request: Request, authorization: str = Header(...)):
    """Return list of ready podcast chunk URLs."""
    user_id = get_user_id(authorization)

    cache_key = key_podcast_chunks(user_id, doc_id)
    cached = get_json(cache_key)
    if cached is not None:
        token = authorization.split(" ")[1]
        base = str(request.base_url).rstrip("/")
        return {
            "status": cached.get("status") or "none",
            "ready_lines": cached.get("ready_lines", 0),
            "total_lines": cached.get("total_lines", 0),
            "script": cached.get("script", []),
            "chunks": [
                {
                    "index": idx,
                    "speaker": speaker,
                    "url": f"{base}/audio/{doc_id}/podcast/{idx}?token={token}",
                }
                for idx, speaker in cached.get("chunk_entries", [])
            ],
        }

    if not USE_LOCAL:
        from services.supabase import get_supabase_admin
        supabase = get_supabase_admin()
        doc = supabase.table("documents") \
            .select("podcast_status, podcast_ready, podcast_total, podcast_script") \
            .eq("id", doc_id).eq("user_id", user_id).single().execute()
        if not doc.data:
            raise HTTPException(status_code=404, detail="Document not found.")

        chunks = list_audio_chunks_supabase(user_id, doc_id, "podcast")
        script = doc.data.get("podcast_script") or []
        token = authorization.split(" ")[1]
        base = str(request.base_url).rstrip("/")

        payload = {
            "status": doc.data.get("podcast_status") or "none",
            "ready_lines": len(chunks),
            "total_lines": doc.data.get("podcast_total", len(script)),
            "script": script,
            "chunks": [
                {
                    "index": c["chunk_index"],
                    "speaker": (script[c["chunk_index"]]["speaker"] if c["chunk_index"] < len(script) else "Ezinne"),
                    "url": f"{base}/audio/{doc_id}/podcast/{c['chunk_index']}?token={token}",
                }
                for c in chunks
            ],
        }
        set_json(cache_key, {
            "status": payload["status"],
            "ready_lines": payload["ready_lines"],
            "total_lines": payload["total_lines"],
            "script": script,
            "chunk_entries": [
                (c["chunk_index"], (script[c["chunk_index"]]["speaker"] if c["chunk_index"] < len(script) else "Ezinne"))
                for c in chunks
            ],
        }, 5)
        return payload

    from services.local_storage import get_document, list_podcast_chunks, get_podcast_script

    doc = get_document(doc_id, user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunks = list_podcast_chunks(doc_id, user_id)
    script = get_podcast_script(doc_id) or []
    token = authorization.split(" ")[1]
    base = str(request.base_url).rstrip("/")
    payload = {
        "status": doc.get("podcast_status") or "none",
        "ready_lines": len(chunks),
        "total_lines": doc.get("podcast_total", len(script)),
        "script": script,
        "chunks": [
            {
                "index": c["chunk_index"],
                "speaker": c["speaker"],
                "url": f"{base}/audio/{doc_id}/podcast/{c['chunk_index']}?token={token}",
            }
            for c in chunks
        ],
    }
    set_json(cache_key, {
        "status": doc.get("podcast_status") or "none",
        "ready_lines": len(chunks),
        "total_lines": doc.get("podcast_total", len(script)),
        "script": script,
        "chunk_entries": [(c["chunk_index"], c["speaker"]) for c in chunks],
    }, 5)
    return payload


@router.post("/summarize/{doc_id}")
async def summarize(doc_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    cache_key = key_doc_summary(user_id, doc_id)
    cached = get_json(cache_key)
    if cached is not None:
        return {"summary": cached, "cached": True}

    if USE_LOCAL:
        from services.local_storage import get_document, update_document
        doc = get_document(doc_id, user_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        if doc.get("summary"):
            set_json(cache_key, doc["summary"], 86400)
            return {"summary": doc["summary"], "cached": True}
        summary = await summarize_document(doc["extracted_text"])
        update_document(doc_id, {"summary": summary})
        set_json(cache_key, summary, 86400)
        return {"summary": summary, "cached": False}

    from services.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    doc = supabase.table("documents").select("extracted_text, summary").eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.data.get("summary"):
        set_json(cache_key, doc.data["summary"], 86400)
        return {"summary": doc.data["summary"], "cached": True}
    summary = await summarize_document(doc.data["extracted_text"])
    supabase.table("documents").update({"summary": summary}).eq("id", doc_id).execute()
    set_json(cache_key, summary, 86400)
    return {"summary": summary, "cached": False}
