"""
Local dev storage — works without Supabase.
Stores files and audio on disk, records in memory.
"""
import uuid, os, time, json
from pathlib import Path

# In local dev there is effectively one user, so relax ownership checks.
# This prevents 404s when user_ids drift between server restarts.
_LOCAL_DEV = os.environ.get("SUPABASE_URL", "") == ""

STORAGE_DIR = Path(__file__).parent.parent / "dev_storage"
STORAGE_DIR.mkdir(exist_ok=True)
(STORAGE_DIR / "documents").mkdir(exist_ok=True)
(STORAGE_DIR / "audio").mkdir(exist_ok=True)

DB_FILE = STORAGE_DIR / "db.json"


def _load_db() -> dict:
    if DB_FILE.exists():
        try:
            return json.loads(DB_FILE.read_text())
        except Exception:
            pass
    return {"documents": {}, "audio_tracks": {}, "audio_chunks": {}}


def _save_db():
    data = {
        "documents": {
            k: {kk: vv for kk, vv in v.items() if kk != "extracted_text"}
            for k, v in _documents.items()
        },
        "audio_tracks": _audio_tracks,
        "audio_chunks": _audio_chunks,
        "podcast_chunks": _podcast_chunks,
        "podcast_scripts": _podcast_scripts,
    }
    DB_FILE.write_text(json.dumps(data))


_db = _load_db()
_documents: dict[str, dict] = _db["documents"]
_audio_tracks: dict[str, dict] = _db["audio_tracks"]
_audio_chunks: dict[str, dict] = _db["audio_chunks"]
_podcast_chunks: dict[str, dict] = _db.get("podcast_chunks", {})
_podcast_scripts: dict[str, list] = _db.get("podcast_scripts", {})

# Load extracted text back from disk
for doc_id, doc in _documents.items():
    text_file = STORAGE_DIR / "documents" / f"{doc_id}_text.txt"
    if text_file.exists():
        doc["extracted_text"] = text_file.read_text(encoding="utf-8")


