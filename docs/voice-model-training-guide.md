# JackPal Voice Model Training Guide
## For Volunteers and Team Members

This document covers everything needed to record, process, and train the JackPal Nigerian AI voice models. Follow each step in order. Do not skip sections.

---

## Overview

We are training four custom Nigerian AI voices for JackPal:

| Character | Gender | Accent | Personality |
|---|---|---|---|
| **Adaora** | Female | Yoruba-influenced Nigerian English | Warm, clear, academic |
| **Jude** | Male | Igbo-influenced Nigerian English | Confident, engaging |
| **Nonso** | Male | Delta/Southern Nigerian English | Friendly, conversational |
| **Zainab** | Female | Hausa-influenced Nigerian English | Calm, precise |

Each voice needs to be recorded by a real Nigerian person with that natural accent. The AI learns entirely from the recordings — the more natural the speaker sounds, the more natural the AI voice will sound.

---

## Team Roles

| Role | Responsibility |
|---|---|
| **Voice Actor** | Records the script |
| **Recording Lead** | Manages the session, monitors audio quality |
| **Audio Editor** | Cleans audio in Audacity, labels files |
| **Dataset Manager** | Prepares CSV files, uploads to Colab |
| **ML Lead** | Runs the fine-tuning on Google Colab |

One person can cover multiple roles if the team is small.

---

## Part 1: Casting Voice Actors

### Who You Are Looking For

- Nigerian students or young adults (18–30)
- Clear, natural speaking voice in their regional English
- Able to read aloud for 45–60 minutes without losing energy
- NOT trying to sound British or American — natural Nigerian English only
- Consistent voice (no heavy cold, no hoarse voice on recording day)

### Where to Find Them

- University campus — drama department, debate club, radio station
- Twitter/X — "looking for Nigerian voice actors for EdTech startup"
- WhatsApp study groups
- Church/mosque — announce after service
- Friends and coursemates

### What to Offer

- Credit in the app ("Voice of Adaora: [Name]")
- ₦5,000 – ₦15,000 per completed session (if budget allows)
- Equity or revenue share for flagship voices (discuss internally)
- Letter of recommendation for portfolio

### Audition Process

Ask candidates to record a 30-second voice note reading this:

> "Welcome to JackPal, your personal study companion. Today we are going to break down this chapter together, step by step, so that by the end of this session, you will understand every key concept clearly."

Listen for:
- Natural Nigerian accent (not forced or stiff)
- Clear pronunciation
- Confident and warm delivery
- No heavy background noise

---

## Part 2: Pre-Recording Checklist

Complete this before every recording session.

### Equipment Needed

**Minimum setup (free):**
- [ ] Android or iPhone with clean microphone
- [ ] Free recording app: **RecForge II** (Android) or **Voice Memos** (iPhone)
- [ ] Quiet room — a wardrobe filled with clothes works perfectly
- [ ] Printed or displayed script (voice-recording-script.txt)
- [ ] Glass of water for the voice actor

**Better setup (recommended):**
- [ ] USB condenser microphone (BM-800 or similar, ~₦15,000–₦25,000)
- [ ] Laptop running **Audacity** (free download: audacityteam.org)
- [ ] Pop filter (or a sock over the mic)
- [ ] Headphones for the recording lead to monitor audio

### Room Setup

- Close all windows and doors
- Turn off fans, generators, and AC if possible (record during night or early morning)
- Put phones on silent (all team members)
- Hang blankets or clothes on walls if the room echoes
- Test record 10 seconds and play it back before starting

### Recording Settings

If using phone:
- Format: WAV or highest quality MP3 (not voice note compression)
- Set RecForge II to: WAV, 22050 Hz, Mono, 16-bit

If using Audacity on laptop:
- Sample rate: 22050 Hz
- Channels: Mono (1)
- Format: WAV (when exporting)

---

## Part 3: Recording Session

### Instructions for the Voice Actor

Read these to the voice actor before starting:

