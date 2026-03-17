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

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
allow_origins = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    frontend_url,
}
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allow_origins),
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
def prefetch_yarn_models():
    """Kick off WavTokenizer download in background so YarnGPT is ready ASAP."""
    from services.tts import start_background_download
    start_background_download()


@app.get("/")
def health():
    return {"status": "JackPal API is running"}
