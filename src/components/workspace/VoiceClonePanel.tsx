"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic2, Upload } from "lucide-react";
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
 * Local VoxCPM / voice-clone management surfaced on the dashboard (not backend-only).
 */
export function VoiceClonePanel() {
  const [caps, setCaps] = useState<VoiceCapabilities | null>(null);
  const [clones, setClones] = useState<VoiceClone[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [voiceKey, setVoiceKey] = useState("");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [testText, setTestText] = useState("Hello — this is a quick preview of your cloned voice.");
  const [testVoiceKey, setTestVoiceKey] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [c, v] = await Promise.all([getVoiceCapabilities(), listVoiceClones().catch(() => [])]);
      setCaps(c);
      setClones(v);
      setTestVoiceKey((prev) => (prev.trim() ? prev : v[0]?.voice_key ?? ""));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not load voice tools.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    setBusy("Uploading sample…");
    setErr("");
    try {
      await registerVoiceClone(key, file, transcript.trim() || undefined);
      setVoiceKey("");
      setTranscript("");
      setFile(null);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Registration failed.");
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
    setBusy("Synthesizing…");
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

  return (
    <section
      className={cn("studio studio-glass studio-glass-interactive rounded-2xl p-4 sm:p-5 space-y-4")}
      aria-labelledby="voice-clone-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="voice-clone-heading" className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: "var(--text-3)" }}>
            <Mic2 size={14} aria-hidden />
            Voice clone (VoxCPM)
          </h3>
          <p className="text-[12px] mt-1 max-w-xl" style={{ color: "var(--text-2)" }}>
            Register a short WAV sample, then preview synthesis. Requires local voice service availability.
          </p>
        </div>
        {loading && <Loader2 className="animate-spin shrink-0" size={18} style={{ color: "var(--text-3)" }} aria-hidden />}
      </div>

      {(err || busy) && (
        <div
          className="rounded-xl px-3 py-2 text-[11px]"
          style={{
            background: err ? "rgba(248,113,113,0.08)" : "var(--surface-2)",
            border: `1px solid ${err ? "rgba(248,113,113,0.35)" : "var(--border)"}`,
            color: err ? "#fecaca" : "var(--text-2)",
          }}
          role={err ? "alert" : "status"}
          aria-live={err ? "assertive" : "polite"}
        >
          {err || busy}
        </div>
      )}

      {caps && !caps.cloning_available && !loading && (
        <p className="text-[12px] rounded-xl px-3 py-2 studio-glass-inset" style={{ color: "var(--text-3)" }}>
          Cloning is not available on this server ({caps.engine}). Tooling stays visible for when the backend enables it.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="studio-glass-inset rounded-xl p-4 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Register sample
          </div>
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
            Voice key
            <input
              value={voiceKey}
              onChange={(e) => setVoiceKey(e.target.value)}
              placeholder="my_voice_01"
              className="rounded-lg px-3 py-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            />
          </label>
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
            Transcript (optional, improves quality)
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={2}
              className="rounded-lg px-3 py-2 text-[12px] outline-none resize-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            />
          </label>
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
            <span className="inline-flex items-center gap-1.5">
              <Upload size={12} aria-hidden />
              WAV audio
            </span>
            <input
              type="file"
              accept=".wav,audio/wav"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-[12px]"
              style={{ color: "var(--text-2)" }}
            />
          </label>
          <button
            type="button"
            onClick={() => void handleRegister()}
            disabled={!!busy || !caps?.cloning_available}
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-50"
            style={{ background: "var(--blue)" }}
          >
            {busy === "Uploading sample…" ? <Loader2 size={14} className="animate-spin" /> : null}
            Register
          </button>
        </div>

        <div className="studio-glass-inset rounded-xl p-4 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Preview synthesis
          </div>
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
            Voice key
            <input
              value={testVoiceKey}
              onChange={(e) => setTestVoiceKey(e.target.value)}
              list="voice-clone-keys"
              className="rounded-lg px-3 py-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            />
            <datalist id="voice-clone-keys">
              {clones.map((v) => (
                <option key={v.voice_key} value={v.voice_key} />
              ))}
            </datalist>
          </label>
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
            Text
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={3}
              className="rounded-lg px-3 py-2 text-[12px] outline-none resize-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            />
          </label>
          <button
            type="button"
            onClick={() => void handlePreview()}
            disabled={!!busy}
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] disabled:opacity-50"
            style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
          >
            {busy === "Synthesizing…" ? <Loader2 size={14} className="animate-spin" /> : null}
            Play preview
          </button>
          {previewUrl && <audio ref={previewRef} src={previewUrl} controls className="w-full mt-2" />}
        </div>
      </div>

      <div className="studio-glass-inset rounded-xl p-4">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
          Registered voices ({clones.length})
        </div>
        {!loading && clones.length === 0 ? (
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
            No clones yet. Upload a WAV sample to create one.
          </p>
        ) : (
          <ul className="space-y-2 list-none">
            {clones.map((v) => (
              <li
                key={v.voice_key}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-[12px]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-2)" }}
              >
                <span className="font-mono">{v.voice_key}</span>
                <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                  {Math.round(v.size / 1024)} KB{v.has_transcript ? " · transcript" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
