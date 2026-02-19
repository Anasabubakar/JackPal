'use client';

import { 
  Play, 
  Download, 
  Upload, 
  Headphones, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Clock,
  Smartphone,
  Menu,
  X,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";
import { useState, useEffect } from "react";

const features = [
  {
    icon: Upload,
    title: "Ghost your textbooks.",
    desc: "Import PDFs or paste text and never look at a screen again. We extract the value, you just press play."
  },
  {
    icon: Zap,
    title: "Study at 2x speed.",
    desc: "Our AI narration is so clean you can double the speed and still catch every detail. Cut study time in half."
  },
  {
    icon: Download,
    title: "Zero-data library.",
    desc: "Download once, listen forever. Even on a bus with no bars, your grades never stop climbing."
  }
];

const stats = [
  { label: "Waitlist Spots", value: "Available" },
  { label: "Launch Window", value: "End of Q1 2026" },
  { label: "Beta Testing", value: "Incoming" },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setMobileMenuOpen(false);
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setWaitlistOpen(false);
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] text-[#111111]">
      {/* Waitlist Modal */}
      {waitlistOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm" onClick={() => setWaitlistOpen(false)} />
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] border-4 border-[#B1121B] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
            {submitted ? (
              <div className="p-12 text-center space-y-6 text-[#111111]">
                <div className="bg-[#B1121B]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-[#B1121B]" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">You're on the list!</h3>
                <p className="font-bold text-[#111111]/60">We've received your feedback. You'll be the first to know when we go live.</p>
              </div>
            ) : (
              <div className="max-h-[90vh] overflow-y-auto p-8 md:p-10 text-[#111111]">
                <button 
                  onClick={() => setWaitlistOpen(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-[#F7F7F7] rounded-full transition-colors text-[#111111]"
                >
                  <X className="h-6 w-6" />
                </button>
                
                <div className="mb-8">
                  <div className="inline-block bg-[#B1121B]/10 text-[#B1121B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                    Exclusive Beta Access
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Join the Top 1%</h3>
                  <p className="mt-2 font-bold text-[#111111]/50 text-sm italic">Help us build the ultimate unfair advantage.</p>
                </div>

                <form onSubmit={handleWaitlistSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 px-1">Full Name</label>
                      <input required type="text" className="w-full bg-[#F7F7F7] border-2 border-[#EFEFEF] rounded-2xl px-4 py-3 font-bold focus:outline-none focus:border-[#B1121B] transition-colors text-[#111111]" placeholder="Anas Abubakar" />
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 px-1">Student Email</label>
                      <input required type="email" className="w-full bg-[#F7F7F7] border-2 border-[#EFEFEF] rounded-2xl px-4 py-3 font-bold focus:outline-none focus:border-[#B1121B] transition-colors text-[#111111]" placeholder="anas@uni.edu" />
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 px-1">Level of Study</label>
                    <select className="w-full bg-[#F7F7F7] border-2 border-[#EFEFEF] rounded-2xl px-4 py-3 font-bold focus:outline-none focus:border-[#B1121B] transition-colors appearance-none text-[#111111]">
                      <option>Undergraduate</option>
                      <option>Postgraduate (Masters/PhD)</option>
                      <option>Professional Exams (Law/Med/Tech)</option>
                      <option>Secondary School</option>
                    </select>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 px-1">What features do you want to see on JackPal?</label>
                    <textarea required className="w-full bg-[#F7F7F7] border-2 border-[#EFEFEF] rounded-2xl px-4 py-3 font-bold focus:outline-none focus:border-[#B1121B] transition-colors min-h-[100px] text-[#111111]" placeholder="Tell us your dream study tool..." />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 px-1">What's your biggest study pain point right now?</label>
                    <input type="text" className="w-full bg-[#F7F7F7] border-2 border-[#EFEFEF] rounded-2xl px-4 py-3 font-bold focus:outline-none focus:border-[#B1121B] transition-colors text-[#111111]" placeholder="Reading fatigue, lack of time, etc." />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 px-1">How do you currently study?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Physical Books", "PDFs/Screens", "Audio/Podcasts", "Flashcards"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 bg-[#F7F7F7] p-3 rounded-xl border border-[#EFEFEF] cursor-pointer hover:border-[#B1121B] transition-colors">
                          <input type="checkbox" className="accent-[#B1121B]" />
                          <span className="text-[10px] font-bold uppercase">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button className="w-full bg-[#B1121B] text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-[#B1121B]/20 hover:bg-[#111111] transition-all transform active:scale-95">
                    Claim My Unfair Advantage
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b ${
          scrolled 
            ? "bg-[#F7F7F7]/90 backdrop-blur-xl py-3 border-[#EFEFEF] shadow-lg" 
            : "bg-transparent py-6 border-transparent"
        }`}
      >
        <div className="section-container flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-[#B1121B] p-1.5 rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-[#B1121B]/20">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">JackPal</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-8 text-xs font-black uppercase tracking-widest text-[#111111]/60">
              <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-[#B1121B] transition-colors">Features</a>
              <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-[#B1121B] transition-colors">Pricing</a>
              <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="hover:text-[#B1121B] transition-colors">FAQ</a>
            </div>
            <div className="h-4 w-[1px] bg-[#111111]/10" />
            <div className="flex items-center gap-6">
              <button className="text-xs font-black uppercase tracking-widest hover:text-[#B1121B] transition-colors">Log in</button>
              <button 
                onClick={() => setWaitlistOpen(true)}
                className="bg-[#B1121B] text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#111111] transition-all shadow-xl shadow-[#B1121B]/20 active:scale-95"
              >
                Join Waitlist
              </button>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-[#111111] hover:bg-[#EFEFEF] rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-full left-0 right-0 bg-[#F7F7F7] border-b border-[#EFEFEF] transition-all duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen ? "max-h-[400px] py-8 shadow-2xl opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="section-container flex flex-col gap-6 text-center">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-sm font-black uppercase tracking-widest hover:text-[#B1121B]">Features</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-sm font-black uppercase tracking-widest hover:text-[#B1121B]">Pricing</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-sm font-black uppercase tracking-widest hover:text-[#B1121B]">FAQ</a>
            <div className="h-[1px] bg-[#111111]/5 w-full" />
            <button className="text-sm font-black uppercase tracking-widest text-[#B1121B] py-2">Log in</button>
            <button 
              onClick={() => setWaitlistOpen(true)}
              className="bg-[#B1121B] text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-[#B1121B]/20 hover:bg-[#111111] transition-colors"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-40 pb-32 overflow-hidden">
          <div className="section-container">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
              <div className="space-y-8 relative z-10">
                <div className="inline-flex items-center gap-2 bg-[#B1121B]/10 text-[#B1121B] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B1121B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B1121B]"></span>
                  </span>
                  Coming Soon to Elite Students
                </div>
                <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight">
                  Study while you live.<br />
                  <span className="text-[#B1121B] italic underline decoration-4 underline-offset-8">Win while they sleep.</span>
                </h1>
                <p className="text-xl text-[#111111]/70 max-w-xl leading-relaxed font-medium">
                  Stop grinding through textbooks like it's 1999. Join the first wave of students who will use JackPal to ghost their readings and finish 10 hours of study on a 30-minute walk.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    onClick={() => setWaitlistOpen(true)}
                    className="bg-[#B1121B] text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl shadow-[#B1121B]/20 hover:bg-[#E10600] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Join the Waitlist Now <ArrowRight className="h-5 w-5" />
                  </button>
                  <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="bg-white border-2 border-[#111111] text-[#111111] px-8 py-4 rounded-full text-lg font-bold hover:bg-[#EFEFEF] transition-colors flex items-center justify-center gap-2 text-center">
                    How it Works
                  </a>
                </div>
                <div className="flex flex-col gap-6 pt-8 border-t border-[#EFEFEF]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest">
                      <span className="text-[#B1121B]">Launch Readiness</span>
                      <span className="text-[#111111]">80%</span>
                    </div>
                    <div className="h-3 bg-[#EFEFEF] rounded-full w-full overflow-hidden relative border border-[#111111]/5">
                      <div className="h-full bg-[#B1121B] animate-loading-bar rounded-full relative overflow-hidden shadow-[0_0_15px_rgba(177,18,27,0.3)]">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ width: '200%' }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-[#111111]/50 uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-[#B1121B]" /> Core Engine</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-[#B1121B]" /> Security DRM</span>
                      <span className="flex items-center gap-1 animate-pulse"><Clock className="h-3 w-3" /> UI Polish</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-10 pt-2">
                    {stats.map((stat) => (
                      <div key={stat.label}>
                        <div className="text-3xl font-black text-[#111111]">{stat.value}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-[#111111]/50">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative">
                {/* Visual Representation of Player */}
                <div className="relative bg-white rounded-[2rem] border-4 border-[#111111] p-8 audio-card-shadow max-w-md mx-auto transform lg:rotate-2 z-10">
                  {/* Floating Trust Toast */}
                  <div className="absolute -top-12 -left-12 bg-[#111111] text-white p-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#B1121B]">
                    <div className="bg-[#B1121B] h-8 w-8 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm">JP</div>
                    <div className="text-[10px] font-bold leading-none">
                      JackPal Beta<br />
                      <span className="text-[#B1121B]">On the way</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-8">
                    <div className="bg-[#EFEFEF] h-10 w-10 rounded-full flex items-center justify-center">
                      <Headphones className="h-5 w-5 text-[#B1121B]" />
                    </div>
                    <div className="bg-[#B1121B]/10 text-[#B1121B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-[#B1121B]/20 shadow-sm flex items-center gap-1.5">
                      <div className="h-1 w-1 bg-[#B1121B] rounded-full animate-ping" />
                      Unfair Advantage Active
                    </div>
                  </div>
                  
                  <div className="mb-6 p-4 rounded-2xl bg-[#EFEFEF] border border-[#111111]/10 text-[10px] font-black flex items-center justify-between">
                     <span className="uppercase text-[#111111]/50 tracking-widest">Top 1% Achievement</span>
                     <span className="text-[#B1121B] bg-[#B1121B]/10 px-2 py-0.5 rounded-full border border-[#B1121B]/20">+450 XP Earned</span>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="h-2 bg-[#EFEFEF] rounded-full w-full overflow-hidden relative">
                        <div className="h-full bg-[#B1121B] animate-loading-bar rounded-full relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ width: '200%' }} />
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] font-black text-[#111111]/50 uppercase tracking-widest">
                        <span>12:45</span>
                        <span>18:30</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-black tracking-tight text-[#111111]">Biology 101: Cell Theory</h3>
                      <p className="text-[#111111]/60 font-bold uppercase text-[10px] tracking-widest">Chapter 4 — The Nucleus</p>
                    </div>

                    <div className="flex items-center justify-center gap-8 py-4">
                      <div className="h-10 w-10 flex items-center justify-center text-[#111111] hover:text-[#B1121B] transition-colors cursor-pointer">
                        <Clock className="h-6 w-6" />
                      </div>
                      <div className="h-16 w-16 bg-[#B1121B] rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-[#E10600] hover:scale-110 transition-all cursor-pointer border-4 border-[#111111]">
                        <Play className="h-8 w-8 fill-current ml-1" />
                      </div>
                      <div className="h-10 w-10 flex items-center justify-center text-[#111111] hover:text-[#B1121B] transition-colors cursor-pointer">
                        <Download className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1 h-12">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div 
                          key={i} 
                          className={`w-1.5 rounded-full bg-[#B1121B]/40 animate-wave wave-delay-${i % 4 + 1}`} 
                          style={{ height: `${Math.random() * 60 + 40}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Background Blobs */}
                <div className="absolute -top-20 -right-20 h-64 w-64 bg-[#B1121B]/5 rounded-full blur-3xl z-0 animate-pulse" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 bg-[#B1121B]/5 rounded-full blur-3xl z-0" />
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section id="pricing" className="py-32 bg-[#EFEFEF]">
          <div className="section-container">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl font-black tracking-tight uppercase">The difference between "Trying" and <span className="text-[#B1121B]">"Winning".</span></h2>
              <p className="text-lg text-[#111111]/70 font-medium">
                Don't be the student stuck in the library at 2 AM. Join the elite who study on their own terms.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Them */}
              <div className="bg-white p-10 rounded-[2.5rem] border border-[#E5E5E5] opacity-80 transition-all">
                <h3 className="text-xl font-black mb-8 flex items-center gap-2 text-[#111111]/70 uppercase tracking-widest">
                  <div className="h-2 w-2 rounded-full bg-[#111111]/70" /> Average Students
                </h3>
                <ul className="space-y-6">
                  {[
                    "Stuck at a desk for 6+ hours",
                    "Chronic eye strain from blue light",
                    "Zero progress during commutes",
                    "Forgetting 70% of what they read",
                    "Constant burnout and fatigue"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-bold text-[#111111]/60 line-through">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* You */}
              <div className="bg-[#111111] text-white p-10 rounded-[2.5rem] border-4 border-[#B1121B] shadow-2xl shadow-[#B1121B]/20 relative overflow-hidden group">
                <div className="absolute top-4 right-4 bg-[#B1121B] text-white text-[10px] font-black uppercase px-2 py-1 rounded-md animate-pulse">
                  Unfair Advantage
                </div>
                <h3 className="text-xl font-black mb-8 flex items-center gap-2 text-[#B1121B] uppercase tracking-widest">
                  <div className="h-2 w-2 rounded-full bg-[#B1121B]" /> JackPal Users
                </h3>
                <ul className="space-y-6">
                  {[
                    "Study at 2x speed while walking",
                    "Zero screen time required",
                    "Convert dead time into Dean's List",
                    "Listen anywhere, fully offline",
                    "Reclaim 20+ hours every week"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-black">
                      <CheckCircle2 className="h-5 w-5 text-[#B1121B]" /> {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-12 p-4 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold text-white/50 group-hover:bg-[#B1121B]/10 transition-colors italic">
                   "It feels like I'm cheating, but my grades are the highest they've ever been." — Sarah J.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 bg-white">
          <div className="section-container">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl font-black tracking-tight text-balance italic underline decoration-[#B1121B]/30 decoration-4">The study system that feels like a cheat code.</h2>
              <p className="text-lg text-[#111111]/60 font-medium">
                We didn't build just another reading app. We built a dedicated audio ecosystem for your academic success.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="p-8 rounded-[2rem] border-2 border-[#EFEFEF] bg-[#F7F7F7] hover:border-[#B1121B]/50 transition-all group">
                  <div className="bg-white p-4 rounded-2xl w-fit mb-6 group-hover:bg-[#B1121B]/10 shadow-sm transition-colors border border-[#EFEFEF]">
                    <feature.icon className="h-8 w-8 text-[#111111] group-hover:text-[#B1121B] transition-colors" />
                  </div>
                  <h3 className="text-xl font-black mb-3 uppercase tracking-tight">{feature.title}</h3>
                  <p className="text-[#111111]/60 leading-relaxed font-bold text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Offline Detail */}
        <section className="py-32 overflow-hidden bg-white">
          <div className="section-container">
            <div className="bg-[#111111] rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden border-b-8 border-[#B1121B] shadow-2xl">
              <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10 text-left">
                <div className="space-y-8">
                  <h2 className="text-4xl md:text-5xl font-black leading-tight underline decoration-[#B1121B] decoration-8 underline-offset-8 !text-white">The app that stays with you, even where the signal dies.</h2>
                  <p className="text-lg text-white/60 leading-relaxed font-bold">
                    Most apps require a constant connection. JackPal downloads your library locally with built-in encryption, giving you access to your studies in the most remote locations.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Military-grade local encryption",
                      "Zero-data background downloads",
                      "Optimized for budget Android devices",
                      "Battery-efficient playback"
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 font-black text-sm uppercase tracking-wide">
                        <CheckCircle2 className="h-5 w-5 text-[#B1121B]" /> {item}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => setWaitlistOpen(true)}
                    className="bg-[#B1121B] text-white px-8 py-4 rounded-full text-lg font-black hover:bg-[#E10600] transition-all shadow-xl shadow-[#B1121B]/20"
                  >
                    Join the Waitlist
                  </button>
                </div>
                <div className="relative flex justify-center lg:justify-end">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] w-full max-w-xs shadow-2xl">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-6 w-6 text-[#B1121B]" />
                        <span className="font-black uppercase tracking-widest text-xs">Device Authorized</span>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-[#B1121B]">Downloaded</span>
                            <ShieldCheck className="h-4 w-4 text-[#B1121B]" />
                          </div>
                          <div className="text-xs font-bold truncate">Physics_Final_Review.mp3</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 opacity-50">
                          <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase tracking-tighter">
                            <span>In Progress</span>
                            <span>45%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full">
                            <div className="h-full bg-[#B1121B] w-[45%] rounded-full shadow-[0_0_8px_#B1121B]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative Circle */}
              <div className="absolute -top-40 -right-40 h-80 w-80 border-[40px] border-white/5 rounded-full" />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 bg-white relative overflow-hidden">
          <div className="section-container relative z-10 blur-lg select-none pointer-events-none opacity-50 text-[#111111]">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl font-black tracking-tight text-balance uppercase leading-[0.9]">Invest in your grades for <span className="text-[#B1121B]">an affordable price.</span></h2>
              <p className="text-lg text-[#111111]/60 font-bold">
                Affordable plans designed for real student budgets. Start free, upgrade when you need to.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-left">
              {[
                { 
                  name: "Free", 
                  price: "FREE", 
                  unit: "",
                  desc: "Perfect for light study",
                  perks: ["30 mins/month", "Standard voices", "In-app player", "Basic extraction"],
                  cta: "Current Plan",
                  highlight: false
                },
                { 
                  name: "Student Monthly", 
                  price: "TBA", 
                  unit: "/mo",
                  desc: "Most popular for exams",
                  perks: ["Unlimited minutes", "Premium voices", "Offline downloads", "DRM protection", "Priority support"],
                  cta: "Get Started",
                  highlight: true
                },
                { 
                  name: "Student Annual", 
                  price: "TBA", 
                  unit: "/yr",
                  desc: "Save on yearly billing",
                  perks: ["Everything in Monthly", "2 months free", "Beta feature access", "Study analytics"],
                  cta: "Go Yearly",
                  highlight: false
                }
              ].map((plan) => (
                <div 
                  key={plan.name} 
                  className={`p-10 rounded-[2.5rem] border-2 ${plan.highlight ? 'border-[#B1121B] bg-[#B1121B]/5 shadow-2xl shadow-[#B1121B]/10 scale-105 z-10' : 'border-[#EFEFEF] bg-[#F7F7F7]'} flex flex-col transition-all hover:scale-105`}
                >
                  <div className="mb-8">
                    <h3 className="text-sm font-black mb-2 uppercase tracking-[0.2em] text-[#111111]/40">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-tighter text-[#111111]">{plan.price}</span>
                      <span className="text-[#111111]/40 font-bold text-sm">{plan.unit}</span>
                    </div>
                    <p className="mt-4 text-[#111111]/70 text-sm font-bold">{plan.desc}</p>
                  </div>
                  <div className="flex-1 space-y-4 mb-10 border-t border-[#111111]/10 pt-8">
                    {plan.perks.map((perk) => (
                      <div key={perk} className="flex items-center gap-3 text-xs font-black uppercase tracking-tight">
                        <CheckCircle2 className={`h-4 w-4 ${plan.highlight ? 'text-[#B1121B]' : 'text-[#111111]/30'}`} />
                        {perk}
                      </div>
                    ))}
                  </div>
                  <button className={`w-full py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all ${plan.highlight ? 'bg-[#B1121B] text-white shadow-xl shadow-[#B1121B]/30 hover:bg-[#E10600]' : 'bg-[#111111] text-white hover:bg-[#B1121B]'}`}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Overlay Badge */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="bg-[#111111] text-white px-12 py-6 rounded-[2rem] border-4 border-[#B1121B] shadow-2xl rotate-3 flex flex-col items-center gap-2">
              <span className="text-3xl font-black uppercase tracking-tighter">Coming Soon</span>
              <span className="text-xs font-bold text-[#B1121B] uppercase tracking-[0.2em]">Regional pricing incoming</span>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 bg-[#F7F7F7]">
          <div className="section-container">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl font-black tracking-tight uppercase leading-[0.9]">The FAQ for students who <span className="text-[#B1121B]">want to win.</span></h2>
              <p className="text-lg text-[#111111]/60 font-bold">
                Still on the fence? Here's why you can't afford to wait.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                { 
                  q: "Will my grades actually improve?", 
                  a: "JackPal is designed to leverage multi-modal learning. By listening while you're active, you can increase retention and master your materials faster than traditional reading alone."
                },
                { 
                  q: "What if my signal drops mid-study?", 
                  a: "That's exactly why we built JackPal. Your library is locally encrypted. You could be in a nuclear bunker and still listen to your notes."
                },
                { 
                  q: "Is it affordable for my budget?", 
                  a: "JackPal is designed to be affordable for any student budget. The value of reclaiming dozens of study hours every month far outweighs the modest cost of the subscription."
                },
                { 
                  q: "Can I cancel anytime?", 
                  a: "Of course. No locked contracts. We're building this for students, by students, so your flexibility is our priority."
                }
              ].map((item) => (
                <div key={item.q} className="p-8 rounded-[2rem] border-2 border-[#EFEFEF] bg-white hover:border-[#B1121B]/30 transition-all group">
                  <h3 className="text-lg font-black mb-3 uppercase tracking-tight group-hover:text-[#B1121B] transition-colors">{item.q}</h3>
                  <p className="text-[#111111]/60 leading-relaxed text-sm font-bold">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-white">
          <div className="section-container text-center space-y-12">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter max-w-4xl mx-auto leading-[0.9] uppercase text-[#111111]">
              The secret weapon of <br />
              <span className="text-[#B1121B] italic underline decoration-8 decoration-[#B1121B]/20">the Top 1%.</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => setWaitlistOpen(true)}
                className="bg-[#B1121B] text-white px-10 py-5 rounded-full text-xl font-black uppercase tracking-widest shadow-2xl shadow-[#B1121B]/30 hover:bg-[#E10600] hover:scale-105 transition-all"
              >
                Get Early Access
              </button>
              <button 
                onClick={() => setWaitlistOpen(true)}
                className="text-lg font-black uppercase tracking-widest px-10 py-5 hover:text-[#B1121B] transition-colors flex items-center gap-2 group text-[#111111]"
              >
                Join the exclusive beta <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#111111] text-white pt-20 pb-10 border-t border-[#B1121B]/20">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-[#B1121B] p-1.5 rounded-lg shadow-lg shadow-[#B1121B]/20">
                  <Headphones className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tighter uppercase italic">JackPal</span>
              </div>
              <p className="text-white/50 text-sm font-bold leading-relaxed">
                The unfair study advantage for the top 1% of students. Turn your dead time into Dean's List results.
              </p>
              <div className="flex gap-4">
                <a href="#" className="h-10 w-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-[#B1121B] hover:border-[#B1121B] transition-all group">
                  <span className="sr-only">Twitter</span>
                  <Twitter className="h-4 w-4 text-white/50 group-hover:text-white" />
                </a>
                <a href="#" className="h-10 w-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-[#B1121B] hover:border-[#B1121B] transition-all group">
                  <span className="sr-only">Instagram</span>
                  <Instagram className="h-4 w-4 text-white/50 group-hover:text-white" />
                </a>
                <a href="#" className="h-10 w-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-[#B1121B] hover:border-[#B1121B] transition-all group">
                  <span className="sr-only">LinkedIn</span>
                  <Linkedin className="h-4 w-4 text-white/50 group-hover:text-white" />
                </a>
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#B1121B] mb-6">Product</h4>
              <ul className="space-y-4 text-sm font-bold text-white/60">
                <li><a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-white transition-colors">AI Engine</a></li>
                <li><a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-white transition-colors">Offline Mode</a></li>
                <li><button onClick={() => setWaitlistOpen(true)} className="hover:text-white transition-colors">Waitlist Beta</button></li>
                <li><a href="#" className="hover:text-white transition-colors">DRM Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#B1121B] mb-6">Company</h4>
              <ul className="space-y-4 text-sm font-bold text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Student Stories</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div className="bg-white/10 p-8 rounded-3xl border border-white/20 space-y-4 text-left shadow-2xl">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">Newsletter</h4>
              <p className="text-xs font-bold text-white/70 leading-relaxed">
                Get study hacks and launch updates. No spam, just value.
              </p>
              <div className="flex flex-col gap-2">
                <input 
                  type="email" 
                  placeholder="Your student email" 
                  className="bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#B1121B] transition-colors text-white"
                />
                <button className="bg-[#B1121B] text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#E10600] transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:row justify-between items-center gap-6">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
              &copy; 2026 JackPal Audio. Built for Winners.
            </p>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-white/40">
              <a href="#" className="hover:text-[#B1121B] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#B1121B] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#B1121B] transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}