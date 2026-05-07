"""
JackPal — Chatterbox TTS on Modal (GPU)
Deploy : modal deploy modal_tts.py
"""

import modal
import io
import os
import base64

app = modal.App("jackpal-tts")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install([
        "chatterbox-tts",
        "torchaudio",
        "scipy",
        "fastapi",
    ])
    .env({"HF_HUB_DISABLE_SYMLINKS_WARNING": "1"})
)

model_cache = modal.Volume.from_name("jackpal-tts-cache",  create_if_missing=True)
voice_store = modal.Volume.from_name("jackpal-voice-refs", create_if_missing=True)
CACHE_DIR   = "/cache"
VOICE_DIR   = "/voices"


@app.cls(
    image=image,
    gpu="T4",
    timeout=300,
    volumes={CACHE_DIR: model_cache, VOICE_DIR: voice_store},
)
class ChatterboxService:

    @modal.enter()
    def load_model(self):
        import torch
        os.environ["HF_HOME"] = CACHE_DIR
        from chatterbox.tts import ChatterboxTTS
        print("[TTS] Loading Chatterbox model on GPU...")
        self.model = ChatterboxTTS.from_pretrained(device="cuda")
        print(f"[TTS] Ready. SR={self.model.sr}")

    @modal.method()
    def synthesize(self, text: str, voice_key: str = "uyi") -> bytes:
        import torchaudio
        import torch

        ref_wav = f"{VOICE_DIR}/{voice_key}.wav"
        has_ref = os.path.exists(ref_wav)
        print(f"[TTS] voice_key={voice_key} ref_exists={has_ref} ref_path={ref_wav}")

        if has_ref:
            # List contents for debug
            print(f"[TTS] /voices contents: {os.listdir(VOICE_DIR)}")
            wav = self.model.generate(
                text,
                audio_prompt_path=ref_wav,
                exaggeration=0.75,
                cfg_weight=0.75,
            )
        else:
            print("[TTS] No ref WAV found — using default voice")
            wav = self.model.generate(text, exaggeration=0.5)

        buf = io.BytesIO()
        torchaudio.save(buf, wav, self.model.sr, format="wav")
        return buf.getvalue()

    @modal.method()
    def register_voice(self, voice_key: str, wav_bytes: bytes) -> str:
        path = f"{VOICE_DIR}/{voice_key}.wav"
        with open(path, "wb") as f:
            f.write(wav_bytes)
        voice_store.commit()
        size = os.path.getsize(path)
        print(f"[TTS] Registered {voice_key} → {path} ({size} bytes)")
        return path


# ── Web endpoints ─────────────────────────────────────────────────────────────
from fastapi import Request
from fastapi.responses import Response as FastAPIResponse

@app.function(
    image=image,
    volumes={CACHE_DIR: model_cache, VOICE_DIR: voice_store},
    gpu="T4",
    timeout=300,
)
@modal.fastapi_endpoint(method="POST", label="jackpal-tts")
async def tts_endpoint(request: Request) -> FastAPIResponse:
    body      = await request.json()
    text      = body.get("text", "").strip()
    voice_key = body.get("voice", "uyi")
    if not text:
        return FastAPIResponse(content=b"no text", status_code=400)
    svc       = ChatterboxService()
    wav_bytes = svc.synthesize.remote(text, voice_key)
    return FastAPIResponse(content=wav_bytes, media_type="audio/wav")


@app.function(
    image=image,
    volumes={VOICE_DIR: voice_store},
)
@modal.fastapi_endpoint(method="POST", label="jackpal-register-voice")
async def register_endpoint(request: Request):
    body      = await request.json()
    voice_key = body.get("voice_key", "").strip()
    wav_b64   = body.get("wav_base64", "")
    if not voice_key or not wav_b64:
        return {"error": "voice_key and wav_base64 required"}
    wav_bytes = base64.b64decode(wav_b64)
    svc       = ChatterboxService()
    path      = svc.register_voice.remote(voice_key, wav_bytes)
    return {"status": "registered", "voice_key": voice_key, "path": path}


@app.local_entrypoint()
def test():
    svc = ChatterboxService()
    print("Testing on Modal GPU...")
    wav_bytes = svc.synthesize.remote(
        "E don set! JackPal TTS is live on Modal GPU.",
        voice_key="uyi",
    )
    with open("modal_test.wav", "wb") as f:
        f.write(wav_bytes)
    print(f"[PASS] Saved modal_test.wav — play: start modal_test.wav")
