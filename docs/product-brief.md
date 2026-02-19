# JackPal Product Brief

App name: JackPal
Working title: AudioLearn

## Feature Comparison Table

| Platform | Core Purpose | Unique / Stand-out Features | What Makes It Special |
| --- | --- | --- | --- |
| Speechify | Text-to-Speech (TTS) | High-quality, natural AI voices; Reads PDFs, websites, emails, and Google Docs; Chrome & mobile extensions; Speed control (high-speed playback) | Best voice quality + reading speed, great for students with reading difficulties or heavy workloads |
| ReadEra | Document & eBook Reader | Offline reading (no account needed); Supports PDF, EPUB, DOC, MOBI, TXT; Auto-detects files on device; No ads, lightweight app | Excellent offline-first document management and a clean reading experience |
| Spotify | Audio Streaming | Strong DRM (content tied to account); Offline downloads inside the app; Playlists & recommendations; Cross-device sync | Best at content protection, scaling, and monetization |
| WPS Office | Document Creation & Viewing | PDF reader + editor; Document annotation & highlighting; Cloud sync; Lightweight alternative to MS Office | Strong document handling + editing, not just reading |

## Product Requirements Document (PRD)

### Product Name (Working Title)
AudioLearn: A student-first, offline-friendly audio learning platform

### Purpose & Vision

#### Problem Statement
Many students struggle to read large volumes of academic material due to:
- Limited time
- Reading fatigue
- Visual strain
- Accessibility challenges
- High cost of existing audio tools

Current platforms either:
- Read text well but lack offline access and DRM
- Handle documents well but lack audio intelligence
- Scale audio content but are not student-centric or affordable

#### Vision
To build an affordable, secure, and student-focused platform that converts academic content into high-quality audio, allowing students to learn anytime, anywhere, even offline, without content piracy.

### Target Users

Primary Users:
- Secondary school students
- University students
- Professional exam candidates (medical, law, tech)

Secondary Users:
- Tutors & educators (future phase)
- Study groups / institutions

### Core Value Proposition
“Turn your academic materials into secure, high-quality audio you can listen to offline — at a price students can actually afford.”

### Key Use Cases (Student-Centric)
- Student uploads a PDF/Doc/website text
- Platform converts content to audio using AI voices
- Student downloads audio inside the app
- Audio plays offline but cannot be exported or shared
- Student studies while commuting, resting, or multitasking

### Core Features (MVP)

#### 5.1 Content Input
- Upload: PDF, DOC/DOCX, TXT
- Paste text
- Web page import (basic)

#### 5.2 Audio Conversion
- Natural-sounding AI voices
- Adjustable playback speed
- Pause / resume from last point
- Section-by-section playback (chapters/pages)

#### 5.3 Offline Access (Critical)
- Audio downloadable only within the app
- No external file export
- Offline playback without internet

#### 5.4 Content Protection (DRM)
- Audio tied to user account
- Encrypted local storage
- No screen/audio recording support (where OS allows)
- Device limit per account

#### 5.5 Student-Friendly Pricing
- Low-cost monthly plan
- Annual student plan
- Free tier with limits (minutes per month)

### Differentiating Features (Phase 2)

#### 6.1 Study Support
- Highlight text while audio plays
- Bookmarks & notes
- Quick summary (AI-generated)

#### 6.2 Smart Learning
- Resume from last listened point
- Study playlists (per course)
- Daily listening goals

#### 6.3 Accessibility
- Dyslexia-friendly fonts (for reading view)
- Voice clarity tuning
- Language support (future)

### Non-Goals (Important)
The platform will NOT:
- Allow free sharing or exporting of audio files
- Replace music streaming platforms
- Act as a social media app
- Enable piracy or redistribution of content

### Technical Requirements (High Level)

Frontend:
- Mobile-first (Android priority)
- Simple, distraction-free UI
- Offline-first design

Backend:
- Secure file storage
- Text-to-speech engine
- DRM & encryption layer
- User authentication

Security:
- Encrypted downloads
- Token-based access
- Device/session control

### Success Metrics (Student-Focused)
- % of users using offline mode weekly
- Average listening time per student
- Retention after 30 days
- Conversion from free → paid student plan
- Feedback on affordability & usability

### Risks & Mitigation
- Content piracy: Strong DRM + in-app playback only
- High infrastructure cost: Usage caps on free tier
- Low student trust: Clear pricing & transparency
- Device limitations: Optimize for low-end Android phones

### Launch Strategy (Early Stage)
- Private beta with students
- Feedback-driven iteration
- Campus-by-campus rollout
- Referral discounts for students
- Gradual feature expansion

### Why This Will Work (Student Logic)
As a student explaining confidently:
- It solves real study pain
- It respects student budgets
- It works offline
- It protects creators
- It combines features no single platform currently offers

## MVP Task Breakdown (Combined Phases)

MVP Goal (Single Sentence)
Build a secure, student-focused audio learning app that converts academic content into high-quality audio, supports offline listening, and protects content from sharing.

