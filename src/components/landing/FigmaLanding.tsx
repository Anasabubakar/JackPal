"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Check,
  ChevronDown,
  FileAudio,
  FolderOpen,
  Instagram,
  Linkedin,
  Medal,
  MessageSquareText,
  Mic2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Twitter,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { AUDIO_PREVIEW_VOICES } from "@/lib/audioPreviews";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { WaitlistProvider, useWaitlist } from "@/components/landing/WaitlistModal";
import { SOCIAL_LINKS } from "@/lib/socialLinks";
import { JackpalsLogo } from "@/components/brand/JackpalsLogo";

const navLinks = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#voices", label: "Voices" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQs" },
];

const testimonials = [
  {
    quote:
      "I didn't think i'd retain anything listening to it - but i remembered more from a 20 minutes walk than from an hour reading.",
    initials: "FA",
    name: "Favour A.",
    meta: "300L - Mass Communication",
  },
  {
    quote:
      "NotebookLM is fine but the accent is completely foreign. This one actually sounds like someone explaining it to me.",
    initials: "TM",
    name: "Tolu M.",
    meta: "200L - Computer Science",
  },
  {
    quote:
      "If this was available during my exams, my life would have looked different.",
    initials: "CO",
    name: "Chiamaka O.",
    meta: "Final Year, Pharmacy",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload Anything",
    text: "Drop a PDF, paste a link, or type your notes directly. JackPals handles the rest. No formatting needed.",
    tone: "green",
  },
  {
    number: "02",
    title: "Choose Your Voice",
    text: "Pick from Adaora, Zainab, Nonso, or Jude. Nigerian AI voices that sound natural, warm, and familiar.",
    tone: "blue",
  },
  {
    number: "03",
    title: "Listen Anywhere",
    text: "On the bus, at the market, before bed. Offline support means your studies never depend on your data.",
    tone: "red",
  },
];

const voices = AUDIO_PREVIEW_VOICES;

const voiceBullets = [
  "Trained on authentic Nigerian speech patterns, not generic TTS engines",
  "Speed control from 0.75× to 2.5×. Learn at the pace your brain works best",
  "Handles technical jargon, equations, and complex academic language",
  "More voices and regional accents coming with every release",
];

const featureCards = [
  {
    icon: Mic2,
    title: "Nigerian Voices",
    text: "Four distinct AI voices with authentic Nigerian accents: Adaora, Zainab, Nonso, and Jude. Familiar, warm, and built for extended listening.",
  },
  {
    icon: FolderOpen,
    title: "Upload Anything",
    text: "PDFs, Word docs, links, plain text, lecture slides. Paste it or upload it, and JackPals converts it to audio. No formatting required.",
  },
  {
    icon: MessageSquareText,
    title: "Offline Access",
    text: "Downloads are optimised for low storage and slow connections. Once it's on your device, listen anywhere. No data, no excuses.",
  },
  {
    icon: Medal,
    title: "Private Seminar",
    text: "Studying a hard topic? Switch to Private Seminar mode. JackPals reads, pauses, and explains concepts the way a patient tutor would.",
  },
  {
    icon: Camera,
    title: "Vision Scan",
    text: "Point your camera at a handwritten note, textbook page, or whiteboard. JackPals reads it out loud in under 3 seconds.",
  },
  {
    icon: Zap,
    title: "Study Faster",
    text: "Speed controls, bookmarks, and chapter skipping let you move through material at 2× speed once you've found your rhythm.",
  },
];

const conditionBullets = [
  "Encrypted local storage. Your notes never leave your device without permission",
  "Optimised for budget Android. Runs smoothly on 2GB RAM devices",
  "Background downloads. Queue your lectures and download while you sleep",
  "Web app availability. No app store required, works in any browser",
];

const freeFeatures = [
  ["5 documents per month", true],
  ["Up to 10 pages per document", true],
  ["2 Nigerian voices (Adaora, Nonso)", true],
  ["Web app access", true],
  ["Offline downloads", false],
  ["All 4 voices", false],
  ["Speed control beyond 1.5×", false],
  ["Private Seminar mode", false],
] as const;

