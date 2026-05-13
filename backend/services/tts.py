"""
TTS service — Nigerian voice synthesis.

Fast mode:
  ElevenLabs (ELEVENLABS_API_KEY + Nigerian-English voice IDs)

Engine priority (premium mode):
  1. VoxCPM API       (VOXCPM_API_URL set)
  2. Modal YarnGPT2b  (MODAL_YARNGPT_URL set) — authentic Nigerian voices, fast
  3. ElevenLabs       (ELEVENLABS_API_KEY set + Nigerian-English voice IDs)
  4. Modal Chatterbox (MODAL_TTS_URL set)      — GPU voice clone fallback
  5. YarnGPT API      (YARNGPT_API_KEY set)    — cloud, pay-per-use

Pidgin (lang="pcm"):
  Meta MMS-TTS-pcm → ElevenLabs fallback
"""
import io
import os
import asyncio
import concurrent.futures

# ── API keys ──────────────────────────────────────────────────────────────────

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
ELEVENLABS_MODEL_ID = os.environ.get("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")
ELEVENLABS_OUTPUT_FORMAT = os.environ.get("ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_128")
ELEVENLABS_API_URL = os.environ.get("ELEVENLABS_API_URL", "https://api.elevenlabs.io/v1")
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

_F_CTRL = "Warm Nigerian English female narrator, clear and confident, natural pacing. Do not use a US accent."
_M_CTRL = "Confident Nigerian English male narrator, calm and articulate, natural pacing. Do not use a US accent."

