from fastapi import APIRouter, HTTPException, Header
from datetime import datetime, timedelta
import os
from services.cache import get_json, set_json, key_user_stats

router = APIRouter(prefix="/user", tags=["user"])
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

@router.get("/stats")
async def get_user_stats(authorization: str = Header(...)):
    user_id = _get_user_id(authorization)
    cache_key = key_user_stats(user_id)
    cached = get_json(cache_key)
    if cached is not None:
        return cached
    
    if USE_LOCAL:
        from services.local_storage import get_activity, list_documents
        activity = get_activity(user_id)
        docs = list_documents(user_id)
        
        # Calculate streak
        dates = sorted(list(set([a["timestamp"].split("T")[0] for a in activity])), reverse=True)
        streak = 0
        if dates:
            today = datetime.utcnow().strftime("%Y-%m-%d")
            yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
            
            curr = today
            if dates[0] == today or dates[0] == yesterday:
                idx = 0
                if dates[0] == today:
                    streak = 1
                    curr = today
                elif dates[0] == yesterday:
                    streak = 1
                    curr = yesterday
                
                # Check consecutive days
                temp_date = datetime.strptime(curr, "%Y-%m-%d")
                for i in range(1, len(dates)):
                    prev_day = (temp_date - timedelta(days=1)).strftime("%Y-%m-%d")
                    if dates[i+idx if idx else i] == prev_day:
                        streak += 1
                        temp_date = datetime.strptime(prev_day, "%Y-%m-%d")
                    else:
                        break
        
        # Calculate hours listened
        total_seconds = sum([a["duration"] for a in activity])
        hours_listened = round(total_seconds / 3600, 1)
        
        # Calculate retention (mock for now, or based on repeated listens)
        # For now, let's say it's related to how many documents have been fully listened
        # (if we track chunk completion, but we just log chunk fetch)
        retention = 85 # Default high retention for JackPal users
        if activity:
            unique_docs_listened = len(set([a["doc_id"] for a in activity]))
            total_docs = len(docs)
            if total_docs > 0:
                retention = min(98, 70 + (unique_docs_listened / total_docs) * 20)
        
        # Materials count
        materials = len(docs)
        
        # Weekly Overview (Daily goal 30 mins = 1800s)
        # Exam readiness (Mock for now)
        # Memory retention (Mock for now)
        
        # Calculate daily progress for the last 7 days
        weekly_progress = []
        for i in range(6, -1, -1):
            day = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
            day_activity = [a for a in activity if a["timestamp"].split("T")[0] == day]
            day_seconds = sum([a["duration"] for a in day_activity])
            # Goal is 30 mins
            progress = min(100, int((day_seconds / 1800) * 100))
            weekly_progress.append(progress)
            
        payload = {
            "streak": streak,
            "hours_listened": hours_listened,
            "retention": f"{int(retention)}%",
            "materials": materials,
            "weekly_overview": {
                "daily_goal": weekly_progress[-1] if weekly_progress else 0,
                "exam_readiness": 75 if materials > 0 else 0,
                "memory_retention": int(retention)
            },
            "recent_activity": activity[-5:] if activity else []
        }
        set_json(cache_key, payload, 10)
        return payload

    from services.supabase_activity import list_activity
    from services.supabase import get_supabase_admin

    activity = list_activity(user_id)
    docs = get_supabase_admin().table("documents").select("id").eq("user_id", user_id).execute().data or []

    dates = sorted(list(set([a["created_at"].split("T")[0] for a in activity if a.get("created_at")])), reverse=True)
    streak = 0
    if dates:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")

        curr = today
        if dates[0] == today or dates[0] == yesterday:
            idx = 0
            if dates[0] == today:
                streak = 1
                curr = today
            elif dates[0] == yesterday:
                streak = 1
                curr = yesterday

            temp_date = datetime.strptime(curr, "%Y-%m-%d")
            for i in range(1, len(dates)):
                prev_day = (temp_date - timedelta(days=1)).strftime("%Y-%m-%d")
                if dates[i+idx if idx else i] == prev_day:
                    streak += 1
                    temp_date = datetime.strptime(prev_day, "%Y-%m-%d")
                else:
                    break

    total_seconds = sum([a.get("duration", 0) for a in activity])
    hours_listened = round(total_seconds / 3600, 1)

    retention = 85
    if activity:
        unique_docs_listened = len(set([a["doc_id"] for a in activity if a.get("doc_id")]))
        total_docs = len(docs)
        if total_docs > 0:
            retention = min(98, 70 + (unique_docs_listened / total_docs) * 20)

    materials = len(docs)

    weekly_progress = []
    for i in range(6, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        day_activity = [a for a in activity if a.get("created_at", "").split("T")[0] == day]
        day_seconds = sum([a.get("duration", 0) for a in day_activity])
        progress = min(100, int((day_seconds / 1800) * 100))
        weekly_progress.append(progress)

    payload = {
        "streak": streak,
        "hours_listened": hours_listened,
        "retention": f"{int(retention)}%",
        "materials": materials,
        "weekly_overview": {
            "daily_goal": weekly_progress[-1] if weekly_progress else 0,
            "exam_readiness": 75 if materials > 0 else 0,
            "memory_retention": int(retention)
        },
        "recent_activity": activity[-5:] if activity else []
    }
    set_json(cache_key, payload, 10)
    return payload
