"""
TTS service — Nigerian voice synthesis.

Engine priority (premium mode):
  1. Modal YarnGPT2b  (MODAL_YARNGPT_URL set) — authentic Nigerian voices, fast
  2. Modal Chatterbox (MODAL_TTS_URL set)      — GPU voice clone fallback
  3. YarnGPT API      (YARNGPT_API_KEY set)    — cloud, pay-per-use
  4. edge-tts         (always available)       — free, Nigerian accent

Fast mode:
  edge-tts always (no cost, no deps beyond the package)

Pidgin (lang="pcm"):
  Meta MMS-TTS-pcm → edge-tts fallback
"""
import io
import os
import asyncio
import concurrent.futures
from pathlib import Path

import edge_tts

# ── API keys ──────────────────────────────────────────────────────────────────

YARNGPT_API_KEY    = os.environ.get("YARNGPT_API_KEY", "")
MODAL_YARNGPT_URL  = os.environ.get("MODAL_YARNGPT_URL", "")
MODAL_TTS_URL      = os.environ.get("MODAL_TTS_URL", "")
VOXCPM_API_URL     = os.environ.get("VOXCPM_API_URL", "")
VOXCPM_CLONE_URL   = os.environ.get("VOXCPM_CLONE_URL", "")
VOXCPM_REGISTER_URL = os.environ.get("VOXCPM_REGISTER_URL", "")
VOXCPM_VOICES_URL  = os.environ.get("VOXCPM_VOICES_URL", "")
YARNGPT_API_URL    = "https://yarngpt.ai/api/v1/tts"

# ── Local model singletons (MMS only) ─────────────────────────────────────────

_mms_model     = None
_mms_tokenizer = None
_mms_lock      = None
_LOCAL_TTS_EXECUTOR = concurrent.futures.ThreadPoolExecutor(
    max_workers=1, thread_name_prefix="local-tts"
)


def _mms_available() -> bool:
    try:
        import transformers  # noqa: F401
        return True
    except ImportError:
        return False


# ── Voice map ─────────────────────────────────────────────────────────────────

_F_CTRL = "Warm Nigerian English female narrator, clear and confident, natural pacing."
_M_CTRL = "Confident Nigerian English male narrator, calm and articulate, natural pacing."

VOICE_MAP = {
    "chinenye":  {"api": "chinenye", "edge": "en-NG-EzinneNeural", "gender": "female", "voxcpm": _F_CTRL},
    "jude":      {"api": "jude",     "edge": "en-NG-AbeoNeural",   "gender": "male",   "voxcpm": _M_CTRL},
    "idera":     {"api": "idera",    "edge": "en-NG-AbeoNeural",   "gender": "male",   "voxcpm": _M_CTRL},
    "emma":      {"api": "emma",     "edge": "en-NG-EzinneNeural", "gender": "female", "voxcpm": _F_CTRL},
    "umar":      {"api": "umar",     "edge": "en-NG-AbeoNeural",   "gender": "male",   "voxcpm": _M_CTRL},
    "joke":      {"api": "joke",     "edge": "en-NG-EzinneNeural", "gender": "female", "voxcpm": _F_CTRL},
    "zainab":    {"api": "zainab",   "edge": "en-NG-EzinneNeural", "gender": "female", "voxcpm": _F_CTRL},
    "osagie":    {"api": "osagie",   "edge": "en-NG-AbeoNeural",   "gender": "male",   "voxcpm": _M_CTRL},
    "remi":      {"api": "remi",     "edge": "en-NG-EzinneNeural", "gender": "female", "voxcpm": _F_CTRL},
    "tayo":      {"api": "tayo",     "edge": "en-NG-AbeoNeural",   "gender": "male",   "voxcpm": _M_CTRL},
    # Named aliases
    "doyinsola": {"api": "chinenye", "edge": "en-NG-EzinneNeural", "gender": "female", "voxcpm": _F_CTRL},
    "dayo":      {"api": "jude",     "edge": "en-NG-AbeoNeural",   "gender": "male",   "voxcpm": _M_CTRL},
    "yomi":      {"api": "idera",    "edge": "en-NG-AbeoNeural",   "gender": "male",   "voxcpm": _M_CTRL},
    "awaye":     {"api": "zainab",   "edge": "en-NG-EzinneNeural", "gender": "female", "voxcpm": _F_CTRL},
}

