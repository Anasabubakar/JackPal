"""
Quick test — call Modal Chatterbox with uyi voice and save output.
Run from JackPal/backend:
    python test_modal_tts.py
"""
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

MODAL_URL = os.environ.get("MODAL_TTS_URL", "https://uhumaghodavid--jackpal-tts.modal.run")
TEXT = "E don set! This na me, Uyi. JackPal don wire my voice into the system. Make we go!"

async def main():
    import aiohttp
    print(f"Calling Modal at {MODAL_URL} ...")
    payload = {"text": TEXT, "voice": "uyi"}
    async with aiohttp.ClientSession() as session:
        async with session.post(
            MODAL_URL, json=payload,
            timeout=aiohttp.ClientTimeout(total=180),
        ) as resp:
            print(f"Status: {resp.status}")
            if resp.status == 200:
                data = await resp.read()
                out = Path("modal_jackpal_test.wav")
                out.write_bytes(data)
                print(f"Saved {len(data):,} bytes → {out}")
                print("Play it: start modal_jackpal_test.wav")
            else:
                body = await resp.text()
                print(f"ERROR: {body[:500]}")

asyncio.run(main())
