import os
import asyncio
import tempfile
import zipfile
from pathlib import Path

_TTS_CONCURRENCY = 5  # parallel edge-tts calls for chunk generation

from fastapi import APIRouter, HTTPException, Header, Query, BackgroundTasks, Request
from fastapi.responses import FileResponse, StreamingResponse
from typing import Optional
from starlette.background import BackgroundTask
from services.tts import DEFAULT_ENGINE, DEFAULT_VOICE, get_tts_capabilities, normalize_engine, resolve_voice_for_engine, split_into_chunks, stream_edge, synthesize_chunk
from services.cache import (
    delete_keys,
    get_json,
    set_json,
    key_tts_caps,
    key_audio_chunks,
    key_audio_status,
)
from services.supabase_storage import (
    upload_audio_chunk,
    list_audio_chunks as list_audio_chunks_supabase,
    download_audio_chunk,
    delete_audio_chunks as delete_audio_chunks_supabase,
)
from services.supabase_activity import log_activity as log_activity_supabase

from services.auth_utils import get_user_id, is_local_mode
router = APIRouter(prefix="/audio", tags=["audio"])
USE_LOCAL = is_local_mode()


# Centered auth moved to services.auth_utils


async def _tts_stream_generator(text: str, voice: str):
    """Pipe edge-tts bytes directly to client as they arrive. Zero disk I/O."""
    async for chunk in stream_edge(text, voice):
        yield chunk


@router.get("/capabilities")
async def audio_capabilities():
    cache_key = key_tts_caps()
    cached = get_json(cache_key)
    if cached is not None:
        return cached
    caps = get_tts_capabilities()
    set_json(cache_key, caps, 300)
    return caps


@router.get("/{doc_id}/stream")
async def stream_audio_direct(
    doc_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    voice: str = Query(DEFAULT_VOICE),
    engine: str = Query(DEFAULT_ENGINE),
):
    """
    Stream Nigerian voice audio directly to browser — no disk writes.
    Browser starts playing within ~1s as first bytes arrive.
    Supports: en-NG-EzinneNeural, en-NG-AbeoNeural
    """
    auth_header = authorization or (f"Bearer {token}" if token else None)
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token.")
    user_id = get_user_id(auth_header)
    engine = normalize_engine(engine)
    voice = resolve_voice_for_engine(voice, engine)

    if USE_LOCAL:
        from services.local_storage import get_document, list_audio_chunks
        doc = get_document(doc_id, user_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        text = doc.get("extracted_text", "")
        if not text:
            raise HTTPException(status_code=422, detail="No text extracted.")

        # If chunks already exist, redirect to chunk playlist (faster)
        existing_chunks = list_audio_chunks(doc_id, user_id)
        if existing_chunks and doc.get("audio_voice") == voice and doc.get("audio_engine", DEFAULT_ENGINE) == engine:
            api_token = auth_header.split(" ")[1]
            base = str(request.base_url).rstrip("/")
            first_url = f"{base}/audio/{doc_id}/chunk/0?token={api_token}"
            from fastapi.responses import RedirectResponse
            return RedirectResponse(url=first_url)

        # Stream only the first 80-word chunk for fast playback start
        # Kick off full pre-generation in background
        from services.tts import split_into_chunks
        chunks = split_into_chunks(text)
        first_chunk_text = chunks[0] if chunks else text

        return StreamingResponse(
            _tts_stream_generator(first_chunk_text, voice),
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-cache",
                "X-Content-Type-Options": "nosniff",
            },
        )

    from services.supabase import get_supabase_admin
    from fastapi.responses import RedirectResponse

    supabase = get_supabase_admin()
    doc = supabase.table("documents") \
        .select("extracted_text, audio_voice, audio_engine") \
        .eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    text = doc.data.get("extracted_text") or ""
    if not text:
        raise HTTPException(status_code=422, detail="No text extracted.")

    existing_chunks = list_audio_chunks_supabase(user_id, doc_id, "chunk")
    if existing_chunks and doc.data.get("audio_voice") == voice and doc.data.get("audio_engine", DEFAULT_ENGINE) == engine:
        api_token = auth_header.split(" ")[1]
        base = str(request.base_url).rstrip("/")
        first_url = f"{base}/audio/{doc_id}/chunk/0?token={api_token}"
        return RedirectResponse(url=first_url)

    chunks = split_into_chunks(text)
    first_chunk_text = chunks[0] if chunks else text
    return StreamingResponse(
        _tts_stream_generator(first_chunk_text, voice),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff",
        },
    )


