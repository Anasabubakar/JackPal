from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import auth, documents, audio, ai, user

app = FastAPI(
    title="JackPal API",
    description="Backend for JackPal — AI-powered audio learning platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",  # keep wildcard for other environments
    ],
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


@app.on_event("startup")
def seed_dev_user():
    """Seed a test account on every startup so dev mode survives restarts."""
    if not os.environ.get("SUPABASE_URL", "").startswith("https"):
        from services.local_auth import signup
        try:
            signup("uhumaghodavid@gmail.com", "password123", "David Uhumagho")
        except ValueError:
            pass  # already exists


@app.on_event("startup")
def reset_stale_generating():
    """Reset any docs stuck in 'generating'/'streaming' state from a previous run.
    On restart, in-progress jobs are dead — set status based on actual chunks on disk.
    """
    if os.environ.get("SUPABASE_URL", "").startswith("https"):
        return  # Supabase mode handles this differently
    from services.local_storage import _documents, _audio_chunks, _podcast_chunks, _save_db
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


@app.on_event("startup")
def prefetch_yarn_models():
    """Kick off WavTokenizer download in background so YarnGPT is ready ASAP."""
    from services.tts import start_background_download
    start_background_download()


@app.get("/")
def health():
    return {"status": "JackPal API is running"}
