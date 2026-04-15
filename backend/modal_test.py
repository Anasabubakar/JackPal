import base64
import requests

# Step 1 — Upload 16kHz resampled voice
print("Uploading 16kHz voice to Modal...")
wav = open("uyi_16k.wav", "rb").read()
r = requests.post(
    "https://uhumaghodavid--jackpal-register-voice.modal.run",
    json={"voice_key": "uyi", "wav_base64": base64.b64encode(wav).decode()},
    timeout=120,
)
print("Register response:", r.json())

# Step 2 — Generate test audio
print("\nGenerating audio in your voice (first request ~30s cold start)...")
r2 = requests.post(
    "https://uhumaghodavid--jackpal-tts.modal.run",
    json={"text": "E don set! Your voice don enter the system. JackPal is ready.", "voice": "uyi"},
    timeout=180,
)
with open("modal_test.wav", "wb") as f:
    f.write(r2.content)
print(f"Done! Size: {len(r2.content):,} bytes")
print("Play it: start modal_test.wav")