1. Speak naturally. Do not try to sound professional or foreign. Sound like yourself.
2. Maintain a consistent distance from the mic — about 20cm (one hand-width away).
3. Read each sentence clearly, then pause 1–2 seconds before the next.
4. If you make a mistake, stop, say "repeat", pause 2 seconds, then say the sentence again from the beginning.
5. Do not clear your throat into the microphone. Turn away if you need to.
6. Drink water every 30 sentences.
7. Take a 5-minute break after every 100 sentences.

### Session Structure

| Time | Activity |
|---|---|
| 0:00 – 0:10 | Setup, mic check, test recording |
| 0:10 – 0:55 | Record sentences 1–150 |
| 0:55 – 1:00 | Break |
| 1:00 – 1:45 | Record sentences 151–300 |
| 1:45 – 1:55 | Re-record any flagged sentences |
| 1:55 – 2:00 | Final check and wrap |

### What the Recording Lead Should Watch For

- Background noise (generator, fan, traffic) — stop and wait
- Voice actor rushing — remind them to slow down
- Voice getting tired or strained — take a break
- Mic too close (popping on P and B sounds) — adjust distance
- Inconsistent volume — keep distance consistent

### File Naming

Save the raw recording files like this:

```
adaora_session1_raw.wav
adaora_session2_raw.wav
jude_session1_raw.wav
```

---

## Part 4: Audio Editing (Audacity)

### Step 1 — Install Audacity
Download free at: audacityteam.org

### Step 2 — Open the Raw Recording

1. Open Audacity
2. File → Import → Audio → select your raw WAV file
3. You will see the full waveform of the recording

### Step 3 — Noise Reduction

1. Find a section of silence (where no one is speaking) — about 2 seconds
2. Select that section
3. Go to: Effect → Noise Reduction → Get Noise Profile
4. Select the entire track (Ctrl+A)
5. Go to: Effect → Noise Reduction → OK
6. This removes background hiss and room noise

### Step 4 — Normalize Volume

1. Select entire track (Ctrl+A)
2. Effect → Normalize → set to -1.0 dB → OK
3. This makes the volume consistent throughout

### Step 5 — Split Into Individual Sentences

Each sentence must become its own audio file. This is the most important step.

**Method 1 — Manual splitting (small dataset):**
1. Listen to the recording
2. Find where each sentence starts and ends
3. Select that sentence
4. File → Export → Export Selected Audio
5. Save as: `adaora_001.wav`, `adaora_002.wav`, etc.
6. Repeat for all 300 sentences

**Method 2 — Automatic splitting (faster):**
1. In Audacity: Analyze → Silence Finder
2. Set minimum silence duration: 0.5 seconds
3. This auto-labels each sentence
4. File → Export → Export Multiple (exports all labeled sections)

### Step 6 — Quality Check Each File

Listen to a random sample of 20 files and verify:
- [ ] Only one sentence per file
- [ ] No clipping (distortion)
- [ ] No background noise
- [ ] Clear and complete sentence from start to finish
- [ ] File is named correctly

### Final File Structure

```
/adaora/
    adaora_001.wav
    adaora_002.wav
    adaora_003.wav
    ...
    adaora_300.wav

/jude/
    jude_001.wav
    ...
```

---

## Part 5: Creating the Dataset (metadata.csv)

The AI training requires a CSV file that pairs each audio file with its transcript.

### Format

```
audio_file|transcript
adaora_001.wav|Welcome to JackPal.
adaora_002.wav|Let us begin your study session.
adaora_003.wav|Your audio is ready.
```

### How to Create It

1. Open Google Sheets or Excel
2. Column A: filename (e.g. adaora_001.wav)
3. Column B: exact sentence from the script
4. Match sentence number to file number (sentence 1 = adaora_001.wav)
5. Download as CSV
6. Rename to: `adaora_metadata.csv`

### Important Rules

- Transcript must match EXACTLY what was said in the recording
- If the voice actor said something slightly differently, use what they SAID, not the script
- Remove any rows where the audio is unclear or damaged
- No headers in the CSV file (just data rows)

---

