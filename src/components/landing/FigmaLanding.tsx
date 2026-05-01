"use client";

import Image from "next/image";
import Link from "next/link";
import { AudioProgress } from '@/components/AudioProgress';
import {
  Camera,
  Check,
  ChevronDown,
  FileAudio,
  FolderOpen,
  Medal,
  MessageSquareText,
  Mic2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

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
    text: "Drop a PDF, paste a link, or type your notes directly. JackPals handles the rest — no formatting needed.",
    tone: "green",
  },
  {
    number: "02",
    title: "Choose Your Voice",
    text: "Pick from Adaora, Zainab, Nonso, or Jude — Nigerian AI voices that sound natural, warm, and familiar.",
    tone: "blue",
  },
  {
    number: "03",
    title: "Listen Anywhere",
    text: "On the bus, at the market, before bed. Offline support means your studies never depend on your data.",
    tone: "red",
  },
];

const voices = [
  ["Adaora", "Igbo - Female"],
  ["Zainab", "Hausa - Female"],
  ["Nonso", "Igbo - Female"],
  ["Jude", "Yoruba - Male"],
];

const voiceBullets = [
  "Trained on authentic Nigerian speech patterns — not generic TTS engines",
  "Speed control from 0.75× to 2.5× — learn at the pace your brain works best",
  "Handles technical jargon, equations, and complex academic language",
  "More voices and regional accents coming with every release",
];

const featureCards = [
  {
    icon: Mic2,
    title: "Nigerian Voices",
    text: "Four distinct AI voices with authentic Nigerian accents — Adaora, Zainab, Nonso, and Jude. Familiar, warm, and built for extended listening.",
  },
  {
    icon: FolderOpen,
    title: "Upload Anything",
    text: "PDFs, Word docs, links, plain text, lecture slides — paste it or upload it, and JackPals converts it to audio. No formatting required.",
  },
  {
    icon: MessageSquareText,
    title: "Offline Access",
    text: "Downloads are optimised for low storage and slow connections. Once it's on your device, listen anywhere — no data, no excuses.",
  },
  {
    icon: Medal,
    title: "Private Seminar",
    text: "Studying a hard topic? Switch to Private Seminar mode — JackPals reads, pauses, and explains concepts the way a patient tutor would.",
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
  "Encrypted local storage — your notes never leave your device without permission",
  "Optimised for budget Android — runs smoothly on 2GB RAM devices",
  "Background downloads — queue your lectures and download while you sleep",
  "Web app availability — no app store required, works in any browser",
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
      "Jackpals turns notes, PDFs, links, and documents into Nigerian-accented study audio so you can revise while commuting, walking, or resting.",
  },
  {
    question: "Why Nigerian voice specifically?",
    answer:
      "Familiar voices reduce listening fatigue. The product is designed so study material sounds closer to home instead of like a generic foreign TTS demo.",
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
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "ghost" | "dark";
}) {
  return (
    <a className={`jp-button jp-button-${variant}`} href={href}>
      <span>{children}</span>
    </a>
  );
}

const progressPath =
  "M4 24 C10 24 12 17 18 24 S28 31 34 24 S44 17 50 24 S60 31 66 24 S76 17 82 24 S92 31 98 24 S108 17 114 24 S124 31 130 24 S140 17 146 24 S156 31 162 24 S172 17 178 24 S188 31 194 24 S204 17 210 24 S220 31 226 24 L516 24";