const proFeatures = [
  "Unlimited documents",
  "No page limits",
  "All 4 Nigerian voices",
  "Offline downloads",
  "Speed control up to 2.5×",
  "Background audio & lockscreen player",
  "Private Seminar mode (when live)",
  "Priority access to new features",
];

const faqs = [
  {
    question: "What exactly is Jackpals?",
    answer:
      "JackPals turns notes, PDFs, links, and documents into Nigerian-accented study audio so you can revise while commuting, walking, or resting.",
  },
  {
    question: "Why Nigerian voice specifically?",
    answer:
      "Familiar voices reduce listening fatigue. JackPals is designed so study material sounds closer to home instead of like a generic foreign TTS demo.",
  },
  {
    question: "Does it work offline?",
    answer:
      "Offline listening is part of the launch plan, with background downloads built for low data and budget Android realities.",
  },
  {
    question: "What file type does Jackpals support?",
    answer:
      "The launch scope focuses on PDFs, typed notes, links, and plain text, with slides, Word documents, and camera scan support planned as the product expands.",
  },
  {
    question: "When is Jackpals launching?",
    answer: "The current launch target is Q2 2026. The waitlist is open now for early access.",
  },
];

function Pill({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className={`jp-pill ${dark ? "jp-pill-dark" : ""}`}>
      <span>{children}</span>
    </div>
  );
}

