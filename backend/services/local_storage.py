"""
Local dev storage — works without Supabase.
Stores files and audio on disk, records in memory.
"""
import uuid, os, time, json, secrets
from pathlib import Path
from services.cache import (
    delete_keys,
    key_doc_list,
    key_doc_text,
    key_doc_chapters,
    key_doc_summary,
    key_audio_status,
    key_audio_chunks,
    key_podcast_chunks,
    key_user_stats,
)

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
    return {
        "documents": {},
        "audio_tracks": {},
        "audio_chunks": {},
        "podcast_chunks": {},
        "podcast_scripts": {},
        "activity": [],
        "notebooks": {},
        "sources": {},
        "notes": {},
        "artifacts": {},
        "sharing": {},
        "research_jobs": {},
        "chats": {},
        "chat_turns": {},
        "invitations": {},
        "collaborators": {},
    }


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
        "activity": _activity,
        "notebooks": _notebooks,
        "sources": _sources,
        "notes": _notes,
        "artifacts": _artifacts,
        "sharing": _sharing,
        "research_jobs": _research_jobs,
        "chats": _chats,
        "chat_turns": _chat_turns,
        "invitations": _invitations,
        "collaborators": _collaborators,
    }
    DB_FILE.write_text(json.dumps(data))


_db = _load_db()
_documents: dict[str, dict] = _db["documents"]
_audio_tracks: dict[str, dict] = _db["audio_tracks"]
_audio_chunks: dict[str, dict] = _db["audio_chunks"]
_podcast_chunks: dict[str, dict] = _db.get("podcast_chunks", {})
_podcast_scripts: dict[str, list] = _db.get("podcast_scripts", {})
_activity: list[dict] = _db.get("activity", [])
_notebooks: dict[str, dict] = _db.get("notebooks", {})
_sources: dict[str, dict] = _db.get("sources", {})
_notes: dict[str, dict] = _db.get("notes", {})
_artifacts: dict[str, dict] = _db.get("artifacts", {})
_sharing: dict[str, dict] = _db.get("sharing", {})
_research_jobs: dict[str, dict] = _db.get("research_jobs", {})
_chats: dict[str, dict] = _db.get("chats", {})
_chat_turns: dict[str, list[dict]] = _db.get("chat_turns", {})
# Pending or accepted invitation links.  Keyed by invitation_id.
_invitations: dict[str, dict] = _db.get("invitations", {})
# Per-notebook collaborator map: ``{notebook_id: {user_id: {role, since, ...}}}``.
_collaborators: dict[str, dict[str, dict]] = _db.get("collaborators", {})


def _timestamp() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _new_id() -> str:
    return str(uuid.uuid4())

def log_activity(user_id: str, doc_id: str, activity_type: str, duration_seconds: int = 0):
    """Record a study event (e.g., 'listen_chunk', 'listen_podcast')."""
    entry = {
        "user_id": user_id,
        "doc_id": doc_id,
        "type": activity_type,
        "duration": duration_seconds,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _activity.append(entry)
    _save_db()
    delete_keys(key_user_stats(user_id))


def get_activity(user_id: str) -> list[dict]:
    if _LOCAL_DEV:
        return _activity
    return [a for a in _activity if a["user_id"] == user_id]

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
        "created_at": _timestamp(),
    }
    _documents[doc_id] = record
    _save_db()
    delete_keys(key_doc_list(user_id), key_user_stats(user_id))
    return record


def save_document_from_text(
    user_id: str,
    filename: str,
    text: str,
    *,
    source_type: str = "text",
    source_id: str | None = None,
) -> dict:
    file_bytes = text.encode("utf-8")
    record = save_document(user_id, filename, file_bytes, text)
    record["source_type"] = source_type
    if source_id:
        record["source_id"] = source_id
    _documents[record["id"]].update({k: v for k, v in record.items() if k != "extracted_text"})
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
    if not doc:
        return False
    # In local dev mode, skip ownership check — user_ids may differ between sessions
    if not _LOCAL_DEV and doc["user_id"] != user_id:
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
    delete_keys(
        key_audio_status(user_id, doc_id),
        key_audio_chunks(user_id, doc_id),
    )


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
    delete_keys(
        key_audio_status(user_id, doc_id),
        key_audio_chunks(user_id, doc_id),
    )
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
        user_id = _documents[doc_id].get("user_id")
        if user_id:
            delete_keys(
                key_doc_list(user_id),
                key_doc_text(user_id, doc_id),
                key_doc_chapters(user_id, doc_id),
                key_doc_summary(user_id, doc_id),
                key_audio_status(user_id, doc_id),
                key_audio_chunks(user_id, doc_id),
                key_podcast_chunks(user_id, doc_id),
            )


