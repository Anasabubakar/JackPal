"""
Core service tests — no Supabase needed.
Tests: text extraction, TTS, AI summary.
Run: python test_core.py
"""
import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

# ── 1. Text Extraction ──────────────────────────────────────────────────────
def test_extraction():
    from services.extractor import extract_text

    sample = b"This is a test document about studying in Nigeria. Students face many challenges."
    result = extract_text(sample, "sample.txt")
    assert "Nigeria" in result
    print(f"[PASS] Extraction: {len(result)} chars extracted")
    return result


# ── 2. TTS ──────────────────────────────────────────────────────────────────
async def test_tts():
    from services.tts import MISTRAL_API_KEY, synthesize_chunk

    text = "Welcome to JackPal. Your academic documents, now in audio."
    engine = "premium" if MISTRAL_API_KEY else "fast"
    engine_label = f"Voxtral ({MISTRAL_API_KEY[:8]}...)" if MISTRAL_API_KEY else "edge-tts (no MISTRAL_API_KEY)"
    print(f"[....] TTS: generating audio — engine={engine_label}")
    audio = await synthesize_chunk(text, voice="doyinsola", engine=engine)

    assert len(audio) > 0, "Audio bytes should not be empty"

    output_path = os.path.join(os.path.dirname(__file__), "test_output.mp3")
    with open(output_path, "wb") as f:
        f.write(audio)

    print(f"[PASS] TTS: {len(audio):,} bytes generated -> test_output.mp3")
    print(f"       Play it: start {output_path}")


# ── 3. AI Summary ────────────────────────────────────────────────────────────
async def test_ai():
    from services.ai import summarize_document

    text = """
    Photosynthesis is the process by which green plants and some other organisms use sunlight
    to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally
    involves the green pigment chlorophyll and generates oxygen as a byproduct. It is one of
    the most important biological processes on Earth and forms the foundation of most food chains.
    The light-dependent reactions take place in the thylakoid membranes and the light-independent
    reactions (Calvin cycle) occur in the stroma of the chloroplast.
    """
    print("[....] AI: summarizing with gemma3:1b (this may take 10-30s)...")
    summary = await summarize_document(text)
    assert len(summary) > 10
    print(f"[PASS] AI Summary:\n\n{summary}\n")


# ── Runner ───────────────────────────────────────────────────────────────────
async def main():
    print("\n=== JackPal Backend Core Tests ===\n")

    print("--- Text Extraction ---")
    test_extraction()

    print("\n--- TTS (Nigerian Voice) ---")
    await test_tts()

    print("\n--- AI Summary (Local Ollama) ---")
    await test_ai()

    print("\n=== All core services working ===")


if __name__ == "__main__":
    asyncio.run(main())