function CtaButton({
  children,
  href = "#pricing",
  variant = "primary",
  openWaitlist,
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "ghost" | "dark";
  openWaitlist?: () => void;
}) {
  if (openWaitlist) {
    return (
      <button type="button" className={`jp-button jp-button-${variant}`} onClick={openWaitlist}>
        <span>{children}</span>
      </button>
    );
  }
  return (
    <a className={`jp-button jp-button-${variant}`} href={href}>
      <span>{children}</span>
    </a>
  );
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const WAVEFORM_BARS = Array.from({ length: 62 }, (_, i) =>
  Math.max(0.12, 0.28 + 0.46 * Math.abs(Math.sin(i * 0.41)) + 0.26 * Math.abs(Math.sin(i * 0.17 + 1.2)))
);

function WaveformDisplay({ isActive, progress }: { isActive: boolean; progress: number }) {
  return (
    <div className="jp-waveform">
      {WAVEFORM_BARS.map((h, i) => {
        const pct = (i / WAVEFORM_BARS.length) * 100;
        const played = isActive && pct <= progress;
        return (
          <div
            key={i}
            className={`jp-wf-bar${played ? " jp-wf-bar--played" : ""}`}
            style={{ height: `${(h * 100).toFixed(1)}%` }}
          />
        );
      })}
    </div>
  );
}

const BIO302_WORDS = [
  "The", "cell", "cycle", "consists", "of", "interphase", "and", "mitosis.",
  "During", "interphase,", "the", "cell", "grows", "and", "replicates", "its", "DNA.",
  "Mitosis", "then", "divides", "the", "nucleus,", "producing", "two", "genetically",
  "identical", "daughter", "cells", "with", "the", "same", "chromosome", "number",
  "as", "the", "parent", "cell.",
];

function KaraokeDisplay({ isActive, progress }: { isActive: boolean; progress: number }) {
  const currentIdx = isActive
    ? Math.min(Math.floor((progress / 100) * BIO302_WORDS.length), BIO302_WORDS.length - 1)
    : -1;
  return (
    <div className="jp-karaoke">
      {BIO302_WORDS.map((word, i) => (
        <span
          key={i}
          className={
            i < currentIdx ? "jp-kw-past" : i === currentIdx ? "jp-kw-current" : "jp-kw-future"
          }
        >
          {word}{" "}
        </span>
      ))}
    </div>
  );
}

function AudioCard({ large = false }: { large?: boolean }) {
  const {
    activeVoice,
    activeSrc,
    isPlaying,
    progress,
    currentTime,
    duration,
    playbackRate,
    playVoice,
    togglePlay,
    skipBy,
    cyclePlaybackRate,
  } = useAudioPlayer();
  const [selectedVoiceName, setSelectedVoiceName] = useState(large ? "Adaora" : "Zainab");
  const selectedVoice =
    voices.find((voice) => voice.name === activeVoice) ??
    voices.find((voice) => voice.name === selectedVoiceName) ??
    voices[0];
  const isCurrentPreview = activeSrc === selectedVoice.src;
  const playing = isCurrentPreview && isPlaying;

  const handlePlayToggle = () => {
    if (isCurrentPreview) {
      togglePlay();
      return;
    }
    playVoice(selectedVoice.name, selectedVoice.src);
  };

  const handleVoiceSelect = (voice: typeof voices[number]) => {
    setSelectedVoiceName(voice.name);
    playVoice(voice.name, voice.src);
  };

  return (
    <div className={`jp-audio-card ${large ? "jp-audio-card-large" : ""} ${playing ? "is-playing" : "is-paused"}`}>
      <div className="jp-now">NOW PLAYING</div>
      <div className="jp-track">
        <div className="jp-track-icon">
          <FileAudio size={24} />
        </div>
        <div>
          <strong>BIO302 - Cell Division Notes</strong>
          <span>12 pages · 18 min listen</span>
        </div>
      </div>

      <WaveformDisplay isActive={isCurrentPreview} progress={progress} />
      <div className="jp-bar-wrap">
        <div className="jp-bar-fill" style={{ width: `${isCurrentPreview ? progress : 0}%` }} />
      </div>

      <div className="jp-player-row">
        <div className="jp-controls">
          <button className="jp-control-icon jp-skip" type="button" onClick={() => skipBy(-10)} aria-label="Skip back 10 seconds">
            <SkipBack size={large ? 15 : 13} />
          </button>
          <button className="jp-control-main" type="button" onClick={handlePlayToggle} aria-label="Toggle audio preview">
            {playing ? <Pause size={large ? 16 : 14} fill="currentColor" /> : <Play size={large ? 16 : 14} fill="currentColor" />}
          </button>
          <button className="jp-control-icon jp-skip" type="button" onClick={() => skipBy(10)} aria-label="Skip forward 10 seconds">
            <SkipForward size={large ? 15 : 13} />
          </button>
        </div>
        <div className="jp-time">
          {formatTime(isCurrentPreview ? currentTime : 0)} / {formatTime(isCurrentPreview ? duration : 0)}
        </div>
        <button type="button" className="jp-speed" onClick={cyclePlaybackRate} aria-label="Change playback speed">
          {playbackRate}x
        </button>
      </div>

      {large ? (
        <div className="jp-voice-grid">
          <strong>NIGERIAN VOICES</strong>
          <div>
            {voices.map((voice) => (
              <button
                type="button"
                className={voice.name === selectedVoice.name ? "selected" : ""}
                key={voice.name}
                onClick={() => handleVoiceSelect(voice)}
              >
                {voice.name}
                <small>{voice.origin}</small>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="jp-voice-label">VOICE</p>
          <div className="jp-voice-tabs" aria-label="Voice options">
            {voices.map((voice) => (
              <button
                type="button"
                className={voice.name === selectedVoice.name ? "selected" : ""}
                key={voice.name}
                onClick={() => handleVoiceSelect(voice)}
              >
                {voice.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Navbar({ openWaitlist }: { openWaitlist: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="jp-nav">
      <div className="jp-nav-inner">
        <Link className="jp-nav-logo" href="/">
          <JackpalsLogo variant="wordmark" priority className="h-9 w-auto" />
        </Link>
        <nav className="jp-nav-links" aria-label="Primary navigation">
          {navLinks.map((item, index) => (
            <a className={index === 0 ? "active" : ""} href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="jp-nav-actions">
          <Link href="/login">Login</Link>
          <button type="button" className="jp-nav-cta" onClick={openWaitlist}>
            Join The Waitlist
          </button>
        </div>
        <button className="jp-menu" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
          {open ? <X /> : <ChevronDown />}
        </button>
      </div>
      {open && (
        <div className="jp-mobile-nav">
          {navLinks.map((item) => (
            <a href={item.href} key={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <Link href="/login" onClick={() => setOpen(false)}>
            Login
          </Link>
          <button
            type="button"
            className="jp-mobile-waitlist"
            onClick={() => {
              setOpen(false);
              openWaitlist();
            }}
          >
            Join The Waitlist
          </button>
        </div>
      )}
    </header>
  );
}

function Hero({ openWaitlist }: { openWaitlist: () => void }) {
  return (
    <section className="jp-hero">
      <img className="jp-hero-bg" src="/images/Whisk_c70ae977c0feb5492014aa58127a071fdr 1.png" alt="" aria-hidden="true" />
      <div className="jp-container jp-hero-grid">
        <div className="jp-hero-copy">
          <div className="jp-kicker">
            <span className="jp-triangle" />
            Your study. Your voice. Your pace.
          </div>
          <h1>
            Your <span>textbooks,</span><br />
            read out loud, in<br className="jp-br-mobile" />{" "}
            a voice that sounds<br className="jp-br-mobile" />{" "}
            <span>like home.</span>
          </h1>
          <p>
            Turn any document type or link, into audio in a Nigerian voice. Listen on the bus, between classes, even offline.
          </p>
          <div className="jp-actions">
            <CtaButton openWaitlist={openWaitlist}>Join the Waitlist</CtaButton>
            <CtaButton href="#how-it-works" variant="ghost">
              See How It Works
            </CtaButton>
          </div>
        </div>
        <div className="jp-hero-demo">
          <AudioCard />
          <Image className="jp-mascot" src="/images/JackPal 2.png" alt="Jackpals mascot" width={105} height={136} priority />
        </div>
      </div>
      <p className="jp-launch-note">Launching Q2 2026 · ₦1,000/month · No credit card required</p>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="jp-proof">
      <Pill>REAL ACTION</Pill>
      <h2>What students said when<br />we showed them a demo</h2>
      <div className="jp-testimonials">
        {testimonials.map((item, index) => (
          <article className="jp-testimonial" key={item.name}>
            <div className="jp-stars">★★★★★</div>
            <span className="jp-quote-mark">“</span>
            <p>“{item.quote}”</p>
            <div className="jp-person">
              <span className={`avatar avatar-${index}`}>{item.initials}</span>
              <div>
                <strong>{item.name}</strong>
                <small>{item.meta}</small>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Reality() {
  return (
    <section className="jp-reality">
      <div className="jp-container jp-reality-grid">
        <div>
          <Pill>THE REALITY</Pill>
          <div className="jp-stat-card">
            <strong>67%</strong>
            <span>of Nigerian undergrads commute over 1 hour daily</span>
          </div>
          <div className="jp-stat-card">
            <strong>2x</strong>
            <span>retention when students read, then listen</span>
          </div>
          <div className="jp-stat-card">
            <strong>Zero</strong>
            <span>tools built specifically for this context — until now</span>
          </div>
        </div>
        <div className="jp-reality-copy">
          <h2>Nigerian students are reading more and <span>retaining less.</span></h2>
          <p>
            Between hour-long commutes, noisy hostels, shared reading rooms, and the sheer volume of course material, the &ldquo;sit down and read&rdquo; method is failing most undergraduates.
          </p>
          <p>Not because students aren&apos;t trying. Because the tools available weren&apos;t built for how we actually live.</p>
          <p>
            Existing study apps don&apos;t change that. The voices are foreign, the accents are unfamiliar, and when something sounds distant, attention drops.
          </p>
          <div className="jp-reality-note">
            <svg className="jp-reality-note-svg" width="100%" height="100%" aria-hidden="true">
              <defs>
                <linearGradient id="note-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF6B7E" />
                  <stop offset="100%" stopColor="#7C6FE8" />
                </linearGradient>
                <filter id="note-rough" x="-3%" y="-25%" width="106%" height="150%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" seed="5" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" />
                </filter>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" rx="12" ry="12" fill="none" stroke="url(#note-grad)" strokeWidth="1" strokeDasharray="5 1.8" strokeLinecap="round" filter="url(#note-rough)" />
              <rect x="0" y="0" width="100%" height="100%" rx="12" ry="12" fill="none" stroke="url(#note-grad)" strokeWidth="0.8" strokeDasharray="4 2.5" strokeLinecap="round" filter="url(#note-rough)" opacity="0.6" transform="translate(0.5, 0.3)" />
            </svg>
            JackPals is built for how Nigerian students actually live, study, and listen
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="jp-dark-section" id="how-it-works">
      <img className="jp-dark-bg" src="/images/Whisk_c70ae977c0feb5492014aa58127a071fdr 1.png" alt="" aria-hidden="true" />
      <div className="jp-container">
        <div className="jp-centered">
          <Pill>SIMPLE BY DESIGN</Pill>
          <h2>Three steps to a smarter<br />study session</h2>
        </div>

        <div className="jp-step-grid">
          {steps.map((step) => (
            <article className="jp-step-card" key={step.number}>
              <span className={`jp-step-number ${step.tone}`}>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>

        <div className="jp-voice-area" id="voices">
          <AudioCard large />
          <div className="jp-voice-copy">
            <h2>Voices that actually sound like <span>you</span>.</h2>
            <p>
              Our Nigerian AI voices aren't just text-to-speech. They carry rhythm, warmth, and familiarity.
              When you hear something that sounds like home, your brain stays present.
            </p>
            <ul>
              {voiceBullets.map((item) => (
                <li key={item}>
                  <Check size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="jp-features">
      <img className="jp-feature-sketch" src="/images/Whisk_fa77d4db251aadf8bd74ed8e18ab7d80dr (1) 1.png" alt="" aria-hidden="true" />
      <Pill>REAL ACTION</Pill>
      <h2>Everything you need.<br />Nothing you don&apos;t.</h2>
      <div className="jp-container jp-feature-grid">
        {featureCards.map(({ icon: Icon, title, text }) => (
          <article className="jp-feature-card" key={title}>
            <span>
              <Icon size={25} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Conditions() {
  return (
    <section className="jp-conditions">
      <div className="jp-container">
        <div className="jp-condition-panel">
          <div>
            <Pill dark>Privacy &amp; performance</Pill>
            <h2>Built for real-world<br /><span>Nigerian conditions.</span></h2>
            <p>
              JackPals doesn&apos;t assume you have fast WiFi, unlimited data, or a 2024 flagship phone.
              It&apos;s engineered for the actual constraints of student life.
            </p>
            <ul>
              {conditionBullets.map((item) => (
                <li key={item}>
                  <Check size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="jp-orb" aria-hidden="true">
            <span className="orb-ring ring-1" />
            <span className="orb-ring ring-2" />
            <span className="orb-core">
              <JackpalsLogo variant="mark" alt="" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing({ openWaitlist }: { openWaitlist: () => void }) {
  return (
    <section className="jp-pricing" id="pricing">
      <div className="jp-centered">
        <Pill>TRANSPARENT PRICING</Pill>
        <h2>Start free. Upgrade when you&apos;re ready.</h2>
        <p>No hidden fees. No foreign currency. Priced for the Nigerian student.</p>
      </div>
      <div className="jp-pricing-grid">
        <article className="jp-price-card">
          <h3>FREE PLAN</h3>
          <strong>₦0</strong>
          <p>Forever free, no card needed</p>
          <hr />
          <ul>
            {freeFeatures.map(([feature, enabled]) => (
              <li className={!enabled ? "muted" : ""} key={feature}>
                {enabled ? <Check size={16} /> : <X size={16} />}
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="jp-price-card-cta" onClick={openWaitlist}>
            Join Free Waitlist
          </button>
        </article>

        <article className="jp-price-card featured">
          <div className="jp-ribbon">RECOMMENDED</div>
          <h3>PRO PLAN</h3>
          <strong>₦1,000</strong>
          <p>Per month · Cancel anytime</p>
          <hr />
          <ul>
            {proFeatures.map((feature) => (
              <li key={feature}>
                <Check size={16} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="jp-price-card-cta" onClick={openWaitlist}>
            Get Early Access
          </button>
        </article>
      </div>
    </section>
  );
}

function ReferralAndFaq({ openWaitlist }: { openWaitlist: () => void }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="jp-faq-band" id="faq">
      <div className="jp-referral">
        <div className="jp-referral-actions">
          <CtaButton openWaitlist={openWaitlist} variant="dark">
            Spread the word
          </CtaButton>
          <CtaButton openWaitlist={openWaitlist}>Share Jackpals</CtaButton>
        </div>
        <h2>Know a student who needs this?</h2>
        <p>
          JackPals is better when your study group uses it. Share it with one person and help them reclaim hours
          of wasted commute time.
        </p>
      </div>

      <div className="jp-container jp-faq-grid">
        <div className="jp-faq-title">
          <Pill>QUESTIONS</Pill>
          <h2>Frequently Asked Questions.</h2>
          <p>Got questions? We have answers.</p>
        </div>
        <div className="jp-accordion">
          {faqs.map((item, index) => {
            const isOpen = open === index;
            return (
              <div className={isOpen ? "open" : ""} key={item.question}>
                <button type="button" onClick={() => setOpen(isOpen ? null : index)} aria-expanded={isOpen}>
                  <span>{item.question}</span>
                  <ChevronDown size={17} />
                </button>
                {isOpen && <p>{item.answer}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ openWaitlist }: { openWaitlist: () => void }) {
  return (
    <section className="jp-final" id="final-cta">
      <div className="jp-final-scene" aria-hidden="true">
        <img
          className="jp-final-bg"
          src="/images/Group%202042.png"
          alt=""
          width={1758}
          height={1011}
          decoding="async"
          draggable={false}
        />
      </div>
      <div className="jp-final-shade" />
      <div className="jp-container jp-final-grid">
        <div className="jp-final-copy">
          <h2 className="jp-final-headline">
            <span className="jp-final-line">Your next exam</span>
            <span className="jp-final-line">deserves better than</span>
            <span className="jp-final-line jp-final-accent">all-night reading</span>
            <span className="jp-final-line jp-final-accent">sessions.</span>
          </h2>
          <p className="jp-final-lead">Join the early access waitlist.</p>
          <div className="jp-actions jp-final-actions">
            <CtaButton openWaitlist={openWaitlist}>Join the Waitlist</CtaButton>
            <CtaButton href="#how-it-works" variant="ghost">
              Learn More
            </CtaButton>
          </div>
          <small>Launching Q2 2026 · ₦1,000/month after launch · No credit card required</small>
        </div>
        <div className="jp-final-rail" />
      </div>
    </section>
  );
}

function Footer() {
  const groups = [
    ["PRODUCT", "How It Works", "Voices", "Features", "Pricing", "Waitlist"],
    ["LEGAL", "Privacy Policy", "Terms of Use", "Cookie Policy"],
  ];

  return (
    <footer className="jp-footer">
      <div className="jp-container jp-footer-grid">
        <div>
          <JackpalsLogo variant="footer" className="h-auto w-[252px] max-w-full" />
          <p>Learn in a way that actually works. Your notes, your voice, your pace.</p>
        </div>
        {groups.map(([title, ...links]) => (
          <nav key={title}>
            <strong>{title}</strong>
            {links.map((link) => (
              <a href="#" key={link}>{link}</a>
            ))}
          </nav>
        ))}
      </div>
      <div className="jp-container jp-footer-bottom">
        <p>© 2026 JackPals. All rights reserved. Built with for Nigerian students.</p>
        <div className="jp-footer-social-row" aria-label="Social links">
          <a
            className="jp-footer-social"
            href={SOCIAL_LINKS.x}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="JackPals on X"
          >
            <Twitter size={16} strokeWidth={2} aria-hidden />
          </a>
          <a
            className="jp-footer-social"
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TeenovateX Labs on LinkedIn"
          >
            <Linkedin size={16} strokeWidth={2} aria-hidden />
          </a>
          <a
            className="jp-footer-social"
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="JackPals on Instagram"
          >
            <Instagram size={16} strokeWidth={2} aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}

function FigmaLandingInner() {
  const { openWaitlist } = useWaitlist();

  return (
    <div className="jp-landing">
      <Navbar openWaitlist={openWaitlist} />
      <main>
        <Hero openWaitlist={openWaitlist} />
        <SocialProof />
        <Reality />
        <HowItWorks />
        <Features />
        <Conditions />
        <Pricing openWaitlist={openWaitlist} />
        <ReferralAndFaq openWaitlist={openWaitlist} />
        <FinalCta openWaitlist={openWaitlist} />
      </main>
      <Footer />
    </div>
  );
}

export function FigmaLanding() {
  return (
    <WaitlistProvider>
      <FigmaLandingInner />
    </WaitlistProvider>
  );
}