def save_document(user_id: str, filename: str, file_bytes: bytes, text: str) -> dict:
    doc_id = str(uuid.uuid4())
    path = STORAGE_DIR / "documents" / f"{doc_id}_{filename}"
    path.write_bytes(file_bytes)

    # Save extracted text separately (can be huge)
    text_file = STORAGE_DIR / "documents" / f"{doc_id}_text.txt"
    text_file.write_text(text, encoding="utf-8")

    record = {
        "id": doc_id,
        "user_id": user_id,
        "filename": filename,
        "storage_path": str(path),
        "extracted_text": text,
        "summary": None,
        "word_count": len(text.split()),
        "status": "ready",
        "audio_voice": None,
        "audio_engine": None,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _documents[doc_id] = record
    _save_db()
    return record


def list_documents(user_id: str) -> list[dict]:
    if _LOCAL_DEV:
        docs = list(_documents.values())
    else:
        docs = [d for d in _documents.values() if d["user_id"] == user_id]
    return sorted(docs, key=lambda d: d["created_at"], reverse=True)


def get_document(doc_id: str, user_id: str) -> dict | None:
    doc = _documents.get(doc_id)
    if not doc:
        return None
    if _LOCAL_DEV or doc["user_id"] == user_id:
        return doc
    return None


def get_document_by_filename(user_id: str, filename: str) -> dict | None:
    """Find an existing document by filename (for dedup on upload)."""
    for doc in _documents.values():
        if (_LOCAL_DEV or doc["user_id"] == user_id) and doc["filename"] == filename:
            return doc
    return None


def delete_document(doc_id: str, user_id: str) -> bool:
    doc = _documents.get(doc_id)
    if not doc or doc["user_id"] != user_id:
        return False
    try:
        Path(doc["storage_path"]).unlink(missing_ok=True)
    except Exception:
        pass
    _documents.pop(doc_id)
    # Remove associated chunked audio
    clear_audio_chunks(doc_id, user_id)
    # Remove associated audio
    for aid, audio in list(_audio_tracks.items()):
        if audio["document_id"] == doc_id:
            try:
                Path(audio["storage_path"]).unlink(missing_ok=True)
            except Exception:
                pass
            _audio_tracks.pop(aid)
    return True


def clear_audio_chunks(doc_id: str, user_id: str):
    chunk_dir = STORAGE_DIR / "audio" / doc_id
    if chunk_dir.exists():
        for path in chunk_dir.glob("*"):
            path.unlink(missing_ok=True)
        chunk_dir.rmdir()

    for key, chunk in list(_audio_chunks.items()):
        if chunk["doc_id"] == doc_id and chunk["user_id"] == user_id:
            _audio_chunks.pop(key)

    if doc_id in _documents:
        _documents[doc_id]["ready_chunks"] = 0
        _documents[doc_id]["total_chunks"] = 0

    _save_db()


def _audio_ext(data: bytes) -> str:
    """Detect audio format from magic bytes — WAV or MP3/other."""
    return ".wav" if data[:4] == b"RIFF" and data[8:12] == b"WAVE" else ".mp3"


def save_audio_chunk(user_id: str, doc_id: str, chunk_index: int, audio_bytes: bytes) -> dict:
    chunk_dir = STORAGE_DIR / "audio" / doc_id
    chunk_dir.mkdir(parents=True, exist_ok=True)
    path = chunk_dir / f"chunk_{chunk_index:04d}{_audio_ext(audio_bytes)}"
    path.write_bytes(audio_bytes)

    key = f"{doc_id}_{chunk_index}"
    record = {
        "doc_id": doc_id,
        "user_id": user_id,
        "chunk_index": chunk_index,
        "storage_path": str(path),
    }
    _audio_chunks[key] = record

    # Update ready_chunks count on document
    if doc_id in _documents:
        current = _documents[doc_id].get("ready_chunks", 0)
        _documents[doc_id]["ready_chunks"] = max(current, chunk_index + 1)

    _save_db()
    return record


def get_audio_chunk(doc_id: str, user_id: str, chunk_index: int) -> dict | None:
    key = f"{doc_id}_{chunk_index}"
    chunk = _audio_chunks.get(key)
    if not chunk:
        return None
    if _LOCAL_DEV or chunk["user_id"] == user_id:
        return chunk
    return None


def list_audio_chunks(doc_id: str, user_id: str) -> list[dict]:
    if _LOCAL_DEV:
        chunks = [c for c in _audio_chunks.values() if c["doc_id"] == doc_id]
    else:
        chunks = [c for c in _audio_chunks.values()
                  if c["doc_id"] == doc_id and c["user_id"] == user_id]
    return sorted(chunks, key=lambda c: c["chunk_index"])


def save_audio(user_id: str, doc_id: str, audio_bytes: bytes) -> dict:
    audio_id = str(uuid.uuid4())
    path = STORAGE_DIR / "audio" / f"{audio_id}.mp3"
    path.write_bytes(audio_bytes)

    record = {
        "id": audio_id,
        "document_id": doc_id,
        "user_id": user_id,
        "storage_path": str(path),
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _audio_tracks[audio_id] = record

    # Mark document as audio_ready
    if doc_id in _documents:
        _documents[doc_id]["status"] = "audio_ready"

    return record


def get_audio_for_document(doc_id: str, user_id: str) -> dict | None:
    tracks = [t for t in _audio_tracks.values()
              if t["document_id"] == doc_id and t["user_id"] == user_id]
    return sorted(tracks, key=lambda t: t["created_at"], reverse=True)[0] if tracks else None


def update_document(doc_id: str, updates: dict):
    if doc_id in _documents:
        _documents[doc_id].update(updates)
        _save_db()


# ── Podcast storage ───────────────────────────────────────────────────────────

def save_podcast_script(doc_id: str, script: list[dict]):
    _podcast_scripts[doc_id] = script
    _save_db()


def get_podcast_script(doc_id: str) -> list[dict] | None:
    return _podcast_scripts.get(doc_id)


def save_podcast_chunk(user_id: str, doc_id: str, chunk_index: int, audio_bytes: bytes, speaker: str) -> dict:
    chunk_dir = STORAGE_DIR / "audio" / doc_id
    chunk_dir.mkdir(parents=True, exist_ok=True)
    path = chunk_dir / f"podcast_{chunk_index:04d}{_audio_ext(audio_bytes)}"
    path.write_bytes(audio_bytes)

    key = f"pod_{doc_id}_{chunk_index}"
    record = {
        "doc_id": doc_id,
        "user_id": user_id,
        "chunk_index": chunk_index,
        "speaker": speaker,
        "storage_path": str(path),
    }
    _podcast_chunks[key] = record

    if doc_id in _documents:
        current = _documents[doc_id].get("podcast_ready", 0)
        _documents[doc_id]["podcast_ready"] = max(current, chunk_index + 1)

    _save_db()
    return record


def save_podcast_chunks_batch(
    user_id: str,
    doc_id: str,
    chunks: list[tuple[int, bytes, str]],  # (chunk_index, audio_bytes, speaker)
) -> list[dict]:
    """Save multiple podcast chunks to disk with a single DB write."""
    chunk_dir = STORAGE_DIR / "audio" / doc_id
    chunk_dir.mkdir(parents=True, exist_ok=True)

    records = []
    max_index = -1

    for chunk_index, audio_bytes, speaker in chunks:
        path = chunk_dir / f"podcast_{chunk_index:04d}{_audio_ext(audio_bytes)}"
        path.write_bytes(audio_bytes)

        key = f"pod_{doc_id}_{chunk_index}"
        record = {
            "doc_id": doc_id,
            "user_id": user_id,
            "chunk_index": chunk_index,
            "speaker": speaker,
            "storage_path": str(path),
        }
        _podcast_chunks[key] = record
        records.append(record)
        max_index = max(max_index, chunk_index)

    if doc_id in _documents and max_index >= 0:
        current = _documents[doc_id].get("podcast_ready", 0)
        _documents[doc_id]["podcast_ready"] = max(current, max_index + 1)

    _save_db()
    return records


def get_podcast_chunk(doc_id: str, user_id: str, chunk_index: int) -> dict | None:
    key = f"pod_{doc_id}_{chunk_index}"
    chunk = _podcast_chunks.get(key)
    if not chunk:
        return None
    if _LOCAL_DEV or chunk["user_id"] == user_id:
        return chunk
    return None


def list_podcast_chunks(doc_id: str, user_id: str) -> list[dict]:
    if _LOCAL_DEV:
        chunks = [c for c in _podcast_chunks.values() if c["doc_id"] == doc_id]
    else:
        chunks = [c for c in _podcast_chunks.values()
                  if c["doc_id"] == doc_id and c["user_id"] == user_id]
    return sorted(chunks, key=lambda c: c["chunk_index"])


def clear_podcast_chunks(doc_id: str, user_id: str):
    chunk_dir = STORAGE_DIR / "audio" / doc_id
    if chunk_dir.exists():
        for path in chunk_dir.glob("podcast_*"):
            path.unlink(missing_ok=True)

    for key in [k for k in _podcast_chunks if k.startswith(f"pod_{doc_id}_")]:
        _podcast_chunks.pop(key)

    _podcast_scripts.pop(doc_id, None)

    if doc_id in _documents:
        _documents[doc_id]["podcast_ready"] = 0
        _documents[doc_id]["podcast_total"] = 0
        _documents[doc_id]["podcast_status"] = None

    _save_db()