async def _generate_remaining_chunks(
    doc_id: str,
    user_id: str,
    chunks: list[str],
    start_index: int,
    voice: str,
    engine: str,
):
    """Background task: generate chunks start_index onwards in parallel."""
    from services.local_storage import save_audio_chunk, update_document
    engine = normalize_engine(engine)
    voice = resolve_voice_for_engine(voice, engine)
    sem = asyncio.Semaphore(_TTS_CONCURRENCY)

    async def _one(i: int):
        async with sem:
            try:
                audio_bytes = await synthesize_chunk(chunks[i], voice, engine)
                save_audio_chunk(user_id, doc_id, i, audio_bytes)
            except Exception as e:
                print(f"[TTS] Chunk {i} failed: {e}")

    await asyncio.gather(*[_one(i) for i in range(start_index, len(chunks))])

    update_document(doc_id, {
        "status": "audio_ready",
        "total_chunks": len(chunks),
        "audio_voice": voice,
        "audio_engine": engine,
    })
    print(f"[TTS] All {len(chunks)} chunks done for doc {doc_id}")


async def _generate_remaining_chunks_supabase(
    doc_id: str,
    user_id: str,
    chunks: list[str],
    start_index: int,
    voice: str,
    engine: str,
):
    """Background task: generate chunks start_index onwards, save to Supabase storage."""
    from services.supabase import get_supabase_admin
    engine = normalize_engine(engine)
    voice = resolve_voice_for_engine(voice, engine)
    sem = asyncio.Semaphore(_TTS_CONCURRENCY)
    supabase = get_supabase_admin()
    progress = {"ready": start_index}
    lock = asyncio.Lock()

    async def _one(i: int):
        async with sem:
            try:
                audio_bytes = await synthesize_chunk(chunks[i], voice, engine)
                upload_audio_chunk(user_id, doc_id, i, audio_bytes, "chunk")
                async with lock:
                    progress["ready"] = max(progress["ready"], i + 1)
                    ready_now = progress["ready"]
            except Exception as e:
                print(f"[TTS] Chunk {i} failed: {e}")
                return
        if ready_now % 3 == 0 or ready_now == len(chunks):
            supabase.table("documents").update({
                "ready_chunks": ready_now,
            }).eq("id", doc_id).execute()

    await asyncio.gather(*[_one(i) for i in range(start_index, len(chunks))])

    supabase.table("documents").update({
        "status": "audio_ready",
        "total_chunks": len(chunks),
        "ready_chunks": progress["ready"],
        "audio_voice": voice,
        "audio_engine": engine,
    }).eq("id", doc_id).execute()
    print(f"[TTS] All {len(chunks)} chunks done for doc {doc_id}")


