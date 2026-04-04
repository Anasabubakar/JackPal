"""
TTS service — multi-engine Nigerian voice synthesis.

Priority order (premium):
  0. XTTS v2 clone    (Coqui TTS, ref WAV on disk) — zero-shot, FREE, offline, ~1.8GB model
  1. Voxtral (clone)  (MISTRAL_API_KEY + clone registered) — 90ms, custom Nigerian voice clone
  2. YarnGPT API      (YARNGPT_API_KEY set)    — authentic Nigerian, pay-per-use
  3. Voxtral (generic)(MISTRAL_API_KEY set)     — 90ms, no clone (generic voice)
  4. YarnGPT2 local   (yarngpt installed)       — open-source, ~2.5GB, zero-cost, offline
  5. edge-tts         (always available)        — Microsoft Azure, free, Nigerian accent

Pidgin path (lang="pcm"):
  Meta MMS-TTS-pcm → edge-tts

Engine modes:
  "premium" → XTTS clone / Voxtral clone / YarnGPT API / YarnGPT2 local  (podcast)
  "fast"    → edge-tts  (listen mode / free users, unlimited)

Voice cloning (XTTS v2 — free, local):
  register_xtts_voice_clone(voice_key, audio_bytes) → saves WAV to data/xtts_clones/
  Any registered XTTS clone is used automatically as priority 0 in the premium path.
  Requires: pip install TTS  (downloads ~1.8GB model on first use)

Voice cloning (Voxtral — paid):
  register_voice_clone(voice_key, audio_bytes, gender) → persists to data/voxtral_clones.json
  Any registered clone is used automatically in the premium path.

YarnGPT voices: chinenye, jude, idera, emma, umar, joke, zainab, osagie, remi, tayo
Named aliases: doyinsola (female), dayo (male), yomi (male), awaye (female)
Voxtral model: voxtral-mini-tts-2603 ($0.016/1k chars)
"""
import io
import os
import json
import asyncio
import concurrent.futures
from pathlib import Path

import edge_tts

# ── API keys ──────────────────────────────────────────────────────────────────

YARNGPT_API_KEY    = os.environ.get("YARNGPT_API_KEY", "")
MISTRAL_API_KEY    = os.environ.get("MISTRAL_API_KEY", "")
MODAL_YARNGPT_URL  = os.environ.get("MODAL_YARNGPT_URL", "")
VOXTRAL_MODEL   = "voxtral-mini-tts-2603"

# ── Voxtral voice clone registry ──────────────────────────────────────────────
# Persisted to data/voxtral_clones.json — maps voice_key → Voxtral voice_id.
# Populated by register_voice_clone() when a user uploads a 2-5s audio sample.

_CLONE_FILE = Path(__file__).parent.parent / "data" / "voxtral_clones.json"
_voxtral_clones: dict[str, str] = {}

def _load_clones() -> None:
    global _voxtral_clones
    if _CLONE_FILE.exists():
        try:
            _voxtral_clones = json.loads(_CLONE_FILE.read_text())
        except Exception:
            _voxtral_clones = {}

def _save_clones() -> None:
    _CLONE_FILE.parent.mkdir(parents=True, exist_ok=True)
    _CLONE_FILE.write_text(json.dumps(_voxtral_clones, indent=2))

_load_clones()

# ── XTTS v2 clone registry (free, local, zero-shot) ───────────────────────────
# Maps voice_key → absolute path to reference WAV file.
# Populated by register_xtts_voice_clone() — no API key, no paid plan needed.

_XTTS_CLONE_DIR  = Path(__file__).parent.parent / "data" / "xtts_clones"
_XTTS_INDEX_FILE = Path(__file__).parent.parent / "data" / "xtts_clones.json"
_xtts_clones: dict[str, str] = {}   # voice_key → wav path
# Voices that have been uploaded to Modal's persistent volume
_modal_voices: set[str] = {"uyi"}

def _load_xtts_clones() -> None:
    global _xtts_clones
    if _XTTS_INDEX_FILE.exists():
        try:
            _xtts_clones = json.loads(_XTTS_INDEX_FILE.read_text())
        except Exception:
            _xtts_clones = {}

def _save_xtts_clones() -> None:
    _XTTS_INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    _XTTS_INDEX_FILE.write_text(json.dumps(_xtts_clones, indent=2))

_load_xtts_clones()

# XTTS v2 model singleton
_xtts_model   = None
_xtts_lock    = None

def _xtts_available() -> bool:
    try:
        import chatterbox  # noqa: F401
        return True
    except ImportError:
        return False

