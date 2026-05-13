"""
JackPal — VoxCPM2 TTS on Modal (GPU)

Premium TTS upgrade path:
  • 30 languages, tokenizer-free
  • Voice design from a text prompt
  • Voice cloning from a reference WAV (zero-shot)
  • "Ultimate cloning" from reference WAV + transcript
  • 48kHz output
  • LoRA-fine-tuned voices

Deploy:
    modal deploy backend/modal_voxcpm.py

Configure JackPal to use it:
    export VOXCPM_API_URL="https://<workspace>--jackpal-voxcpm-tts.modal.run"
    export VOXCPM_CLONE_URL="https://<workspace>--jackpal-voxcpm-clone.modal.run"
    export VOXCPM_REGISTER_URL="https://<workspace>--jackpal-voxcpm-register.modal.run"

The JackPal TTS service auto-prefers VoxCPM when VOXCPM_API_URL is set
(see backend/services/tts.py).
"""

import base64
import io
import os
import tempfile
from typing import Optional

import modal

app = modal.App("jackpal-voxcpm")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(["ffmpeg", "git", "build-essential"])
    .pip_install(
        "torch==2.4.0",
        "torchaudio==2.4.0",
        extra_index_url="https://download.pytorch.org/whl/cu121",
    )
    .pip_install([
        "voxcpm",                    # OpenBMB VoxCPM2 inference lib
        "huggingface-hub>=0.24",
        "modelscope>=1.16",          # for the zipenhancer denoiser
        "soundfile>=0.12.1",
        "scipy>=1.11",
        "numpy>=1.26",
        "fastapi",
        "python-multipart",
    ])
    .env({
        "HF_HUB_DISABLE_SYMLINKS_WARNING": "1",
        "HF_HOME":             "/cache/hf",
        "MODELSCOPE_CACHE":    "/cache/modelscope",
        "TRANSFORMERS_CACHE":  "/cache/hf/transformers",
    })
)

model_cache  = modal.Volume.from_name("jackpal-voxcpm-cache",  create_if_missing=True)
voice_store  = modal.Volume.from_name("jackpal-voxcpm-voices", create_if_missing=True)
lora_store   = modal.Volume.from_name("jackpal-voxcpm-lora",   create_if_missing=True)

CACHE_DIR = "/cache"
VOICE_DIR = "/voices"
LORA_DIR  = "/lora"

HF_MODEL_ID = os.environ.get("VOXCPM_HF_MODEL_ID", "openbmb/VoxCPM2")
GPU_KIND    = os.environ.get("VOXCPM_GPU", "A10G")  # T4 works but A10G is faster on long lines


# ── Helpers ────────────────────────────────────────────────────────────────────

def _wav_bytes(wav, sr: int) -> bytes:
    """Convert a numpy float32 waveform to a 16-bit PCM WAV blob."""
    import numpy as np
    import scipy.io.wavfile as wavfile

    if wav.ndim > 1:
        wav = wav.squeeze()
    wav = np.clip(wav, -1.0, 1.0)
    pcm = (wav * 32767).astype(np.int16)
    buf = io.BytesIO()
    wavfile.write(buf, sr, pcm)
    return buf.getvalue()


def _save_b64_wav(b64: str, suffix: str = ".wav") -> str:
    """Decode a base64 WAV string to a temp file and return the path."""
    if not b64:
        raise ValueError("missing base64 payload")
    raw = base64.b64decode(b64)
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(raw)
    return path


# ── Model service ─────────────────────────────────────────────────────────────

