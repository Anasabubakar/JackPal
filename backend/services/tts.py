"""
TTS service — YarnGPT (authentic Nigerian voices) with edge-tts fallback.

YarnGPT voices (English): idera, chinenye, jude, emma, umar, joke, zainab, osagie, remi, tayo
YarnGPT voices (Yoruba):  tayo_yoruba, idera_yoruba, joke_yoruba
YarnGPT voices (Igbo):    chinenye_igbo, emma_igbo
YarnGPT voices (Hausa):   umar_hausa, zainab_hausa

Model files auto-download to ~/.yarngpt/models/ on first run (~2.4GB total).
"""
import io
import os
import asyncio
from pathlib import Path

import edge_tts

# ── Model paths ──────────────────────────────────────────────────────────────

MODEL_DIR = Path.home() / ".yarngpt" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

WAV_CONFIG_PATH = MODEL_DIR / "wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml"
WAV_MODEL_PATH  = MODEL_DIR / "wavtokenizer_medium_speech_320_24k.ckpt"

WAV_CONFIG_URL = "https://huggingface.co/novateur/WavTokenizer-medium-speech-75token/resolve/main/wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml"
WAV_MODEL_URL  = "https://huggingface.co/novateur/WavTokenizer-medium-speech-75token/resolve/main/wavtokenizer_medium_speech_320_24k.ckpt"
YARN_MODEL_ID  = "saheedniyi/YarnGPT2b"

# ── Voice map ────────────────────────────────────────────────────────────────

VOICE_MAP = {
    "idera":    {"yarn": "idera",    "edge": "en-NG-AbeoNeural"},
    "chinenye": {"yarn": "chinenye", "edge": "en-NG-EzinneNeural"},
    "jude":     {"yarn": "jude",     "edge": "en-NG-AbeoNeural"},
    "emma":     {"yarn": "emma",     "edge": "en-NG-EzinneNeural"},
    "umar":     {"yarn": "umar",     "edge": "en-NG-AbeoNeural"},
    "joke":     {"yarn": "joke",     "edge": "en-NG-EzinneNeural"},
    "zainab":   {"yarn": "zainab",   "edge": "en-NG-EzinneNeural"},
    "osagie":   {"yarn": "osagie",   "edge": "en-NG-AbeoNeural"},
    "remi":     {"yarn": "remi",     "edge": "en-NG-EzinneNeural"},
    "tayo":     {"yarn": "tayo",     "edge": "en-NG-AbeoNeural"},
}

DEFAULT_VOICE = "chinenye"
ENABLE_YARNGPT = os.environ.get("JACKPAL_ENABLE_YARNGPT", "").lower() in {"1", "true", "yes", "on"}
DEFAULT_ENGINE = "fast"
PREMIUM_VOICES = {"idera", "chinenye", "jude", "emma", "umar", "joke", "zainab", "osagie", "remi", "tayo"}
FAST_VOICES = {"chinenye", "jude"}


def normalize_voice(voice: str | None) -> str:
    if not voice:
        return DEFAULT_VOICE

    if voice in VOICE_MAP:
        return voice

    for key, config in VOICE_MAP.items():
        if voice == config["edge"] or voice == config["yarn"]:
            return key

    return DEFAULT_VOICE


def normalize_engine(engine: str | None) -> str:
    return "premium" if engine == "premium" else DEFAULT_ENGINE


def resolve_voice_for_engine(voice: str | None, engine: str | None) -> str:
    normalized_engine = normalize_engine(engine)
    normalized_voice = normalize_voice(voice)

    if normalized_engine == "premium":
        return normalized_voice if normalized_voice in PREMIUM_VOICES else DEFAULT_VOICE

    if normalized_voice in FAST_VOICES:
        return normalized_voice
    return DEFAULT_VOICE if DEFAULT_VOICE in FAST_VOICES else "jude"


def get_tts_capabilities() -> dict:
    return {
        "fast_available": True,
        "premium_enabled": ENABLE_YARNGPT,
        "premium_model_ready": _models_on_disk(),
        "premium_loaded": _yarn_available is True,
        "premium_available": ENABLE_YARNGPT and _models_on_disk(),
        "fast_voices": sorted(FAST_VOICES),
        "premium_voices": sorted(PREMIUM_VOICES),
    }


def ensure_premium_available() -> None:
    if not ENABLE_YARNGPT:
        raise RuntimeError("Premium YarnGPT is disabled on this backend.")
    if not _models_on_disk():
        raise RuntimeError("Premium YarnGPT models are still downloading.")
    if not _try_load_yarn():
        raise RuntimeError("Premium YarnGPT failed to load on this backend.")

# ── Lazy-loaded YarnGPT state ─────────────────────────────────────────────────

_yarn_model = None
_yarn_tokenizer = None
_yarn_available = None   # None = not yet checked; True/False = result


def _models_on_disk() -> bool:
    """True if both WavTokenizer files have been downloaded."""
    return WAV_CONFIG_PATH.exists() and WAV_MODEL_PATH.exists()


def _download_file(url: str, dest: Path):
    """Download url to dest with a progress print. Skip if already exists."""
    if dest.exists():
        return
    import requests
    from tqdm import tqdm
    print(f"[TTS] Downloading {dest.name} ...")
    r = requests.get(url, stream=True)
    total = int(r.headers.get("content-length", 0))
    with open(dest, "wb") as f, tqdm(total=total, unit="B", unit_scale=True, desc=dest.name) as bar:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
            bar.update(len(chunk))
    print(f"[TTS] {dest.name} downloaded.")


