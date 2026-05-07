from services.supabase import get_supabase_admin
from services.cache import delete_keys, key_user_stats


def log_activity(user_id: str, doc_id: str, activity_type: str, duration_seconds: int = 0):
    """Telemetry only — must NEVER raise. The 'activity' table is optional;
    if it doesn't exist or RLS blocks the insert we silently drop the
    record. Audio playback and other primary flows MUST NOT break because
    a side-effect logger failed."""
    try:
        get_supabase_admin().table("activity").insert({
            "user_id": user_id,
            "doc_id": doc_id,
            "type": activity_type,
            "duration": duration_seconds,
        }).execute()
        delete_keys(key_user_stats(user_id))
    except Exception as e:
        # Common: table missing (PGRST205), RLS denial, network blip.
        # Print once-ish so we can fix the schema later, but DO NOT raise.
        print(f"[activity] log skipped ({type(e).__name__}): {e}")


def list_activity(user_id: str) -> list[dict]:
    try:
        result = get_supabase_admin().table("activity") \
            .select("doc_id, type, duration, created_at") \
            .eq("user_id", user_id).order("created_at", desc=False).execute()
        return result.data or []
    except Exception as e:
        print(f"[activity] list skipped ({type(e).__name__}): {e}")
        return []