// ... (rest of code)
function AudioCard({ large = false }: { large?: boolean }) {
// ... (rest of code)
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(38);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setProgress((value) => (value >= 100 ? 0 : value + 0.6));
    }, 120);
    return () => window.clearInterval(timer);
  }, [playing]);

  return (
    <div className={`jp-audio-card ${large ? "jp-audio-card-large" : ""} ${playing ? "is-playing" : "is-paused"}`}>
      <div className="jp-now">NOW PLAYING</div>
      <div className="jp-track">
        <div className="jp-track-icon">
          <FileAudio size={24} />
        </div>
        <div>
          <strong>{large ? "PHY302 - Mechanics & Waves" : "BIO302 - Cell Division Notes"}</strong>
          <span>{large ? "Chapter 4 + 8 pages" : "12 pages - 18 min listen"}</span>
        </div>
      </div>

      <AudioProgress progress={progress} label={large ? "Study session" : "Chapter progress"} />

      <div className="jp-player-row">
        <div className="jp-time">{large ? "00:00" : "17:55"} / {large ? "14:32" : "18:06"}</div>
        <div className="jp-controls">
          <SkipBack size={large ? 15 : 13} />
          <button type="button" onClick={() => setPlaying((value) => !value)} aria-label="Toggle audio preview">
            {playing ? <Pause size={large ? 14 : 12} fill="currentColor" /> : <Play size={large ? 14 : 12} fill="currentColor" />}
          </button>
          <SkipForward size={large ? 15 : 13} />
        </div>
        <div className="jp-speed">1x</div>
      </div>

      {large ? (
        <div className="jp-voice-grid">
          <strong>NIGERIAN VOICES</strong>
          <div>
            {voices.map(([voice, origin]) => (
              <span key={voice}>
                {voice}
                <small>{origin}</small>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="jp-voice-tabs" aria-label="Voice options">
          {["Adaora", "Zainab", "Nonso", "Jude"].map((voice) => (
            <span className={voice === "Zainab" ? "selected" : ""} key={voice}>
              {voice}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="jp-nav">
      <div className="jp-nav-inner">
        <Link className="jp-nav-logo" href="/">
          <Image src="/images/Jackpals Logo 4 1.png" alt="Jackpals" width={164} height={36} priority />
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
          <a href="#pricing">Join The Waitlist</a>
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
          <Link href="/login">Login</Link>
        </div>
      )}
    </header>
  );
}

function Hero() {
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
            Your textbooks,
            <br />
            read out loud, in a <span>voice that sounds like home.</span>
          </h1>
          <p>
            JackPals converts any document, PDF, or link into high-quality audio narrated by Nigerian AI voices.
            Study on a commute, between classes, or anywhere your life takes you — without staring at a screen.
          </p>
          <div className="jp-actions">
            <CtaButton>Join the Waitlist</CtaButton>
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
      <p className="jp-launch-note">--- Launching Q2 2026 · ₦1,000/month · No credit card required to join waitlist</p>
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
            <strong>3x</strong>
            <span>faster retention with audio vs passive reading</span>
          </div>
          <div className="jp-stat-card">
            <strong>₦0</strong>
            <span>tools built specifically for this context — until now</span>
          </div>
        </div>
        <div className="jp-reality-copy">
          <h2>Nigerian students are reading more and <span>retaining less.</span></h2>
          <p>
            Between long commutes, noisy hostels, shared reading spaces, and the sheer volume of course material
            — the traditional "sit down and read" method is failing most undergraduates.
          </p>
          <p>Not because students aren't trying. Because the tools available weren't built for how we actually live.</p>
          <p>
            Apps like NotebookLM exist, but they were built for a different context. The voices are foreign. The
            accents are unfamiliar. And when something sounds distant, your brain switches off faster.
          </p>
          <div className="jp-reality-note">
            JackPals is built differently — for the Nigerian student experience, from the ground up.
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
              Our Nigerian AI voices aren't just text-to-speech — they carry rhythm, warmth, and familiarity.
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
              <img src="/images/Jackpals Logo 2 1.png" alt="" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
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
          <a href="#final-cta">Join Free Waitlist</a>
        </article>

        <article className="jp-price-card featured">
          <div className="jp-ribbon">MOST POPULAR</div>
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
          <a href="#final-cta">Get Early Access</a>
        </article>
      </div>
    </section>
  );
}

function ReferralAndFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="jp-faq-band" id="faq">
      <div className="jp-referral">
        <div className="jp-referral-actions">
          <CtaButton href="#final-cta" variant="dark">Spread the word</CtaButton>
          <CtaButton href="#final-cta">Share Jackpals</CtaButton>
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

function FinalCta() {
  return (
    <section className="jp-final" id="final-cta">
      <img className="jp-final-bg" src="/images/,.m., 1.png" alt="" aria-hidden="true" />
      <div className="jp-final-shade" />
      <div className="jp-container jp-final-grid">
        <div>
          <h2>Your next exam deserves better than <span>all-night reading sessions.</span></h2>
          <p>Join thousands of Nigerian students already on the waitlist.</p>
          <div className="jp-actions">
            <CtaButton>Join the Waitlist</CtaButton>
            <CtaButton href="#how-it-works" variant="ghost">Learn More</CtaButton>
          </div>
          <small>Launching Q2 2026 · ₦1,000/month after launch · No credit card required</small>
        </div>
        <div className="jp-final-logo">
          <Image src="/images/Jackpals Logo 2 1(1).png" alt="Jackpals" width={226} height={164} />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const groups = [
    ["PRODUCT", "How It Works", "Voices", "Features", "Pricing", "Waitlist"],
    ["COMPANY", "About", "Blog", "Career", "Contact"],
    ["LEGAL", "Privacy Policy", "Term of Use", "Cookie Policy"],
  ];

  return (
    <footer className="jp-footer">
      <div className="jp-container jp-footer-grid">
        <div>
          <Image src="/images/Jackpals Logo 3 1.png" alt="Jackpals" width={252} height={57} />
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
        <div>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </footer>
  );
}

export function FigmaLanding() {
  return (
    <div className="jp-landing">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <Reality />
        <HowItWorks />
        <Features />
        <Conditions />
        <Pricing />
        <ReferralAndFaq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