VOICE_MAP = {
    "chinenye":  {"api": "chinenye", "elevenlabs_env": "ELEVENLABS_VOICE_CHINENYE_ID", "gender": "female", "voxcpm": _F_CTRL},
    "jude":      {"api": "jude",     "elevenlabs_env": "ELEVENLABS_VOICE_JUDE_ID",     "gender": "male",   "voxcpm": _M_CTRL},
    "idera":     {"api": "idera",    "elevenlabs_env": "ELEVENLABS_VOICE_IDERA_ID",    "gender": "male",   "voxcpm": _M_CTRL},
    "emma":      {"api": "emma",     "elevenlabs_env": "ELEVENLABS_VOICE_EMMA_ID",     "gender": "female", "voxcpm": _F_CTRL},
    "umar":      {"api": "umar",     "elevenlabs_env": "ELEVENLABS_VOICE_UMAR_ID",     "gender": "male",   "voxcpm": _M_CTRL},
    "joke":      {"api": "joke",     "elevenlabs_env": "ELEVENLABS_VOICE_JOKE_ID",     "gender": "female", "voxcpm": _F_CTRL},
    "zainab":    {"api": "zainab",   "elevenlabs_env": "ELEVENLABS_VOICE_ZAINAB_ID",   "gender": "female", "voxcpm": _F_CTRL},
    "osagie":    {"api": "osagie",   "elevenlabs_env": "ELEVENLABS_VOICE_OSAGIE_ID",   "gender": "male",   "voxcpm": _M_CTRL},
    "remi":      {"api": "remi",     "elevenlabs_env": "ELEVENLABS_VOICE_REMI_ID",     "gender": "female", "voxcpm": _F_CTRL},
    "tayo":      {"api": "tayo",     "elevenlabs_env": "ELEVENLABS_VOICE_TAYO_ID",     "gender": "male",   "voxcpm": _M_CTRL},
    # Named aliases
    "doyinsola": {"api": "chinenye", "elevenlabs_env": "ELEVENLABS_VOICE_CHINENYE_ID", "gender": "female", "voxcpm": _F_CTRL},
    "dayo":      {"api": "jude",     "elevenlabs_env": "ELEVENLABS_VOICE_JUDE_ID",     "gender": "male",   "voxcpm": _M_CTRL},
    "yomi":      {"api": "idera",    "elevenlabs_env": "ELEVENLABS_VOICE_IDERA_ID",    "gender": "male",   "voxcpm": _M_CTRL},
    "awaye":     {"api": "zainab",   "elevenlabs_env": "ELEVENLABS_VOICE_ZAINAB_ID",   "gender": "female", "voxcpm": _F_CTRL},
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


def _elevenlabs_voice_id(voice: str) -> str:
    cfg = VOICE_MAP.get(voice, {})
    env_name = cfg.get("elevenlabs_env")
    voice_id = os.environ.get(env_name or "", "")
    if not voice_id:
        gender = cfg.get("gender")
        fallback_env = "ELEVENLABS_NIGERIAN_FEMALE_VOICE_ID" if gender == "female" else "ELEVENLABS_NIGERIAN_MALE_VOICE_ID"
        voice_id = os.environ.get(fallback_env, "")
    if not voice_id:
        raise RuntimeError(
            f"ElevenLabs Nigerian English voice not configured for '{voice}'. "
            f"Set {env_name} or a gender fallback ELEVENLABS_NIGERIAN_*_VOICE_ID. "
            "Do not use generic US premade voice IDs."
        )
    return voice_id


def _elevenlabs_configured_voices() -> set[str]:
    configured: set[str] = set()
    for voice, cfg in VOICE_MAP.items():
        env_name = cfg.get("elevenlabs_env")
        gender = cfg.get("gender")
        fallback_env = "ELEVENLABS_NIGERIAN_FEMALE_VOICE_ID" if gender == "female" else "ELEVENLABS_NIGERIAN_MALE_VOICE_ID"
        if os.environ.get(env_name or "") or os.environ.get(fallback_env):
            configured.add(voice)
    return configured


# ── Capabilities ───────────────────────────────────────────────────────────────

def get_tts_capabilities() -> dict:
    elevenlabs = bool(ELEVENLABS_API_KEY) and bool(_elevenlabs_configured_voices())
    voxcpm     = bool(VOXCPM_API_URL)
    modal_yarn = bool(MODAL_YARNGPT_URL)
    modal_tts  = bool(MODAL_TTS_URL)
    yarn_api   = bool(YARNGPT_API_KEY)
    mms        = _mms_available()
    premium    = voxcpm or modal_yarn or elevenlabs or modal_tts or yarn_api

    if voxcpm:
        engine = "voxcpm_api"
    elif modal_yarn:
        engine = "modal_yarngpt"
    elif elevenlabs:
        engine = "elevenlabs"
    elif yarn_api:
        engine = "yarngpt_api"
    elif modal_tts:
        engine = "modal_chatterbox"
    else:
        engine = "unconfigured"

    return {
        "fast_available":           elevenlabs,
        "premium_available":        premium,
        "premium_enabled":          premium,
        "premium_elevenlabs":       elevenlabs,
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
    if ELEVENLABS_API_KEY:
        configured = _elevenlabs_configured_voices()
        if configured:
            print(f"[TTS] ElevenLabs active — Nigerian English voices configured: {', '.join(sorted(configured))}.")
        else:
            print("[TTS] ElevenLabs API key set, but no Nigerian English voice IDs are configured.")
    if VOXCPM_API_URL:
        print("[TTS] VoxCPM API active — strongest premium synthesis path.")
    if MODAL_YARNGPT_URL:
        print("[TTS] Modal YarnGPT2b active — authentic Nigerian voices.")
    if YARNGPT_API_KEY:
        print("[TTS] YarnGPT API active — cloud, pay-per-use.")
    if MODAL_TTS_URL:
        print("[TTS] Modal Chatterbox active — GPU voice clone endpoint.")
    if not ELEVENLABS_API_KEY and not MODAL_YARNGPT_URL and not YARNGPT_API_KEY and not MODAL_TTS_URL:
        print("[TTS] No TTS engine configured — set ELEVENLABS_API_KEY and Nigerian English voice IDs.")
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
      lang="pcm"  → MMS-TTS-pcm (Nigerian Pidgin) → ElevenLabs fallback
      premium     → VoxCPM → Modal YarnGPT → ElevenLabs → YarnGPT API → Modal Chatterbox
      fast        → ElevenLabs
    """
    engine = normalize_engine(engine)
    voice  = normalize_voice(voice)

    # ── Pidgin path ─────────────────────────────────────────────────────────
    if lang == "pcm":
        if _mms_available():
            try:
                return await _mms_pidgin_synthesize(text)
            except Exception as e:
                print(f"[TTS] MMS failed ({e}), fallback ElevenLabs")
        return await _elevenlabs_synthesize(text, voice)

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

        if ELEVENLABS_API_KEY:
            try:
                return await _elevenlabs_synthesize(text, voice)
            except Exception as e:
                print(f"[TTS] ElevenLabs failed ({e}), trying next engine")

        if YARNGPT_API_KEY:
            try:
                return await _yarn_api_synthesize(text, voice)
            except Exception as e:
                print(f"[TTS] YarnGPT API failed ({e}), trying next")

        if MODAL_TTS_URL and voice in _modal_voices:
            try:
                return await _modal_synthesize(text, voice, MODAL_TTS_URL)
            except Exception as e:
                print(f"[TTS] Modal Chatterbox failed ({e})")

    return await _elevenlabs_synthesize(text, voice)


async def stream_tts(text: str, voice: str = DEFAULT_VOICE):
    """Stream configured Nigerian-English TTS audio bytes."""
    voice = normalize_voice(voice)
    async for chunk in stream_elevenlabs(text, voice):
        yield chunk


async def stream_elevenlabs(text: str, voice: str = DEFAULT_VOICE):
    """Async generator — stream ElevenLabs MP3 bytes using Nigerian English voice IDs."""
    import aiohttp
    voice = normalize_voice(voice)
    voice_id = _elevenlabs_voice_id(voice)
    url = f"{ELEVENLABS_API_URL.rstrip('/')}/text-to-speech/{voice_id}/stream"
    params = {"output_format": ELEVENLABS_OUTPUT_FORMAT}
    payload = _elevenlabs_payload(text, voice)
    headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
    async with aiohttp.ClientSession() as session:
        async with session.post(
            url,
            params=params,
            json=payload,
            headers=headers,
            timeout=aiohttp.ClientTimeout(total=120),
        ) as resp:
            if resp.status != 200:
                body = await resp.text()
                raise RuntimeError(f"ElevenLabs {resp.status}: {body[:200]}")
            async for chunk in resp.content.iter_chunked(8192):
                if chunk:
                    yield chunk


# ── ElevenLabs synthesizer ────────────────────────────────────────────────────

def _elevenlabs_payload(text: str, voice: str) -> dict:
    cfg = VOICE_MAP.get(voice, {})
    # Accent is determined by the ElevenLabs voice ID. These settings keep the
    # selected Nigerian-English voice stable instead of drifting toward generic US English.
    return {
        "text": text,
        "model_id": ELEVENLABS_MODEL_ID,
        "language_code": "en",
        "voice_settings": {
            "stability": 0.65,
            "similarity_boost": 0.9,
            "style": 0.15,
            "use_speaker_boost": True,
            "speed": 1.0 if cfg.get("gender") == "female" else 0.98,
        },
    }


async def _elevenlabs_synthesize(text: str, voice: str) -> bytes:
    if not ELEVENLABS_API_KEY:
        raise RuntimeError("ElevenLabs is not configured. Set ELEVENLABS_API_KEY.")
    buf = io.BytesIO()
    async for chunk in stream_elevenlabs(text, voice):
        buf.write(chunk)
    return buf.getvalue()


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