@app.cls(
    image=image,
    gpu=GPU_KIND,
    timeout=600,
    scaledown_window=180,
    volumes={
        CACHE_DIR: model_cache,
        VOICE_DIR: voice_store,
        LORA_DIR:  lora_store,
    },
)
class VoxCPMService:

    @modal.enter()
    def load_model(self):
        """Cold start: download + warm the VoxCPM2 weights."""
        import torch
        from voxcpm import VoxCPM

        os.environ["HF_HOME"] = f"{CACHE_DIR}/hf"
        os.environ["MODELSCOPE_CACHE"] = f"{CACHE_DIR}/modelscope"

        print(f"[VoxCPM] Loading {HF_MODEL_ID} on {GPU_KIND} ...")
        self.model = VoxCPM.from_pretrained(
            hf_model_id=HF_MODEL_ID,
            cache_dir=f"{CACHE_DIR}/hf",
            load_denoiser=True,
            optimize=True,
            device="cuda" if torch.cuda.is_available() else "cpu",
        )
        # VoxCPM2 outputs at 48kHz; older VoxCPM at 16kHz. Read it off the model.
        self.sr = getattr(getattr(self.model, "tts_model", None), "sample_rate", 48000)
        print(f"[VoxCPM] Ready. sr={self.sr}")

    # ── Plain TTS ─────────────────────────────────────────────────────────────

    @modal.method()
    def synthesize(
        self,
        text: str,
        prompt_text: Optional[str] = None,
        cfg_value: float = 2.0,
        inference_timesteps: int = 10,
        denoise: bool = False,
        normalize: bool = True,
    ) -> bytes:
        """Pure text-to-speech with optional natural-language voice prompt."""
        if not text or not text.strip():
            raise ValueError("text is required")

        target = text.strip()
        if prompt_text:
            # Voice-design path: condition on a textual voice description by
            # using it as the prompt sentence read in the target voice style.
            target = f"{prompt_text.strip()}. {target}"

        wav = self.model.generate(
            text=target,
            cfg_value=cfg_value,
            inference_timesteps=inference_timesteps,
            normalize=normalize,
            denoise=denoise,
        )
        return _wav_bytes(wav, self.sr)

    # ── Voice cloning ────────────────────────────────────────────────────────

    @modal.method()
    def clone(
        self,
        text: str,
        voice_key: Optional[str] = None,
        reference_wav_b64: Optional[str] = None,
        prompt_text: Optional[str] = None,
        cfg_value: float = 2.0,
        inference_timesteps: int = 10,
        denoise: bool = True,
        normalize: bool = True,
    ) -> bytes:
        """
        Voice cloning:
          • If ``voice_key`` matches a registered profile under /voices, use it.
          • Otherwise decode ``reference_wav_b64`` (a base64 WAV blob).
          • If ``prompt_text`` is supplied along with the reference audio, use
            VoxCPM2 "ultimate cloning" (prompt audio + matching transcript).
        """
        if not text or not text.strip():
            raise ValueError("text is required")

        ref_path: Optional[str] = None
        cleanup: list[str] = []

        if voice_key:
            candidate = f"{VOICE_DIR}/{voice_key}.wav"
            if os.path.exists(candidate):
                ref_path = candidate
                # Look for an adjacent transcript for ultimate cloning
                tx = f"{VOICE_DIR}/{voice_key}.txt"
                if prompt_text is None and os.path.exists(tx):
                    with open(tx, "r", encoding="utf-8") as f:
                        prompt_text = f.read().strip() or None

        if ref_path is None and reference_wav_b64:
            ref_path = _save_b64_wav(reference_wav_b64)
            cleanup.append(ref_path)

        if ref_path is None:
            raise ValueError("voice cloning requires voice_key or reference_wav_b64")

        try:
            kwargs = dict(
                text=text.strip(),
                cfg_value=cfg_value,
                inference_timesteps=inference_timesteps,
                normalize=normalize,
                denoise=denoise,
            )
            # Ultimate cloning: prompt audio + matching transcript
            if prompt_text:
                kwargs["prompt_wav_path"] = ref_path
                kwargs["prompt_text"]     = prompt_text.strip()
            else:
                # Zero-shot cloning: reference audio only
                kwargs["reference_wav_path"] = ref_path

            wav = self.model.generate(**kwargs)
            return _wav_bytes(wav, self.sr)
        finally:
            for p in cleanup:
                try:
                    os.unlink(p)
                except OSError:
                    pass

    # ── Voice registry (persistent reference samples) ────────────────────────

    @modal.method()
    def register_voice(
        self,
        voice_key: str,
        wav_b64: str,
        transcript: Optional[str] = None,
    ) -> dict:
        if not voice_key or not wav_b64:
            raise ValueError("voice_key and wav_b64 are required")

        os.makedirs(VOICE_DIR, exist_ok=True)
        wav_path = f"{VOICE_DIR}/{voice_key}.wav"
        with open(wav_path, "wb") as f:
            f.write(base64.b64decode(wav_b64))

        tx_path = None
        if transcript and transcript.strip():
            tx_path = f"{VOICE_DIR}/{voice_key}.txt"
            with open(tx_path, "w", encoding="utf-8") as f:
                f.write(transcript.strip())

        voice_store.commit()
        return {
            "status":     "registered",
            "voice_key":  voice_key,
            "wav_path":   wav_path,
            "transcript": tx_path,
            "size":       os.path.getsize(wav_path),
        }

    @modal.method()
    def list_voices(self) -> dict:
        if not os.path.isdir(VOICE_DIR):
            return {"voices": []}
        out = []
        for name in sorted(os.listdir(VOICE_DIR)):
            if not name.endswith(".wav"):
                continue
            key = name[:-4]
            entry = {"voice_key": key, "size": os.path.getsize(f"{VOICE_DIR}/{name}")}
            tx = f"{VOICE_DIR}/{key}.txt"
            if os.path.exists(tx):
                entry["has_transcript"] = True
            out.append(entry)
        return {"voices": out}

    @modal.method()
    def delete_voice(self, voice_key: str) -> dict:
        removed = []
        for ext in (".wav", ".txt"):
            p = f"{VOICE_DIR}/{voice_key}{ext}"
            if os.path.exists(p):
                os.unlink(p)
                removed.append(p)
        if removed:
            voice_store.commit()
        return {"status": "ok", "removed": removed}


