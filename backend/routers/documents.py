import os
import asyncio
from fastapi import APIRouter, HTTPException, UploadFile, File, Header
from services.extractor import extract_text
from services.cache import (
    delete_keys,
    get_json,
    set_json,
    key_doc_list,
    key_doc_text,
    key_doc_chapters,
    key_doc_summary,
    key_audio_status,
    key_audio_chunks,
    key_podcast_chunks,
    key_user_stats,
)
from services.supabase_storage import delete_audio_chunks as delete_audio_chunks_supabase

router = APIRouter(prefix="/documents", tags=["documents"])
USE_LOCAL = not os.environ.get("SUPABASE_URL", "").startswith("https")

ALLOWED_TYPES = {"pdf", "doc", "docx", "txt"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


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


async def _auto_generate_audio(doc_id: str, user_id: str, text: str):
    """Background: pre-generate all audio chunks in parallel so playback is instant."""
    from services.tts import split_into_chunks, synthesize_chunk
    from services.local_storage import save_audio_chunk, update_document

    chunks = split_into_chunks(text)
    total = len(chunks)
    update_document(doc_id, {"status": "generating", "total_chunks": total, "ready_chunks": 0})
    print(f"[Upload] Auto-generating {total} audio chunks for {doc_id}")

    sem = asyncio.Semaphore(5)
    saved = 0

    async def _one(i: int, chunk_text: str):
        nonlocal saved
        async with sem:
            try:
                audio_bytes = await synthesize_chunk(chunk_text)
                save_audio_chunk(user_id, doc_id, i, audio_bytes)
                saved += 1
            except Exception as e:
                print(f"[Upload] Chunk {i} failed: {e}")

    await asyncio.gather(*[_one(i, chunk) for i, chunk in enumerate(chunks)])

    if saved > 0:
        update_document(doc_id, {"status": "audio_ready", "total_chunks": total})
        print(f"[Upload] Audio ready for {doc_id} — {saved}/{total} chunks")
    else:
        update_document(doc_id, {"status": "ready", "total_chunks": 0, "ready_chunks": 0})
        print(f"[Upload] Audio generation failed for {doc_id} — falling back to stream")


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    authorization: str = Header(...),
):
    user_id = _get_user_id(authorization)

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type .{ext} not supported.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 20MB.")

    try:
        text = extract_text(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not extract text: {str(e)}")

    if not text.strip():
        raise HTTPException(status_code=422, detail="Document appears empty or unreadable.")

    if USE_LOCAL:
        from services.local_storage import save_document, get_document_by_filename
        # Return existing doc if same filename already uploaded (prevent duplicates)
        existing = get_document_by_filename(user_id, file.filename)
        if existing:
            delete_keys(key_doc_list(user_id), key_user_stats(user_id))
            return {
                "id": existing["id"],
                "filename": existing["filename"],
                "word_count": existing["word_count"],
                "status": existing["status"],
                "audio_voice": existing.get("audio_voice"),
                "audio_engine": existing.get("audio_engine"),
                "ready_chunks": existing.get("ready_chunks", 0),
                "total_chunks": existing.get("total_chunks", 0),
            }
        record = save_document(user_id, file.filename, file_bytes, text)
        delete_keys(key_doc_list(user_id), key_user_stats(user_id))
        return {
            "id": record["id"],
            "filename": record["filename"],
            "word_count": record["word_count"],
            "status": "ready",
            "audio_voice": record.get("audio_voice"),
            "audio_engine": record.get("audio_engine"),
            "ready_chunks": 0,
            "total_chunks": 0,
        }

    import uuid
    from services.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    doc_id = str(uuid.uuid4())
    storage_path = f"{user_id}/{doc_id}/{file.filename}"
    supabase.storage.from_("documents").upload(storage_path, file_bytes)
    supabase.table("documents").insert({
        "id": doc_id, "user_id": user_id, "filename": file.filename,
        "storage_path": storage_path, "extracted_text": text,
        "word_count": len(text.split()), "status": "ready",
    }).execute()
    delete_keys(key_doc_list(user_id), key_user_stats(user_id))
    return {"id": doc_id, "filename": file.filename, "word_count": len(text.split()), "status": "ready"}


@router.get("/")
async def list_documents(authorization: str = Header(...)):
    user_id = _get_user_id(authorization)
    cache_key = key_doc_list(user_id)
    cached = get_json(cache_key)
    if cached is not None:
        return cached

    if USE_LOCAL:
        from services.local_storage import list_documents
        docs = list_documents(user_id)
        payload = [{
            "id": d["id"],
            "filename": d["filename"],
            "word_count": d["word_count"],
            "status": d["status"],
            "audio_voice": d.get("audio_voice"),
            "audio_engine": d.get("audio_engine"),
            "ready_chunks": d.get("ready_chunks", 0),
            "total_chunks": d.get("total_chunks", 0),
            "created_at": d["created_at"],
        } for d in docs]
        set_json(cache_key, payload, 10)
        return payload

    from services.supabase import get_supabase_admin
    result = get_supabase_admin().table("documents") \
        .select("id, filename, word_count, status, created_at, audio_voice, audio_engine, ready_chunks, total_chunks, podcast_status, podcast_ready, podcast_total") \
        .eq("user_id", user_id).order("created_at", desc=True).execute()
    set_json(cache_key, result.data, 10)
    return result.data


@router.get("/{doc_id}/text")
async def get_document_text(doc_id: str, authorization: str = Header(...)):
    user_id = _get_user_id(authorization)
    cache_key = key_doc_text(user_id, doc_id)
    cached = get_json(cache_key)
    if cached is not None:
        return {"text": cached}

    if USE_LOCAL:
        from services.local_storage import get_document
        doc = get_document(doc_id, user_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        set_json(cache_key, doc["extracted_text"], 3600)
        return {"text": doc["extracted_text"]}

    from services.supabase import get_supabase_admin
    result = get_supabase_admin().table("documents") \
        .select("extracted_text").eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    set_json(cache_key, result.data["extracted_text"], 3600)
    return {"text": result.data["extracted_text"]}


@router.get("/{doc_id}/chapters")
async def get_chapters(doc_id: str, authorization: str = Header(...)):
    """Return chapter/section list for navigation sidebar."""
    user_id = _get_user_id(authorization)
    cache_key = key_doc_chapters(user_id, doc_id)
    cached = get_json(cache_key)
    if cached is not None:
        return {"chapters": cached}

    if USE_LOCAL:
        from services.local_storage import get_document
        doc = get_document(doc_id, user_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        from services.chapters import detect_chapters
        chapters = detect_chapters(doc["extracted_text"])
        payload = [{"title": c["title"], "word_count": c["word_count"], "start_word": c["start_word"], "is_skippable": c.get("is_skippable", False)} for c in chapters]
        set_json(cache_key, payload, 3600)
        return {"chapters": payload}

    from services.supabase import get_supabase_admin
    result = get_supabase_admin().table("documents") \
        .select("extracted_text").eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    from services.chapters import detect_chapters
    chapters = detect_chapters(result.data.get("extracted_text") or "")
    payload = [{"title": c["title"], "word_count": c["word_count"], "start_word": c["start_word"], "is_skippable": c.get("is_skippable", False)} for c in chapters]
    set_json(cache_key, payload, 3600)
    return {"chapters": payload}


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, authorization: str = Header(...)):
    user_id = _get_user_id(authorization)

    if USE_LOCAL:
        from services.local_storage import delete_document
        if not delete_document(doc_id, user_id):
            raise HTTPException(status_code=404, detail="Document not found.")
        delete_keys(
            key_doc_list(user_id),
            key_doc_text(user_id, doc_id),
            key_doc_chapters(user_id, doc_id),
            key_doc_summary(user_id, doc_id),
            key_audio_status(user_id, doc_id),
            key_audio_chunks(user_id, doc_id),
            key_podcast_chunks(user_id, doc_id),
            key_user_stats(user_id),
        )
        return {"message": "Document deleted."}

    from services.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    doc = supabase.table("documents").select("storage_path").eq("id", doc_id).eq("user_id", user_id).single().execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    supabase.storage.from_("documents").remove([doc.data["storage_path"]])
    delete_audio_chunks_supabase(user_id, doc_id, "chunk")
    delete_audio_chunks_supabase(user_id, doc_id, "podcast")
    supabase.table("documents").delete().eq("id", doc_id).execute()
    delete_keys(
        key_doc_list(user_id),
        key_doc_text(user_id, doc_id),
        key_doc_chapters(user_id, doc_id),
        key_doc_summary(user_id, doc_id),
        key_audio_status(user_id, doc_id),
        key_audio_chunks(user_id, doc_id),
        key_podcast_chunks(user_id, doc_id),
        key_user_stats(user_id),
    )
    return {"message": "Document deleted."}
