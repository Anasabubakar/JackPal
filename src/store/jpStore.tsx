'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  listDocuments,
  uploadDocument,
  generateAudio,
  getAudioStatus,
  getAudioChunks,
  getTtsCapabilities,
  listWorkspaces,
  createWorkspace,
  type Document as ApiDocument,
} from '@/lib/api';
import { getSupabase } from '@/lib/supabase-browser';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  profile_url?: string | null;
}

export interface JpVoice {
  id: string;
  name: string;
  tone: string;
  color: string;
}

export interface JpSubject {
  ink: string;
  tint: string;
  glyph: string;
}

export interface JpDoc {
  id: string;
  title: string;
  course: string;
  subject: string;
  pages: number;
  durationSec: number;
  progressSec: number;
  voice: string;
  updated: string;
  audioReady: boolean;
  apiStatus?: string;
}

export type UploadStep = 'extracting' | 'voice' | 'generating' | 'ready';

export interface UploadState {
  step: UploadStep;
  fileName: string;
  apiDocId: string | null;
  voice: string | null;
  progress: number;
  originFrame: 'desktop' | 'mobile';
}

export interface ToastState {
  msg: string;
  kind: 'info' | 'warn';
  id: number;
}

export type DesktopRoute =
  | 'library'
  | 'player'
  | 'preview'
  | 'artifact'
  | 'voices'
  | 'account'
  | 'reader'
  | 'notes';

export type MobileRoute = 'library' | 'player';

export interface RouteState {
  desktop: DesktopRoute;
  mobile: MobileRoute;
}

// ── Static data ────────────────────────────────────────────────────────────────

export const JP_VOICES: JpVoice[] = [
  { id: 'adaora', name: 'Adaora', tone: 'Warm & nurturing',      color: '#F5A623' },
  { id: 'zainab', name: 'Zainab', tone: 'Clear & precise',       color: '#1B6EF3' },
  { id: 'nonso',  name: 'Nonso',  tone: 'Energetic & dynamic',   color: '#10B981' },
  { id: 'jude',   name: 'Jude',   tone: 'Deep & authoritative',  color: '#9333EA' },
];

export const JP_SUBJECTS: Record<string, JpSubject> = {
  Biology:    { ink: '#0F5132', tint: '#D6F0DC', glyph: '🌿' },
  Economics:  { ink: '#1B3A8A', tint: '#DCE6FB', glyph: '₦'  },
  Law:        { ink: '#7C2D12', tint: '#FBE3D2', glyph: '§'  },
  Chemistry:  { ink: '#581C87', tint: '#ECDDF8', glyph: '⚗'  },
  Literature: { ink: '#9F1239', tint: '#FCDDE4', glyph: '✎'  },
  Math:       { ink: '#0E4F66', tint: '#D2EDF7', glyph: '∑'  },
};

// ── Theme ──────────────────────────────────────────────────────────────────────

export interface JpTheme {
  isDark: boolean;
  bg: string;
  sidebar: string;
  card: string;
  card2: string;
  inset: string;
  border: string;
  borderHi: string;
  ink: string;
  ink2: string;
  muted: string;
  faded: string;
}

export function jpTheme(isDark: boolean): JpTheme {
  if (isDark) {
    return {
      isDark: true,
      bg: '#060C22',
      sidebar: '#0A1130',
      card: '#0D1635',
      card2: '#111D40',
      inset: 'rgba(255,255,255,0.03)',
      border: 'rgba(255,255,255,0.08)',
      borderHi: 'rgba(255,255,255,0.16)',
      ink: '#FFFFFF',
      ink2: '#C8D2E5',
      muted: '#8B9BB4',
      faded: '#3A4D6B',
    };
  }
  return {
    isDark: false,
    bg: '#FAF6EE',
    sidebar: '#FFFFFF',
    card: '#FFFFFF',
    card2: '#F5F3EE',
    inset: '#FAF6EE',
    border: 'rgba(10,22,40,0.08)',
    borderHi: 'rgba(10,22,40,0.16)',
    ink: '#0A1628',
    ink2: '#1F2937',
    muted: '#6B7280',
    faded: '#9CA3AF',
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function inferSubject(filename: string): string {
  const n = filename.toLowerCase();
  if (/bio|plant|ecolog|photosyn|cell|organism|genetics|anatomy/.test(n)) return 'Biology';
  if (/econ|demand|supply|market|financ|micro|macro|trade|gdp|elasticit/.test(n)) return 'Economics';
  if (/law|legal|const|court|tort|statute|judici|criminal|civil/.test(n)) return 'Law';
  if (/chem|organic|mol|reaction|stoich|compound|element|periodic/.test(n)) return 'Chemistry';
  if (/lit|novel|poem|fiction|shakespeare|prose|drama|author/.test(n)) return 'Literature';
  if (/math|calculus|algebra|geometr|statistic|trigon|equation/.test(n)) return 'Math';
  return 'Biology';
}

function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
}

function loadProgress(docId: string): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(`jp_progress_${docId}`) || '0', 10);
}

