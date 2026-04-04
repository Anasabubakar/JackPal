from __future__ import annotations

import re
from typing import Iterable

from services.supabase import get_supabase_admin

_CHUNK_RE = re.compile(r"^(chunk|podcast)_(\d+)\.(mp3|wav)$")


def _bucket():
    return get_supabase_admin().storage.from_("audio")


def _make_path(user_id: str, doc_id: str, filename: str) -> str:
    return f"{user_id}/{doc_id}/{filename}"


def upload_audio_chunk(
    user_id: str,
    doc_id: str,
    chunk_index: int,
    audio_bytes: bytes,
    kind: str = "chunk",
) -> str:
    ext = "wav" if audio_bytes[:4] == b"RIFF" and audio_bytes[8:12] == b"WAVE" else "mp3"
    filename = f"{kind}_{chunk_index:04d}.{ext}"
    path = _make_path(user_id, doc_id, filename)
    _bucket().upload(path, audio_bytes, {"content-type": "audio/wav" if ext == "wav" else "audio/mpeg"})
    return path


def list_audio_chunks(user_id: str, doc_id: str, kind: str = "chunk") -> list[dict]:
    prefix = f"{user_id}/{doc_id}"
    entries = _bucket().list(prefix)
    items = []
    for entry in entries or []:
        name = entry.get("name") or ""
        match = _CHUNK_RE.match(name)
        if not match:
            continue
        entry_kind, idx_str, _ext = match.groups()
        if entry_kind != kind:
            continue
        idx = int(idx_str)
        items.append({"chunk_index": idx, "storage_path": _make_path(user_id, doc_id, name)})
    return sorted(items, key=lambda x: x["chunk_index"])


def signed_url(storage_path: str, expires_in: int = 3600) -> str:
    result = _bucket().create_signed_url(storage_path, expires_in)
    return result.get("signedURL") or result.get("signed_url") or ""


def download_audio_chunk(storage_path: str) -> bytes:
    return _bucket().download(storage_path)


def delete_audio_chunks(user_id: str, doc_id: str, kind: str = "chunk") -> int:
    prefix = f"{user_id}/{doc_id}"
    entries = _bucket().list(prefix)
    if not entries:
        return 0
    targets = []
    for entry in entries:
        name = entry.get("name") or ""
        match = _CHUNK_RE.match(name)
        if not match:
            continue
        entry_kind, _idx, _ext = match.groups()
        if entry_kind != kind:
            continue
        targets.append(_make_path(user_id, doc_id, name))
    if not targets:
        return 0
    _bucket().remove(targets)
    return len(targets)
