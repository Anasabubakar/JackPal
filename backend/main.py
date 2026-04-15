from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import auth, documents, audio, ai, user


def _build_allowed_origins() -> list[str]:
    """Build an explicit origin list — no wildcard allowed with credentials."""
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    frontend_url = os.environ.get("FRONTEND_URL", "").rstrip("/")
    if frontend_url and frontend_url not in origins:
        origins.append(frontend_url)
    return origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup tasks run here; shutdown tasks go after the yield."""
    _seed_dev_user()
    _reset_stale_generating()
    _log_tts_engines()
    yield


def _seed_dev_user():
    """Seed a test account in local dev mode only."""
    if os.environ.get("SUPABASE_URL", "").startswith("https"):
        return
    dev_email = os.environ.get("DEV_USER_EMAIL", "")
    dev_password = os.environ.get("DEV_USER_PASSWORD", "")
    dev_name = os.environ.get("DEV_USER_NAME", "Dev Student")
    if not dev_email or not dev_password:
        print("[Startup] DEV_USER_EMAIL/DEV_USER_PASSWORD not set — skipping seed.")
        return
    from services.local_auth import signup
    try:
        signup(dev_email, dev_password, dev_name)
    except ValueError:
        pass  # already exists


def _reset_stale_generating():
    """Reset any docs stuck in 'generating'/'streaming' state from a previous run."""
    if os.environ.get("SUPABASE_URL", "").startswith("https"):
        return
    from services.local_storage import _documents, _save_db
    changed = False
    for doc_id, doc in _documents.items():
        if doc.get("status") in ("generating", "streaming"):
            ready = doc.get("ready_chunks", 0)
            doc["status"] = "audio_ready" if ready > 0 else "ready"
            changed = True
        if doc.get("podcast_status") == "generating":
            doc["podcast_status"] = "ready" if doc.get("podcast_ready", 0) > 0 else None
            changed = True
    if changed:
        _save_db()
        print("[Startup] Reset stale generating statuses.")


def _log_tts_engines():
    """Log active TTS engines on startup."""
    from services.tts import start_background_download
    start_background_download()


app = FastAPI(
    title="JackPal API",
    description="Backend for JackPal — AI-powered audio learning platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(audio.router)
app.include_router(ai.router)
app.include_router(user.router)


@app.get("/")
def health():
    return {"status": "JackPal API is running"}