## Part 6: Fine-Tuning the Voice Model (Google Colab)

### What You Need

- [ ] Google account (for Colab and Drive)
- [ ] All WAV files for one character (e.g. all 300 adaora files)
- [ ] metadata.csv for that character
- [ ] Stable internet connection for the upload

### Step 1 — Upload Files to Google Drive

1. Create a folder in Google Drive: `JackPal/adaora_dataset/`
2. Upload all 300 WAV files into that folder
3. Upload `adaora_metadata.csv` into the same folder

### Step 2 — Open Google Colab

1. Go to colab.research.google.com
2. Create a new notebook
3. Runtime → Change runtime type → GPU (T4)

### Step 3 — Install XTTS v2

Paste this into the first cell and run:

```python
!pip install TTS
!pip install torch torchaudio
```

### Step 4 — Mount Google Drive

```python
from google.colab import drive
drive.mount('/content/drive')
```

### Step 5 — Prepare the Dataset

```python
import os
import shutil

# Set paths
dataset_path = "/content/drive/MyDrive/JackPal/adaora_dataset"
output_path = "/content/adaora_training"

os.makedirs(output_path, exist_ok=True)

# Copy files to Colab local storage (faster training)
shutil.copytree(dataset_path, output_path, dirs_exist_ok=True)

print("Dataset loaded. File count:", len(os.listdir(output_path)))
```

### Step 6 — Run Fine-Tuning

```python
from TTS.bin.train_tts import main
from TTS.config.shared_configs import BaseAudioConfig
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

# This will fine-tune XTTS v2 on your Adaora recordings
# Training time estimate: 2-4 hours on free Colab T4 GPU

config = XttsConfig()
config.load_json("/content/XTTS-v2/config.json")

model = Xtts.init_from_config(config)
model.load_checkpoint(config, checkpoint_dir="/content/XTTS-v2/")

# Fine-tune on your dataset
model.finetune(
    train_csv="/content/adaora_training/adaora_metadata.csv",
    audio_dir="/content/adaora_training/",
    output_path="/content/adaora_finetuned/",
    epochs=100
)

print("Fine-tuning complete.")
```

### Step 7 — Test Your Voice

```python
# Generate test audio with the trained voice
model.synthesize(
    text="Welcome to JackPal. I am Adaora, your study companion. Let us begin.",
    output_file="/content/adaora_test.wav"
)

# Play the audio in Colab
from IPython.display import Audio
Audio("/content/adaora_test.wav")
```

Listen carefully. The voice should sound like your voice actor. If it does, the training worked.

### Step 8 — Save the Model

```python
# Save trained model back to Google Drive
shutil.copytree(
    "/content/adaora_finetuned/",
    "/content/drive/MyDrive/JackPal/models/adaora_v1/"
)

print("Model saved to Google Drive.")
```

---

## Part 7: Deploying the Voice API (Hugging Face Spaces)

### Step 1 — Create a Hugging Face Account
Sign up at: huggingface.co (free)

### Step 2 — Create a New Space

1. Go to huggingface.co/new-space
2. Name it: `jackpal-tts`
3. SDK: Gradio
4. Hardware: CPU Basic (free) or T4 Small ($0.60/hr when needed)
5. Visibility: Private

### Step 3 — Upload Your Model Files

Upload the contents of `adaora_v1/` folder to the Space files section.

### Step 4 — Create the API File (app.py)

Create a file called `app.py` in your Space:

```python
import gradio as gr
from TTS.api import TTS

# Load all four trained voices
voices = {
    "adaora": TTS(model_path="./adaora_v1/"),
    "jude": TTS(model_path="./jude_v1/"),
    "nonso": TTS(model_path="./nonso_v1/"),
    "zainab": TTS(model_path="./zainab_v1/"),
}

def synthesize(text: str, voice: str):
    model = voices.get(voice)
    if not model:
        return None
    output_path = f"/tmp/{voice}_output.wav"
    model.tts_to_file(text=text, file_path=output_path)
    return output_path

demo = gr.Interface(
    fn=synthesize,
    inputs=[
        gr.Textbox(label="Text to speak"),
        gr.Dropdown(["adaora", "jude", "nonso", "zainab"], label="Voice")
    ],
    outputs=gr.Audio(label="Generated Audio")
)

demo.launch()
```