# ── Local model singletons ─────────────────────────────────────────────────────

_yarn_local_pipeline = None
_yarn_local_lock = None
_mms_model = None
_mms_tokenizer = None
_mms_lock = None
_LOCAL_TTS_EXECUTOR = concurrent.futures.ThreadPoolExecutor(
    max_workers=1, thread_name_prefix="local-tts"
)


def _yarn_local_available() -> bool:
    try:
        import yarngpt  # noqa: F401
        return True
    except ImportError:
        return False


def _mms_available() -> bool:
    try:
        import transformers  # noqa: F401
        return True
    except ImportError:
        return False
YARNGPT_API_URL = "https://yarngpt.ai/api/v1/tts"

# ── Voice map ─────────────────────────────────────────────────────────────────
# el   = legacy ElevenLabs Voice ID (kept for reference — not used)
# edge = edge-tts voice (fast / free users)

VOICE_MAP = {
    # voice_key → { api: YarnGPT name, yarn_local: YarnGPT2 local name, edge: edge-tts name, gender }
    "chinenye":  { "api": "chinenye", "yarn_local": "chinenye", "edge": "en-NG-EzinneNeural", "gender": "female" },
    "jude":      { "api": "jude",     "yarn_local": "jude",     "edge": "en-NG-AbeoNeural",   "gender": "male"   },
    "idera":     { "api": "idera",    "yarn_local": "idera",    "edge": "en-NG-AbeoNeural",   "gender": "male"   },
    "emma":      { "api": "emma",     "yarn_local": "emma",     "edge": "en-NG-EzinneNeural", "gender": "female" },
    "umar":      { "api": "umar",     "yarn_local": "umar",     "edge": "en-NG-AbeoNeural",   "gender": "male"   },
    "joke":      { "api": "joke",     "yarn_local": "joke",     "edge": "en-NG-EzinneNeural", "gender": "female" },
    "zainab":    { "api": "zainab",   "yarn_local": "zainab",   "edge": "en-NG-EzinneNeural", "gender": "female" },
    "osagie":    { "api": "osagie",   "yarn_local": "osagie",   "edge": "en-NG-AbeoNeural",   "gender": "male"   },
    "remi":      { "api": "remi",     "yarn_local": "remi",     "edge": "en-NG-EzinneNeural", "gender": "female" },
    "tayo":      { "api": "tayo",     "yarn_local": "tayo",     "edge": "en-NG-AbeoNeural",   "gender": "male"   },
    # Named aliases (map to YarnGPT equivalents)
    "doyinsola": { "api": "chinenye", "yarn_local": "chinenye", "edge": "en-NG-EzinneNeural", "gender": "female" },
    "dayo":      { "api": "jude",     "yarn_local": "jude",     "edge": "en-NG-AbeoNeural",   "gender": "male"   },
    "yomi":      { "api": "idera",    "yarn_local": "idera",    "edge": "en-NG-AbeoNeural",   "gender": "male"   },
    "awaye":     { "api": "zainab",   "yarn_local": "zainab",   "edge": "en-NG-EzinneNeural", "gender": "female" },
}

PREMIUM_VOICES = set(VOICE_MAP.keys())
FAST_VOICES    = set(VOICE_MAP.keys())   # all voices work in edge-tts via alias

DEFAULT_VOICE  = "doyinsola"
DEFAULT_ENGINE = "fast"

# ── Voice resolution ───────────────────────────────────────────────────────────

def normalize_voice(voice: str | None) -> str:
    if not voice:
        return DEFAULT_VOICE
    # Clone voices (XTTS or Voxtral) are valid even if not in VOICE_MAP
    if voice in _xtts_clones or voice in _voxtral_clones:
        return voice
    if voice in VOICE_MAP:
        return voice
    return DEFAULT_VOICE


def normalize_engine(engine: str | None) -> str:
    return "premium" if engine == "premium" else DEFAULT_ENGINE


def resolve_voice_for_engine(voice: str | None, engine: str | None) -> str:
    return normalize_voice(voice)


# ── Capabilities ───────────────────────────────────────────────────────────────

