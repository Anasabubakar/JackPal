from services.supabase import get_supabase_admin
from services.cache import delete_keys, key_user_stats


def log_activity(user_id: str, doc_id: str, activity_type: str, duration_seconds: int = 0):
    get_supabase_admin().table("activity").insert({
        "user_id": user_id,
        "doc_id": doc_id,
        "type": activity_type,
        "duration": duration_seconds,
    }).execute()
    delete_keys(key_user_stats(user_id))


def list_activity(user_id: str) -> list[dict]:
    result = get_supabase_admin().table("activity") \
        .select("doc_id, type, duration, created_at") \
        .eq("user_id", user_id).order("created_at", desc=False).execute()
    return result.data or []
