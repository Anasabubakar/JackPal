import hashlib
import json
import os
import re
import threading
from typing import Any

try:
    import redis
except Exception:
    redis = None

_DEFAULT_REDIS_URL = "redis://localhost:6379/0"
_client = None
_disabled = False
_lock = threading.Lock()


def _get_client():
    global _client, _disabled
    if _disabled or redis is None:
        return None
    if _client is not None:
        return _client
    with _lock:
        if _client is not None:
            return _client
        url = os.environ.get("REDIS_URL", _DEFAULT_REDIS_URL)
        if not url:
            _disabled = True
            return None
        try:
            _client = redis.Redis.from_url(url, decode_responses=True)
            _client.ping()
            return _client
        except Exception:
            _disabled = True
            _client = None
            return None


def cache_key(*parts: Any) -> str:
    return ":".join(str(p) for p in parts)


def get_json(key: str):
    client = _get_client()
    if not client:
        return None
    try:
        raw = client.get(key)
    except Exception:
        return None
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


def set_json(key: str, value: Any, ttl_seconds: int) -> bool:
    client = _get_client()
    if not client:
        return False
    try:
        client.setex(key, ttl_seconds, json.dumps(value))
        return True
    except Exception:
        return False


def delete_keys(*keys: str) -> int:
    client = _get_client()
    if not client or not keys:
        return 0
    try:
        return int(client.delete(*keys))
    except Exception:
        return 0


def key_doc_list(user_id: str) -> str:
    return cache_key("docs", user_id)


def key_doc_text(user_id: str, doc_id: str) -> str:
    return cache_key("doc_text", user_id, doc_id)


def key_doc_chapters(user_id: str, doc_id: str) -> str:
    return cache_key("doc_chapters", user_id, doc_id)


def key_doc_summary(user_id: str, doc_id: str) -> str:
    return cache_key("doc_summary", user_id, doc_id)


def key_audio_status(user_id: str, doc_id: str) -> str:
    return cache_key("audio_status", user_id, doc_id)


def key_audio_chunks(user_id: str, doc_id: str) -> str:
    return cache_key("audio_chunks", user_id, doc_id)


def key_podcast_chunks(user_id: str, doc_id: str) -> str:
    return cache_key("podcast_chunks", user_id, doc_id)


def key_user_stats(user_id: str) -> str:
    return cache_key("user_stats", user_id)


def key_tts_caps() -> str:
    return "tts_caps"


# ── Content-hash caching (cross-user) ─────────────────────────────────────────
# Same document text + same prompt => identical Groq output. Cache it once,
# serve to every user who uploads that lecture. Massive win for Nigerian
# students sharing syllabi.

_WS_RE = re.compile(r"\s+")


def content_hash(text: str) -> str:
    """Stable fingerprint for a chunk of text. Whitespace-normalized so that
    minor copy-paste differences (extra newlines, trailing spaces) still hit
    the same cache entry."""
    normalized = _WS_RE.sub(" ", (text or "").strip()).lower()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:24]


def key_script_by_hash(c_hash: str, mode: str, chapter: int | None = None) -> str:
    """Cross-user podcast script cache key."""
    ch = "all" if chapter is None else str(chapter)
    return cache_key("script_h", mode, ch, c_hash)


def key_listen_by_hash(c_hash: str) -> str:
    """Cross-user listen-narration script cache key.
    Bump the prefix when the narration prompt changes to invalidate old
    cached output. v3 = peak-explanation prompt (teach, don't transcribe)."""
    return cache_key("listen_h_v3", c_hash)


def key_summary_by_hash(c_hash: str) -> str:
    """Cross-user summary cache key."""
    return cache_key("summary_h", c_hash)


# Long TTLs — content hashes are stable, no reason to re-pay Groq cost
TTL_SCRIPT_HASH = 60 * 60 * 24 * 30   # 30 days
TTL_SUMMARY_HASH = 60 * 60 * 24 * 30  # 30 days
TTL_PER_USER_SCRIPT = 60 * 60 * 24 * 7  # 7 days


def is_enabled() -> bool:
    """True only if a real Redis connection is alive. Lets routes log a
    warning when REDIS_URL is missing in production."""
    return _get_client() is not None
