"""
Local dev auth — works without Supabase.
Simple JWT + in-memory user store.
"""
import uuid, hashlib, hmac, base64, json, time, os
from typing import Optional

SECRET = os.environ.get("JWT_SECRET", "jackpal-dev-secret-change-in-prod")

# In-memory stores (resets on server restart — dev only)
_users: dict[str, dict] = {}       # email -> user record
_tokens: dict[str, str] = {}       # token -> user_id


def _hash_password(password: str) -> str:
    return hashlib.sha256((password + SECRET).encode()).hexdigest()


def _make_token(user_id: str) -> str:
    payload = json.dumps({"user_id": user_id, "exp": time.time() + 86400 * 7})
    encoded = base64.urlsafe_b64encode(payload.encode()).decode()
    sig = hmac.new(SECRET.encode(), encoded.encode(), hashlib.sha256).hexdigest()
    token = f"{encoded}.{sig}"
    _tokens[token] = user_id
    return token


def _verify_token(token: str) -> Optional[str]:
    try:
        encoded, sig = token.rsplit(".", 1)
        expected = hmac.new(SECRET.encode(), encoded.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(encoded).decode())
        if payload["exp"] < time.time():
            return None
        return payload["user_id"]
    except Exception:
        return None


def signup(email: str, password: str, full_name: str) -> dict:
    if email in _users:
        raise ValueError("An account with this email already exists.")
    # Deterministic user_id based on email so it survives server restarts
    user_id = str(uuid.UUID(hashlib.md5(email.lower().encode()).hexdigest()))
    _users[email] = {
        "id": user_id,
        "email": email,
        "full_name": full_name,
        "password_hash": _hash_password(password),
    }
    return {"user_id": user_id, "message": "Account created."}


def login(email: str, password: str) -> dict:
    user = _users.get(email)
    if not user or user["password_hash"] != _hash_password(password):
        raise ValueError("Invalid email or password.")
    token = _make_token(user["id"])
    return {
        "access_token": token,
        "refresh_token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
        },
    }


def get_user_from_token(token: str) -> Optional[dict]:
    user_id = _verify_token(token)
    if not user_id:
        return None
    for user in _users.values():
        if user["id"] == user_id:
            return user
    # Token is cryptographically valid but user not in memory (e.g. after restart)
    # Return a minimal user so the request proceeds — user_id is what matters for storage
    return {"id": user_id, "email": "unknown", "full_name": "Student"}


def invalidate_token(token: str):
    _tokens.pop(token, None)