function saveProgress(docId: string, sec: number) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`jp_progress_${docId}`, String(Math.round(sec)));
  }
}

function loadMeta(docId: string): { subject?: string; course?: string; voice?: string } {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(`jp_meta_${docId}`) || '{}');
  } catch { return {}; }
}

function saveMeta(docId: string, meta: { subject?: string; course?: string; voice?: string }) {
  if (typeof window !== 'undefined') {
    const prev = loadMeta(docId);
    localStorage.setItem(`jp_meta_${docId}`, JSON.stringify({ ...prev, ...meta }));
  }
}

function mapApiDoc(doc: ApiDocument): JpDoc {
  const savedMeta = loadMeta(doc.id);
  const cleanName = doc.filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  const wordsPerSec = 2.2; // TTS reading speed
  const estimatedDuration = Math.max(60, Math.round(doc.word_count / wordsPerSec));
  return {
    id: doc.id,
    title: cleanName,
    course: savedMeta.course || 'My Library',
    subject: savedMeta.subject || inferSubject(doc.filename),
    pages: Math.max(1, Math.round(doc.word_count / 250)),
    durationSec: estimatedDuration,
    progressSec: loadProgress(doc.id),
    voice: doc.audio_voice || savedMeta.voice || 'adaora',
    updated: formatRelativeDate(doc.created_at),
    audioReady: doc.status === 'audio_ready',
    apiStatus: doc.status,
  };
}

function getBackendVoiceId(conceptId: string, fastVoices: string[]): string {
  if (!fastVoices.length) return conceptId;
  const idx = ['adaora', 'zainab', 'nonso', 'jude'].indexOf(conceptId);
  return fastVoices[Math.max(0, idx) % fastVoices.length];
}

// ── Context ────────────────────────────────────────────────────────────────────

interface JpStoreValue {
  docs: JpDoc[];
  currentDocId: string;
  isPlaying: boolean;
  route: RouteState;
  upload: UploadState | null;
  toast: ToastState | null;
  loading: boolean;
  user: AppUser | null;
  workspaceId: string | null;
  fastVoices: string[];
  startUpload: (file: File, originFrame: 'desktop' | 'mobile') => void;
  pickVoice: (vId: string) => void;
  openNewDoc: () => void;
  closeUpload: () => void;
  playDoc: (id: string, frame?: 'desktop' | 'mobile') => void;
  togglePlay: () => void;
  seek: (delta: number) => void;
  showToast: (msg: string, kind: 'info' | 'warn') => void;
  setRoute: (r: Partial<RouteState>) => void;
  fetchDocs: () => Promise<void>;
}

const JpContext = createContext<JpStoreValue | null>(null);

