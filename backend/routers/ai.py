import os
import asyncio
from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel
from services.ai import summarize_document, generate_podcast_script, stream_podcast_lines


class PodcastRequest(BaseModel):
    topic: str | None = None  # Optional: specific section text to podcast about

router = APIRouter(prefix="/ai", tags=["ai"])
USE_LOCAL = not os.environ.get("SUPABASE_URL", "").startswith("https")

# Max concurrent edge-tts calls — edge-tts is network I/O so parallelism helps a lot
_TTS_CONCURRENCY = 5


def _get_user_id(authorization: str) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token.")
    token = authorization.split(" ")[1]

    if USE_LOCAL:
        from services.local_auth import get_user_from_token
        user = get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired token.")
        return user["id"]

    from services.supabase import get_supabase_admin
    result = get_supabase_admin().auth.get_user(token)
    if not result.user:
        raise HTTPException(status_code=401, detail="Invalid token.")
    return result.user.id


async def _podcast_pipeline(doc_id: str, user_id: str, text: str, mode: str = "standard"):
    """
    True pipeline: Groq streams lines → each line is synthesized immediately.
    As soon as line 0 audio is ready, signals first_ready so the HTTP response
    can be sent — the rest continues here in the background.

    Returns (script, first_ready_event) so the endpoint can await the signal.
    Pidgin mode uses YarnGPT (premium engine) when available, falls back to edge-tts.
    """
    from services.tts import synthesize_chunk, get_tts_capabilities
    from services.local_storage import save_podcast_chunk, save_podcast_script, update_document

    # Pidgin mode → try YarnGPT premium Nigerian voices if the model is loaded
    caps = get_tts_capabilities()
    engine = "premium" if (mode == "pidgin" and caps["premium_available"]) else "fast"
    if engine == "premium":
        print(f"[Podcast] Using YarnGPT premium engine for {mode} mode")
    else:
        print(f"[Podcast] Using edge-tts fast engine for {mode} mode")

    script: list[dict] = []
    first_ready = asyncio.Event()

    async def _run():
        idx = 0
        async for line in stream_podcast_lines(text, mode=mode):
            script.append(line)
            try:
                try:
                    audio = await synthesize_chunk(line["text"], line["voice"], engine)
                except Exception as tts_err:
                    print(f"[Podcast] Line {idx} premium TTS failed ({tts_err}), falling back to edge-tts")
                    audio = await synthesize_chunk(line["text"], line["voice"], "fast")
                save_podcast_chunk(user_id, doc_id, idx, audio, line["speaker"])
                update_document(doc_id, {"podcast_ready": idx + 1})
                # Save script incrementally so /chunks can return it while still generating
                save_podcast_script(doc_id, list(script))
            except Exception as e:
                print(f"[Podcast] Line {idx} TTS failed: {e}")
            finally:
                if idx == 0:
                    first_ready.set()  # Unblock the HTTP response
                idx += 1

        update_document(doc_id, {"podcast_status": "ready", "podcast_total": len(script)})
        if not first_ready.is_set():
            first_ready.set()  # Edge case: Ollama returned nothing
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
    user_id = _get_user_id(authorization)

    if not USE_LOCAL:
        raise HTTPException(status_code=501, detail="Supabase path not yet implemented.")

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

    # Start pipeline — script generation + TTS run concurrently
    script_ref, first_ready, _task = await _podcast_pipeline(doc_id, user_id, text, mode=mode)

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
async def get_podcast_chunks(doc_id: str, authorization: str = Header(...)):
    """Return list of ready podcast chunk URLs."""
    user_id = _get_user_id(authorization)

    if not USE_LOCAL:
        raise HTTPException(status_code=501, detail="Supabase path not yet implemented.")

    from services.local_storage import get_document, list_podcast_chunks, get_podcast_script

    doc = get_document(doc_id, user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunks = list_podcast_chunks(doc_id, user_id)
    script = get_podcast_script(doc_id) or []
    token = authorization.split(" ")[1]

    return {
        "status": doc.get("podcast_status") or "none",
        "ready_lines": len(chunks),
        "total_lines": doc.get("podcast_total", len(script)),
        "script": script,
        "chunks": [
            {
                "index": c["chunk_index"],
                "speaker": c["speaker"],
                "url": f"http://localhost:8000/audio/{doc_id}/podcast/{c['chunk_index']}?token={token}",
            }
            for c in chunks
        ],
    }


@router.post("/summarize/{doc_id}")
async def summarize(doc_id: str, authorization: str = Header(...)):
    user_id = _get_user_id(authorization)

    if USE_LOCAL:
        from services.local_storage import get_document, update_document
        doc = get_document(doc_id, user_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        if doc.get("summary"):
            return {"summary": doc["summary"], "cached": True}
        summary = await summarize_document(doc["extracted_text"])
        update_document(doc_id, {"summary": summary})
        return {"summary": summary, "cached": False}

    from services.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    doc = supabase.table("documents").select("extracted_text, summary").eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.data.get("summary"):
        return {"summary": doc.data["summary"], "cached": True}
    summary = await summarize_document(doc.data["extracted_text"])
    supabase.table("documents").update({"summary": summary}).eq("id", doc_id).execute()
    return {"summary": summary, "cached": False}
