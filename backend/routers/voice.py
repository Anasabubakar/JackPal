"""
Voice cloning router — VoxCPM2 powered.

Endpoints
---------
GET  /voice/clones                       List registered voice profiles.
POST /voice/clones/register              Upload a reference WAV (+ optional transcript).
POST /voice/clones/synthesize            Synthesize text in a cloned voice.

All endpoints proxy to the JackPal Modal deployment defined in
``backend/modal_voxcpm.py`` (deploy with ``modal deploy backend/modal_voxcpm.py``).
"""

from __future__ import annotations

import base64
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from services.auth_utils import get_user_id
from services.tts import (
    VOXCPM_CLONE_URL,
    VOXCPM_REGISTER_URL,
    VOXCPM_VOICES_URL,
    list_voice_clones,
    register_voice_clone,
    synthesize_with_voice_clone,
)

router = APIRouter(prefix="/voice", tags=["voice"])

# ── Capabilities ──────────────────────────────────────────────────────────────


@router.get("/capabilities")
async def voice_capabilities():
    return {
        "cloning_available":   bool(VOXCPM_CLONE_URL),
        "registry_available":  bool(VOXCPM_REGISTER_URL),
        "list_available":      bool(VOXCPM_VOICES_URL),
        "engine":              "voxcpm2",
    }


# ── List registered clones ────────────────────────────────────────────────────


@router.get("/clones")
async def list_clones(request: Request):
    get_user_id(request)  # auth required
    voices = await list_voice_clones()
    return {"voices": voices}


# ── Register a new clone (multipart upload) ───────────────────────────────────


@router.post("/clones/register")
async def register_clone(
    request: Request,
    voice_key: str = Form(...),
    transcript: Optional[str] = Form(None),
    audio: UploadFile = File(...),
):
    """Upload reference audio so VoxCPM can clone the speaker on demand."""
    get_user_id(request)

    if not VOXCPM_REGISTER_URL:
        raise HTTPException(
            status_code=503,
            detail="Voice cloning service not configured (VOXCPM_REGISTER_URL).",
        )
    key = (voice_key or "").strip()
    if not key:
        raise HTTPException(400, "voice_key is required")
    if not audio:
        raise HTTPException(400, "audio file is required")

    wav_bytes = await audio.read()
    if not wav_bytes:
        raise HTTPException(400, "audio file is empty")

    try:
        return await register_voice_clone(key, wav_bytes, transcript)
    except Exception as exc:                      # noqa: BLE001
        raise HTTPException(502, f"Registration failed: {exc}") from exc


# ── Synthesize using a clone ──────────────────────────────────────────────────


class SynthesizeCloneRequest(BaseModel):
    text: str
    voice_key: Optional[str] = None
    reference_wav_b64: Optional[str] = None
    prompt_text: Optional[str] = None
    cfg_value: float = 2.0
    inference_timesteps: int = 10
    denoise: bool = True
    normalize: bool = True


@router.post("/clones/synthesize")
async def synthesize_clone(request: Request, body: SynthesizeCloneRequest):
    get_user_id(request)

    if not VOXCPM_CLONE_URL:
        raise HTTPException(
            status_code=503,
            detail="Voice cloning service not configured (VOXCPM_CLONE_URL).",
        )
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(400, "text is required")
    if not body.voice_key and not body.reference_wav_b64:
        raise HTTPException(400, "voice_key or reference_wav_b64 is required")

    try:
        wav = await synthesize_with_voice_clone(
            text=text,
            voice_key=body.voice_key,
            reference_wav_b64=body.reference_wav_b64,
            prompt_text=body.prompt_text,
            cfg_value=body.cfg_value,
            inference_timesteps=body.inference_timesteps,
            denoise=body.denoise,
            normalize=body.normalize,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except Exception as exc:                      # noqa: BLE001
        raise HTTPException(502, f"Synthesis failed: {exc}") from exc

    return Response(content=wav, media_type="audio/wav")


# ── Convenience: synthesize from a base64 WAV in JSON ─────────────────────────


class SynthesizeFromB64Request(BaseModel):
    text: str
    reference_wav_b64: str
    prompt_text: Optional[str] = None


@router.post("/clones/quick")
async def synthesize_quick(request: Request, body: SynthesizeFromB64Request):
    """One-shot zero-shot clone: send text + base64 WAV, get audio back."""
    return await synthesize_clone(request, SynthesizeCloneRequest(
        text=body.text,
        reference_wav_b64=body.reference_wav_b64,
        prompt_text=body.prompt_text,
    ))


# Internal helper for other routers that already hold raw WAV bytes


async def b64_of(wav_bytes: bytes) -> str:
    return base64.b64encode(wav_bytes).decode("ascii")
