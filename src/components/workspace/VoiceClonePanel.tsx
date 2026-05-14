"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic2, Upload, Sparkles, Fingerprint, Play, Trash2, Volume2 } from "lucide-react";
import {
  getVoiceCapabilities,
  listVoiceClones,
  registerVoiceClone,
  synthesizeVoiceClone,
  type VoiceCapabilities,
  type VoiceClone,
} from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Voice Studio — Advanced VoxCPM management.
 * Supports:
 *  - Zero-shot / Ultimate Cloning
 *  - Voice Design (text prompt)
 *  - Voice Library management
 */
export function VoiceClonePanel() {
  const [caps, setCaps] = useState<VoiceCapabilities | null>(null);
  const [clones, setClones] = useState<VoiceClone[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  
  // Tabs: 'register' | 'design' | 'preview' | 'library'
  const [activeTab, setActiveTab] = useState<"register" | "design" | "preview" | "library">("register");

  // Register State
  const [voiceKey, setVoiceKey] = useState("");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Design State
  const [designPrompt, setDesignPrompt] = useState("Warm Nigerian English female narrator, clear and confident, natural pacing.");
  const [designText, setDesignText] = useState("Hello, I am the voice you just designed. How do I sound?");

  // Preview State
  const [testVoiceKey, setTestVoiceKey] = useState("");
  const [testText, setTestText] = useState("Hello — this is a quick preview of your cloned voice.");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [c, v] = await Promise.all([getVoiceCapabilities(), listVoiceClones().catch(() => [])]);
      setCaps(c);
      setClones(v);
      if (!testVoiceKey && v.length > 0) setTestVoiceKey(v[0].voice_key);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not load voice tools.");
    } finally {
      setLoading(false);
    }
  }, [testVoiceKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleRegister() {
    const key = voiceKey.trim();
    if (!key || !file) {
      setErr("Enter a voice key and choose a WAV file.");
      return;
    }
    setBusy("Registering voice...");
    setErr("");
    try {
      await registerVoiceClone(key, file, transcript.trim() || undefined);
      setVoiceKey("");
      setTranscript("");
      setFile(null);
      await load();
      setActiveTab("library");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setBusy("");
    }
  }

  async function handleDesign() {
    if (!designPrompt.trim() || !designText.trim()) {
      setErr("Enter both a description and some text to speak.");
      return;
    }
    setBusy("Designing voice...");
    setErr("");
    try {
      const blob = await synthesizeVoiceClone({ 
        text: designText.trim(), 
        prompt_text: designPrompt.trim() 
      });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      queueMicrotask(() => previewRef.current?.play().catch(() => {}));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Design failed.");
    } finally {
      setBusy("");
    }
  }

  async function handlePreview() {
    const key = testVoiceKey.trim();
    if (!key || !testText.trim()) {
      setErr("Choose a voice and enter text to synthesize.");
      return;
    }
    setBusy("Synthesizing...");
    setErr("");
    try {
      const blob = await synthesizeVoiceClone({ text: testText.trim(), voice_key: key });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      queueMicrotask(() => previewRef.current?.play().catch(() => {}));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Synthesis failed.");
    } finally {
      setBusy("");
    }
  }

  const renderTabButton = (id: typeof activeTab, label: string, Icon: any) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
        activeTab === id ? "text-white shadow-lg" : "text-[var(--text-3)] hover:text-[var(--text-1)]"
      )}
      style={{ background: activeTab === id ? "var(--blue)" : "transparent" }}
    >
      <Icon size={14} />
      {label}
    </button>
  );

  return (
    <section
      className={cn("studio studio-glass studio-glass-interactive rounded-2xl p-4 sm:p-5 space-y-6")}
      aria-labelledby="voice-studio-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="voice-studio-heading" className="text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: "var(--text-3)" }}>
            <Mic2 size={14} aria-hidden />
            Voice Studio (VoxCPM2)
          </h3>
          <p className="text-[12px] mt-1 max-w-xl" style={{ color: "var(--text-2)" }}>
            Advanced Nigerian-anchored voice synthesis. Clone a real voice or design a new one from a description.
          </p>
        </div>
        {loading && <Loader2 className="animate-spin shrink-0" size={18} style={{ color: "var(--text-3)" }} aria-hidden />}
      </div>

      <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/5">
        {renderTabButton("register", "Clone Voice", Fingerprint)}
        {renderTabButton("design", "Voice Design", Sparkles)}
        {renderTabButton("preview", "Preview", Play)}
        {renderTabButton("library", `Library (${clones.length})`, Volume2)}
      </div>

      {(err || busy) && (
        <div
          className="rounded-xl px-4 py-3 text-[12px] animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            background: err ? "rgba(248,113,113,0.08)" : "var(--surface-2)",
            border: `1px solid ${err ? "rgba(248,113,113,0.35)" : "var(--border)"}`,
            color: err ? "#fecaca" : "var(--text-1)",
          }}
          role={err ? "alert" : "status"}
          aria-live={err ? "assertive" : "polite"}
        >
          {err || busy}
        </div>
      )}

      {caps && !caps.cloning_available && !loading && (
        <p className="text-[12px] rounded-xl px-4 py-3 studio-glass-inset" style={{ color: "var(--text-3)" }}>
          Cloning is not available on this server ({caps.engine}). Tools stay visible for reference.
        </p>
      )}

      <div className="min-h-[320px]">
        {activeTab === "register" && (
          <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                Identity & Sample
              </div>
              <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                Voice Name / Key
                <input
                  value={voiceKey}
                  onChange={(e) => setVoiceKey(e.target.value)}
                  placeholder="e.g., Prof_Tunde"
                  className="rounded-xl px-4 py-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              </label>
              <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                <span className="flex items-center gap-2">
                  <Upload size={14} />
                  Reference WAV (Clean audio)
                </span>
                <input
                  type="file"
                  accept=".wav,audio/wav"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="text-[12px] mt-1 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-[var(--surface-3)] file:text-[var(--text-2)] hover:file:bg-[var(--surface-4)]"
                  style={{ color: "var(--text-2)" }}
                />
              </label>
            </div>
            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                Ultimate Cloning (Optional)
              </div>
              <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                Transcript of Sample
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={5}
                  placeholder="Providing the exact words spoken in the WAV dramatically improves cloning accuracy."
                  className="rounded-xl px-4 py-3 text-[13px] outline-none resize-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              </label>
              <button
                type="button"
                onClick={() => void handleRegister()}
                disabled={!!busy || !caps?.cloning_available || !file || !voiceKey}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50 shadow-xl transition-all active:scale-95"
                style={{ background: "var(--blue)" }}
              >
                {busy.includes("Registering") ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />}
                Register Clone
              </button>
            </div>
          </div>
        )}

        {activeTab === "design" && (
          <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                Describe the Voice
              </div>
              <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                Narrative Prompt
                <textarea
                  value={designPrompt}
                  onChange={(e) => setDesignPrompt(e.target.value)}
                  rows={4}
                  className="rounded-xl px-4 py-3 text-[13px] outline-none resize-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              </label>
              <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                Tip: Mention gender, accent (Nigerian English), age, and tone.
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                Test Synthesis
              </div>
              <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                Test Text
                <textarea
                  value={designText}
                  onChange={(e) => setDesignText(e.target.value)}
                  rows={4}
                  className="rounded-xl px-4 py-3 text-[13px] outline-none resize-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              </label>
              <button
                type="button"
                onClick={() => void handleDesign()}
                disabled={!!busy}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-50 shadow-xl transition-all active:scale-95"
                style={{ background: "var(--teal)" }}
              >
                {busy.includes("Designing") ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate Design
              </button>
            </div>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                Select Voice
                <select
                  value={testVoiceKey}
                  onChange={(e) => setTestVoiceKey(e.target.value)}
                  className="rounded-xl px-4 py-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] cursor-pointer"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                >
                  <option value="">Choose a registered voice...</option>
                  {clones.map((v) => (
                    <option key={v.voice_key} value={v.voice_key}>{v.voice_key}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                Text to Speak
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={4}
                  className="rounded-xl px-4 py-3 text-[13px] outline-none resize-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
                />
              </label>
              <button
                type="button"
                onClick={() => void handlePreview()}
                disabled={!!busy || !testVoiceKey}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl text-[11px] font-bold uppercase tracking-widest focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] disabled:opacity-50 transition-all border border-white/10 hover:bg-white/5 active:scale-95"
                style={{ color: "var(--text-1)" }}
              >
                {busy.includes("Synthesizing") ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Run Synthesis
              </button>
              {previewUrl && (
                <div className="pt-2 animate-in slide-in-from-bottom-4 duration-500">
                  <audio ref={previewRef} src={previewUrl} controls className="w-full h-10 rounded-lg shadow-inner" />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "library" && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {!loading && clones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-60">
                <Volume2 size={40} className="stroke-1" />
                <p className="text-[13px]">No cloned voices yet.</p>
                <button onClick={() => setActiveTab('register')} className="text-[11px] font-bold uppercase text-[var(--blue)] hover:underline">
                  Create your first clone
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {clones.map((v) => (
                  <div
                    key={v.voice_key}
                    className="flex flex-col justify-between p-4 rounded-2xl studio-glass-inset group"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-mono text-[13px] font-bold truncate pr-2" style={{ color: "var(--text-1)" }}>
                        {v.voice_key}
                      </div>
                      {v.has_transcript && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-[var(--teal-dim)] text-[var(--teal)] text-[8px] font-black uppercase">
                          HQ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                      <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                        {Math.round(v.size / 1024)} KB
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setTestVoiceKey(v.voice_key); setActiveTab('preview'); }}
                          className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-2)] transition-colors"
                          title="Use in preview"
                        >
                          <Play size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