PREMIUM_VOICES = set(VOICE_MAP.keys())
FAST_VOICES    = set(VOICE_MAP.keys())

DEFAULT_VOICE  = "doyinsola"
DEFAULT_ENGINE = "fast"

# Voices with WAVs uploaded to Modal's persistent volume
_modal_voices: set[str] = {"uyi"}


# ── Voice resolution ───────────────────────────────────────────────────────────

def normalize_voice(voice: str | None) -> str:
    if voice and voice in VOICE_MAP:
        return voice
    return DEFAULT_VOICE


def normalize_engine(engine: str | None) -> str:
    return "premium" if engine == "premium" else DEFAULT_ENGINE


def resolve_voice_for_engine(voice: str | None, engine: str | None) -> str:
    return normalize_voice(voice)


# ── Capabilities ───────────────────────────────────────────────────────────────

def get_tts_capabilities() -> dict:
    voxcpm     = bool(VOXCPM_API_URL)
    modal_yarn = bool(MODAL_YARNGPT_URL)
    modal_tts  = bool(MODAL_TTS_URL)
    yarn_api   = bool(YARNGPT_API_KEY)
    mms        = _mms_available()
    premium    = voxcpm or modal_yarn or modal_tts or yarn_api

    if voxcpm:
        engine = "voxcpm_api"
    elif modal_yarn:
        engine = "modal_yarngpt"
    elif yarn_api:
        engine = "yarngpt_api"
    elif modal_tts:
        engine = "modal_chatterbox"
    else:
        engine = "edge-tts"

    return {
        "fast_available":           True,
        "premium_available":        premium,
        "premium_enabled":          premium,
        "premium_voxcpm":           voxcpm,
        "premium_voxcpm_cloning":   bool(VOXCPM_CLONE_URL),
        "premium_voxcpm_registry":  bool(VOXCPM_REGISTER_URL),
        "premium_modal_yarngpt":    modal_yarn,
        "premium_modal_tts":        modal_tts,
        "premium_yarngpt":          yarn_api,
        "premium_mms_pidgin":       mms,
        "fast_voices":              sorted(FAST_VOICES),
        "premium_voices":           sorted(PREMIUM_VOICES),
        "engine":                   engine,
    }


def start_background_download():
    """Log active TTS engines on startup."""
    if VOXCPM_API_URL:
        print("[TTS] VoxCPM API active — strongest premium synthesis path.")
    if MODAL_YARNGPT_URL:
        print("[TTS] Modal YarnGPT2b active — authentic Nigerian voices.")
    if YARNGPT_API_KEY:
        print("[TTS] YarnGPT API active — cloud, pay-per-use.")
    if MODAL_TTS_URL:
        print("[TTS] Modal Chatterbox active — GPU voice clone endpoint.")
    if not MODAL_YARNGPT_URL and not YARNGPT_API_KEY and not MODAL_TTS_URL:
        print("[TTS] No premium engine configured — using edge-tts (free mode).")
    if _mms_available():
        print("[TTS] MMS-TTS-pcm available — Nigerian Pidgin support ready.")


# ── Chunking ──────────────────────────────────────────────────────────────────

CHUNK_WORDS       = 80
FIRST_CHUNK_WORDS = 15


def split_into_chunks(text: str, first_chunk_words: int = FIRST_CHUNK_WORDS) -> list[str]:
    words = text.split()
    if not words:
        return []
    chunks = [" ".join(words[:first_chunk_words])]
    i = first_chunk_words
    while i < len(words):
        chunks.append(" ".join(words[i:i + CHUNK_WORDS]))
        i += CHUNK_WORDS
    return chunks


# ── Public synthesis API ───────────────────────────────────────────────────────