# ── Podcast storage ───────────────────────────────────────────────────────────

def save_podcast_script(doc_id: str, script: list[dict]):
    _podcast_scripts[doc_id] = script
    _save_db()
    doc = _documents.get(doc_id)
    if doc:
        delete_keys(key_podcast_chunks(doc["user_id"], doc_id))


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
    delete_keys(key_podcast_chunks(user_id, doc_id))
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
    delete_keys(key_podcast_chunks(user_id, doc_id))
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
    delete_keys(key_podcast_chunks(user_id, doc_id))


# ── Notebook workspace storage ───────────────────────────────────────────────

def list_notebooks(user_id: str) -> list[dict]:
    notebooks = [n for n in _notebooks.values() if n["user_id"] == user_id]
    return sorted(notebooks, key=lambda n: n["updated_at"], reverse=True)


def list_accessible_notebooks(user_id: str) -> list[dict]:
    """Notebooks the user owns plus notebooks they joined as a collaborator."""
    by_id: dict[str, dict] = {}
    for n in _notebooks.values():
        if n["user_id"] == user_id:
            by_id[n["id"]] = n
    for nb_id, collabs in _collaborators.items():
        if user_id in collabs and nb_id in _notebooks:
            by_id[nb_id] = _notebooks[nb_id]
    return sorted(by_id.values(), key=lambda n: n["updated_at"], reverse=True)


def get_notebook(notebook_id: str, user_id: str) -> dict | None:
    nb = _notebooks.get(notebook_id)
    if not nb:
        return None
    if nb["user_id"] == user_id:
        return nb
    collaborators = _collaborators.get(notebook_id, {})
    if user_id and user_id in collaborators:
        return nb
    sharing = _sharing.get(notebook_id, {})
    if sharing.get("public") and user_id:
        return nb
    # Legacy local dev: user/session id may not match persisted owner_id after restarts.
    if _LOCAL_DEV and user_id:
        return nb
    return None


def create_notebook(user_id: str, title: str, description: str = "") -> dict:
    notebook_id = _new_id()
    record = {
        "id": notebook_id,
        "user_id": user_id,
        "title": title.strip() or "Untitled Notebook",
        "description": description.strip(),
        "created_at": _timestamp(),
        "updated_at": _timestamp(),
    }
    _notebooks[notebook_id] = record
    _sharing.setdefault(notebook_id, {"notebook_id": notebook_id, "user_id": user_id, "public": False, "role": "viewer"})
    _save_db()
    return record


def rename_notebook(notebook_id: str, user_id: str, title: str) -> dict | None:
    nb = get_notebook(notebook_id, user_id)
    if not nb:
        return None
    nb["title"] = title.strip() or nb["title"]
    nb["updated_at"] = _timestamp()
    _save_db()
    return nb


def delete_notebook(notebook_id: str, user_id: str) -> bool:
    nb = get_notebook(notebook_id, user_id)
    if not nb:
        return False
    if nb.get("user_id") != user_id:
        return False
    for source in list(_sources.values()):
        if source["notebook_id"] == notebook_id:
            delete_source(source["id"], user_id)
    for note in list(_notes.values()):
        if note["notebook_id"] == notebook_id:
            _notes.pop(note["id"], None)
    for artifact in list(_artifacts.values()):
        if artifact["notebook_id"] == notebook_id:
            _artifacts.pop(artifact["id"], None)
    _sharing.pop(notebook_id, None)
    _collaborators.pop(notebook_id, None)
    for inv_id, inv in list(_invitations.items()):
        if inv.get("notebook_id") == notebook_id:
            _invitations.pop(inv_id, None)
    _notebooks.pop(notebook_id, None)
    _save_db()
    return True


def _source_defaults() -> dict:
    return {"status": "ready", "guide": None, "fulltext": "", "refresh_state": "fresh"}