### Architecture & Setup (Foundation)
1.1 Project Setup
- Create monorepo or separated frontend/backend repos
- Define environments (dev, staging, prod)
- Set up CI/CD pipeline
- Configure environment variables
Deliverable: Working dev environment for mobile + backend

1.2 Authentication & User Accounts
- Email/password sign-up
- Secure login & logout
- Password reset
- Device registration per user
- Session/token management
Deliverable: Secure user identity system

### Content Input & Management (Core)
2.1 File Upload System
- Upload PDF, DOC/DOCX, TXT
- File size validation
- File format validation
- Server-side storage
Deliverable: Students can upload academic files safely

2.2 Text Extraction Engine
- Extract readable text from PDFs
- Extract readable text from Word documents
- Handle multi-page documents
- Error handling for unreadable files
Deliverable: Clean text output ready for audio conversion

2.3 Content Library
- List uploaded documents
- Rename / delete documents
- Organize by course or subject
Deliverable: Student document dashboard

### Text-to-Speech Engine (Core)
3.1 Audio Generation
- Convert extracted text to audio
- Natural-sounding AI voice selection
- Chunk long documents into sections
Deliverable: Audio version of uploaded content

3.2 Audio Controls
- Play / pause
- Skip forward/back
- Speed control
- Resume from last position
Deliverable: Usable study-grade audio player

### Offline Access & DRM (Critical)
4.1 Secure Audio Downloads
- Download audio to device
- Encrypt audio files locally
- Prevent external file access
Deliverable: Offline audio playable only inside the app

4.2 DRM Enforcement
- Tie audio to user account
- Limit number of devices per account
- Block file export & sharing
Deliverable: Content protection system

### Student Experience Enhancements (Phase 2 Merged)
5.1 Text Sync & Highlighting
- Display extracted text
- Highlight current spoken section
- Tap text to jump audio
Deliverable: Audio-text synchronization

5.2 Bookmarks & Notes
- Add bookmarks during playback
- Attach short notes
- Save per document
Deliverable: Active learning support tools

5.3 Study Playlists
- Group audios by subject/course
- Play continuously
- Reorder items
Deliverable: Course-based study playlists

### Smart Learning Features
6.1 Progress Tracking
- Track listening progress per document
- Auto-resume
- Completion indicators
Deliverable: Learning continuity system

6.2 AI Summaries (Lightweight MVP)
- Generate short summaries per document
- Optional display
- Text-only (no audio summary in MVP)
Deliverable: Fast revision aid

### Accessibility & Performance
7.1 Accessibility Controls
- Font size adjustment
- Dyslexia-friendly fonts
- High-contrast mode
Deliverable: Inclusive student UI

7.2 Performance Optimization
- Low-end Android optimization
- Background download handling
- Battery-efficient playback
Deliverable: Reliable experience on student devices

### Pricing & Usage Control
8.1 Free Tier Limits
- Monthly audio minutes cap
- File upload limits
Deliverable: Cost control mechanism

8.2 Paid Student Plans
- Monthly subscription
- Annual student discount
- In-app payment integration
Deliverable: Monetization system

### Admin & Monitoring (Internal MVP)
9.1 Admin Dashboard
- View active users
- Monitor usage
- Flag abuse
Deliverable: Basic platform control panel

9.2 Analytics
- Daily active users
- Average listening time
- Offline usage rate
Deliverable: Product decision data

## MVP Delivery Milestones
- Milestone 1: User auth + file upload
- Milestone 2: Text extraction + audio generation
- Milestone 3: Offline playback + DRM
- Milestone 4: Study tools + UI polish
- Milestone 5: Payments + analytics

## Final Student Summary (Why This Is Buildable)
As a student confidently closing the presentation:
This MVP focuses on real student behavior: uploading notes, listening offline, studying on low-end devices, and paying only what they can afford. Every feature directly supports learning, not distraction.

## 2-Week MVP Build Timeline (14 Days)

Build Assumptions
- Small team (2–4 developers)
- Mobile-first (Android)
- Reuse existing TTS APIs
- No feature creep
- Phase-2 features trimmed to essentials

Week 1: Core Functionality (Foundation)
- Day 1: Project setup & architecture
- Day 2: Authentication & user accounts
- Day 3: File upload & storage
- Day 4: Text extraction
- Day 5: Text-to-speech conversion
- Day 6: Audio player (online)
- Day 7: Buffer & internal testing

Week 2: Offline, Security & Student Experience
- Day 8: Offline downloads
- Day 9: DRM & content protection
- Day 10: Content library & organization
- Day 11: Study tools (light phase 2)
- Day 12: Usage limits & pricing logic
- Day 13: QA, performance & accessibility
- Day 14: MVP freeze & demo prep

## What This 2-Week MVP Delivers
- Upload academic documents
- Convert text to audio
- Offline listening inside app
- DRM protection
- Student-friendly UI
- Real learning use case

## What Is Intentionally Excluded
- AI summaries (post-MVP)
- Advanced analytics
- Institution dashboards
- Multi-language voices

## Final Student Close
In two weeks, we are not building a perfect product. We are building proof that students will use this, need this, and pay for this.
Let's build.