def get_tts_capabilities() -> dict:
    yarn      = bool(YARNGPT_API_KEY)
    voxtral   = bool(MISTRAL_API_KEY)
    yarn_loc  = _yarn_local_available()
    xtts      = _xtts_available()
    mms       = _mms_available()
    xtts_clones = list(_xtts_clones.keys())
    engine = (
        ("xtts_clone" if xtts_clones else "xtts") if xtts else
        "yarngpt" if yarn else
        "voxtral" if voxtral else
        "yarngpt_local" if yarn_loc else
        "edge-tts"
    )
    return {
        "fast_available":            True,
        "premium_enabled":           xtts or yarn or voxtral or yarn_loc,
        "premium_xtts":              xtts,
        "premium_xtts_clones":       xtts_clones,
        "premium_yarngpt":           yarn,
        "premium_voxtral":           voxtral,
        "premium_voxtral_clones":    list(_voxtral_clones.keys()),
        "premium_yarngpt_local":     yarn_loc,
        "premium_mms_pidgin":        mms,
        "premium_available":         xtts or yarn or voxtral or yarn_loc,
        "fast_voices":               sorted(FAST_VOICES),
        "premium_voices":            sorted(PREMIUM_VOICES),
        "engine":                    engine,
    }


def ensure_premium_available() -> None:
    if not _xtts_available() and not YARNGPT_API_KEY and not MISTRAL_API_KEY and not _yarn_local_available():
        raise RuntimeError("Premium TTS requires TTS (Coqui XTTS), YARNGPT_API_KEY, MISTRAL_API_KEY, or yarngpt package.")


def start_background_download():
    """Log active TTS engines on startup."""
    if _xtts_available():
        clones = list(_xtts_clones.keys())
        clone_info = f", clones: {clones}" if clones else ", no clones yet (run register_voice.py)"
        print(f"[TTS] Chatterbox TTS active — zero-shot voice cloning, FREE, offline{clone_info}.")
    if YARNGPT_API_KEY:
        print("[TTS] YarnGPT API active — authentic Nigerian voices, pay-per-use.")
    if MISTRAL_API_KEY:
        clones = list(_voxtral_clones.keys())
        clone_info = f", clones: {clones}" if clones else ", no clones yet"
        print(f"[TTS] Voxtral active ({VOXTRAL_MODEL}) — 90ms latency{clone_info}.")
    if not _xtts_available() and not YARNGPT_API_KEY and not MISTRAL_API_KEY:
        if _yarn_local_available():
            print("[TTS] YarnGPT2 local available — will load on first podcast request (~2.5GB).")
        else:
            print("[TTS] No premium engine — using edge-tts (free mode). Run: pip install TTS")
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
      lang="pcm"  → MMS-TTS-pcm (Nigerian Pidgin) → edge-tts
      premium     → YarnGPT API → ElevenLabs → YarnGPT2 local → edge-tts
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
        # 0. Modal YarnGPT2b — authentic Nigerian voices, boosted speed & volume
        #    Prioritised above everything else: sounds Nigerian, fast, zero local deps
        if MODAL_YARNGPT_URL:
            try:
                return await _modal_yarngpt_synthesize(text, voice, MODAL_YARNGPT_URL)
            except Exception as e:
                print(f"[TTS] Modal YarnGPT failed ({e}), trying next engine")

        # 1. YarnGPT API — pay-per-use cloud, authentic Nigerian
        if YARNGPT_API_KEY:
            try:
                return await _yarn_api_synthesize(text, voice)
            except Exception as e:
                print(f"[TTS] YarnGPT API failed ({e}), trying next")

        # 2. Modal Chatterbox — GPU voice clone (fallback if YarnGPT unavailable)
        modal_url = os.environ.get("MODAL_TTS_URL", "")
        if modal_url and (voice in _modal_voices or voice in _xtts_clones):
            try:
                return await _modal_synthesize(text, voice, modal_url)
            except Exception as e:
                print(f"[TTS] Modal Chatterbox failed ({e}), trying next engine")

        # 3. XTTS local clone — free, local, zero-shot
        if _xtts_available() and voice in _xtts_clones:
            try:
                return await _xtts_synthesize(text, voice)
            except Exception as e:
                print(f"[TTS] XTTS clone failed ({e}), trying next engine")

        # 4. Voxtral clone — paid voice clone
        if MISTRAL_API_KEY and voice in _voxtral_clones:
            try:
                return await _voxtral_synthesize(text, voice)
            except Exception as e:
                print(f"[TTS] Voxtral clone failed ({e}), trying local")

        # 5. YarnGPT2 local — open-source, zero-cost, offline
        if _yarn_local_available():
            try:
                return await _yarn_local_synthesize(text, voice)
            except Exception as e:
                print(f"[TTS] YarnGPT2 local failed ({e}), falling back to edge-tts")

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
    """YarnGPT cloud API — authentic Nigerian voices, pay-per-use."""
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


# ── edge-tts synthesizer ──────────────────────────────────────────────────────

async def _edge_synthesize(text: str, voice: str) -> bytes:
    """Microsoft Azure edge-tts — free, always available, Nigerian accent."""
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