export function JpStoreProvider({ children }: { children: React.ReactNode }) {
  const [docs, setDocs] = useState<JpDoc[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [route, setRouteState] = useState<RouteState>({ desktop: 'library', mobile: 'library' });
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [fastVoices, setFastVoices] = useState<string[]>([]);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<{ index: number; url: string }[]>([]);
  const currentDocIdRef = useRef<string>('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDocIdRef = useRef<string>('');
  const fastVoicesRef = useRef<string[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { currentDocIdRef.current = currentDocId; }, [currentDocId]);
  useEffect(() => { fastVoicesRef.current = fastVoices; }, [fastVoices]);

  // ── Initialization ────────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string, kind: 'info' | 'warn') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const id = Date.now();
    setToast({ msg, kind, id });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchDocs = useCallback(async () => {
    try {
      const apiDocs = await listDocuments();
      const mapped = apiDocs.map(mapApiDoc);
      setDocs(mapped);
      if (mapped.length > 0 && !currentDocIdRef.current) {
        setCurrentDocId(mapped[0].id);
        currentDocIdRef.current = mapped[0].id;
      }
    } catch (e) {
      console.error('fetchDocs error:', e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        // User from Supabase
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0] ||
              'User',
            profile_url: session.user.user_metadata?.avatar_url || null,
          });
        }

        // Documents
        const apiDocs = await listDocuments();
        if (!mounted) return;
        const mapped = apiDocs.map(mapApiDoc);
        setDocs(mapped);
        if (mapped.length > 0) {
          setCurrentDocId(mapped[0].id);
          currentDocIdRef.current = mapped[0].id;
        }

        // Workspace
        const workspaces = await listWorkspaces();
        if (!mounted) return;
        if (workspaces.length > 0) {
          setWorkspaceId(workspaces[0].id);
        } else {
          const ws = await createWorkspace('My Studies');
          if (mounted) setWorkspaceId(ws.id);
        }

        // TTS capabilities for voice mapping
        const caps = await getTtsCapabilities();
        if (mounted && caps.fast_voices?.length) {
          setFastVoices(caps.fast_voices);
          fastVoicesRef.current = caps.fast_voices;
        }
      } catch (e) {
        console.error('JpStore init:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  // ── Extracting progress animation ─────────────────────────────────────────────

  useEffect(() => {
    if (!upload || upload.step !== 'extracting') return;
    const id = setInterval(() => {
      setUpload(prev => {
        if (!prev || prev.step !== 'extracting') return prev;
        return { ...prev, progress: Math.min(98, prev.progress + 4) };
      });
    }, 80);
    return () => clearInterval(id);
  }, [upload?.step]);

  // When extracting animation reaches ~98% and upload has finished (apiDocId set), complete
  useEffect(() => {
    if (!upload) return;
    if (upload.step === 'extracting' && upload.progress >= 98 && upload.apiDocId) {
      setUpload(prev => prev ? { ...prev, progress: 100, step: 'voice' } : prev);
    }
  }, [upload?.progress, upload?.apiDocId, upload?.step]);

  // ── Audio ─────────────────────────────────────────────────────────────────────

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.onended = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
  }, []);

  const playChunk = useCallback((docId: string, chunks: { index: number; url: string }[], idx: number) => {
    if (idx >= chunks.length || docId !== currentDocIdRef.current) {
      setIsPlaying(false);
      return;
    }
    stopAudio();
    const audio = new Audio(chunks[idx].url);
    audioRef.current = audio;

    audio.play().catch(err => {
      console.error('Audio play error:', err);
      setIsPlaying(false);
    });

    const avgChunkDur = 30; // seconds per chunk estimate
    audio.ontimeupdate = () => {
      if (docId !== currentDocIdRef.current) return;
      const totalSec = idx * avgChunkDur + audio.currentTime;
      setDocs(prev => prev.map(d => {
        if (d.id !== docId) return d;
        const sec = Math.round(totalSec);
        saveProgress(docId, sec);
        return { ...d, progressSec: sec };
      }));
    };

    audio.onended = () => {
      playChunk(docId, chunks, idx + 1);
    };

    audio.onerror = () => {
      console.error(`Chunk ${idx} error`);
      playChunk(docId, chunks, idx + 1);
    };
  }, [stopAudio]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const startUpload = useCallback((file: File, originFrame: 'desktop' | 'mobile') => {
    setUpload({ step: 'extracting', fileName: file.name, apiDocId: null, voice: null, progress: 0, originFrame });

    uploadDocument(file)
      .then(apiDoc => {
        pendingDocIdRef.current = apiDoc.id;
        const newDoc = mapApiDoc(apiDoc);
        setDocs(prev => prev.some(d => d.id === apiDoc.id) ? prev : [newDoc, ...prev]);
        if (!currentDocIdRef.current) {
          setCurrentDocId(apiDoc.id);
          currentDocIdRef.current = apiDoc.id;
        }
        // Signal extracting that upload is done
        setUpload(prev => prev && prev.step === 'extracting'
          ? { ...prev, apiDocId: apiDoc.id }
          : prev
        );
      })
      .catch(err => {
        console.error('Upload error:', err);
        showToast('Upload failed — please try again.', 'warn');
        setUpload(null);
      });
  }, [showToast]);

  const pickVoice = useCallback((vId: string) => {
    const docId = pendingDocIdRef.current;
    if (!docId) return;
    setUpload(prev => prev && prev.step === 'voice'
      ? { ...prev, voice: vId, step: 'generating', progress: 0 }
      : prev
    );
    saveMeta(docId, { voice: vId });

    const backendVoiceId = getBackendVoiceId(vId, fastVoicesRef.current);
    generateAudio(docId, backendVoiceId, 'fast')
      .then(() => {
        // Poll status
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(async () => {
          try {
            const status = await getAudioStatus(docId);
            const pct = status.total_chunks > 0
              ? (status.ready_chunks / status.total_chunks) * 100
              : 50;

            setUpload(prev => {
              if (!prev || prev.step !== 'generating') {
                clearInterval(pollTimerRef.current!);
                return prev;
              }
              return { ...prev, progress: Math.min(99, pct) };
            });

            if (status.status === 'audio_ready') {
              clearInterval(pollTimerRef.current!);
              setDocs(prev => prev.map(d =>
                d.id === docId ? { ...d, audioReady: true, apiStatus: 'audio_ready', voice: vId } : d
              ));
              setUpload(prev => prev ? { ...prev, step: 'ready', progress: 100 } : prev);
            } else if (status.status === 'error') {
              clearInterval(pollTimerRef.current!);
              showToast('Audio generation failed.', 'warn');
              setUpload(null);
            }
          } catch (e) {
            console.error('Poll error:', e);
          }
        }, 2000);
      })
      .catch(err => {
        console.error('generateAudio error:', err);
        showToast('Failed to start audio generation.', 'warn');
        setUpload(null);
      });
  }, [showToast]);

  const openNewDoc = useCallback(() => {
    const docId = pendingDocIdRef.current;
    if (docId) {
      setCurrentDocId(docId);
      currentDocIdRef.current = docId;
    }
    setUpload(null);
    setRouteState(prev => ({ ...prev, desktop: 'player', mobile: 'player' }));
  }, []);

  const closeUpload = useCallback(() => {
    setUpload(null);
  }, []);

  const playDoc = useCallback(async (id: string, frame?: 'desktop' | 'mobile') => {
    stopAudio();
    setCurrentDocId(id);
    currentDocIdRef.current = id;
    setIsPlaying(true);

    if (frame === 'mobile') {
      setRouteState(prev => ({ ...prev, mobile: 'player' }));
    } else {
      setRouteState(prev => ({ ...prev, desktop: 'player' }));
    }

    try {
      const result = await getAudioChunks(id);
      if (result.chunks?.length > 0) {
        const sorted = [...result.chunks].sort((a, b) => a.index - b.index);
        audioChunksRef.current = sorted;
        playChunk(id, sorted, 0);
      } else {
        showToast('Audio not ready yet.', 'info');
        setIsPlaying(false);
      }
    } catch {
      showToast('Could not load audio.', 'warn');
      setIsPlaying(false);
    }
  }, [stopAudio, playChunk, showToast]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [isPlaying]);

  const seek = useCallback((delta: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + delta);
    }
    setDocs(prev => prev.map(d => {
      if (d.id !== currentDocIdRef.current) return d;
      const next = Math.max(0, Math.min(d.durationSec, d.progressSec + delta));
      saveProgress(d.id, next);
      return { ...d, progressSec: next };
    }));
  }, []);

  const setRoute = useCallback((r: Partial<RouteState>) => {
    setRouteState(prev => ({ ...prev, ...r }));
  }, []);

  return (
    <JpContext.Provider value={{
      docs,
      currentDocId,
      isPlaying,
      route,
      upload,
      toast,
      loading,
      user,
      workspaceId,
      fastVoices,
      startUpload,
      pickVoice,
      openNewDoc,
      closeUpload,
      playDoc,
      togglePlay,
      seek,
      showToast,
      setRoute,
      fetchDocs,
    }}>
      {children}
    </JpContext.Provider>
  );
}

export function useJp(): JpStoreValue {
  const ctx = useContext(JpContext);
  if (!ctx) throw new Error('useJp must be used inside JpStoreProvider');
  return ctx;
}
