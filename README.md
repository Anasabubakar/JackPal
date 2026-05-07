# JackPal — AudioLearn

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

> Turn your academic materials into secure, high-quality audio you can listen to offline at a price students can actually afford.


## What Is JackPal?

JackPal (working title: **AudioLearn**) is a student-first audio learning platform built for the Nigerian and African student market.

Students struggle with large volumes of academic reading due to limited time, reading fatigue, visual strain, and the high cost of existing audio tools. JackPal solves this by letting students upload their academic documents (PDFs, Word docs, text), converting them to natural-sounding audio using AI, and playing them back offline — with content protection so files cannot be shared or pirated.

Think: Speechify meets Spotify, built for students who study on low-end Android phones and cannot always afford data.

**Live site:** jackpal.vercel.app

---

## Team Structure

| Role | Responsibility |
|------|---------------|
| Frontend | Next.js UI, pages, components, user experience |
| Backend | FastAPI (Python) AI service, auth, file processing, TTS pipeline |

---

## Current State of the Codebase

This is a **Next.js 16 / React 19 / TypeScript** project deployed on Vercel.

### What exists right now

#### Pages
| Route | Status | Notes |
|-------|--------|-------|
| `/` | Live | Landing page — 3D interactive hero, waitlist form, newsletter signup |
| `/login` | Shell | UI complete. Login is **simulated** — no real auth yet |
| `/forgot-password` | Shell | UI complete. Reset flow is **simulated** — no real email sent |
| `/reset-password` | Shell | UI complete. Password update is **simulated** |
| `/dashboard` | Shell | UI exists. No real data — placeholder only |

#### Backend logic (current)
- `src/app/actions.ts` — Next.js Server Actions for:
  - Waitlist form → syncs to MailerLite + sends notification via Resend
  - Newsletter signup → same pipeline
- No database, no real auth, no file handling

#### Infrastructure
- Hosted on Vercel (61 deployments, production is live)
- MailerLite for email list management
- Resend for transactional email notifications

---

## What the Backend Will Add

The backend is being built as a **separate FastAPI (Python) service** that the Next.js frontend will communicate with via API calls.

### Auth (Milestone 1)
- Real email/password signup and login via Supabase
- Session management with secure tokens
- Password reset flow — actual emails sent, actual password updates
- Device registration per user account

### File Upload & Processing (Milestone 2)
- Upload PDF, DOCX, TXT files
- Server-side storage in Supabase Storage
- Text extraction from documents (PyMuPDF, python-docx)
- Content library — list, rename, delete documents per user

### Text-to-Speech Pipeline (Milestone 3)
- Extracted text → AI audio conversion (Google Cloud TTS — 1M chars/month free)
- Natural-sounding voices, adjustable speed
- Audio stored securely, tied to user account
- Section-by-section chunking for long documents

### Offline & DRM (Milestone 4)
- Audio downloadable only inside the app
- Encrypted local storage — files cannot be exported or shared
- Audio tied to user account (breaks if shared)
- Device limit enforcement per account

### AI Features (Milestone 5)
- AI-generated document summaries (Groq API — free tier, llama3)
- Bookmark and notes system
- Study playlists by course/subject
- Progress tracking and auto-resume

---

## Frontend Integration Points

As the backend comes online, the frontend will need to connect to the following. The backend team will provide the base URL and exact request/response shapes.

### Auth endpoints (FastAPI → Supabase)
```
POST /auth/signup       — create account
POST /auth/login        — returns session token
POST /auth/logout       — invalidate session
POST /auth/reset        — trigger password reset email
POST /auth/update-pass  — set new password with reset token
```

### Documents
```
POST   /documents/upload     — upload file (multipart/form-data)
GET    /documents/           — list user's documents
DELETE /documents/:id        — delete a document
GET    /documents/:id/text   — get extracted text
```

### Audio
```
POST /audio/generate/:doc_id  — trigger TTS conversion
GET  /audio/:doc_id           — get audio stream URL
GET  /audio/:doc_id/status    — check generation progress
```

### AI
```
POST /ai/summarize/:doc_id    — generate document summary
```

---

## Pages That Need Wiring (Frontend Action Required)

Once the backend is live, these pages need to stop using simulated logic and connect to real API calls:

### `/login`
- Replace `setTimeout` simulation with real `POST /auth/login`
- Store returned session token (Supabase handles this automatically)
- Redirect to `/dashboard` on success

### `/forgot-password`
- Replace simulation with `POST /auth/reset`
- Show confirmation that email was sent

### `/reset-password`
- Replace simulation with `POST /auth/update-pass`
- Pass token from URL params (Supabase sends this in the reset email link)

### `/dashboard`
- Fetch real documents from `GET /documents/`
- Show upload UI
- Show audio generation status
- Audio player component (needs building)

---

## Local Development Setup

### Frontend

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Fill in your keys (see .env.example for reference)

# Start dev server
npm run dev
```

Open http://localhost:3000

### Environment Variables

| Variable | What It Is | Required |
|----------|-----------|----------|
| `MAILERLITE_API_KEY` | MailerLite API key for email lists | Yes (for forms) |
| `MAILERLITE_GROUP_IDS` | Group ID(s) for newsletter + waitlist | Yes (for forms) |
| `RESEND_API_KEY` | Resend API key for email notifications | Yes (for forms) |
| `RESEND_FROM_EMAIL` | Sender email address | Optional |
| `RESEND_TO_EMAIL` | Where form notifications go | Optional |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Coming — backend adds this |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | Coming — backend adds this |
| `NEXT_PUBLIC_API_URL` | FastAPI backend base URL | Coming — backend adds this |

### Backend (coming soon)
The backend team will add setup instructions to `/backend/README.md` once the FastAPI service is scaffolded.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| 3D / Visuals | Three.js, React Three Fiber, Rapier physics |
| Icons | Lucide React |
| Email lists | MailerLite |
| Transactional email | Resend |
| Auth + Database | Supabase (Postgres) |
| File storage | Supabase Storage |
| AI backend | FastAPI (Python) |
| PDF extraction | PyMuPDF |
| Text-to-speech | Google Cloud TTS (1M chars/month free) |
| LLM / summaries | Groq API (llama3, free tier) |
| Local dev LLM | Ollama |
| Backend hosting | Render / Railway (free tier) |
| Frontend hosting | Vercel |

---

## MVP Milestones

- [x] Landing page + waitlist + newsletter
- [ ] **Milestone 1** — Real auth (login, signup, password reset)
- [ ] **Milestone 2** — File upload + text extraction
- [ ] **Milestone 3** — TTS audio generation + player
- [ ] **Milestone 4** — Offline access + DRM
- [ ] **Milestone 5** — AI summaries + study tools

---

## Branch Convention

```
main              — production (Vercel deploys from here)
backend/setup     — initial FastAPI scaffolding
backend/auth      — auth integration
backend/upload    — file upload pipeline
backend/tts       — text-to-speech pipeline
frontend/dashboard — dashboard wiring (after backend auth is live)
```

Never push directly to `main`. Open a pull request and request a review.

---

## Contact

Questions about the backend integration? Reach out to the backend team before building UI for features that depend on API responses — coordinate on the contract (request/response shapes) first so both sides can work in parallel.
