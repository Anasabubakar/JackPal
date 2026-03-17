import os
from fastapi import HTTPException

def is_local_mode() -> bool:
    """Helper to check if we are in local development mode."""
    return not os.environ.get("SUPABASE_URL", "").startswith("https")

def get_user_id(authorization: str) -> str:
    """
    Shared utility to extract user ID from the Authorization header.
    Handles both local mock auth and Supabase real auth.
    Returns a 401 instead of crashing on invalid tokens.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token.")
    
    token = authorization.split(" ")[1]
    
    if is_local_mode():
        from services.local_auth import get_user_from_token
        user = get_user_from_token(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired token.")
        return user["id"]
    
    # Supabase Path
    from services.supabase import get_supabase_admin
    try:
        # We use the admin client to verify the user token
        # This prevents 500 crashes if the client is misconfigured or token is malformed
        result = get_supabase_admin().auth.get_user(token)
        if not result.user:
            raise HTTPException(status_code=401, detail="Invalid token.")
        return result.user.id
    except Exception as e:
        print(f"[Auth] Shared auth failed: {e}")
        # Raising a clean 401 prevents ASGI crashes and ensures CORS headers are sent
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")