# ── YarnGPT2 local synthesizer ────────────────────────────────────────────────

async def _get_yarn_local_pipeline():
    """Lazy singleton — downloads ~2.5GB on first call."""
    global _yarn_local_pipeline, _yarn_local_lock
    if _yarn_local_lock is None:
        _yarn_local_lock = asyncio.Lock()
    async with _yarn_local_lock:
        if _yarn_local_pipeline is not None:
            return _yarn_local_pipeline

        def _load():
            from yarngpt.audiopipeline import YarnGPTPipeline
            print("[TTS] Loading YarnGPT2b local model (first call — downloads ~2.5GB)...")
            p = YarnGPTPipeline("saheedniyi/YarnGPT2b", "OuteAI/OuteTTS-0.2-500M")
            print("[TTS] YarnGPT2b loaded.")
            return p

        try:
            loop = asyncio.get_event_loop()
            _yarn_local_pipeline = await loop.run_in_executor(_LOCAL_TTS_EXECUTOR, _load)
        except Exception:
            _yarn_local_pipeline = False  # don't retry this session
            raise
    return _yarn_local_pipeline


async def _yarn_local_synthesize(text: str, voice: str) -> bytes:
    """YarnGPT2 local — open-source Nigerian TTS, zero-cost, offline once downloaded."""
    pipeline = await _get_yarn_local_pipeline()
    if pipeline is False:
        raise RuntimeError("YarnGPT2 pipeline failed to load.")

    yarn_voice = VOICE_MAP.get(voice, {}).get("yarn_local", "chinenye")
    gender     = VOICE_MAP.get(voice, {}).get("gender", "female")
    if not yarn_voice:
        yarn_voice = "jude" if gender == "male" else "chinenye"

    def _run():
        import io as _io
        # yarngpt >= 0.2.0 uses generate_speech() directly
        try:
            from yarngpt import generate_speech
            import torchaudio
            wav_tensor = generate_speech(text, speaker=yarn_voice, temperature=0.1)
            buf = _io.BytesIO()
            torchaudio.save(buf, wav_tensor, 24000, format="wav")
            return buf.getvalue()
        except ImportError:
            # fallback: yarngpt < 0.2.0 audiopipeline API
            import tempfile
            output = pipeline.generate(text=text, voice=yarn_voice, temperature=0.1, max_length=4096)
            tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            tmp.close()
            try:
                pipeline.save_audio(output, tmp.name)
                with open(tmp.name, "rb") as f:
                    return f.read()
            finally:
                os.unlink(tmp.name)

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_LOCAL_TTS_EXECUTOR, _run)


# ── Audio post-processor — louder + faster ────────────────────────────────────

def _boost_audio(wav_bytes: bytes, speed: float = 1.25, volume_gain: float = 3.0) -> bytes:
    """
    Boost volume and speed up a WAV (handles both 16-bit PCM and 32-bit float WAV).
    speed      : 1.25 = 25% faster (slight pitch rise — sounds energetic)
    volume_gain: multiply amplitude (3.0 = ~9.5dB, clipped to prevent distortion)
    """
    try:
        import io as _io
        import numpy as np
        from scipy.io import wavfile

        sr, data = wavfile.read(_io.BytesIO(wav_bytes))

        is_float = data.dtype.kind == 'f'

        if is_float:
            # Float32 WAV — normalise then boost
            data = np.clip(data * volume_gain, -1.0, 1.0).astype(np.float32)
        else:
            # Integer PCM (16 or 32-bit)
            MAX_VAL = np.iinfo(data.dtype).max
            data = np.clip(data.astype(np.float64) * volume_gain, -MAX_VAL, MAX_VAL).astype(data.dtype)

        # Speed up via sample decimation (every Nth sample)
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


# ── Modal Chatterbox synthesizer (GPU, best quality) ─────────────────────────

async def _modal_synthesize(text: str, voice_key: str, modal_url: str) -> bytes:
    """Call Modal-hosted Chatterbox GPU endpoint."""
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


# ── Modal YarnGPT2b synthesizer (CPU, authentic Nigerian voices) ─────────────

async def _modal_yarngpt_synthesize(text: str, voice: str, modal_yarngpt_url: str) -> bytes:
    """Call Modal-hosted YarnGPT2b endpoint — authentic Nigerian voices."""
    import aiohttp
    yarn_voice = VOICE_MAP.get(voice, {}).get("yarn_local", voice)
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


# ── XTTS v2 synthesizer (Coqui TTS — free, local, zero-shot) ─────────────────

