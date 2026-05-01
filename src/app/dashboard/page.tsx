'use client';

import {
  Home,
  Library,
  CloudUpload,
  FolderOpen,
  User,
  Play,
  Clock,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  LogOut,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Flame,
  Mic2,
  FileText,
  Video,
  Link2,
  Image as ImageIcon,
  X,
  Cloud,
  Globe,
  LayoutGrid,
  Loader2,
  Pause,
  Sparkles,
  Download,
  SkipBack,
  SkipForward,
  AudioLines,
  Trash2,
  RotateCcw,
  FastForward,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ease, dur } from "@/lib/motion";
import { FadeUp, SlideIn, SpringScale } from "@/components/ui/MotionPrimitives";
import {
  getUser,
  logout,
  listDocuments,
  uploadDocument,
  generateAudio,
  getAudioChunks,
  getAudioStatus,
  downloadAudioArchive,
  deleteDocument,
  summarizeDocument,
  getDocumentChapters,
  generatePodcast,
  getPodcastChunks,
  getDocumentText,
  askDocument,
  type Document,
  type Chapter,
  type PodcastLine,
} from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const VOICE_OPTIONS = [
  { value: "chinenye", label: "Ezinne", desc: "Female · Nigerian English" },
  { value: "jude",     label: "Abeo",   desc: "Male · Nigerian English" },
];
const PODCAST_HOSTS = [
  { voice: "chinenye", name: "Ezinne", role: "Asks the questions" },
  { voice: "jude",     name: "Abeo",   role: "Breaks it down" },
];