def list_sources(notebook_id: str, user_id: str) -> list[dict]:
    """All sources in the notebook for anyone who can open the notebook (owner, collaborator, or public viewer)."""
    if get_notebook(notebook_id, user_id) is None:
        return []
    sources = [s for s in _sources.values() if s["notebook_id"] == notebook_id]
    return sorted(sources, key=lambda s: s["updated_at"], reverse=True)


def get_source(source_id: str, user_id: str) -> dict | None:
    src = _sources.get(source_id)
    if not src:
        return None
    if get_notebook(src["notebook_id"], user_id) is None:
        return None
    return src


def upsert_source(
    notebook_id: str,
    user_id: str,
    *,
    source_type: str,
    title: str,
    content: str,
    url: str | None = None,
    document_id: str | None = None,
    metadata: dict | None = None,
) -> dict:
    source_id = _new_id()
    now = _timestamp()
    record = {
        "id": source_id,
        "notebook_id": notebook_id,
        "user_id": user_id,
        "type": source_type,
        "title": title.strip() or "Untitled Source",
        "url": url,
        "document_id": document_id,
        "content": content,
        "fulltext": content,
        "metadata": metadata or {},
        "status": "ready",
        "refresh_state": "fresh",
        "created_at": now,
        "updated_at": now,
    }
    _sources[source_id] = record
    if notebook_id in _notebooks:
        _notebooks[notebook_id]["updated_at"] = now
    _save_db()
    return record


def rename_source(source_id: str, user_id: str, title: str) -> dict | None:
    src = get_source(source_id, user_id)
    if not src:
        return None
    src["title"] = title.strip() or src["title"]
    src["updated_at"] = _timestamp()
    _save_db()
    return src


def update_source(source_id: str, user_id: str, updates: dict) -> dict | None:
    src = get_source(source_id, user_id)
    if not src:
        return None
    src.update(updates)
    src["updated_at"] = _timestamp()
    _save_db()
    return src


def delete_source(source_id: str, user_id: str) -> bool:
    src = get_source(source_id, user_id)
    if not src:
        return False
    doc_id = src.get("document_id")
    if doc_id:
        delete_document(doc_id, user_id)
    _sources.pop(source_id, None)
    _save_db()
    return True


def list_notes(notebook_id: str, user_id: str) -> list[dict]:
    if get_notebook(notebook_id, user_id) is None:
        return []
    notes = [n for n in _notes.values() if n["notebook_id"] == notebook_id]
    return sorted(notes, key=lambda n: n["updated_at"], reverse=True)


def create_note(
    notebook_id: str,
    user_id: str,
    *,
    title: str,
    content: str,
    source_id: str | None = None,
    kind: str = "note",
) -> dict:
    note_id = _new_id()
    now = _timestamp()
    record = {
        "id": note_id,
        "notebook_id": notebook_id,
        "user_id": user_id,
        "source_id": source_id,
        "kind": kind,
        "title": title.strip() or "Untitled Note",
        "content": content.strip(),
        "created_at": now,
        "updated_at": now,
    }
    _notes[note_id] = record
    _save_db()
    return record


def update_note(note_id: str, user_id: str, updates: dict) -> dict | None:
    note = _notes.get(note_id)
    if not note:
        return None
    nb_id = note["notebook_id"]
    if not _LOCAL_DEV:
        if note["user_id"] != user_id and not can_access_notebook(nb_id, user_id, required="editor"):
            return None
    note.update(updates)
    note["updated_at"] = _timestamp()
    _save_db()
    return note


def delete_note(note_id: str, user_id: str) -> bool:
    note = _notes.get(note_id)
    if not note:
        return False
    nb_id = note["notebook_id"]
    if not _LOCAL_DEV:
        if note["user_id"] != user_id and not can_access_notebook(nb_id, user_id, required="editor"):
            return False
    _notes.pop(note_id, None)
    _save_db()
    return True


def list_artifacts(notebook_id: str, user_id: str) -> list[dict]:
    if get_notebook(notebook_id, user_id) is None:
        return []
    artifacts = [a for a in _artifacts.values() if a["notebook_id"] == notebook_id]
    return sorted(artifacts, key=lambda a: a["updated_at"], reverse=True)