async def synthesize_chunk(
    text: str,
    voice: str = DEFAULT_VOICE,
    engine: str = DEFAULT_ENGINE,
    lang: str = "en",
) -> bytes:
    """
    Generate audio bytes for a text chunk.

    Routing:
      lang="pcm"  → MMS-TTS-pcm (Nigerian Pidgin) → edge-tts fallback
      premium     → Modal YarnGPT → YarnGPT API → Modal Chatterbox → edge-tts
      fast        → edge-tts
    """
    engine = normalize_engine(engine)
    voice  = normalize_voice(voice)

    # ── Pidgin path ─────────────────────────────────────────────────────────
    if lang == "pcm":
        if _mms_available():
            try:
                return await _mms_pidgin_synthesize(text)
            except Exception as e:
                print(f"[TTS] MMS failed ({e}), fallback edge-tts")
        return await _edge_synthesize(text, voice)

    # ── Premium path ─────────────────────────────────────────────────────────
    if engine == "premium":
        if VOXCPM_API_URL:
            try:
                return await _voxcpm_synthesize(text, voice, VOXCPM_API_URL)
            except Exception as e:
                print(f"[TTS] VoxCPM API failed ({e}), trying next engine")

        if MODAL_YARNGPT_URL:
            try:
                return await _modal_yarngpt_synthesize(text, voice, MODAL_YARNGPT_URL)
            except Exception as e:
                print(f"[TTS] Modal YarnGPT failed ({e}), trying next engine")

        if YARNGPT_API_KEY:
            try:
                return await _yarn_api_synthesize(text, voice)
            except Exception as e:
                print(f"[TTS] YarnGPT API failed ({e}), trying next")

        if MODAL_TTS_URL and voice in _modal_voices:
            try:
                return await _modal_synthesize(text, voice, MODAL_TTS_URL)
            except Exception as e:
                print(f"[TTS] Modal Chatterbox failed ({e}), falling back to edge-tts")

    return await _edge_synthesize(text, voice)


async def stream_edge(text: str, voice: str = DEFAULT_VOICE):
    """Async generator — stream edge-tts bytes directly (fast mode streaming)."""
    voice = normalize_voice(voice)
    edge_voice = VOICE_MAP.get(voice, {}).get("edge", "en-NG-EzinneNeural")
    communicate = edge_tts.Communicate(text, edge_voice)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            yield chunk["data"]


# ── YarnGPT API synthesizer ───────────────────────────────────────────────────

async def _yarn_api_synthesize(text: str, voice: str) -> bytes:
    import aiohttp
    api_voice = VOICE_MAP.get(voice, {}).get("api", "chinenye")
    payload = {"text": text, "voice": api_voice, "response_format": "mp3"}
    headers = {"Authorization": f"Bearer {YARNGPT_API_KEY}", "Content-Type": "application/json"}
    async with aiohttp.ClientSession() as session:
        async with session.post(
            YARNGPT_API_URL, json=payload, headers=headers,
            timeout=aiohttp.ClientTimeout(total=60),
        ) as resp:
            if resp.status != 200:
                body = await resp.text()
                raise RuntimeError(f"YarnGPT API {resp.status}: {body[:200]}")
            return await resp.read()