@router.post("/generate/{doc_id}")
async def generate_audio(
    doc_id: str,
    background_tasks: BackgroundTasks,
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    voice: str = Query(DEFAULT_VOICE),
    engine: str = Query(DEFAULT_ENGINE),
):
    auth_header = authorization or (f"Bearer {token}" if token else None)
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token.")
    user_id = get_user_id(auth_header)
    engine = normalize_engine(engine)
    voice = resolve_voice_for_engine(voice, engine)

    if USE_LOCAL:
        from services.local_storage import clear_audio_chunks, get_document, save_audio_chunk, update_document

        doc = get_document(doc_id, user_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        text = doc.get("extracted_text", "")
        if not text:
            raise HTTPException(status_code=422, detail="Document has no extracted text.")

        chunks = split_into_chunks(text)
        total_chunks = len(chunks)
        if doc.get("audio_voice") != voice or doc.get("audio_engine", DEFAULT_ENGINE) != engine:
            clear_audio_chunks(doc_id, user_id)

        update_document(doc_id, {
            "status": "generating",
            "total_chunks": total_chunks,
            "ready_chunks": 0,
            "audio_voice": voice,
            "audio_engine": engine,
        })

        # Generate ONLY first chunk — return immediately, rest in background
        try:
            first_audio = await synthesize_chunk(chunks[0], voice, engine)
            save_audio_chunk(user_id, doc_id, 0, first_audio)
            update_document(doc_id, {"status": "streaming", "ready_chunks": 1, "audio_voice": voice, "audio_engine": engine})
        except Exception as e:
            update_document(doc_id, {"status": "ready"})
            raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

        # All remaining chunks in background
        if total_chunks > 1:
            background_tasks.add_task(
                _generate_remaining_chunks, doc_id, user_id, chunks, 1, voice, engine
            )

        return {
            "status": "streaming",
            "ready_chunks": 1,
            "total_chunks": total_chunks,
            "audio_voice": voice,
            "audio_engine": engine,
            "message": f"First chunk ready. Generating {total_chunks - 1} more in background.",
        }

    from services.supabase import get_supabase_admin
    supabase = get_supabase_admin()

    doc = supabase.table("documents").select("extracted_text, audio_voice, audio_engine") \
        .eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found.")

    text = doc.data.get("extracted_text", "")
    if not text:
        raise HTTPException(status_code=422, detail="Document has no extracted text.")

    chunks = split_into_chunks(text)
    total_chunks = len(chunks)
    if total_chunks == 0:
        raise HTTPException(status_code=422, detail="Document has no usable text.")

    if doc.data.get("audio_voice") != voice or doc.data.get("audio_engine", DEFAULT_ENGINE) != engine:
        delete_audio_chunks_supabase(user_id, doc_id, "chunk")

    supabase.table("documents").update({
        "status": "generating",
        "total_chunks": total_chunks,
        "ready_chunks": 0,
        "audio_voice": voice,
        "audio_engine": engine,
    }).eq("id", doc_id).execute()
    delete_keys(key_audio_status(user_id, doc_id), key_audio_chunks(user_id, doc_id))

    try:
        first_audio = await synthesize_chunk(chunks[0], voice, engine)
        upload_audio_chunk(user_id, doc_id, 0, first_audio, "chunk")
        supabase.table("documents").update({
            "status": "streaming",
            "ready_chunks": 1,
            "audio_voice": voice,
            "audio_engine": engine,
        }).eq("id", doc_id).execute()
        delete_keys(key_audio_status(user_id, doc_id), key_audio_chunks(user_id, doc_id))
    except Exception as e:
        supabase.table("documents").update({"status": "ready"}).eq("id", doc_id).execute()
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

    if total_chunks > 1:
        background_tasks.add_task(
            _generate_remaining_chunks_supabase, doc_id, user_id, chunks, 1, voice, engine
        )

    return {
        "status": "streaming",
        "ready_chunks": 1,
        "total_chunks": total_chunks,
        "audio_voice": voice,
        "audio_engine": engine,
        "message": f"First chunk ready. Generating {total_chunks - 1} more in background.",
    }


@router.get("/{doc_id}/chunks")
async def get_audio_chunks(
    doc_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
):
    """Returns list of ready chunk URLs for the frontend playlist."""
    auth_header = authorization or (f"Bearer {token}" if token else None)
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token.")
    user_id = get_user_id(auth_header)

    cache_key = key_audio_chunks(user_id, doc_id)
    cached = get_json(cache_key)
    if cached is not None:
        api_token = auth_header.split(" ")[1]
        base = str(request.base_url).rstrip("/")
        return {
            "status": cached["status"],
            "ready_chunks": cached["ready_chunks"],
            "total_chunks": cached.get("total_chunks", 0),
            "audio_voice": cached.get("audio_voice"),
            "audio_engine": cached.get("audio_engine"),
            "chunks": [
                {
                    "index": idx,
                        "url": f"{base}/audio/{doc_id}/chunk/{idx}?token={api_token}",
                }
                for idx in cached.get("chunk_indices", [])
            ],
        }

    if USE_LOCAL:
        from services.local_storage import get_document, list_audio_chunks
        doc = get_document(doc_id, user_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        chunks = list_audio_chunks(doc_id, user_id)
        api_token = auth_header.split(" ")[1]
        base = str(request.base_url).rstrip("/")
        payload = {
            "status": doc["status"],
            "ready_chunks": len(chunks),
            "total_chunks": doc.get("total_chunks", 0),
            "audio_voice": doc.get("audio_voice"),
            "audio_engine": doc.get("audio_engine"),
            "chunks": [
                {
                    "index": c["chunk_index"],
                    "url": f"{base}/audio/{doc_id}/chunk/{c['chunk_index']}?token={api_token}",
                }
                for c in chunks
            ],
        }
        set_json(cache_key, {
            "status": doc["status"],
            "ready_chunks": len(chunks),
            "total_chunks": doc.get("total_chunks", 0),
            "audio_voice": doc.get("audio_voice"),
            "audio_engine": doc.get("audio_engine"),
            "chunk_indices": [c["chunk_index"] for c in chunks],
        }, 3)
        return payload

    from services.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    doc = supabase.table("documents").select("status, ready_chunks, total_chunks, audio_voice, audio_engine") \
        .eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunks = list_audio_chunks_supabase(user_id, doc_id, "chunk")
    api_token = auth_header.split(" ")[1]
    base = str(request.base_url).rstrip("/")
    payload = {
        "status": doc.data.get("status") or "ready",
        "ready_chunks": doc.data.get("ready_chunks", len(chunks)),
        "total_chunks": doc.data.get("total_chunks", 0),
        "audio_voice": doc.data.get("audio_voice"),
        "audio_engine": doc.data.get("audio_engine"),
        "chunks": [
            {
                "index": c["chunk_index"],
                "url": f"{base}/audio/{doc_id}/chunk/{c['chunk_index']}?token={api_token}",
            }
            for c in chunks
        ],
    }
    set_json(cache_key, {
        "status": payload["status"],
        "ready_chunks": payload["ready_chunks"],
        "total_chunks": payload.get("total_chunks", 0),
        "audio_voice": payload.get("audio_voice"),
        "audio_engine": payload.get("audio_engine"),
        "chunk_indices": [c["chunk_index"] for c in chunks],
    }, 3)
    return payload


@router.get("/{doc_id}/chunk/{chunk_index}")
async def stream_chunk(
    doc_id: str,
    chunk_index: int,
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
):
    """Stream a single audio chunk."""
    auth_header = authorization or (f"Bearer {token}" if token else None)
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token.")
    user_id = get_user_id(auth_header)

    if USE_LOCAL:
        from services.local_storage import get_audio_chunk, log_activity
        chunk = get_audio_chunk(doc_id, user_id, chunk_index)
        if not chunk:
            raise HTTPException(status_code=404, detail=f"Chunk {chunk_index} not ready yet.")
        
        # Log study activity: ~45s per chunk
        log_activity(user_id, doc_id, "listen_chunk", 45)

        mime = "audio/wav" if chunk["storage_path"].endswith(".wav") else "audio/mpeg"
        return FileResponse(chunk["storage_path"], media_type=mime)

    chunks = list_audio_chunks_supabase(user_id, doc_id, "chunk")
    match = next((c for c in chunks if c["chunk_index"] == chunk_index), None)
    if not match:
        raise HTTPException(status_code=404, detail=f"Chunk {chunk_index} not ready yet.")

    log_activity_supabase(user_id, doc_id, "listen_chunk", 45)
    data = download_audio_chunk(match["storage_path"])
    mime = "audio/wav" if match["storage_path"].endswith(".wav") else "audio/mpeg"
    return StreamingResponse(iter([data]), media_type=mime)


@router.get("/{doc_id}/download")
async def download_audio_chunks(
    doc_id: str,
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
):
    """Package ready chunk MP3s into a zip for offline download."""
    auth_header = authorization or (f"Bearer {token}" if token else None)
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token.")
    user_id = get_user_id(auth_header)

    if USE_LOCAL:
        from services.local_storage import get_document, list_audio_chunks

        doc = get_document(doc_id, user_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        chunks = list_audio_chunks(doc_id, user_id)
        if not chunks:
            raise HTTPException(status_code=409, detail="No audio chunks are ready for download yet.")

        safe_name = "".join(ch for ch in Path(doc["filename"]).stem if ch.isalnum() or ch in (" ", "-", "_")).strip() or "jackpal-audio"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
        tmp.close()

        with zipfile.ZipFile(tmp.name, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for chunk in chunks:
                chunk_path = Path(chunk["storage_path"])
                archive.write(chunk_path, arcname=chunk_path.name)

        return FileResponse(
            tmp.name,
            media_type="application/zip",
            filename=f"{safe_name}-audio-chunks.zip",
            background=BackgroundTask(lambda path=tmp.name: Path(path).unlink(missing_ok=True)),
        )

    raise HTTPException(status_code=501, detail="Supabase path not yet implemented.")


@router.get("/{doc_id}/podcast/{chunk_index}")
async def stream_podcast_chunk(
    doc_id: str,
    chunk_index: int,
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
):
    """Serve a single podcast audio chunk."""
    auth_header = authorization or (f"Bearer {token}" if token else None)
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token.")
    user_id = get_user_id(auth_header)

    if USE_LOCAL:
        from services.local_storage import get_podcast_chunk, log_activity
        chunk = get_podcast_chunk(doc_id, user_id, chunk_index)
        if not chunk:
            raise HTTPException(status_code=404, detail=f"Podcast chunk {chunk_index} not ready yet.")
        
        # Log podcast activity: ~30s per line
        log_activity(user_id, doc_id, "listen_podcast", 30)

        mime = "audio/wav" if chunk["storage_path"].endswith(".wav") else "audio/mpeg"
        return FileResponse(chunk["storage_path"], media_type=mime)

    chunks = list_audio_chunks_supabase(user_id, doc_id, "podcast")
    match = next((c for c in chunks if c["chunk_index"] == chunk_index), None)
    if not match:
        raise HTTPException(status_code=404, detail=f"Podcast chunk {chunk_index} not ready yet.")

    log_activity_supabase(user_id, doc_id, "listen_podcast", 30)
    data = download_audio_chunk(match["storage_path"])
    mime = "audio/wav" if match["storage_path"].endswith(".wav") else "audio/mpeg"
    return StreamingResponse(iter([data]), media_type=mime)


@router.get("/{doc_id}/status")
async def get_audio_status(
    doc_id: str,
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
):
    auth_header = authorization or (f"Bearer {token}" if token else None)
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token.")
    user_id = get_user_id(auth_header)
    cache_key = key_audio_status(user_id, doc_id)
    cached = get_json(cache_key)
    if cached is not None:
        return cached

    if USE_LOCAL:
        from services.local_storage import get_document
        doc = get_document(doc_id, user_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        payload = {
            "status": doc["status"],
            "ready_chunks": doc.get("ready_chunks", 0),
            "total_chunks": doc.get("total_chunks", 0),
            "audio_voice": doc.get("audio_voice"),
            "audio_engine": doc.get("audio_engine"),
        }
        set_json(cache_key, payload, 3)
        return payload

    from services.supabase import get_supabase_admin
    doc = get_supabase_admin().table("documents") \
        .select("status, ready_chunks, total_chunks, audio_voice, audio_engine") \
        .eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    payload = {
        "status": doc.data.get("status") or "ready",
        "ready_chunks": doc.data.get("ready_chunks", 0),
        "total_chunks": doc.data.get("total_chunks", 0),
        "audio_voice": doc.data.get("audio_voice"),
        "audio_engine": doc.data.get("audio_engine"),
    }
    set_json(cache_key, payload, 3)
    return payload
