import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, validator

router = APIRouter(prefix="/auth", tags=["auth"])
USE_LOCAL = not os.environ.get("SUPABASE_URL", "").startswith("https")


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    @validator("password")
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v

    @validator("full_name")
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty.")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ResetRequest(BaseModel):
    email: EmailStr


class UpdatePasswordRequest(BaseModel):
    access_token: str
    new_password: str


@router.post("/signup")
async def signup(body: SignupRequest):
    if USE_LOCAL:
        from services.local_auth import signup as local_signup
        try:
            return local_signup(body.email, body.password, body.full_name)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    from services.supabase import get_supabase
    try:
        result = get_supabase().auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {"data": {"full_name": body.full_name}},
        })
        if result.user is None:
            raise HTTPException(status_code=400, detail="Signup failed.")
        return {"message": "Account created. Check your email to confirm.", "user_id": result.user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(body: LoginRequest):
    if USE_LOCAL:
        from services.local_auth import login as local_login
        try:
            return local_login(body.email, body.password)
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))

    from services.supabase import get_supabase
    try:
        result = get_supabase().auth.sign_in_with_password({
            "email": body.email, "password": body.password,
        })
        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "user": {
                "id": result.user.id,
                "email": result.user.email,
                "full_name": result.user.user_metadata.get("full_name", ""),
            },
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password.")


@router.post("/logout")
async def logout():
    if not USE_LOCAL:
        from services.supabase import get_supabase
        get_supabase().auth.sign_out()
    return {"message": "Logged out."}


@router.post("/reset")
async def request_password_reset(body: ResetRequest):
    if USE_LOCAL:
        return {"message": "Password reset email sent if account exists. (Dev mode — check server logs)"}

    from services.supabase import get_supabase
    redirect_url = f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password"
    get_supabase().auth.reset_password_email(body.email, {"redirect_to": redirect_url})
    return {"message": "Password reset email sent if account exists."}


@router.post("/update-password")
async def update_password(body: UpdatePasswordRequest):
    if USE_LOCAL:
        return {"message": "Password updated. (Dev mode)"}

    from services.supabase import get_supabase
    try:
        supabase = get_supabase()
        supabase.auth.set_session(body.access_token, "")
        supabase.auth.update_user({"password": body.new_password})
        return {"message": "Password updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