async def _voxcpm_synthesize(text: str, voice: str, api_url: str) -> bytes:
    """
    Call the JackPal VoxCPM2 endpoint (see backend/modal_voxcpm.py).

    Sends ``text`` plus an optional natural-language voice prompt derived
    from the voice map (e.g. "Warm Nigerian English female narrator").
    """
    import aiohttp
    cfg = VOICE_MAP.get(voice, {})
    payload = {
        "text": text,
        "prompt_text": cfg.get("voxcpm")
            or ("Female Nigerian English narrator" if cfg.get("gender") == "female"
                else "Male Nigerian English narrator"),
        "cfg_value": 2.0,
        "inference_timesteps": 10,
        "denoise": False,
        "normalize": True,
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(
            api_url, json=payload,
            timeout=aiohttp.ClientTimeout(total=180),
        ) as resp:
            if resp.status != 200:
                body = await resp.text()
                raise RuntimeError(f"VoxCPM API {resp.status}: {body[:200]}")
            return await resp.read()


# ── VoxCPM voice cloning ──────────────────────────────────────────────────────

async def synthesize_with_voice_clone(
    text: str,
    *,
    voice_key: str | None = None,
    reference_wav_b64: str | None = None,
    prompt_text: str | None = None,
    cfg_value: float = 2.0,
    inference_timesteps: int = 10,
    denoise: bool = True,
    normalize: bool = True,
) -> bytes:
    """
    Synthesize ``text`` using a cloned voice via VoxCPM2.

    Either ``voice_key`` (a profile registered on Modal) or
    ``reference_wav_b64`` (a base64 WAV payload) is required.

    If ``prompt_text`` is supplied the call uses VoxCPM2 'ultimate cloning'
    (reference audio + matching transcript). Otherwise it falls back to
    zero-shot cloning from the reference audio alone.
    """
    if not VOXCPM_CLONE_URL:
        raise RuntimeError(
            "Voice cloning is unavailable — set VOXCPM_CLONE_URL after running "
            "`modal deploy backend/modal_voxcpm.py`."
        )
    if not voice_key and not reference_wav_b64:
        raise ValueError("voice_key or reference_wav_b64 is required")

    import aiohttp
    payload: dict = {
        "text": text,
        "cfg_value": cfg_value,
        "inference_timesteps": inference_timesteps,
        "denoise": denoise,
        "normalize": normalize,
    }
    if voice_key:
        payload["voice_key"] = voice_key
    if reference_wav_b64:
        payload["reference_wav_b64"] = reference_wav_b64
    if prompt_text:
        payload["prompt_text"] = prompt_text

    async with aiohttp.ClientSession() as session:
        async with session.post(
            VOXCPM_CLONE_URL, json=payload,
            timeout=aiohttp.ClientTimeout(total=240),
        ) as resp:
            if resp.status != 200:
                body = await resp.text()
                raise RuntimeError(f"VoxCPM clone {resp.status}: {body[:200]}")
            return await resp.read()


async def register_voice_clone(
    voice_key: str,
    wav_bytes: bytes,
    transcript: str | None = None,
) -> dict:
    """Upload a reference WAV (and optional transcript) to the VoxCPM voice store."""
    if not VOXCPM_REGISTER_URL:
        raise RuntimeError(
            "Voice registration is unavailable — set VOXCPM_REGISTER_URL after "
            "`modal deploy backend/modal_voxcpm.py`."
        )
    if not voice_key or not wav_bytes:
        raise ValueError("voice_key and wav_bytes are required")

    import base64
    import aiohttp
    payload = {
        "voice_key": voice_key,
        "wav_base64": base64.b64encode(wav_bytes).decode("ascii"),
    }
    if transcript:
        payload["transcript"] = transcript

    async with aiohttp.ClientSession() as session:
        async with session.post(
            VOXCPM_REGISTER_URL, json=payload,
            timeout=aiohttp.ClientTimeout(total=120),
        ) as resp:
            data = await resp.json()
            if resp.status != 200:
                raise RuntimeError(f"VoxCPM register {resp.status}: {data}")
            return data


async def list_voice_clones() -> list[dict]:
    """List voices registered on the VoxCPM Modal deployment."""
    if not VOXCPM_VOICES_URL:
        return []
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(
            VOXCPM_VOICES_URL,
            timeout=aiohttp.ClientTimeout(total=30),
        ) as resp:
            if resp.status != 200:
                return []
            data = await resp.json()
            return list(data.get("voices") or [])


# ── edge-tts synthesizer ──────────────────────────────────────────────────────

async def _edge_synthesize(text: str, voice: str) -> bytes:
    voice_cfg  = VOICE_MAP.get(voice, {})
    edge_voice = voice_cfg.get("edge", "en-NG-AbeoNeural")
    is_male    = voice_cfg.get("gender") == "male"
    rate       = "+12%" if is_male else "+6%"
    pitch      = "-4Hz" if is_male else "+2Hz"
    communicate = edge_tts.Communicate(text, edge_voice, rate=rate, pitch=pitch)
    buf = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])
    return buf.getvalue()


# ── Audio post-processor — louder + faster ────────────────────────────────────

