"""
Fix Chatterbox voice cloning — resamples reference to 16kHz before synthesis.
Run: python fix_clone.py
"""
import os
import sys
import io
from pathlib import Path

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

BACKEND_DIR = Path(__file__).parent
REF_WAV     = BACKEND_DIR / "uyi_raw.wav"
OUT_WAV     = BACKEND_DIR / "uyi_test2.wav"
REF_16K     = BACKEND_DIR / "uyi_16k.wav"

def resample_to_16k(src: Path, dst: Path):
    """Resample WAV to 16kHz mono — what Chatterbox actually expects."""
    import scipy.io.wavfile as wavio
    import numpy as np
    from scipy.signal import resample_poly
    from math import gcd

    rate, data = wavio.read(str(src))
    if data.ndim > 1:
        data = data.mean(axis=1).astype(data.dtype)

    target = 16000
    if rate != target:
        g = gcd(rate, target)
        data_float = data.astype(np.float32) / 32768.0
        resampled = resample_poly(data_float, target // g, rate // g)
        data = (resampled * 32767).clip(-32768, 32767).astype(np.int16)
        rate = target

    wavio.write(str(dst), rate, data)
    print(f"[OK] Resampled reference → {dst} ({rate}Hz)")


def generate():
    from chatterbox.tts import ChatterboxTTS
    import torchaudio

    resample_to_16k(REF_WAV, REF_16K)

    print("Loading Chatterbox model (from cache)...")
    model = ChatterboxTTS.from_pretrained(device="cpu")
    print("Model loaded. Generating...")

    # cfg_weight 0.7 = strong reference adherence
    # exaggeration 0.7 = push voice characteristics hard
    wav = model.generate(
        "E don set! Your voice don enter the system. JackPal is ready.",
        audio_prompt_path=str(REF_16K),
        exaggeration=0.7,
        cfg_weight=0.7,
    )

    torchaudio.save(str(OUT_WAV), wav, model.sr)
    print(f"\n[PASS] Saved → {OUT_WAV}")
    print(f"       Play:   start {OUT_WAV}")


if __name__ == "__main__":
    if not REF_WAV.exists():
        print(f"[ERROR] {REF_WAV} not found — run register_voice.py first")
        sys.exit(1)
    generate()