# ── Web endpoints ─────────────────────────────────────────────────────────────

from fastapi import Request                         # noqa: E402
from fastapi.responses import JSONResponse, Response  # noqa: E402


@app.function(
    image=image,
    gpu=GPU_KIND,
    timeout=600,
    volumes={
        CACHE_DIR: model_cache,
        VOICE_DIR: voice_store,
        LORA_DIR:  lora_store,
    },
)
@modal.fastapi_endpoint(method="POST", label="jackpal-voxcpm-tts")
async def tts_endpoint(request: Request) -> Response:
    body = await request.json()
    text = (body.get("text") or "").strip()
    if not text:
        return JSONResponse({"error": "text is required"}, status_code=400)

    svc = VoxCPMService()
    wav = svc.synthesize.remote(
        text=text,
        prompt_text=body.get("prompt_text") or body.get("control"),
        cfg_value=float(body.get("cfg_value", 2.0)),
        inference_timesteps=int(body.get("inference_timesteps", 10)),
        denoise=bool(body.get("denoise", False)),
        normalize=bool(body.get("normalize", True)),
    )
    return Response(content=wav, media_type="audio/wav")


@app.function(
    image=image,
    gpu=GPU_KIND,
    timeout=600,
    volumes={
        CACHE_DIR: model_cache,
        VOICE_DIR: voice_store,
    },
)
@modal.fastapi_endpoint(method="POST", label="jackpal-voxcpm-clone")
async def clone_endpoint(request: Request) -> Response:
    body = await request.json()
    text = (body.get("text") or "").strip()
    if not text:
        return JSONResponse({"error": "text is required"}, status_code=400)

    if not body.get("voice_key") and not body.get("reference_wav_b64"):
        return JSONResponse(
            {"error": "voice_key or reference_wav_b64 is required"},
            status_code=400,
        )

    svc = VoxCPMService()
    wav = svc.clone.remote(
        text=text,
        voice_key=body.get("voice_key"),
        reference_wav_b64=body.get("reference_wav_b64"),
        prompt_text=body.get("prompt_text"),
        cfg_value=float(body.get("cfg_value", 2.0)),
        inference_timesteps=int(body.get("inference_timesteps", 10)),
        denoise=bool(body.get("denoise", True)),
        normalize=bool(body.get("normalize", True)),
    )
    return Response(content=wav, media_type="audio/wav")


@app.function(
    image=image,
    timeout=120,
    volumes={VOICE_DIR: voice_store},
)
@modal.fastapi_endpoint(method="POST", label="jackpal-voxcpm-register")
async def register_endpoint(request: Request):
    body = await request.json()
    voice_key  = (body.get("voice_key") or "").strip()
    wav_b64    = body.get("wav_base64") or body.get("wav_b64")
    transcript = body.get("transcript")
    if not voice_key or not wav_b64:
        return JSONResponse(
            {"error": "voice_key and wav_base64 are required"},
            status_code=400,
        )
    svc = VoxCPMService()
    return svc.register_voice.remote(voice_key, wav_b64, transcript)


@app.function(image=image, volumes={VOICE_DIR: voice_store})
@modal.fastapi_endpoint(method="GET", label="jackpal-voxcpm-voices")
async def list_voices_endpoint(_: Request):
    svc = VoxCPMService()
    return svc.list_voices.remote()


@app.function(image=image, volumes={VOICE_DIR: voice_store})
@modal.fastapi_endpoint(method="POST", label="jackpal-voxcpm-delete-voice")
async def delete_voice_endpoint(request: Request):
    body = await request.json()
    voice_key = (body.get("voice_key") or "").strip()
    if not voice_key:
        return JSONResponse({"error": "voice_key required"}, status_code=400)
    svc = VoxCPMService()
    return svc.delete_voice.remote(voice_key)


# ── Local smoke test ──────────────────────────────────────────────────────────

@app.local_entrypoint()
def test():
    """Quick sanity check after `modal deploy`."""
    svc = VoxCPMService()
    print("[VoxCPM] Calling synthesize remotely ...")
    wav = svc.synthesize.remote(
        "E don set! JackPal premium TTS now runs on VoxCPM 2.",
        prompt_text="Warm Nigerian English narrator, confident and clear.",
    )
    out = "voxcpm_smoke.wav"
    with open(out, "wb") as f:
        f.write(wav)
    print(f"[PASS] Wrote {out} ({len(wav)} bytes)")