### Step 5 — Get Your API URL

Once deployed, your API URL will be:
```
https://your-username-jackpal-tts.hf.space/api/predict
```

Share this URL with the development team. The JackPal app will call this endpoint to generate audio.

---

## Part 8: Quality Standards

Before any voice is approved for production, it must pass these checks:

### Audio Recording Quality
- [ ] No background noise audible
- [ ] No clipping or distortion
- [ ] Consistent volume throughout
- [ ] Natural pacing (not too fast, not robotic)
- [ ] All 300 sentences completed and labeled

### Generated Voice Quality
- [ ] Nigerian accent is clearly preserved
- [ ] Voice sounds natural, not robotic
- [ ] Long sentences (20+ words) sound smooth
- [ ] Numbers and dates pronounced correctly
- [ ] No audio glitches or artifacts

### Approval Process
1. ML Lead generates 20 test sentences with the trained voice
2. Recording Lead and Voice Actor listen together
3. If approved — deploy to Hugging Face
4. If rejected — identify issues, collect more data if needed, retrain

---

## Part 9: Troubleshooting

### Problem: Training crashes on Colab
**Solution:** Runtime → Restart runtime, then re-run from Step 3. Colab sometimes disconnects. Save checkpoints regularly.

### Problem: Voice sounds robotic
**Solution:** More training data needed. Collect another 200 sentences from the same voice actor and retrain.

### Problem: Accent is not preserved
**Solution:** The voice actor may have been speaking too formally. Re-record with instructions to speak more naturally.

### Problem: Audio files have background noise
**Solution:** Redo the noise reduction step in Audacity. If noise is too heavy, re-record in a quieter environment.

### Problem: Colab runs out of GPU time
**Solution:** Use RunPod instead. Create an account at runpod.io, rent an RTX 4090 pod (~$0.35/hr), repeat the same steps.

### Problem: metadata.csv has errors
**Solution:** Open in Excel, check that every row has exactly one filename and one transcript, no empty rows, no special characters.

---

## Timeline

| Week | Task | Who |
|---|---|---|
| Week 1 | Cast voice actors, auditions | Team Lead |
| Week 1 | Set up recording equipment | Recording Lead |
| Week 2 | Record Adaora (300 sentences) | Recording Lead + Voice Actor |
| Week 2 | Record Jude (300 sentences) | Recording Lead + Voice Actor |
| Week 3 | Edit and label Adaora audio | Audio Editor |
| Week 3 | Edit and label Jude audio | Audio Editor |
| Week 3 | Create metadata CSV files | Dataset Manager |
| Week 4 | Fine-tune Adaora model on Colab | ML Lead |
| Week 4 | Fine-tune Jude model on Colab | ML Lead |
| Week 4 | Quality check both voices | Full team |
| Week 5 | Record Nonso and Zainab | Recording Lead + Voice Actors |
| Week 6 | Edit, label, train Nonso and Zainab | Audio Editor + ML Lead |
| Week 7 | Deploy all four voices to Hugging Face | ML Lead |
| Week 7 | Integrate API into JackPal app | Dev team |

---

## Resources and Downloads

| Tool | Purpose | Link |
|---|---|---|
| Audacity | Audio editing | audacityteam.org |
| RecForge II | Android recording | Google Play Store |
| Google Colab | Free GPU training | colab.research.google.com |
| Hugging Face | Model hosting | huggingface.co |
| XTTS v2 Docs | Model documentation | github.com/coqui-ai/TTS |

---

## Contact

If you are stuck at any step, do not guess. Stop and contact the team lead before proceeding. A mistake in the recording or dataset stage means wasted training time.

---

*JackPal Voice Model Training Guide v1.0*
*Internal document — do not share publicly*