def create_artifact(
    notebook_id: str,
    user_id: str,
    *,
    artifact_type: str,
    title: str,
    content: str,
    fmt: str = "text",
    status: str = "ready",
    metadata: dict | None = None,
) -> dict:
    artifact_id = _new_id()
    now = _timestamp()
    record = {
        "id": artifact_id,
        "notebook_id": notebook_id,
        "user_id": user_id,
        "type": artifact_type,
        "title": title.strip() or artifact_type.title(),
        "content": content,
        "format": fmt,
        "status": status,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }
    _artifacts[artifact_id] = record
    _save_db()
    return record


def update_artifact(artifact_id: str, user_id: str, updates: dict) -> dict | None:
    artifact = _artifacts.get(artifact_id)
    if not artifact:
        return None
    nb_id = artifact["notebook_id"]
    if not _LOCAL_DEV:
        if artifact["user_id"] != user_id and not can_access_notebook(nb_id, user_id, required="editor"):
            return None
    artifact.update(updates)
    artifact["updated_at"] = _timestamp()
    _save_db()
    return artifact


def delete_artifact(artifact_id: str, user_id: str) -> bool:
    artifact = _artifacts.get(artifact_id)
    if not artifact:
        return False
    nb_id = artifact["notebook_id"]
    if not _LOCAL_DEV:
        if artifact["user_id"] != user_id and not can_access_notebook(nb_id, user_id, required="editor"):
            return False
    _artifacts.pop(artifact_id, None)
    _save_db()
    return True


def set_sharing(notebook_id: str, user_id: str, public: bool, role: str = "viewer") -> dict | None:
    nb = get_notebook(notebook_id, user_id)
    if not nb:
        return None
    record = {
        "notebook_id": notebook_id,
        "user_id": user_id,
        "public": bool(public),
        "role": role if role in {"viewer", "editor"} else "viewer",
        "updated_at": _timestamp(),
    }
    _sharing[notebook_id] = record
    _save_db()
    return record


def get_sharing(notebook_id: str, user_id: str) -> dict | None:
    sharing = _sharing.get(notebook_id)
    if not sharing:
        return {"notebook_id": notebook_id, "user_id": user_id, "public": False, "role": "viewer"}
    return sharing


def create_research_job(
    notebook_id: str,
    user_id: str,
    *,
    query: str,
    mode: str = "fast",
    status: str = "ready",
    results: list[dict] | None = None,
) -> dict:
    job_id = _new_id()
    now = _timestamp()
    record = {
        "id": job_id,
        "notebook_id": notebook_id,
        "user_id": user_id,
        "query": query.strip(),
        "mode": mode,
        "status": status,
        "results": results or [],
        "created_at": now,
        "updated_at": now,
    }
    _research_jobs[job_id] = record
    _save_db()
    return record


def get_research_job(job_id: str, user_id: str) -> dict | None:
    job = _research_jobs.get(job_id)
    if not job:
        return None
    if _LOCAL_DEV or job["user_id"] == user_id:
        return job
    return None


def list_chats(notebook_id: str, user_id: str) -> list[dict]:
    if get_notebook(notebook_id, user_id) is None:
        return []
    chats = [c for c in _chats.values() if c["notebook_id"] == notebook_id]
    return sorted(chats, key=lambda c: c["updated_at"], reverse=True)


def create_chat(notebook_id: str, user_id: str, title: str, source_ids: list[str] | None = None) -> dict:
    chat_id = _new_id()
    now = _timestamp()
    record = {
        "id": chat_id,
        "notebook_id": notebook_id,
        "user_id": user_id,
        "title": title.strip() or "Saved Chat",
        "source_ids": source_ids or [],
        "created_at": now,
        "updated_at": now,
    }
    _chats[chat_id] = record
    _chat_turns[chat_id] = []
    _save_db()
    return record


def get_chat(chat_id: str, user_id: str) -> dict | None:
    chat = _chats.get(chat_id)
    if not chat:
        return None
    if get_notebook(chat["notebook_id"], user_id) is None:
        return None
    return chat


def rename_chat(chat_id: str, user_id: str, title: str) -> dict | None:
    chat = get_chat(chat_id, user_id)
    if not chat:
        return None
    chat["title"] = title.strip() or chat["title"]
    chat["updated_at"] = _timestamp()
    _save_db()
    return chat


def delete_chat(chat_id: str, user_id: str) -> bool:
    chat = get_chat(chat_id, user_id)
    if not chat:
        return False
    _chats.pop(chat_id, None)
    _chat_turns.pop(chat_id, None)
    _save_db()
    return True


