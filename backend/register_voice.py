"""
Record your voice and register it as a local Chatterbox TTS clone.
Free, offline, zero-shot — no API key needed.

Usage: python register_voice.py
"""
import os
import sys
import io
import json
from pathlib import Path

# Suppress symlink warning on Windows
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

VOICE_KEY  = "uyi"
DURATION   = 10
SAMPLERATE = 24000

SCRIPT = (
    "My name is Uyi and I am a Nigerian student. "
    "I love learning and I believe education is the key to success. "
    "JackPal makes studying easier for students like me."
)

BACKEND_DIR   = Path(__file__).parent
CLONE_DIR     = BACKEND_DIR / "data" / "xtts_clones"
CLONE_INDEX   = BACKEND_DIR / "data" / "xtts_clones.json"


def record_audio() -> bytes:
    try:
        import sounddevice as sd
        import scipy.io.wavfile as wav
        import numpy as np
    except ImportError:
        print("[ERROR] Install recording deps: pip install sounddevice scipy numpy")
        sys.exit(1)

    print(f"\nRead this aloud naturally (you have {DURATION}s):")
    print(f'\n  "{SCRIPT}"\n')
    input("Press ENTER when you're ready to record... ")

    print(f"Recording for {DURATION}s... speak now!")
    audio = sd.rec(int(DURATION * SAMPLERATE), samplerate=SAMPLERATE, channels=1, dtype="int16")
    sd.wait()
    print("Recording done.\n")

    buf = io.BytesIO()
    wav.write(buf, SAMPLERATE, audio)
    return buf.getvalue()


def register_clone(audio_bytes: bytes) -> str:
    """Save reference WAV and update the clone index."""
    CLONE_DIR.mkdir(parents=True, exist_ok=True)
    wav_path = CLONE_DIR / f"{VOICE_KEY}.wav"
    wav_path.write_bytes(audio_bytes)

    index = {}
    if CLONE_INDEX.exists():
        try:
            index = json.loads(CLONE_INDEX.read_text())
        except Exception:
            pass
    index[VOICE_KEY] = str(wav_path)
    CLONE_INDEX.write_text(json.dumps(index, indent=2))

    print(f"[TTS] Clone registered: {VOICE_KEY} → {wav_path}")
    return str(wav_path)


def test_playback(ref_wav: str) -> None:
    """Synchronously load Chatterbox and generate a test clip."""
    try:
        from chatterbox.tts import ChatterboxTTS
    except ImportError:
        print("[ERROR] Run: pip install chatterbox-tts")
        sys.exit(1)

    import torchaudio

    print("\nLoading Chatterbox TTS model (downloading if first time — be patient)...")
    model = ChatterboxTTS.from_pretrained(device="cpu")
    print("Model loaded.")

    print("Generating test audio in your cloned voice...")
    wav_tensor = model.generate(
        "E don set! Your voice don enter the system. JackPal is ready.",
        audio_prompt_path=ref_wav,
        exaggeration=0.8,
        cfg_weight=0.3,
    )

    out_path = BACKEND_DIR / "uyi_test.wav"
    torchaudio.save(str(out_path), wav_tensor, model.sr)
    print(f"\n[PASS] Test audio saved → {out_path}")
    print(f"       Play it: start {out_path}")


def main():
    audio_bytes = record_audio()

    raw_path = BACKEND_DIR / "uyi_raw.wav"
    raw_path.write_bytes(audio_bytes)
    print(f"Raw recording saved → {raw_path}")

    ref_wav = register_clone(audio_bytes)

    print(f"\n[PASS] Clone registered!")
    print(f"  voice_key : {VOICE_KEY}")
    print(f"  ref WAV   : {ref_wav}")

    test_playback(ref_wav)


if __name__ == "__main__":
    main()
