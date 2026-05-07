"""
JackPal — YarnGPT2b Nigerian TTS on Modal (GPU T4)
Authentic Nigerian voices: jude (male), chinenye (female)

Deploy : python -m modal deploy modal_yarngpt.py
Test   : python test_yarngpt.py
"""

import modal
import io

app = modal.App("jackpal-yarngpt")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(["build-essential", "cmake"])
    # CUDA-enabled torch for GPU inference (clean Nigerian voice quality)
    .pip_install(
        "torch", "torchaudio",
        extra_index_url="https://download.pytorch.org/whl/cu121",
    )
    .pip_install([
        "transformers", "scipy", "fastapi",
        "huggingface-hub", "pyyaml", "tqdm", "soundfile", "sounddevice",
        "requests", "loguru", "numpy", "einops", "encodec", "inflect",
        "ftfy", "aiohttp", "natsort", "polars", "uroman",
        "descript-audio-codec", "mecab-python3", "unidic-lite",
    ])
    .run_commands(["pip install yarngpt outetts --no-deps --quiet"])
    # outetts hard-imports gguf_model (requires llama_cpp) — stub it out
    .run_commands([
        "python -c \""
        "import pathlib; "
        "p=pathlib.Path('/usr/local/lib/python3.11/site-packages/outetts/models/gguf_model.py'); "
        "p.write_text('class GGUFModel:\\n    def __init__(self,*a,**k): raise RuntimeError(\\\"GGUF not supported\\\")\\n'); "
        "print('gguf_model stubbed OK')"
        "\""
    ])
    .env({"HF_HUB_DISABLE_SYMLINKS_WARNING": "1", "HF_HOME": "/root/hf_cache"})
    # Bake model weights into image — zero download at cold start
    .run_commands([
        "python -c \""
        "import os, torch; "
        "_o=torch.load; torch.load=lambda *a,**k: _o(*a,**{**k,'weights_only':False}); "
        "os.makedirs(os.path.expanduser('~/.yarngpt/models'), exist_ok=True); "
        "from huggingface_hub import hf_hub_download; "
        "p=hf_hub_download(repo_id='novateur/WavTokenizer-medium-speech-75token', "
        "filename='wavtokenizer_medium_speech_320_24k.ckpt', "
        "local_dir=os.path.expanduser('~/.yarngpt/models')); "
        "import yarngpt.core as yc; yc.MODEL_PATH=p; "
        "from yarngpt import generate_speech; "
        "generate_speech('ready', speaker='jude'); "
        "print('Models baked OK')"
        "\""
    ])
)

VALID_VOICES  = {"jude", "chinenye"}
DEFAULT_VOICE = "jude"


@app.cls(
    image=image,
    gpu="T4",
    timeout=300,
)
class YarnGPTService:

    @modal.enter()
    def load_model(self):
        import os, torch
        _o = torch.load
        torch.load = lambda *a, **k: _o(*a, **{**k, "weights_only": False})
        import yarngpt.core as yc
        yc.MODEL_PATH = os.path.expanduser("~/.yarngpt/models/wavtokenizer_medium_speech_320_24k.ckpt")
        from yarngpt import generate_speech
        print("[YarnGPT] Warming up on GPU...")
        generate_speech("ready", speaker="jude")
        self._generate = generate_speech
        print("[YarnGPT] Ready.")

    @modal.method()
    def synthesize(self, text: str, voice: str = DEFAULT_VOICE) -> bytes:
        import numpy as np
        from scipy.io import wavfile
        if voice not in VALID_VOICES:
            voice = DEFAULT_VOICE
        print(f"[YarnGPT] voice={voice} chars={len(text)}")
        wav = self._generate(text, speaker=voice, temperature=0.1)
        audio_np = wav.squeeze().cpu().numpy()
        audio_int16 = (audio_np * 32767).clip(-32768, 32767).astype(np.int16)
        buf = io.BytesIO()
        wavfile.write(buf, 24000, audio_int16)
        return buf.getvalue()


# ── Web endpoint ──────────────────────────────────────────────────────────────
from fastapi import Request
from fastapi.responses import Response as FastAPIResponse


@app.function(image=image, cpu=1.0, memory=512, timeout=300)
@modal.fastapi_endpoint(method="POST", label="jackpal-yarngpt")
async def yarngpt_endpoint(request: Request) -> FastAPIResponse:
    body  = await request.json()
    text  = body.get("text", "").strip()
    voice = body.get("voice", DEFAULT_VOICE)
    if not text:
        return FastAPIResponse(content=b"no text", status_code=400)
    svc       = YarnGPTService()
    wav_bytes = svc.synthesize.remote(text, voice)
    return FastAPIResponse(content=wav_bytes, media_type="audio/wav")


@app.local_entrypoint()
def test():
    svc = YarnGPTService()
    print("Testing YarnGPT2b on Modal GPU...")
    wav = svc.synthesize.remote(
        "How far! This na JackPal with authentic Nigerian voice. E dey work well well!",
        voice="jude",
    )
    with open("yarngpt_modal_test.wav", "wb") as f:
        f.write(wav)
    print(f"[PASS] {len(wav):,} bytes → start yarngpt_modal_test.wav")