def list_chat_turns(chat_id: str, user_id: str) -> list[dict]:
    chat = get_chat(chat_id, user_id)
    if not chat:
        return []
    return _chat_turns.get(chat_id, [])


def add_chat_turn(
    chat_id: str,
    user_id: str,
    *,
    role: str,
    content: str,
    citations: list[dict] | None = None,
) -> dict | None:
    chat = get_chat(chat_id, user_id)
    if not chat:
        return None
    turn = {
        "id": _new_id(),
        "role": role,
        "content": content,
        "citations": citations or [],
        "pinned": False,
        "created_at": _timestamp(),
    }
    _chat_turns.setdefault(chat_id, []).append(turn)
    chat["updated_at"] = _timestamp()
    _save_db()
    return turn


def get_chat_turn(chat_id: str, turn_id: str, user_id: str) -> dict | None:
    """Return a single turn by id, scoped to the requesting user.

    Used by ``save_turn_as_note`` and ``set_turn_pinned`` so they don't have
    to scan the whole turn list in the router.
    """
    chat = get_chat(chat_id, user_id)
    if not chat:
        return None
    for turn in _chat_turns.get(chat_id, []):
        if turn["id"] == turn_id:
            return turn
    return None


def set_turn_pinned(chat_id: str, turn_id: str, user_id: str, *, pinned: bool) -> dict | None:
    """Mark or unmark a chat turn as pinned. Mutates in place."""
    turn = get_chat_turn(chat_id, turn_id, user_id)
    if not turn:
        return None
    turn["pinned"] = bool(pinned)
    _save_db()
    return turn


# ---------------------------------------------------------------------------
# Sharing: invitations, collaborators, role resolution
# ---------------------------------------------------------------------------

ROLE_ORDER = {"viewer": 1, "editor": 2, "owner": 3}
INVITATION_DEFAULT_TTL_SECONDS = 7 * 24 * 3600


def _normalize_role(role: str | None, default: str = "viewer") -> str:
    role = (role or "").strip().lower()
    if role in {"viewer", "editor"}:
        return role
    if role == "owner":
        return "owner"
    return default


def _role_at_least(actual: str | None, required: str) -> bool:
    if not actual:
        return False
    return ROLE_ORDER.get(actual, 0) >= ROLE_ORDER.get(required, 0)


def get_notebook_role(notebook_id: str, user_id: str | None) -> str | None:
    """Return the effective role for ``user_id`` on a notebook.

    Returns ``"owner"`` / ``"editor"`` / ``"viewer"`` for explicit access.  In
    local-dev mode, unknown users gain ``"editor"`` (not owner) so solo-dev
    flows can mutate content while collaborator viewer/editor still apply when
    joined.  Returns ``None`` when the user has no access.
    """
    nb = _notebooks.get(notebook_id)
    if not nb:
        return None
    if user_id and nb.get("user_id") == user_id:
        return "owner"
    if user_id:
        collab = _collaborators.get(notebook_id, {}).get(user_id)
        if collab:
            return _normalize_role(collab.get("role"))
    sharing = _sharing.get(notebook_id)
    if sharing and sharing.get("public"):
        # Public sharing currently exposes read-only access.
        return _normalize_role(sharing.get("role"), default="viewer")
    if _LOCAL_DEV and user_id:
        return "editor"
    return None


def can_access_notebook(notebook_id: str, user_id: str | None, required: str = "viewer") -> bool:
    role = get_notebook_role(notebook_id, user_id)
    return _role_at_least(role, required)


def create_invitation(
    notebook_id: str,
    owner_id: str,
    role: str = "viewer",
    expires_in_seconds: int = INVITATION_DEFAULT_TTL_SECONDS,
    invitee_email: str | None = None,
) -> dict | None:
    nb = get_notebook(notebook_id, owner_id)
    if not nb:
        return None
    if not _LOCAL_DEV and nb.get("user_id") != owner_id:
        return None
    record = {
        "id": _new_id(),
        "notebook_id": notebook_id,
        "owner_id": owner_id,
        "invitee_email": (invitee_email or "").strip().lower() or None,
        "role": _normalize_role(role),
        "token": secrets.token_urlsafe(24),
        "created_at": _timestamp(),
        "expires_at": time.time() + max(int(expires_in_seconds), 60),
        "accepted_user_id": None,
        "accepted_at": None,
        "revoked": False,
    }
    _invitations[record["id"]] = record
    _save_db()
    return record


