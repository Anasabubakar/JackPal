import os
import asyncio
import tempfile
import zipfile
from pathlib import Path

_TTS_CONCURRENCY = 5  # parallel edge-tts calls for chunk generation

from fastapi import APIRouter, HTTPException, Header, Query, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from typing import Optional
from starlette.background import BackgroundTask
from services.tts import DEFAULT_ENGINE, DEFAULT_VOICE, get_tts_capabilities, normalize_engine, resolve_voice_for_engine, split_into_chunks, stream_edge, synthesize_chunk

router = APIRouter(prefix="/audio", tags=["audio"])
USE_LOCAL = not os.environ.get("SUPABASE_URL", "").startswith("https")


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


async def _tts_stream_generator(text: str, voice: str):
    """Pipe edge-tts bytes directly to client as they arrive. Zero disk I/O."""
    async for chunk in stream_edge(text, voice):
        yield chunk


@router.get("/capabilities")
async def audio_capabilities():
    return get_tts_capabilities()


@router.get("/{doc_id}/stream")
async def stream_audio_direct(
    doc_id: str,
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
    user_id = _get_user_id(auth_header)
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
            first_url = f"http://localhost:8000/audio/{doc_id}/chunk/0?token={api_token}"
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

    raise HTTPException(status_code=501, detail="Supabase path not yet implemented.")


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
    user_id = _get_user_id(auth_header)
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

    # Supabase path (same progressive approach)
    raise HTTPException(status_code=501, detail="Supabase path not yet implemented for chunks.")


@router.get("/{doc_id}/chunks")
async def get_audio_chunks(
    doc_id: str,
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
):
    """Returns list of ready chunk URLs for the frontend playlist."""
    auth_header = authorization or (f"Bearer {token}" if token else None)
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token.")
    user_id = _get_user_id(auth_header)

    if USE_LOCAL:
        from services.local_storage import get_document, list_audio_chunks
        doc = get_document(doc_id, user_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        chunks = list_audio_chunks(doc_id, user_id)
        api_token = auth_header.split(" ")[1]

        return {
            "status": doc["status"],
            "ready_chunks": len(chunks),
            "total_chunks": doc.get("total_chunks", 0),
            "audio_voice": doc.get("audio_voice"),
            "audio_engine": doc.get("audio_engine"),
            "chunks": [
                {
                    "index": c["chunk_index"],
                    "url": f"http://localhost:8000/audio/{doc_id}/chunk/{c['chunk_index']}?token={api_token}",
                }
                for c in chunks
            ],
        }

    raise HTTPException(status_code=501, detail="Supabase path not yet implemented.")


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
    user_id = _get_user_id(auth_header)

    if USE_LOCAL:
        from services.local_storage import get_audio_chunk, log_activity
        chunk = get_audio_chunk(doc_id, user_id, chunk_index)
        if not chunk:
            raise HTTPException(status_code=404, detail=f"Chunk {chunk_index} not ready yet.")
        
        # Log study activity: ~45s per chunk
        log_activity(user_id, doc_id, "listen_chunk", 45)

        mime = "audio/wav" if chunk["storage_path"].endswith(".wav") else "audio/mpeg"
        return FileResponse(chunk["storage_path"], media_type=mime)

    raise HTTPException(status_code=501, detail="Supabase path not yet implemented.")


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
    user_id = _get_user_id(auth_header)

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
    user_id = _get_user_id(auth_header)

    if USE_LOCAL:
        from services.local_storage import get_podcast_chunk, log_activity
        chunk = get_podcast_chunk(doc_id, user_id, chunk_index)
        if not chunk:
            raise HTTPException(status_code=404, detail=f"Podcast chunk {chunk_index} not ready yet.")
        
        # Log podcast activity: ~30s per line
        log_activity(user_id, doc_id, "listen_podcast", 30)

        mime = "audio/wav" if chunk["storage_path"].endswith(".wav") else "audio/mpeg"
        return FileResponse(chunk["storage_path"], media_type=mime)

    raise HTTPException(status_code=501, detail="Supabase path not yet implemented.")


@router.get("/{doc_id}/status")
async def get_audio_status(
    doc_id: str,
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
):
    auth_header = authorization or (f"Bearer {token}" if token else None)
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token.")
    user_id = _get_user_id(auth_header)

    if USE_LOCAL:
        from services.local_storage import get_document
        doc = get_document(doc_id, user_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        return {
            "status": doc["status"],
            "ready_chunks": doc.get("ready_chunks", 0),
            "total_chunks": doc.get("total_chunks", 0),
            "audio_voice": doc.get("audio_voice"),
            "audio_engine": doc.get("audio_engine"),
        }

    from services.supabase import get_supabase_admin
    doc = get_supabase_admin().table("documents").select("status").eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"status": doc.data["status"]}
