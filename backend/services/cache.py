import json
import os
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