def list_invitations(notebook_id: str, owner_id: str) -> list[dict]:
    nb = get_notebook(notebook_id, owner_id)
    if not nb:
        return []
    if not _LOCAL_DEV and nb.get("user_id") != owner_id:
        return []
    records = [inv for inv in _invitations.values() if inv.get("notebook_id") == notebook_id]
    return sorted(records, key=lambda inv: inv["created_at"], reverse=True)


def revoke_invitation(invitation_id: str, owner_id: str) -> bool:
    inv = _invitations.get(invitation_id)
    if not inv:
        return False
    nb = _notebooks.get(inv.get("notebook_id", ""))
    if not nb:
        return False
    if not _LOCAL_DEV and nb.get("user_id") != owner_id:
        return False
    inv["revoked"] = True
    _save_db()
    return True


def find_invitation_by_token(token: str) -> dict | None:
    token = (token or "").strip()
    if not token:
        return None
    for inv in _invitations.values():
        if inv.get("token") == token:
            return inv
    return None


def accept_invitation(token: str, user_id: str) -> dict | None:
    """Convert an invitation token into a collaborator record.

    Returns a dict ``{"notebook": ..., "collaborator": ..., "invitation": ...}``
    on success or ``None`` when the token is invalid/expired/revoked.
    """
    inv = find_invitation_by_token(token)
    if not inv:
        return None
    if inv.get("revoked"):
        return None
    expires_at = inv.get("expires_at") or 0
    if expires_at and time.time() > float(expires_at):
        return None
    notebook_id = inv.get("notebook_id")
    nb = _notebooks.get(notebook_id or "")
    if not nb:
        return None
    if not _LOCAL_DEV and nb.get("user_id") == user_id:
        # Owners do not need to accept their own invitations.
        return {"notebook": nb, "collaborator": None, "invitation": inv, "already_owner": True}
    role = _normalize_role(inv.get("role"))
    collaborators = _collaborators.setdefault(notebook_id, {})
    record = collaborators.get(user_id) or {}
    record.update(
        {
            "user_id": user_id,
            "role": role,
            "invitation_id": inv["id"],
            "since": record.get("since") or _timestamp(),
            "updated_at": _timestamp(),
        }
    )
    collaborators[user_id] = record
    inv["accepted_user_id"] = user_id
    inv["accepted_at"] = _timestamp()
    _save_db()
    return {"notebook": nb, "collaborator": record, "invitation": inv, "already_owner": False}


def list_collaborators(notebook_id: str, owner_id: str) -> list[dict]:
    nb = get_notebook(notebook_id, owner_id)
    if not nb:
        return []
    if not _LOCAL_DEV and nb.get("user_id") != owner_id:
        return []
    return sorted(_collaborators.get(notebook_id, {}).values(), key=lambda c: c.get("since", ""))


def remove_collaborator(notebook_id: str, owner_id: str, target_user_id: str) -> bool:
    nb = _notebooks.get(notebook_id)
    if not nb:
        return False
    if not _LOCAL_DEV and nb.get("user_id") != owner_id:
        return False
    collaborators = _collaborators.get(notebook_id, {})
    if target_user_id not in collaborators:
        return False
    collaborators.pop(target_user_id, None)
    if not collaborators:
        _collaborators.pop(notebook_id, None)
    _save_db()
    return True


def update_collaborator_role(
    notebook_id: str, owner_id: str, target_user_id: str, role: str
) -> dict | None:
    nb = _notebooks.get(notebook_id)
    if not nb:
        return None
    if not _LOCAL_DEV and nb.get("user_id") != owner_id:
        return None
    collaborators = _collaborators.get(notebook_id, {})
    if target_user_id not in collaborators:
        return None
    collaborators[target_user_id]["role"] = _normalize_role(role)
    collaborators[target_user_id]["updated_at"] = _timestamp()
    _save_db()
    return collaborators[target_user_id]


def cleanup_duplicate_sources(notebook_id: str, user_id: str) -> list[dict]:
    sources = list_sources(notebook_id, user_id)
    seen = {}
    removed = []
    for source in sources:
        key = (source.get("url") or "").strip().lower() or source["title"].strip().lower()
        if key in seen:
            removed.append(source)
            delete_source(source["id"], user_id)
            continue
        seen[key] = source["id"]
    return removed