def _boost_audio(wav_bytes: bytes, speed: float = 1.25, volume_gain: float = 3.0) -> bytes:
    try:
        import io as _io
        import numpy as np
        from scipy.io import wavfile

        sr, data = wavfile.read(_io.BytesIO(wav_bytes))
        is_float = data.dtype.kind == "f"

        if is_float:
            data = np.clip(data * volume_gain, -1.0, 1.0).astype(np.float32)
        else:
            MAX_VAL = np.iinfo(data.dtype).max
            data = np.clip(data.astype(np.float64) * volume_gain, -MAX_VAL, MAX_VAL).astype(data.dtype)

        if speed != 1.0:
            indices = np.arange(0, len(data), speed).astype(int)
            indices = indices[indices < len(data)]
            data = data[indices]

        out = _io.BytesIO()
        wavfile.write(out, sr, data)
        return out.getvalue()
    except Exception as e:
        print(f"[TTS] Audio boost failed ({e}), returning original")
        return wav_bytes


# ── Modal Chatterbox synthesizer ──────────────────────────────────────────────

async def _modal_synthesize(text: str, voice_key: str, modal_url: str) -> bytes:
    import aiohttp
    payload = {"text": text, "voice": voice_key}
    async with aiohttp.ClientSession() as session:
        async with session.post(
            modal_url, json=payload,
            timeout=aiohttp.ClientTimeout(total=120),
        ) as resp:
            if resp.status != 200:
                body = await resp.text()
                raise RuntimeError(f"Modal TTS {resp.status}: {body[:200]}")
            raw = await resp.read()
    return _boost_audio(raw, speed=1.25, volume_gain=3.0)


# ── Modal YarnGPT2b synthesizer ───────────────────────────────────────────────

async def _modal_yarngpt_synthesize(text: str, voice: str, modal_yarngpt_url: str) -> bytes:
    import aiohttp
    yarn_voice = VOICE_MAP.get(voice, {}).get("api", voice)
    payload = {"text": text, "voice": yarn_voice}
    async with aiohttp.ClientSession() as session:
        async with session.post(
            modal_yarngpt_url, json=payload,
            timeout=aiohttp.ClientTimeout(total=180),
        ) as resp:
            if resp.status != 200:
                body = await resp.text()
                raise RuntimeError(f"Modal YarnGPT {resp.status}: {body[:200]}")
            raw = await resp.read()
    return _boost_audio(raw, speed=1.25, volume_gain=3.0)


# ── MMS-TTS-pcm synthesizer (Nigerian Pidgin) ─────────────────────────────────

async def _get_mms_model():
    global _mms_model, _mms_tokenizer, _mms_lock
    if _mms_lock is None:
        _mms_lock = asyncio.Lock()
    async with _mms_lock:
        if _mms_model is not None:
            return _mms_model, _mms_tokenizer

        def _load():
            from transformers import VitsModel, AutoTokenizer
            print("[TTS] Loading MMS-TTS-pcm (Nigerian Pidgin, ~350MB)...")
            tok = AutoTokenizer.from_pretrained("facebook/mms-tts-pcm")
            mdl = VitsModel.from_pretrained("facebook/mms-tts-pcm").eval()
            print("[TTS] MMS-TTS-pcm loaded.")
            return mdl, tok

        _mms_model, _mms_tokenizer = await asyncio.get_event_loop().run_in_executor(
            _LOCAL_TTS_EXECUTOR, _load
        )
    return _mms_model, _mms_tokenizer


async def _mms_pidgin_synthesize(text: str) -> bytes:
    import numpy as np
    import scipy.io.wavfile
    import torch

    model, tokenizer = await _get_mms_model()

    def _infer():
        inputs = tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            waveform = model(**inputs).waveform.squeeze().cpu().numpy()
        pcm = (waveform * 32767).clip(-32768, 32767).astype(np.int16)
        buf = io.BytesIO()
        scipy.io.wavfile.write(buf, model.config.sampling_rate, pcm)
        return buf.getvalue()

    return await asyncio.get_event_loop().run_in_executor(_LOCAL_TTS_EXECUTOR, _infer)