def start_background_download():
    """Kick off WavTokenizer model download in a daemon thread (non-blocking)."""
    if not ENABLE_YARNGPT:
        print("[TTS] YarnGPT disabled. Using edge-tts fast path.")
        return
    if _models_on_disk():
        return
    import threading
    def _worker():
        try:
            _download_file(WAV_CONFIG_URL, WAV_CONFIG_PATH)
            _download_file(WAV_MODEL_URL, WAV_MODEL_PATH)
            print("[TTS] WavTokenizer models ready. YarnGPT will activate on next request.")
            # Reset availability check so next synthesize_chunk tries YarnGPT
            global _yarn_available
            _yarn_available = None
        except Exception as e:
            print(f"[TTS] Download failed: {e}")
    t = threading.Thread(target=_worker, daemon=True)
    t.start()


def _try_load_yarn() -> bool:
    global _yarn_model, _yarn_tokenizer, _yarn_available
    if _yarn_available is not None:
        return _yarn_available

    if not _models_on_disk():
        print("[TTS] WavTokenizer not downloaded yet. Using edge-tts.")
        _yarn_available = False
        return False

    try:
        # Import directly — bypasses yarngpt/__init__ which has broken download logic
        import sys
        import importlib.util

        # Load audiotokenizer.py from site-packages directly
        spec = importlib.util.find_spec("audiotokenizer")
        if spec is None:
            raise ImportError("audiotokenizer module not found")

        from audiotokenizer import AudioTokenizerV2
        from transformers import AutoModelForCausalLM

        print("[TTS] Loading YarnGPT2b tokenizer ...")
        _yarn_tokenizer = AudioTokenizerV2(
            YARN_MODEL_ID,
            str(WAV_MODEL_PATH),
            str(WAV_CONFIG_PATH),
        )
        print("[TTS] Loading YarnGPT2b model ...")
        _yarn_model = AutoModelForCausalLM.from_pretrained(
            YARN_MODEL_ID, torch_dtype="auto"
        ).to(_yarn_tokenizer.device)
        _yarn_available = True
        print("[TTS] YarnGPT2b ready — authentic Nigerian voices active!")
        return True

    except Exception as e:
        print(f"[TTS] YarnGPT unavailable: {e}. Using edge-tts.")
        _yarn_available = False
        return False


# ── Public API ────────────────────────────────────────────────────────────────

CHUNK_WORDS = 80  # ~30s audio per chunk


def split_into_chunks(text: str) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunks.append(" ".join(words[i:i + CHUNK_WORDS]))
        i += CHUNK_WORDS
    return chunks


async def synthesize_chunk(text: str, voice: str = DEFAULT_VOICE, engine: str = DEFAULT_ENGINE) -> bytes:
    """Generate audio bytes. Uses YarnGPT if ready, else edge-tts."""
    engine = normalize_engine(engine)
    voice = resolve_voice_for_engine(voice, engine)
    if engine == "premium":
        ensure_premium_available()
        return await _yarn_synthesize(text, voice)
    return await _edge_synthesize(text, voice)


async def stream_edge(text: str, voice: str = DEFAULT_VOICE):
    """Async generator — stream edge-tts bytes directly to browser."""
    voice = normalize_voice(voice)
    edge_voice = VOICE_MAP.get(voice, {}).get("edge", "en-NG-EzinneNeural")
    communicate = edge_tts.Communicate(text, edge_voice)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            yield chunk["data"]


# ── Internal synthesizers ─────────────────────────────────────────────────────

async def _yarn_synthesize(text: str, voice: str) -> bytes:
    import torchaudio

    voice = normalize_voice(voice)
    speaker = VOICE_MAP.get(voice, {}).get("yarn", "chinenye")

    def _run():
        import soundfile as sf
        import numpy as np

        prompt = _yarn_tokenizer.create_prompt(text, lang="english", speaker_name=speaker)
        input_ids = _yarn_tokenizer.tokenize_prompt(prompt)
        output = _yarn_model.generate(
            input_ids=input_ids,
            temperature=0.1,
            repetition_penalty=1.1,
            max_length=4000,
        )
        codes = _yarn_tokenizer.get_codes(output)
        audio = _yarn_tokenizer.get_audio(codes)
        # audio is a torch tensor [1, samples] — convert to numpy for soundfile
        audio_np = audio.squeeze().cpu().numpy()
        buf = io.BytesIO()
        sf.write(buf, audio_np, samplerate=24000, format="WAV")
        return buf.getvalue()

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _run)


async def _edge_synthesize(text: str, voice: str) -> bytes:
    voice = normalize_voice(voice)
    edge_voice = VOICE_MAP.get(voice, {}).get("edge", "en-NG-EzinneNeural")
    # Male voices: faster, deeper energy. Female: warm, clear, slightly elevated.
    # Rates tuned for natural Nigerian speaking pace — energetic but not rushed.
    is_male = voice in ("jude", "idera", "umar", "osagie", "tayo")
    rate  = "+12%" if is_male else "+6%"
    pitch = "-4Hz" if is_male else "+2Hz"
    communicate = edge_tts.Communicate(text, edge_voice, rate=rate, pitch=pitch)
    buf = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])
    return buf.getvalue()