export default function Dashboard() {
  const SPEED_OPTIONS = [0.9, 1, 1.25, 1.5, 1.75];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isOthersModalOpen, setIsOthersModalOpen] = useState(false);

  // Auth
  const user = mounted ? getUser() : null;

  // Documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio player
  const [playingDocId, setPlayingDocId] = useState<string | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState("No audio selected");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playerMode, setPlayerMode] = useState<"idle" | "stream" | "chunks">("idle");
  const [activeChunk, setActiveChunk] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("chinenye");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunkQueueRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPreloadingRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chapters
  const [chaptersDocId, setChaptersDocId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // AI Summary â€” per-doc
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summaryLoadingId, setSummaryLoadingId] = useState<string | null>(null);

  // Q&A
  const [qaDocId, setQaDocId] = useState<string | null>(null);
  const [qaQuestion, setQaQuestion] = useState<Record<string, string>>({});
  const [qaAnswer, setQaAnswer] = useState<Record<string, string>>({});
  const [qaLoading, setQaLoading] = useState<string | null>(null);

  // Podcast mode
  const [docMode, setDocMode] = useState<Record<string, "listen" | "podcast">>({});
  const [podcastGenerating, setPodcastGenerating] = useState<string | null>(null);
  const [podcastLoadingMsg, setPodcastLoadingMsg] = useState("");
  const [podcastPlayingDocId, setPodcastPlayingDocId] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<PodcastLine[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [podcastChunkIndex, setPodcastChunkIndex] = useState(0);
  const podcastQueueRef = useRef<{ url: string; speaker: string }[]>([]);
  const podcastIndexRef = useRef(0);
  const [podcastMode, setPodcastMode] = useState<"standard" | "pidgin">("standard");
  const [podcastTopic, setPodcastTopic] = useState<string | null>(null); // section text being podcasted

  // Resume playback â€” chunk index per document
  const [savedProgress, setSavedProgress] = useState<Record<string, number>>({});

  // Transcript / seeking
  const [docText, setDocText] = useState<string>("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // 80-word chunks matching backend split â€” enables click-to-seek
  const textChunks = useMemo(() => {
    if (!docText) return [];
    const words = docText.split(/\s+/).filter(Boolean);
    const result: string[] = [];
    for (let i = 0; i < words.length; i += 80) {
      result.push(words.slice(i, i + 80).join(" "));
    }
    return result;
  }, [docText]);

  const visibleTextChunks = useMemo(() => {
    if (!showTranscript) return [];
    if (showFullTranscript) {
      return textChunks.map((chunk, index) => ({ chunk, index }));
    }
    if (!textChunks.length) return [];
    const windowSize = 25;
    const start = Math.max(0, activeChunk - windowSize);
    const end = Math.min(textChunks.length, activeChunk + windowSize + 1);
    return textChunks.slice(start, end).map((chunk, offset) => ({
      chunk,
      index: start + offset,
    }));
  }, [textChunks, activeChunk, showFullTranscript, showTranscript]);

  const visiblePodcastLines = useMemo(() => {
    if (!showTranscript) return [];
    if (showFullTranscript) {
      return podcastScript.map((line, index) => ({ line, index }));
    }
    if (!podcastScript.length) return [];
    const windowSize = 25;
    const start = Math.max(0, podcastChunkIndex - windowSize);
    const end = Math.min(podcastScript.length, podcastChunkIndex + windowSize + 1);
    return podcastScript.slice(start, end).map((line, offset) => ({
      line,
      index: start + offset,
    }));
  }, [podcastScript, podcastChunkIndex, showFullTranscript, showTranscript]);

  // Course subject labels (stored locally per docId)
  const [subjects, setSubjects] = useState<Record<string, string>>({});

  // Real Stats
  const [userStats, setUserStats] = useState<any>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const lastTimeUpdateRef = useRef(0);
  const documentsRef = useRef<Document[]>([]);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter(doc => 
      doc.filename.toLowerCase().includes(q) || 
      (subjects[doc.id] && subjects[doc.id].toLowerCase().includes(q))
    );
  }, [documents, searchQuery, subjects]);
  useEffect(() => {
    setMounted(true);
    const u = getUser();
    const savedVoice = localStorage.getItem("jackpal_voice");
    if (savedVoice && VOICE_OPTIONS.find(v => v.value === savedVoice)) setSelectedVoice(savedVoice);
    const savedSubjects = localStorage.getItem("jackpal_subjects");
    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    const rawProgress = localStorage.getItem("jackpal_progress");
    if (rawProgress) setSavedProgress(JSON.parse(rawProgress));
    if (!u) {
      router.push("/login");
      return;
    }
    fetchDocuments();
  }, []);

  function saveSubject(docId: string, subject: string) {
    const updated = { ...subjects, [docId]: subject };
    setSubjects(updated);
    localStorage.setItem("jackpal_subjects", JSON.stringify(updated));
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("jackpal_voice", selectedVoice);
  }, [mounted, selectedVoice]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (preloadAudioRef.current) {
        preloadAudioRef.current.pause();
        preloadAudioRef.current.src = "";
        preloadAudioRef.current = null;
      }
    };
  }, []);

  // Poll status for docs that are still generating
  const hasGenerating = documents.some(d => d.status === "generating" || d.status === "streaming");

  useEffect(() => {
    if (!hasGenerating) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = setInterval(async () => {
      let anyUpdated = false;
      const updated = await Promise.all(
        documentsRef.current.map(async (doc) => {
          if (doc.status !== "generating" && doc.status !== "streaming") return doc;
          try {
            const s = await getAudioStatus(doc.id);
            if (s.status !== doc.status || s.ready_chunks !== doc.ready_chunks) {
              anyUpdated = true;
              return {
                ...doc,
                status: s.status as Document["status"],
                ready_chunks: s.ready_chunks,
                total_chunks: s.total_chunks,
                audio_voice: s.audio_voice ?? doc.audio_voice,
              };
            }
          } catch { /* ignore */ }
          return doc;
        })
      );
      if (anyUpdated) setDocuments(updated);
    }, 3000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [hasGenerating]);

  async function fetchDocuments() {
    setDocsLoading(true);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch {
      // token expired or backend down
    } finally {
      setDocsLoading(false);
    }
  }

  function formatTime(value: number) {
    if (!Number.isFinite(value) || value < 0) return "00:00";
    const totalSeconds = Math.floor(value);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  function getDocumentTitle(docId: string) {
    return documents.find((doc) => doc.id === docId)?.filename || "Study Audio";
  }

  function getVoiceMeta(voice = selectedVoice) {
    return VOICE_OPTIONS.find((option) => option.value === voice) ?? VOICE_OPTIONS[0];
  }

  function attachAudio(
    audio: HTMLAudioElement,
    docId: string,
    title: string,
    mode: "stream" | "chunks",
    chunkIndex: number,
    onEnded?: () => void
  ) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }

    audio.preload = "auto";
    audio.playbackRate = playbackRate;
    audioRef.current = audio;
    setCurrentDocId(docId);
    setCurrentTitle(title);
    setPlayerMode(mode);
    setActiveChunk(chunkIndex);
    setCurrentTime(0);
    setDuration(0);
    setIsAudioLoading(true);

    lastTimeUpdateRef.current = 0;
    audio.ontimeupdate = () => {
      const now = audio.currentTime || 0;
      if (Math.abs(now - lastTimeUpdateRef.current) < 0.25) return;
      lastTimeUpdateRef.current = now;
      setCurrentTime(now);
    };
    audio.onloadedmetadata = () => setDuration(audio.duration || 0);
    audio.onwaiting = () => setIsAudioLoading(true);
    audio.oncanplay = () => setIsAudioLoading(false);
    audio.onplaying = () => {
      setPlayingDocId(docId);
      setIsAudioLoading(false);
    };
    audio.onerror = () => {
      setPlayingDocId(null);
      setIsAudioLoading(false);
    };
    audio.onended = () => {
      setCurrentTime(0);
      onEnded?.();
    };
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    setIsOthersModalOpen(false);
    setIsAddMenuOpen(false);
    try {
      await uploadDocument(file);
      await fetchDocuments();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }
    // Clean up preloaded audio
    if (preloadAudioRef.current) {
      preloadAudioRef.current.pause();
      preloadAudioRef.current.src = "";
      preloadAudioRef.current = null;
    }
    isPreloadingRef.current = false;
    chunkQueueRef.current = [];
    chunkIndexRef.current = 0;
    podcastQueueRef.current = [];
    podcastIndexRef.current = 0;
    setPlayingDocId(null);
    setPodcastPlayingDocId(null);
    setCurrentSpeaker(null);
    setCurrentDocId(null);
    setCurrentTitle("No audio selected");
    setCurrentTime(0);
    setDuration(0);
    setPlayerMode("idle");
    setActiveChunk(0);
    setPodcastChunkIndex(0);
    setIsAudioLoading(false);
  }

  async function handleGenerateAudio(doc: Document) {
    // Toggle off if already playing
    if (playingDocId === doc.id) { stopAudio(); return; }
    stopAudio();

    // If pre-generated chunks exist → instant chunk playlist
    const hasMatchingReadyAudio = ((doc.ready_chunks ?? 0) > 0 || doc.status === "audio_ready")
      && doc.audio_voice === selectedVoice;
    if (hasMatchingReadyAudio) {
      try {
        const { chunks } = await getAudioChunks(doc.id);
        if (chunks.length > 0) {
          loadDocumentText(doc.id);
          await handlePlayChunks(doc.id, 0, doc.filename);
          return;
        }
      } catch { /* chunks not ready yet, fall through to stream */ }
    }

    setDocuments((prev) => prev.map((item) => (
      item.id === doc.id && item.status === "ready"
        ? { ...item, status: "generating" }
        : item
    )));

    setIsAudioLoading(true);
    loadDocumentText(doc.id);
    try {
      const status = await generateAudio(doc.id, selectedVoice, "fast");
      setDocuments((prev) => prev.map((item) => (
        item.id === doc.id
          ? {
              ...item,
              status: status.status as Document["status"],
              ready_chunks: status.ready_chunks,
              total_chunks: status.total_chunks,
              audio_voice: status.audio_voice ?? selectedVoice,
            }
          : item
      )));
      await handlePlayChunks(doc.id, 0, doc.filename);
    } catch (err: unknown) {
      setPlayingDocId(null);
      setIsAudioLoading(false);
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("not found") || msg.includes("404")) {
        setUploadError("Document not found on server â€” try re-uploading your file.");
        fetchDocuments();
      } else {
        setUploadError("Audio generation failed. Is the backend running?");
      }
    }
  }

  async function waitForChunkAndContinue(docId: string, nextChunkIndex: number, title: string) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      try {
        const { chunks, status } = await getAudioChunks(docId);
        if (chunks.length > nextChunkIndex) {
          await handlePlayChunks(docId, nextChunkIndex, title);
          return;
        }
        if (status === "audio_ready" && chunks.length <= nextChunkIndex) {
          stopAudio();
          return;
        }
      } catch {
        // Keep polling briefly before giving up.
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    setPlayingDocId(null);
    setIsAudioLoading(false);
  }

  async function handlePlayChunks(docId: string, startChunk = 0, title = getDocumentTitle(docId)) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    // Cancel any preloading
    if (preloadAudioRef.current) {
      preloadAudioRef.current.pause();
      preloadAudioRef.current.src = "";
      preloadAudioRef.current = null;
    }
    isPreloadingRef.current = false;
    
    const { chunks } = await getAudioChunks(docId);
    if (!chunks.length || !chunks[startChunk]) return;
    chunkQueueRef.current = chunks.map(c => c.url);
    chunkIndexRef.current = startChunk;
    setPlayingDocId(docId);
    
    // Preload the next chunk immediately
    preloadNextChunk(docId, title);
    playNextChunk(docId, title);
  }

  function preloadNextChunk(docId: string, title: string) {
    const nextIndex = chunkIndexRef.current + 1;
    if (nextIndex >= chunkQueueRef.current.length) return; // No more chunks
    if (isPreloadingRef.current && preloadAudioRef.current) return; // Already preloading
    
    const nextUrl = chunkQueueRef.current[nextIndex];
    if (!nextUrl) return;
    
    isPreloadingRef.current = true;
    const preloadAudio = new Audio(nextUrl);
    preloadAudio.preload = "auto";
    
    preloadAudio.oncanplaythrough = () => {
      preloadAudioRef.current = preloadAudio;
      isPreloadingRef.current = false;
    };
    
    preloadAudio.onerror = () => {
      isPreloadingRef.current = false;
    };
    
    // Start loading
    preloadAudio.load();
  }

  function playNextChunk(docId: string, title: string) {
    const url = chunkQueueRef.current[chunkIndexRef.current];
    if (!url) { setPlayingDocId(null); return; }
    const audio = new Audio(url);
    attachAudio(audio, docId, title, "chunks", chunkIndexRef.current, async () => {
      chunkIndexRef.current += 1;
      
      // Use preloaded audio if available
      if (preloadAudioRef.current && preloadAudioRef.current.src === chunkQueueRef.current[chunkIndexRef.current]) {
        // Use the preloaded audio - swap refs
        const preloaded = preloadAudioRef.current;
        preloadAudioRef.current = null;
        
        // Transfer the preloaded audio to audioRef
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        audioRef.current = preloaded;
        
        // Attach the onended handler to the preloaded audio
        preloaded.onended = async () => {
          chunkIndexRef.current += 1;
          const { chunks } = await getAudioChunks(docId);
          chunkQueueRef.current = chunks.map(c => c.url);
          if (chunkQueueRef.current[chunkIndexRef.current]) {
            preloadNextChunk(docId, title);
            playNextChunk(docId, title);
            return;
          }
          await waitForChunkAndContinue(docId, chunkIndexRef.current, title);
        };
        
        // Update state for preloaded audio
        setActiveChunk(chunkIndexRef.current);
        setCurrentTime(0);
        setIsAudioLoading(false);
        setPlayingDocId(docId);
        
        preloaded.oncanplay = () => setIsAudioLoading(false);
        preloaded.onplaying = () => { setPlayingDocId(docId); setIsAudioLoading(false); };
        preloaded.onerror = () => { setPlayingDocId(null); setIsAudioLoading(false); };
        
        preloaded.play().catch(() => setPlayingDocId(null));
        
        // Preload the next one
        preloadNextChunk(docId, title);
        return;
      }
      
      // No preloaded audio - normal path
      const { chunks } = await getAudioChunks(docId);
      chunkQueueRef.current = chunks.map(c => c.url);
      if (chunkQueueRef.current[chunkIndexRef.current]) {
        preloadNextChunk(docId, title);
        playNextChunk(docId, title);
        return;
      }
      await waitForChunkAndContinue(docId, chunkIndexRef.current, title);
    });
    audio.play().catch(() => setPlayingDocId(null));
  }

  function toggleCurrentPlayback() {
    const audio = audioRef.current;
    if (!audio || !currentDocId) return;
    if (audio.paused) {
      audio.play().catch(() => setPlayingDocId(null));
      return;
    }
    audio.pause();
    setPlayingDocId(null);
  }

  async function handleChunkNavigation(direction: -1 | 1) {
    if (!currentDocId) return;

    const targetChunk = Math.max(0, activeChunk + direction);
    if (direction < 0 && playerMode === "stream") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
      return;
    }

    try {
      const { chunks, status } = await getAudioChunks(currentDocId);
      chunkQueueRef.current = chunks.map((chunk) => chunk.url);

      if (chunks[targetChunk]) {
        await handlePlayChunks(currentDocId, targetChunk, currentTitle);
        return;
      }

      const currentDocStatus = currentDoc?.status ?? status;
      if (direction > 0 && (currentDocStatus === "generating" || currentDocStatus === "streaming")) {
        setIsAudioLoading(true);
        await waitForChunkAndContinue(currentDocId, targetChunk, currentTitle);
      }
    } catch {
      setIsAudioLoading(false);
    }
  }

  function seekWithinCurrent(progress: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const nextTime = (progress / 100) * audio.duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function skipBy(delta: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const maxDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const nextTime = Math.max(0, Math.min(maxDuration, audio.currentTime + delta));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  async function handleDownload(docId: string) {
    setDownloadingDocId(docId);
    setUploadError("");
    try {
      const { blob, filename } = await downloadAudioArchive(docId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadingDocId(null);
    }
  }

  async function handleViewChapters(doc: Document) {
    if (chaptersDocId === doc.id) { setChaptersDocId(null); setChapters([]); return; }
    setChaptersDocId(doc.id);
    setChapters([]);
    setChaptersLoading(true);
    try {
      const res = await getDocumentChapters(doc.id);
      setChapters(res.chapters);
    } catch { /* ignore */ }
    finally { setChaptersLoading(false); }
  }

  async function handleJumpToChapter(docId: string, chapterIndex: number) {
    // Each chapter maps to roughly (start_word / 80) chunk index
    const chapter = chapters[chapterIndex];
    if (!chapter) return;
    const chunkIndex = Math.floor(chapter.start_word / 80);
    await handlePlayChunks(docId, chunkIndex);
  }

  async function handleSummarize(doc: Document) {
    // Toggle off if already loaded
    if (summaries[doc.id] && summaryLoadingId !== doc.id) {
      setSummaries(prev => { const n = { ...prev }; delete n[doc.id]; return n; });
      return;
    }
    if (summaryLoadingId === doc.id) return;
    setSummaryLoadingId(doc.id);
    try {
      const result = await summarizeDocument(doc.id);
      setSummaries(prev => ({ ...prev, [doc.id]: result.summary }));
    } catch {
      setSummaries(prev => ({ ...prev, [doc.id]: "Could not generate summary. Please check that your API keys (GROQ_API_KEY or GOOGLE_AI_API_KEY) are set in the backend." }));
    } finally {
      setSummaryLoadingId(null);
    }
  }

  async function handleAsk(docId: string, e: React.FormEvent) {
    e.preventDefault();
    const q = (qaQuestion[docId] ?? "").trim();
    if (!q || qaLoading === docId) return;
    setQaDocId(docId);
    setQaLoading(docId);
    setQaAnswer(prev => ({ ...prev, [docId]: "" }));
    try {
      const result = await askDocument(docId, q);
      setQaAnswer(prev => ({ ...prev, [docId]: result.answer }));
    } catch {
      setQaAnswer(prev => ({ ...prev, [docId]: "Could not answer. Please try again." }));
    } finally {
      setQaLoading(null);
    }
  }

  // Save chunk progress whenever the active chunk advances
  useEffect(() => {
    if (!currentDocId || activeChunk === 0) return;
    setSavedProgress(prev => {
      const next = { ...prev, [currentDocId]: activeChunk };
      localStorage.setItem("jackpal_progress", JSON.stringify(next));
      return next;
    });
  }, [activeChunk, currentDocId]);

  async function handleDeleteDoc(docId: string) {
    // Optimistic: remove from UI immediately
    setDocuments(prev => prev.filter(d => d.id !== docId));
    if (currentDocId === docId) stopAudio();
    if (podcastPlayingDocId === docId) stopPodcast();
    try {
      await deleteDocument(docId);
      // Clear saved progress for this doc
      setSavedProgress(prev => {
        const next = { ...prev };
        delete next[docId];
        localStorage.setItem("jackpal_progress", JSON.stringify(next));
        return next;
      });
    } catch {
      fetchDocuments(); // Restore if delete failed
    }
  }

  async function loadDocumentText(docId: string) {
    try {
      const text = await getDocumentText(docId);
      setDocText(text);
    } catch { /* non-fatal â€” transcript just won't show */ }
  }

  function jumpToPodcastLine(index: number) {
    if (!podcastPlayingDocId) return;
    if (!podcastQueueRef.current[index]) return;
    podcastIndexRef.current = index;
    playNextPodcastChunk(podcastPlayingDocId);
  }

  // Auto-scroll active transcript line into view
  useEffect(() => {
    if (!showTranscript || !transcriptRef.current) return;
    const active = transcriptRef.current.querySelector("[data-active='true']");
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeChunk, podcastChunkIndex, showTranscript]);

  function stopPodcast() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.onended = null;
    }
    podcastQueueRef.current = [];
    podcastIndexRef.current = 0;
    setPodcastPlayingDocId(null);
    setCurrentSpeaker(null);
    setPodcastChunkIndex(0);
    setCurrentTime(0);
    setDuration(0);
    setIsAudioLoading(false);
  }

  function playNextPodcastChunk(docId: string) {
    const entry = podcastQueueRef.current[podcastIndexRef.current];
    if (!entry) { setPodcastPlayingDocId(null); setCurrentSpeaker(null); return; }

    const audio = new Audio(entry.url);
    audio.playbackRate = playbackRate;
    audio.preload = "auto";

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.onended = null;
    }
    audioRef.current = audio;

    setCurrentSpeaker(entry.speaker);
    setPodcastChunkIndex(podcastIndexRef.current);
    setIsAudioLoading(true);
    setCurrentDocId(docId);
    setCurrentTitle(documents.find(d => d.id === docId)?.filename ?? "Podcast");

    lastTimeUpdateRef.current = 0;
    audio.ontimeupdate = () => {
      const now = audio.currentTime || 0;
      if (Math.abs(now - lastTimeUpdateRef.current) < 0.25) return;
      lastTimeUpdateRef.current = now;
      setCurrentTime(now);
    };
    audio.onloadedmetadata = () => setDuration(audio.duration || 0);
    audio.oncanplay = () => setIsAudioLoading(false);
    audio.onplaying = () => { setPodcastPlayingDocId(docId); setIsAudioLoading(false); };
    audio.onerror = () => { setPodcastPlayingDocId(null); setIsAudioLoading(false); };
    audio.onended = async () => {
      setCurrentTime(0);
      podcastIndexRef.current += 1;
      if (podcastQueueRef.current[podcastIndexRef.current]) {
        playNextPodcastChunk(docId);
      } else {
        // Poll for more chunks if podcast is still generating
        for (let attempt = 0; attempt < 10; attempt++) {
          await new Promise(r => setTimeout(r, 1500));
          try {
            const res = await getPodcastChunks(docId);
            podcastQueueRef.current = res.chunks.map(c => ({ url: c.url, speaker: c.speaker }));
            if (podcastQueueRef.current[podcastIndexRef.current]) {
              playNextPodcastChunk(docId);
              return;
            }
            if (res.status === "ready") break;
          } catch { break; }
        }
        setPodcastPlayingDocId(null);
        setCurrentSpeaker(null);
      }
    };

    audio.play().catch(() => setPodcastPlayingDocId(null));
  }

  async function handlePodcast(doc: Document, regenerate = false, topic?: string, chapterIndex?: number) {
    // If already playing this podcast â€” toggle pause/play (unless regenerating or switching topic)
    if (!regenerate && !topic && chapterIndex === undefined && podcastPlayingDocId === doc.id) {
      if (audioRef.current?.paused) {
        audioRef.current.play().catch(() => setPodcastPlayingDocId(null));
        setPodcastPlayingDocId(doc.id);
      } else {
        audioRef.current?.pause();
        setPodcastPlayingDocId(null);
      }
      return;
    }

    // Stop whatever is playing
    stopPodcast();
    stopAudio();
    setIsAudioLoading(true);
    setPodcastGenerating(doc.id);
    setPodcastTopic(topic ?? null);
    setShowTranscript(true);

    const loadingMsgs = [
      "Reading your notes...",
      "Ezinne and Abeo are prepping...",
      "Writing the script...",
      "Recording the episode...",
      "Adding the finishing touches...",
      "Almost ready to play...",
    ];
    let msgIdx = 0;
    setPodcastLoadingMsg(loadingMsgs[0]);
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMsgs.length;
      setPodcastLoadingMsg(loadingMsgs[msgIdx]);
    }, 4000);

    try {
      await generatePodcast(doc.id, regenerate || !!topic || chapterIndex !== undefined, podcastMode, topic, chapterIndex);

      const poll = async (): Promise<void> => {
        for (let i = 0; i < 90; i++) {
          await new Promise(r => setTimeout(r, 2000));
          try {
            const res = await getPodcastChunks(doc.id);
            if (res.script?.length > 0) setPodcastScript(res.script);
            if (res.chunks.length > 0) {
              clearInterval(msgInterval);
              podcastQueueRef.current = res.chunks.map(c => ({ url: c.url, speaker: c.speaker }));
              podcastIndexRef.current = 0;
              playNextPodcastChunk(doc.id);
              return;
            }
          } catch { /* keep polling */ }
        }
        clearInterval(msgInterval);
        setUploadError("Podcast took too long â€” please try again.");
        setIsAudioLoading(false);
      };
      poll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Podcast generation failed.";
      const isNotFound = msg.toLowerCase().includes("not found") || msg.includes("404");
      setUploadError(
        isNotFound
          ? "Document not found on server â€” try re-uploading your file."
          : msg.includes("Script generation") || msg.includes("empty")
          ? "AI script generation failed. Is Ollama running? (ollama serve)"
          : msg
      );
      clearInterval(msgInterval);
      setIsAudioLoading(false);
      if (isNotFound) {
        fetchDocuments();
      }
    } finally {
      setPodcastGenerating(null);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const mainUploadOptions = [
    { label: "File", icon: FileText, color: "#2585C7" },
    { label: "Link/URL", icon: Link2, color: "#61E3F0" },
    { label: "Google Drive", icon: Cloud, color: "#0F1774" },
  ];

  const allUploadOptions = [
    { label: "File", icon: FileText, color: "#2585C7", desc: "Upload PDFs, Word, or TXT", action: "file" },
    { label: "Link/URL", icon: Link2, color: "#61E3F0", desc: "Import from any website", action: null },
    { label: "Google Drive", icon: Cloud, color: "#0F1774", desc: "Connect your cloud library", action: null },
    { label: "Web/External", icon: Globe, color: "#2261B9", desc: "External cloud platforms", action: null },
    { label: "Image/Note", icon: ImageIcon, color: "#02013D", desc: "OCR for images and notes", action: null },
    { label: "Video", icon: Video, color: "#2585C7", desc: "Extract audio from videos", action: null },
  ];

  const recentAudios = [
    { id: 1, title: "Biology 101: Cell Theory", chapter: "Chapter 4", progress: 75, duration: "18:30", color: "#2585C7" },
    { id: 2, title: "Modern Physics: Quantum Mechanics", chapter: "Chapter 2", progress: 40, duration: "25:15", color: "#61E3F0" },
    { id: 3, title: "Introduction to Law", chapter: "Lesson 12", progress: 10, duration: "32:00", color: "#02013D" },
  ];

  if (!mounted) return null;

  const firstName = user?.full_name?.split(" ")[0] || "Winner";
  const activeDocId = podcastPlayingDocId || currentDocId;
  const currentDoc = activeDocId ? documents.find((doc) => doc.id === activeDocId) ?? null : null;
  const playerProgress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const canGoPrevChunk = playerMode === "chunks" ? activeChunk > 0 : currentTime > 0;
  const canGoNextChunk = !podcastPlayingDocId && currentDoc
    ? (currentDoc.ready_chunks ?? 0) > activeChunk + 1 || currentDoc.status === "generating" || currentDoc.status === "streaming"
    : false;

  const selectedDoc = selectedDocId
    ? documents.find((doc) => doc.id === selectedDocId) ?? null
    : null;

  const LeftRail = () => (
    <nav
      className="w-14 flex-shrink-0 flex flex-col items-center py-5 gap-1 z-40"
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
    >
      <div className="mb-5">
        <Image src="/images/logo.svg" alt="JackPal" width={26} height={26} priority />
      </div>
      {[
        { id: "home", Icon: Library, label: "Library" },
        { id: "upload", Icon: Plus, label: "Upload" },
      ].map(({ id, Icon, label }) => (
        <button
          key={id}
          title={label}
          onClick={() => {
            if (id === "upload") {
              setActiveTab("home");
              fileInputRef.current?.click();
              return;
            }
            setActiveTab(id);
          }}
          className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
          style={{
            color: activeTab === id ? "var(--text-1)" : "var(--text-3)",
            background: activeTab === id ? "var(--surface-2)" : "transparent",
          }}
        >
          {activeTab === id && (
            <motion.div
              layoutId="nav-pill"
              className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
              style={{ background: "var(--blue)" }}
            />
          )}
          <Icon size={18} strokeWidth={1.75} />
        </button>
      ))}
      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          title="Sign out"
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
          style={{ color: "var(--text-3)" }}
        >
          <LogOut size={16} strokeWidth={1.75} />
        </button>
      </div>
    </nav>
  );

  const LibraryView = () => {
    const isEmpty = filteredDocuments.length === 0 && !docsLoading;
    const hasSearch = searchQuery.trim().length > 0;
    return (
      <motion.div
        key="library"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: dur.smooth, ease: ease.out }}
        className="flex-1 flex flex-col overflow-hidden"
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0 gap-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="min-w-0">
            <div
              className="text-[9px] font-bold uppercase tracking-[0.25em]"
              style={{ color: "var(--text-3)", fontFamily: "var(--font-syne)" }}
            >
              Good day
            </div>
            <div
              className="leading-none mt-0.5 truncate"
              style={{ color: "var(--text-1)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, fontStyle: "italic" }}
            >
              {firstName}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="rounded-lg px-3 py-2 text-[11px] outline-none w-36 transition-all"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--blue)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <label
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer transition-all"
              style={{ background: "var(--blue)", color: "white" }}
            >
              {uploading
                ? <Loader2 size={12} className="animate-spin" />
                : <Plus size={12} strokeWidth={2} />}
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {uploading ? "Uploading" : "Upload"}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {uploadError && (
          <div
            className="mx-5 mt-3 px-4 py-2.5 rounded-xl text-[11px] flex items-center justify-between gap-3"
            style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.15)" }}
          >
            <span>{uploadError}</span>
            <button onClick={() => setUploadError("")} style={{ color: "#f87171", opacity: 0.6 }}>
              <X size={12} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto studio-scroll">
          {docsLoading ? (
            <div className="px-4 pt-4 space-y-1">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl animate-pulse">
                  <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: "var(--surface-2)" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-lg w-44" style={{ background: "var(--surface-2)" }} />
                    <div className="h-2 rounded-lg w-20" style={{ background: "var(--surface-2)" }} />
                  </div>
                  <div className="h-7 w-16 rounded-lg" style={{ background: "var(--surface-2)" }} />
                  <div className="h-7 w-20 rounded-lg" style={{ background: "var(--surface-2)" }} />
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            /* â”€â”€ Empty state â”€â”€ */
            <div className="flex flex-col items-center justify-center h-full px-6" style={{ gap: "28px" }}>
              {/* Upload zone */}
              <label
                className="w-full cursor-pointer transition-all"
                style={{ maxWidth: 400 }}
                onDragOver={e => {
                  e.preventDefault();
                  (e.currentTarget.querySelector(".upload-zone") as HTMLElement | null)?.setAttribute("style", "border-color:var(--blue);background:var(--blue-dim)");
                }}
                onDragLeave={e => {
                  (e.currentTarget.querySelector(".upload-zone") as HTMLElement | null)?.setAttribute("style", "");
                }}
                onDrop={async e => {
                  e.preventDefault();
                  (e.currentTarget.querySelector(".upload-zone") as HTMLElement | null)?.setAttribute("style", "");
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  setUploadError("");
                  try {
                    await uploadDocument(file);
                    await fetchDocuments();
                  } catch (err: unknown) {
                    setUploadError(err instanceof Error ? err.message : "Upload failed.");
                  } finally {
                    setUploading(false);
                  }
                }}
              >
                <div
                  className="upload-zone flex flex-col items-center gap-5 rounded-2xl py-12 px-8 transition-all"
                  style={{ border: "1.5px dashed var(--border)", background: "var(--surface)" }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    {uploading
                      ? <Loader2 size={22} className="animate-spin" style={{ color: "var(--blue)" }} />
                      : <CloudUpload size={22} strokeWidth={1.5} style={{ color: "var(--blue)" }} />}
                  </div>
                  <div className="text-center">
                    <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)" }}>
                      {uploading ? "Uploading…" : "Drop your notes here"}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--text-3)" }}>PDF · DOCX · TXT · up to 10 MB</div>
                  </div>
                  <div
                    className="px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest"
                    style={{ background: "var(--blue)", color: "#fff" }}
                  >
                    Browse files
                  </div>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {/* What happens next */}
              <div className="flex flex-col items-center gap-3">
                <div className="text-[11px] text-center" style={{ color: "var(--text-3)", fontFamily: "var(--font-syne)" }}>
                  Becomes a podcast in ~30 s, hosted by
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "var(--teal)", color: "var(--ink)" }}>E</div>
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-2)", fontFamily: "var(--font-syne)" }}>Ezinne</span>
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--text-3)" }}>&amp;</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: "var(--blue)" }}>A</div>
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-2)", fontFamily: "var(--font-syne)" }}>Abeo</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* â”€â”€ Document list â”€â”€ */
            <div className="px-3 pt-3 pb-24 space-y-0.5">
              <div className="px-3 pb-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-3)" }}>
                  {filteredDocuments.length} {filteredDocuments.length === 1 ? "document" : "documents"}
                  {hasSearch && ` · "${searchQuery}"`}
                </span>
              </div>
              {filteredDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: dur.smooth, ease: ease.out, delay: index * 0.03 }}
                  className="group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all"
                  style={{ background: selectedDocId === doc.id ? "var(--surface-2)" : "transparent" }}
                  onMouseEnter={e => { if (selectedDocId !== doc.id) e.currentTarget.style.background = "var(--surface)"; }}
                  onMouseLeave={e => { if (selectedDocId !== doc.id) e.currentTarget.style.background = selectedDocId === doc.id ? "var(--surface-2)" : "transparent"; }}
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    if (chaptersDocId !== doc.id) {
                      setChaptersDocId(doc.id);
                      setChaptersLoading(true);
                      getDocumentChapters(doc.id).then(res => setChapters(res.chapters || [])).catch(() => {}).finally(() => setChaptersLoading(false));
                    }
                  }}
                >
                  <div
                    className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg"
                    style={{ background: "var(--surface-2)" }}
                  >
                    {(playingDocId === doc.id || podcastPlayingDocId === doc.id) ? (
                      <div className="flex items-end gap-0.5 h-4">
                        {[0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
                          <div
                            key={i}
                            className="w-0.5 rounded-full animate-wave"
                            style={{
                              height: `${h * 100}%`,
                              animationDelay: `${i * 0.1}s`,
                              background: "var(--teal)",
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <FileText size={14} strokeWidth={1.5} style={{ color: "var(--text-3)" }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: "var(--text-1)" }}>
                      {doc.filename}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                        {doc.word_count?.toLocaleString()} words
                      </span>
                      {(doc.status === "generating" || doc.status === "streaming") && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{ background: "var(--blue-dim)", color: "var(--blue)" }}
                        >
                          Generating {doc.ready_chunks}/{doc.total_chunks}
                        </span>
                      )}
                      {doc.status === "audio_ready" && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{ background: "var(--teal-dim)", color: "var(--teal)" }}
                        >
                          Ready
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={e => { e.stopPropagation(); setShowTranscript(true); handleGenerateAudio(doc); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white transition-all"
                      style={{ background: playingDocId === doc.id ? "var(--teal)" : "var(--blue)" }}
                    >
                      {playingDocId === doc.id ? <Pause size={11} strokeWidth={2} /> : <Play size={11} strokeWidth={2} />}
                      {playingDocId === doc.id ? "Playing" : "Listen"}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={e => { e.stopPropagation(); handlePodcast(doc); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                      style={{ border: "1px solid var(--teal)", color: "var(--teal)" }}
                    >
                      <Mic2 size={11} strokeWidth={2} />
                      Podcast
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={e => { e.stopPropagation(); if (confirm("Delete this document?")) handleDeleteDoc(doc.id); }}
                      className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      style={{ color: "var(--text-3)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
                    >
                      <Trash2 size={13} strokeWidth={1.75} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const SyncReader = () => (
    <motion.div key="reader" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: dur.smooth, ease: ease.out }} className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <button onClick={() => { setCurrentDocId(null); setPlayingDocId(null); setPodcastPlayingDocId(null); }} className="p-1 rounded-lg transition-colors" style={{ color: "var(--text-3)" }}>
          <ChevronRight size={16} strokeWidth={1.75} className="rotate-180" />
        </button>
        <span className="text-[12px] font-bold uppercase tracking-widest truncate" style={{ color: "var(--text-2)" }}>{currentTitle}</span>
      </div>
      <div className="flex-1 overflow-y-auto studio-scroll px-8 py-10" style={{ background: "#15130F" }}>
        <div className="max-w-[68ch] mx-auto space-y-5">
          {(visibleTextChunks.length ? visibleTextChunks : textChunks.map((chunk, index) => ({ chunk, index }))).map(({ chunk, index }) => (
            <div key={index} onClick={() => { if (currentDocId) handlePlayChunks(currentDocId, index, currentTitle); }} className="rounded-lg px-4 py-2 cursor-pointer transition-all duration-200" style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "16px", lineHeight: "1.85", ...(index === activeChunk ? { background: "var(--blue-dim)", borderLeft: "2px solid var(--blue)", color: "#F5F1EA" } : index < activeChunk ? { color: "#5A5875", opacity: 0.7 } : { color: "#F5F1EA" }) }}>{chunk}</div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const PodcastTheater = () => (
    <motion.div key="theater" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: dur.smooth, ease: ease.out }} className="flex-1 flex flex-col items-center overflow-hidden">
      {podcastGenerating && !podcastPlayingDocId && (
        <div className="w-full max-w-lg mx-auto mt-10 px-4">
          <FadeUp>
            <div className="rounded-2xl p-8 flex flex-col items-center gap-6" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
              <div className="flex items-end gap-1 h-12">
                {[0.4, 0.7, 1, 0.8, 0.5, 1, 0.6, 0.9, 0.4, 0.75, 1, 0.55].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full animate-wave wave-delay-${(i % 4) + 1}`}
                    style={{ height: `${h * 100}%`, background: "var(--teal)" }}
                  />
                ))}
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2" style={{ color: "var(--teal)", fontFamily: "var(--font-syne)" }}>
                  JackPal Studio
                </div>
                <div className="text-[18px] font-bold" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)" }}>
                  {podcastLoadingMsg || "Preparing episode..."}
                </div>
                <div className="text-[11px] mt-1" style={{ color: "var(--text-3)" }}>
                  Ezinne &amp; Abeo · plays automatically
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      )}
      {podcastScript.length > 0 && (
        <SlideIn className="w-full max-w-xl mx-auto flex-1 overflow-y-auto studio-scroll px-4 py-6 space-y-1">
          <div ref={transcriptRef}>
            {(visiblePodcastLines.length ? visiblePodcastLines : podcastScript.map((line, index) => ({ line, index }))).map(({ line, index }) => (
              <motion.div key={index} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.quick, ease: ease.out }} className="flex gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors" style={index === podcastChunkIndex ? { background: "var(--teal-dim)", borderLeft: "2px solid var(--teal)" } : { borderLeft: "2px solid transparent" }} onClick={() => jumpToPodcastLine(index)}>
                <div className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5" style={line.speaker === "Ezinne" ? { background: "var(--teal)", color: "var(--ink)" } : { background: "var(--blue)", color: "white" }}>{line.speaker?.[0] ?? "E"}</div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>{line.speaker}</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: index === podcastChunkIndex ? "var(--text-1)" : "var(--text-2)" }}>{line.text}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </SlideIn>
      )}
    </motion.div>
  );

  const RightPanel = () => (
    <AnimatePresence>
      {selectedDocId && selectedDoc && (
        <motion.aside key="panel" initial={{ width: 0, opacity: 0 }} animate={{ width: 304, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={ease.spring} className="flex-shrink-0 overflow-hidden" style={{ borderLeft: "1px solid var(--border)", background: "var(--surface)" }}>
          <div className="h-full overflow-y-auto studio-scroll p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold truncate" style={{ color: "var(--text-2)" }}>{selectedDoc.filename}</div>
              <button className="p-1 rounded" style={{ color: "var(--text-3)" }} onClick={() => setSelectedDocId(null)}><X size={14} /></button>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => { if (selectedDoc) { setShowTranscript(true); handleGenerateAudio(selectedDoc); } }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white"
                style={{ background: "var(--blue)" }}
              >
                <Play size={11} strokeWidth={2} /> Listen
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => { if (selectedDoc) handlePodcast(selectedDoc); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                style={{ border: "1px solid var(--teal)", color: "var(--teal)" }}
              >
                <Mic2 size={11} strokeWidth={2} /> Podcast
              </motion.button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>AI Study Summary</span>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSummarize(selectedDoc)} disabled={summaryLoadingId === selectedDocId} className="p-1.5 rounded-lg transition-colors" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                  {summaryLoadingId === selectedDocId ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} strokeWidth={1.75} />}
                </motion.button>
              </div>
              <AnimatePresence>
                {summaries[selectedDocId] && <FadeUp><pre className="text-[11px] leading-relaxed whitespace-pre-wrap rounded-xl p-3" style={{ fontFamily: "var(--font-syne), monospace", background: "var(--surface-2)", color: "var(--text-2)" }}>{summaries[selectedDocId]}</pre></FadeUp>}
              </AnimatePresence>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Chapters</div>
              {chapters.length > 0 ? (
                <div className="space-y-0.5">
                  {chapters.map((ch, i) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors" style={{ color: "var(--text-2)" }} onClick={() => { setShowTranscript(true); handleJumpToChapter(selectedDoc.id, i); }}>
                      <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full text-[9px] font-bold" style={{ background: "var(--surface-3)", color: "var(--text-3)" }}>{i + 1}</span>
                      <span className="text-[11px] truncate">{ch.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={() => handleViewChapters(selectedDoc)} className="text-[10px] rounded-lg px-3 py-2" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>Load chapters</button>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-3" style={{ color: "var(--text-3)" }}>
                <Sparkles size={10} strokeWidth={1.75} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Ask JackPal</span>
              </div>
              <form onSubmit={(e) => handleAsk(selectedDocId, e)} className="flex gap-2">
                <input value={qaQuestion[selectedDocId] ?? ""} onChange={(e) => setQaQuestion((p) => ({ ...p, [selectedDocId]: e.target.value }))} placeholder="Ask anything about this doc..." className="flex-1 rounded-xl px-3 py-2 text-[11px] outline-none transition-colors" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={qaLoading === selectedDocId || !(qaQuestion[selectedDocId] ?? "").trim()} className="px-3 py-2 rounded-xl text-white text-[10px] font-bold transition-all" style={{ background: "var(--blue)" }}>
                  {qaLoading === selectedDocId ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} strokeWidth={2} />}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );

  const PlayerBar = () => {
    if (!currentDocId && !podcastPlayingDocId && !isAudioLoading) return null;
    const isPodcast = !!podcastPlayingDocId;
    const chunkTotal = isPodcast ? podcastScript.length : textChunks.length;
    const chunkCurrent = isPodcast ? podcastChunkIndex : activeChunk;
    const isPlaying = isPodcast ? !!podcastPlayingDocId : !!playingDocId;
    return (
      <div className="fixed bottom-0 z-50 flex items-center gap-4 px-5" style={{ left: 56, right: 0, height: 64, background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 w-48 min-w-0 flex-shrink-0">
          <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold" style={isPodcast ? { background: "var(--teal)", color: "var(--ink)" } : { background: "var(--blue)", color: "white" }}>
            {isPodcast ? currentSpeaker?.[0] ?? "E" : <AudioLines size={13} strokeWidth={1.75} />}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{currentTitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skipBy(-10)} style={{ color: "var(--text-3)" }}><SkipBack size={16} strokeWidth={1.75} /></motion.button>
          <SpringScale>
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => { const audio = audioRef.current; if (!audio) return; if (audio.paused) audio.play().catch(() => {}); else audio.pause(); }} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: isPodcast ? "var(--teal)" : "var(--blue)", color: isPodcast ? "var(--ink)" : "white" }}>
              <AnimatePresence mode="wait">
                {isAudioLoading ? <motion.span key="spin" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Loader2 size={15} className="animate-spin" /></motion.span> : isPlaying ? <motion.span key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Pause size={15} strokeWidth={2} /></motion.span> : <motion.span key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Play size={15} strokeWidth={2} /></motion.span>}
              </AnimatePresence>
            </motion.button>
          </SpringScale>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skipBy(10)} style={{ color: "var(--text-3)" }}><SkipForward size={16} strokeWidth={1.75} /></motion.button>
        </div>
        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: "var(--text-3)" }}>
            {formatTime(currentTime)}
          </span>
          <div
            className="relative flex-1 h-1 rounded-full cursor-pointer group"
            style={{ background: "var(--surface-3)" }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seekWithinCurrent(pct * 100);
            }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${playerProgress}%`, background: isPodcast ? "var(--teal)" : "var(--blue)" }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                left: `calc(${playerProgress}% - 6px)`,
                background: isPodcast ? "var(--teal)" : "var(--blue)",
                borderColor: "var(--ink)",
              }}
            />
          </div>
          <span className="text-[10px] tabular-nums flex-shrink-0" style={{ color: "var(--text-3)" }}>
            {formatTime(duration)}
          </span>
        </div>
        <button onClick={() => { const next = SPEED_OPTIONS[(SPEED_OPTIONS.indexOf(playbackRate) + 1) % SPEED_OPTIONS.length]; setPlaybackRate(next); if (audioRef.current) audioRef.current.playbackRate = next; }} className="text-[10px] font-bold w-10 text-center transition-colors" style={{ color: "var(--text-3)" }}>{playbackRate}x</button>
        {currentDocId && <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDownload(currentDocId)} style={{ color: "var(--text-3)" }}><Download size={15} strokeWidth={1.75} /></motion.button>}
      </div>
    );
  };

  return (
    <div className="studio flex h-screen overflow-hidden" style={{ background: "var(--ink)", color: "var(--text-1)" }}>
      <audio ref={audioRef} />
      <LeftRail />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ paddingBottom: currentDocId || podcastPlayingDocId || isAudioLoading ? 64 : 0 }}>
        <AnimatePresence mode="wait">
          {activeTab === "home" && !currentDocId && !podcastPlayingDocId && <LibraryView key="library" />}
          {currentDocId && !podcastPlayingDocId && <SyncReader key="reader" />}
          {(podcastPlayingDocId || podcastGenerating) && <PodcastTheater key="podcast" />}
        </AnimatePresence>
      </main>
      <RightPanel />
      <PlayerBar />
    </div>
  );
}