async def register_xtts_voice_clone(voice_key: str, audio_bytes: bytes) -> str:
    """
    Register a voice clone for XTTS v2.
    Saves the reference WAV to data/xtts_clones/{voice_key}.wav and indexes it.
    No API key needed — fully local and free.
    Returns the path to the saved WAV.
    """
    _XTTS_CLONE_DIR.mkdir(parents=True, exist_ok=True)
    wav_path = str(_XTTS_CLONE_DIR / f"{voice_key}.wav")
    with open(wav_path, "wb") as f:
        f.write(audio_bytes)
    _xtts_clones[voice_key] = wav_path
    _save_xtts_clones()
    print(f"[TTS] XTTS clone registered: {voice_key} → {wav_path}")
    return wav_path


async def _get_xtts_model():
    """Lazy singleton — downloads ~1GB on first call (Chatterbox by Resemble AI)."""
    global _xtts_model, _xtts_lock
    if _xtts_lock is None:
        _xtts_lock = asyncio.Lock()
    async with _xtts_lock:
        if _xtts_model is not None:
            return _xtts_model

        def _load():
            from chatterbox.tts import ChatterboxTTS
            print("[TTS] Loading Chatterbox TTS model (~1GB, first-time download)...")
            model = ChatterboxTTS.from_pretrained(device="cpu")
            print("[TTS] Chatterbox TTS loaded and ready.")
            return model

        try:
            loop = asyncio.get_event_loop()
            _xtts_model = await loop.run_in_executor(_LOCAL_TTS_EXECUTOR, _load)
        except Exception:
            _xtts_model = False  # don't retry this session
            raise
    return _xtts_model


async def _xtts_synthesize(text: str, voice_key: str) -> bytes:
    """
    Chatterbox zero-shot voice clone synthesis.
    Uses the registered reference WAV to clone the voice — no fine-tuning needed.
    Outputs WAV bytes.
    """
    import numpy as np
    import scipy.io.wavfile

    ref_wav = _xtts_clones.get(voice_key)
    if not ref_wav or not Path(ref_wav).exists():
        raise RuntimeError(f"Chatterbox ref WAV not found for voice '{voice_key}'")

    model = await _get_xtts_model()
    if model is False:
        raise RuntimeError("Chatterbox model failed to load.")

    def _run():
        import torchaudio
        wav_tensor = model.generate(text, audio_prompt_path=ref_wav, exaggeration=0.5)
        buf = io.BytesIO()
        torchaudio.save(buf, wav_tensor, model.sr, format="wav")
        return buf.getvalue()

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_LOCAL_TTS_EXECUTOR, _run)


# ── Voxtral synthesizer (Mistral) ────────────────────────────────────────────

async def register_voice_clone(
    voice_key: str,
    audio_bytes: bytes,
    gender: str = "female",
    filename: str = "sample.wav",
) -> str:
    """
    Register a voice clone with Voxtral from a 2-25s audio sample.
    Persists the returned voice_id to data/voxtral_clones.json.
    Returns the Voxtral voice_id.
    """
    import base64
    from mistralai.client import Mistral

    client = Mistral(api_key=MISTRAL_API_KEY)
    audio_b64 = base64.standard_b64encode(audio_bytes).decode("utf-8")

    voice = await client.audio.voices.create_async(
        name=voice_key,
        sample_audio=audio_b64,
        sample_filename=filename,
        languages=["en"],
        gender=gender,
    )
    _voxtral_clones[voice_key] = voice.id
    _save_clones()
    print(f"[TTS] Voxtral clone registered: {voice_key} → {voice.id}")
    return voice.id


async def _voxtral_synthesize(text: str, voice: str) -> bytes:
    """
    Mistral Voxtral TTS — 90ms latency, $0.016/1k chars.
    Uses a registered voice clone if available, otherwise generic.
    Response audio_data is base64-encoded MP3.
    """
    import base64
    from mistralai.client import Mistral

    client = Mistral(api_key=MISTRAL_API_KEY)
    clone_id = _voxtral_clones.get(voice)

    kwargs: dict = {"input": text, "model": VOXTRAL_MODEL, "response_format": "mp3"}
    if clone_id:
        kwargs["voice_id"] = clone_id

    response = await client.audio.speech.complete_async(**kwargs)
    return base64.b64decode(response.audio_data)


# ── MMS-TTS-pcm synthesizer (Nigerian Pidgin) ─────────────────────────────────

async def _get_mms_model():
    """Lazy singleton — downloads ~350MB on first call."""
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
    """Meta MMS-TTS-pcm — official Nigerian Pidgin model, single-speaker."""
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
