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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chapters
  const [chaptersDocId, setChaptersDocId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // AI Summary
  const [summaryDocId, setSummaryDocId] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Podcast mode
  const [docMode, setDocMode] = useState<Record<string, "listen" | "podcast">>({});
  const [podcastGenerating, setPodcastGenerating] = useState<string | null>(null);
  const [podcastPlayingDocId, setPodcastPlayingDocId] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<PodcastLine[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [podcastChunkIndex, setPodcastChunkIndex] = useState(0);
  const podcastQueueRef = useRef<{ url: string; speaker: string }[]>([]);
  const podcastIndexRef = useRef(0);
  const [podcastMode, setPodcastMode] = useState<"standard" | "pidgin">("standard");
  const [podcastTopic, setPodcastTopic] = useState<string | null>(null); // section text being podcasted

  // Resume playback — chunk index per document
  const [savedProgress, setSavedProgress] = useState<Record<string, number>>({});

  // Transcript / seeking
  const [docText, setDocText] = useState<string>("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // 80-word chunks matching backend split — enables click-to-seek
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
    }
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
        setUploadError("Document not found on server — try re-uploading your file.");
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
    const { chunks } = await getAudioChunks(docId);
    if (!chunks.length || !chunks[startChunk]) return;
    chunkQueueRef.current = chunks.map(c => c.url);
    chunkIndexRef.current = startChunk;
    setPlayingDocId(docId);
    playNextChunk(docId, title);
  }

  function playNextChunk(docId: string, title: string) {
    const url = chunkQueueRef.current[chunkIndexRef.current];
    if (!url) { setPlayingDocId(null); return; }
    const audio = new Audio(url);
    attachAudio(audio, docId, title, "chunks", chunkIndexRef.current, async () => {
      chunkIndexRef.current += 1;
      // Refresh chunk list in case more are ready
      const { chunks } = await getAudioChunks(docId);
      chunkQueueRef.current = chunks.map(c => c.url);
      if (chunkQueueRef.current[chunkIndexRef.current]) {
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
    setSummaryDocId(doc.id);
    setSummary("");
    setSummaryLoading(true);
    try {
      const result = await summarizeDocument(doc.id);
      setSummary(result.summary);
    } catch {
      setSummary("Could not generate summary. Make sure Ollama is running.");
    } finally {
      setSummaryLoading(false);
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
    } catch { /* non-fatal — transcript just won't show */ }
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
    // If already playing this podcast — toggle pause/play (unless regenerating or switching topic)
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
    setShowTranscript(true); // Always show transcript when podcast starts

    try {
      const result = await generatePodcast(doc.id, regenerate || !!topic || chapterIndex !== undefined, podcastMode, topic, chapterIndex);
      setPodcastScript(result.script || []);

      // Fetch chunks and start playing
      const chunksRes = await getPodcastChunks(doc.id);
      podcastQueueRef.current = chunksRes.chunks.map(c => ({ url: c.url, speaker: c.speaker }));
      podcastIndexRef.current = 0;

      if (chunksRes.chunks.length > 0) {
        playNextPodcastChunk(doc.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Podcast generation failed.";
      const isNotFound = msg.toLowerCase().includes("not found") || msg.includes("404");
      setUploadError(
        isNotFound
          ? "Document not found on server — try re-uploading your file."
          : msg.includes("Script generation") || msg.includes("empty")
          ? "AI script generation failed. Is Ollama running? (ollama serve)"
          : msg
      );
      setIsAudioLoading(false);
      if (isNotFound) {
        // Refresh document list — this doc no longer exists on the server
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

  return (
    <div className="flex h-screen bg-[#F7F7F7] text-[#02013D] font-sans overflow-hidden">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-60 bg-[#02013D] text-white p-6 border-r-4 border-[#2585C7] h-full relative z-[150]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2585C7]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <Link href="/" className="flex items-center gap-3 mb-12 group relative z-10">
          <Image src="/images/logo.svg" alt="JackPal" width={32} height={32} className="brightness-0 invert group-hover:rotate-12 transition-transform" />
          <span className="text-xl font-black italic tracking-tighter uppercase">JackPal</span>
        </Link>

        <nav className="flex-1 space-y-1 relative z-10">
          {[
            { id: 'home', icon: Home, label: 'Dashboard' },
            { id: 'library', icon: Library, label: 'Audio Library' },
            { id: 'files', icon: FolderOpen, label: 'Study Materials' },
            { id: 'profile', icon: User, label: 'Account Profile' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === item.id
                  ? 'bg-[#2585C7] text-white shadow-lg shadow-[#2585C7]/20'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 relative z-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[#61E3F0] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* DESKTOP TOP BAR */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/50 backdrop-blur-md border-b border-[#EFEFEF]">
          <div className="relative w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#02013D]/20 group-focus-within:text-[#2585C7] transition-colors" />
            <input
              type="text"
              placeholder="Search your library..."
              className="w-full bg-[#F7F7F7] border-2 border-transparent rounded-xl py-2 pl-10 pr-4 font-bold text-[10px] focus:outline-none focus:border-[#2585C7] focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative bg-white p-2 rounded-lg border border-[#EFEFEF] hover:border-[#2585C7] transition-all">
              <Bell className="h-4 w-4 text-[#02013D]/60" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#2585C7] rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-[#EFEFEF]" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-tighter">{user?.full_name || "Student"}</div>
                <div className="text-[9px] font-bold text-[#2585C7] uppercase">{user?.email || ""}</div>
              </div>
              <div className="h-8 w-8 bg-[#2585C7] rounded-lg flex items-center justify-center text-white font-black italic text-xs">
                {user?.full_name?.slice(0, 2).toUpperCase() || "JP"}
              </div>
            </div>
          </div>
        </header>

        {/* MOBILE TOP BAR */}
        <header className="md:hidden flex items-center justify-between px-6 py-3 bg-white/50 backdrop-blur-md border-b border-[#EFEFEF]">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.svg" alt="JackPal" width={24} height={24} />
            <span className="text-base font-black italic tracking-tighter uppercase">JackPal</span>
          </div>
          <button className="bg-[#2585C7] p-2 rounded-lg text-white shadow-lg shadow-[#2585C7]/20">
            <Bell className="h-4 w-4" />
          </button>
        </header>

        {/* Upload error banner */}
        {uploadError && (
          <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-lg flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{uploadError}</p>
            <button onClick={() => setUploadError("")}><X className="h-4 w-4 text-red-400" /></button>
          </div>
        )}

        {/* Uploading indicator */}
        {uploading && (
          <div className="mx-6 mt-4 bg-[#2585C7]/10 border-l-4 border-[#2585C7] p-3 rounded-lg flex items-center gap-3">
            <Loader2 className="h-4 w-4 text-[#2585C7] animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#2585C7]">Uploading & extracting text...</p>
          </div>
        )}

        {/* SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 pb-32 md:pb-8">

            {/* HERO */}
            <section className="bg-[#02013D] rounded-3xl md:rounded-[2rem] p-6 md:p-10 text-white relative overflow-hidden border-b-4 border-[#2585C7] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#2585C7]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
              <div className="space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 bg-[#2585C7]/20 text-[#61E3F0] px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                  <AudioLines className="h-3 w-3" />
                  Nigerian AI Study Platform
                </div>
                <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">
                  Welcome back, <br />
                  <span className="text-[#2585C7] underline decoration-[#2585C7]/20 decoration-4 underline-offset-4">{firstName}.</span>
                </h1>
                <p className="text-xs md:text-base text-white/50 font-bold max-w-md leading-relaxed">
                  {documents.length > 0
                    ? `${documents.length} document${documents.length > 1 ? "s" : ""} in your library. Listen to it or let Ezinne & Abeo discuss it.`
                    : "Upload lecture notes → Listen as Nigerian voices read it or discuss it like a podcast. Works offline."}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">🎙️ Podcast Mode</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">📶 Works Offline</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">🇳🇬 Nigerian Voices</span>
                </div>
              </div>
              <div className="flex gap-3 relative z-10">
                <div className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                  <div className="text-[9px] font-black uppercase text-[#2585C7] mb-1 tracking-widest">Docs</div>
                  <div className="text-3xl font-black italic leading-none">{documents.length}</div>
                  <div className="text-[9px] font-bold text-white/30 uppercase mt-1">Total</div>
                </div>
                <div className="bg-[#2585C7] p-4 rounded-2xl text-center min-w-[100px] shadow-xl shadow-[#2585C7]/20 flex flex-col justify-center">
                  <div className="text-[9px] font-black uppercase text-white/60 mb-1 tracking-widest">Audio</div>
                  <div className="text-xl font-black italic leading-none uppercase">
                    {documents.filter(d => d.status === "audio_ready").length}
                  </div>
                  <div className="text-[9px] font-bold text-white/60 uppercase mt-1">Ready</div>
                </div>
              </div>
            </section>

            {/* PREMIUM OVERVIEW (Main branch UI) */}
            <section className="space-y-8 lg:space-y-12">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {[
                  { label: "Study Streak", value: "12 Days", icon: Flame, color: "#2585C7", gradient: "from-[#2585C7]/10 to-transparent" },
                  { label: "Hours Listened", value: "48.5h", icon: Clock, color: "#61E3F0", gradient: "from-[#61E3F0]/10 to-transparent" },
                  { label: "Retention", value: "92%", icon: TrendingUp, color: "#0F1774", gradient: "from-[#0F1774]/10 to-transparent" },
                  { label: "Materials", value: "24", icon: Library, color: "#2261B9", gradient: "from-[#2261B9]/10 to-transparent" },
                ].map((stat, i) => (
                  <div key={stat.label}
                       className="bg-white/60 backdrop-blur-xl p-4 sm:p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(37,133,199,0.08)] transition-all group overflow-hidden relative flex flex-col justify-between min-h-[110px] sm:min-h-[130px] lg:min-h-[150px]"
                       style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.gradient} rounded-full blur-2xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500`} />

                    <div className="flex items-start justify-between relative z-10 w-full">
                      <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white border border-white/50 shadow-sm group-hover:-translate-y-1 transition-transform duration-300">
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" style={{ color: stat.color }} />
                      </div>
                      <span className="bg-white/80 backdrop-blur text-[9px] sm:text-[10px] font-bold text-[#02013D]/60 uppercase tracking-widest px-2 py-1 rounded-lg border border-white/50">
                        Top 5%
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5 sm:gap-1 relative z-10 mt-4 sm:mt-6">
                      <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-[#02013D]/50 uppercase tracking-widest">{stat.label}</span>
                      <span className="text-xl sm:text-2xl lg:text-3xl font-black italic tracking-tighter uppercase text-[#02013D] group-hover:text-[#2585C7] transition-colors">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-10">
                <div className="xl:col-span-2 space-y-8 lg:space-y-10">
                  <section className="relative overflow-hidden bg-[#02013D] rounded-[2rem] lg:rounded-[3rem] p-6 sm:p-8 lg:p-12 shadow-[0_20px_40px_rgba(2,1,61,0.2)] group border border-white/10">
                    <div className="absolute top-0 right-0 w-full h-full bg-[url('/images/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                    <div className="absolute -top-[50%] -right-[20%] w-[100%] h-[150%] bg-gradient-to-b from-[#2585C7]/40 to-transparent blur-[100px] rounded-full group-hover:scale-105 group-hover:opacity-80 transition-all duration-700 ease-in-out pointer-events-none" />
                    <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-[#61E3F0]/20 blur-[80px] rounded-full group-hover:translate-x-10 transition-transform duration-1000 ease-in-out pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12">
                      <div className="space-y-4 sm:space-y-6 text-center md:text-left flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 w-fit mx-auto md:mx-0">
                          <span className="w-2 h-2 rounded-full bg-[#61E3F0] animate-pulse" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Personalized Session</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-[1.1] text-white">
                          Master your <br className="hidden md:block" />
                          <span className="bg-gradient-to-r from-[#61E3F0] to-[#2585C7] bg-clip-text text-transparent">next lesson</span>
                        </h2>
                        <p className="text-white/70 text-xs sm:text-sm font-medium max-w-sm mx-auto md:mx-0 leading-relaxed">
                          We've curated a high-yield audio study session based on your weakness in Cellular Biology.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                          <button className="w-full sm:w-auto bg-gradient-to-r from-[#2585C7] to-[#2261B9] hover:from-[#61E3F0] hover:to-[#2585C7] text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 hover:shadow-[0_10px_20px_rgba(37,133,199,0.3)] hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2">
                            <Play className="w-4 h-4 fill-white" /> Start Listening
                          </button>
                          <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">Est. 25 Mins</span>
                        </div>
                      </div>

                      <div className="hidden sm:flex relative w-48 h-48 lg:w-56 lg:h-56 items-center justify-center">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 rotate-12 group-hover:rotate-[15deg] transition-transform duration-700 ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-br from-[#2585C7] to-transparent opacity-20 rounded-[3rem] -rotate-6 group-hover:-rotate-12 transition-transform duration-700 ease-out" />
                        <Mic2 className="w-20 h-20 text-[#61E3F0] relative z-10 filter drop-shadow-[0_0_15px_rgba(97,227,240,0.5)] group-hover:scale-110 transition-transform duration-500 delay-100" />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5 sm:space-y-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase text-[#02013D]">Continue Learning</h2>
                        <p className="text-[10px] sm:text-xs font-bold text-[#02013D]/40 uppercase tracking-widest mt-1">Pick up where you left off</p>
                      </div>
                      <button className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#2585C7] flex items-center gap-1 hover:gap-2 transition-all p-2 bg-white/50 backdrop-blur-md rounded-xl border border-white/60 hover:bg-white hover:shadow-sm">
                        View All <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recentAudios.map((audio, i) => (
                        <div key={audio.id}
                             className="bg-white/60 backdrop-blur-xl group p-4 sm:p-5 rounded-[2rem] border border-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(37,133,199,0.08)] hover:bg-white transition-all duration-300 flex items-center gap-4 cursor-pointer relative overflow-hidden"
                             style={{ animationDelay: `${(i + 4) * 100}ms` }}
                        >
                          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#2585C7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                          <div
                             className="h-16 w-16 sm:h-20 sm:w-20 rounded-[1.25rem] sm:rounded-[1.5rem] flex items-center justify-center text-white flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300 border border-black/5 shadow-inner"
                             style={{ backgroundColor: audio.color }}
                          >
                             <Play className="h-6 w-6 sm:h-8 sm:w-8 fill-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                             <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                             <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out" />
                          </div>

                          <div className="flex-1 space-y-1.5 min-w-0">
                             <div className="flex items-center justify-between">
                                <div className="text-[9px] sm:text-[10px] font-bold text-[#2585C7] bg-[#2585C7]/10 px-2 py-0.5 rounded-md uppercase tracking-widest">{audio.chapter}</div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-[#02013D]/40 uppercase flex items-center gap-1">
                                   <Clock className="w-3 h-3" /> {audio.duration}
                                </span>
                             </div>
                             <h4 className="text-sm sm:text-base font-black uppercase tracking-tighter text-[#02013D] truncate group-hover:text-[#2585C7] transition-colors">{audio.title}</h4>
                             <div className="flex items-center gap-3 pt-1">
                                <div className="flex-1 h-2 bg-[#EFEFEF] rounded-full overflow-hidden shadow-inner">
                                   <div className="h-full bg-gradient-to-r from-[#2585C7] to-[#61E3F0] rounded-full relative" style={{ width: `${audio.progress}%` }}>
                                      <div className="absolute inset-0 bg-[#02013D]/10 mix-blend-overlay opacity-20" />
                                   </div>
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-black text-[#02013D]/60 min-w-[30px]">{audio.progress}%</span>
                             </div>
                          </div>
                       </div>
                      ))}
                    </div>
                  </section>
                </div>

                <aside className="space-y-6 lg:space-y-8">
                  <section className="bg-white/70 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-6 relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2585C7]/5 rounded-full blur-[40px] group-hover:bg-[#2585C7]/10 transition-colors" />

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#02013D]/5 rounded-xl border border-[#02013D]/10">
                        <TrendingUp className="h-5 w-5 text-[#02013D]" />
                      </div>
                      <h3 className="text-sm sm:text-base font-black uppercase tracking-tighter text-[#02013D]">Weekly Overview</h3>
                    </div>

                    <div className="space-y-5">
                      {[
                        { label: "Daily Goal", progress: 65, color: "#2585C7" },
                        { label: "Exam Readiness", progress: 82, color: "#61E3F0" },
                        { label: "Memory Retention", progress: 45, color: "#0F1774" },
                      ].map((p, i) => (
                        <div key={p.label} className="space-y-2" style={{ animationDelay: `${i * 150}ms` }}>
                          <div className="flex justify-between items-center px-1">
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#02013D]/60">{p.label}</span>
                            <span className="text-[10px] sm:text-xs font-black text-[#02013D]">{p.progress}%</span>
                          </div>
                          <div className="h-2.5 bg-[#02013D]/5 rounded-full overflow-hidden border border-[#02013D]/5">
                            <div className="h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${p.progress}%`, backgroundColor: p.color }}>
                              <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full blur-[2px]" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="w-full py-4 rounded-xl bg-gradient-to-b from-white to-[#F7F7F7] border border-[#EFEFEF] hover:border-[#2585C7]/30 hover:shadow-md transition-all text-[10px] font-black uppercase tracking-widest text-[#02013D] group/btn flex items-center justify-center gap-2">
                      Full Analytics Report <ChevronRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </section>

                  <section className="bg-gradient-to-br from-[#2585C7]/5 to-[#61E3F0]/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-white/50 shadow-inner space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#2585C7]" />
                      </div>
                      <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] text-[#02013D]/70">Student Hub</h3>
                    </div>
                    <div className="space-y-3 pt-2">
                      {[
                        { text: "New Yorùbá voice model now available", tag: "New" },
                        { text: "Beta: AI Summary for Medical Students", tag: "Beta" },
                        { text: "Refer a friend and get 1 month Premium", tag: "Promo" },
                      ].map((news, i) => (
                        <div key={i} className="flex gap-3 items-start group cursor-pointer p-3 rounded-xl hover:bg-white/60 transition-colors border border-transparent hover:border-white/80">
                          <div className="h-1.5 w-1.5 bg-[#2585C7] rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_5px_rgba(37,133,199,0.5)] group-hover:scale-150 transition-transform" />
                          <div className="space-y-1 mt-[-2px]">
                            <p className="text-[10px] sm:text-xs font-bold text-[#02013D]/80 group-hover:text-[#2585C7] transition-colors leading-snug">{news.text}</p>
                            <span className="inline-block text-[8px] font-black uppercase tracking-widest text-[#2585C7]/60 bg-[#2585C7]/10 px-1.5 py-0.5 rounded">{news.tag}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </aside>
              </div>
            </section>

            {(currentDocId || podcastPlayingDocId) && (
              <section className={`relative overflow-hidden rounded-[2rem] border-4 p-5 md:p-6 text-white shadow-2xl ${podcastPlayingDocId ? "border-[#61E3F0] bg-gradient-to-br from-[#02013D] via-[#0F3D2A] to-[#0A5C3A] shadow-[#61E3F0]/20" : "border-[#02013D] bg-gradient-to-br from-[#02013D] via-[#0F1774] to-[#2585C7] shadow-[#02013D]/20"}`}>
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10 space-y-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2 min-w-0">
                      {podcastPlayingDocId ? (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#61E3F0]/30 bg-[#61E3F0]/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#61E3F0]">
                              <AudioLines className="h-3.5 w-3.5 animate-pulse" />
                              Podcast Mode — Ezinne &amp; Abeo
                            </div>
                            {podcastMode === "pidgin" && (
                              <div className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-widest border border-[#61E3F0]/40 bg-[#61E3F0]/15 text-[#61E3F0]">
                                Pidgin
                              </div>
                            )}
                          </div>
                          <div className="text-lg font-black uppercase tracking-tight md:text-2xl">{currentTitle}</div>
                          {currentSpeaker && (
                            <div className="flex items-center gap-2">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-black ${currentSpeaker === "Ezinne" ? "bg-[#61E3F0] text-[#02013D]" : "bg-[#2585C7] text-white"}`}>
                                {currentSpeaker[0]}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                                {currentSpeaker} is speaking
                              </span>
                              <span className="text-[9px] text-white/40">
                                — {PODCAST_HOSTS.find(h => h.name === currentSpeaker)?.role}
                              </span>
                            </div>
                          )}
                          <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                            {isAudioLoading ? "Buffering..." : podcastPlayingDocId ? "Playing" : "Paused"}
                            {" · "} Line {podcastChunkIndex + 1} of {podcastScript.length || "?"}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#61E3F0]">
                            <AudioLines className="h-3.5 w-3.5" />
                            {playerMode === "stream" ? "Fast Start Mode" : "Read Aloud"}
                          </div>
                          <div className="text-lg font-black uppercase tracking-tight md:text-2xl">{currentTitle}</div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                            <span>{currentDoc?.word_count?.toLocaleString() ?? 0} words</span>
                            <span>{isAudioLoading ? "Buffering" : playingDocId ? "Playing" : "Paused"}</span>
                            <span>{getVoiceMeta(currentDoc?.audio_voice ?? selectedVoice).label}</span>
                          </div>
                        </>
                      )}
                    </div>
                    {!podcastPlayingDocId && (
                      <div className="flex flex-col items-stretch gap-2 md:min-w-[200px]">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Voice</label>
                        <select
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value)}
                          className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-[11px] font-black uppercase tracking-widest text-white outline-none"
                        >
                          {VOICE_OPTIONS.map((v) => (
                            <option key={v.value} value={v.value} className="text-[#02013D]">
                              {v.label} — {v.desc}
                            </option>
                          ))}
                        </select>
                        <div className="text-[9px] font-bold text-white/60">Nigerian English · Microsoft Azure</div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {!podcastPlayingDocId && (
                        <>
                          <button
                            onClick={() => handleChunkNavigation(-1)}
                            disabled={!canGoPrevChunk}
                            className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <SkipBack className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          if (podcastPlayingDocId) {
                            const docId = podcastPlayingDocId;
                            if (audioRef.current?.paused) {
                              audioRef.current.play().catch(() => setPodcastPlayingDocId(null));
                              setPodcastPlayingDocId(docId);
                            } else {
                              audioRef.current?.pause();
                              setPodcastPlayingDocId(null);
                            }
                          } else {
                            toggleCurrentPlayback();
                          }
                        }}
                        className="rounded-2xl bg-[#61E3F0] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#02013D] transition hover:brightness-105"
                      >
                        {(podcastPlayingDocId || playingDocId) ? "Pause" : "Play"}
                      </button>
                      {!podcastPlayingDocId && (
                        <button
                          onClick={() => handleChunkNavigation(1)}
                          disabled={!canGoNextChunk}
                          className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <SkipForward className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                      <span>{formatTime(currentTime)}</span>
                      <div className="flex items-center gap-3">
                        {/* Transcript toggle */}
                        <button
                          onClick={() => setShowTranscript(v => !v)}
                          className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${showTranscript ? "border-[#61E3F0] text-[#61E3F0] bg-[#61E3F0]/10" : "border-white/20 text-white/40 hover:text-white/70"}`}
                        >
                          {showTranscript ? "Hide" : "Transcript"}
                        </button>
                        {showTranscript && (
                          <button
                            onClick={() => setShowFullTranscript(v => !v)}
                            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${
                              showFullTranscript
                                ? "border-[#2585C7] text-[#2585C7] bg-[#2585C7]/10"
                                : "border-white/20 text-white/40 hover:text-white/70"
                            }`}
                          >
                            {showFullTranscript ? "Windowed" : "Full"}
                          </button>
                        )}
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.1}
                        value={playerProgress}
                        onChange={(e) => seekWithinCurrent(parseFloat(e.target.value))}
                        className="h-3 w-full cursor-pointer appearance-none rounded-full bg-white/10"
                      />
                      <div className="pointer-events-none absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-[#61E3F0]" style={{ width: `${playerProgress}%` }} />
                    </div>
                  </div>

                  {/* TRANSCRIPT / CHAPTER PANEL */}
                  {showTranscript && (
                    <div
                      ref={transcriptRef}
                      className="max-h-56 overflow-y-auto rounded-2xl bg-black/20 border border-white/10 p-2 space-y-0.5"
                    >
                      {podcastPlayingDocId ? (
                        /* Podcast mode: show script lines, click to jump */
                        visiblePodcastLines.length > 0 ? visiblePodcastLines.map(({ line, index }) => (
                          <button
                            key={index}
                            data-active={index === podcastChunkIndex}
                            onClick={() => jumpToPodcastLine(index)}
                            className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                              index === podcastChunkIndex
                                ? "bg-[#61E3F0]/15 border border-[#61E3F0]/30"
                                : "hover:bg-white/5"
                            }`}
                          >
                            <span className={`text-[9px] font-black uppercase tracking-widest mr-2 ${line.speaker === "Ezinne" ? "text-[#61E3F0]" : "text-[#2585C7]"}`}>
                              {line.speaker}
                            </span>
                            <span className={`text-[10px] font-bold ${index === podcastChunkIndex ? "text-white" : "text-white/50"}`}>
                              {line.text}
                            </span>
                          </button>
                        )) : (
                          <p className="text-[9px] text-white/30 font-bold text-center py-4">Generating script...</p>
                        )
                      ) : (
                        /* Listen mode: text chunks, click to jump to that chunk */
                        visibleTextChunks.length > 0 ? visibleTextChunks.map(({ chunk, index }) => (
                          <button
                            key={index}
                            data-active={index === activeChunk}
                            onClick={() => currentDocId && handlePlayChunks(currentDocId, index, currentTitle)}
                            className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                              index === activeChunk
                                ? "bg-[#61E3F0]/15 border border-[#61E3F0]/30"
                                : "hover:bg-white/5"
                            }`}
                          >
                            <span className="text-[9px] font-black text-white/20 mr-2 tabular-nums">{index + 1}</span>
                            <span className={`text-[10px] font-bold ${index === activeChunk ? "text-white" : "text-white/50"}`}>
                              {chunk.length > 140 ? chunk.slice(0, 140) + "…" : chunk}
                            </span>
                          </button>
                        )) : (
                          <p className="text-[9px] text-white/30 font-bold text-center py-4">Loading transcript...</p>
                        )
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => skipBy(-15)}
                        className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/80 transition hover:bg-white/15"
                      >
                        -15s
                      </button>
                      <button
                        onClick={() => skipBy(15)}
                        className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/80 transition hover:bg-white/15"
                      >
                        +15s
                      </button>
                      {SPEED_OPTIONS.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackRate(speed)}
                          className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
                            playbackRate === speed ? "bg-white text-[#02013D]" : "bg-white/10 text-white/70 hover:bg-white/15"
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                    {currentDocId && (
                      <button
                        onClick={() => handleDownload(currentDocId)}
                        disabled={!currentDoc || (currentDoc.ready_chunks ?? 0) === 0 || downloadingDocId === currentDocId}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#02013D]/40 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#02013D]/60 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {downloadingDocId === currentDocId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {downloadingDocId === currentDocId ? "Preparing Download" : "Download Ready Audio"}
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            <div className="grid lg:grid-cols-[1fr_280px] gap-8">
              {/* MAIN FEED */}
              <div className="space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black uppercase tracking-tighter flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#2585C7]" />
                      Your Documents
                    </h3>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[9px] font-black uppercase tracking-widest text-[#2585C7] flex items-center gap-1 hover:underline"
                    >
                      + Upload <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>

                  {docsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border-2 border-[#EFEFEF] p-5 animate-pulse">
                          <div className="flex justify-between mb-3">
                            <div className="space-y-2 flex-1">
                              <div className="h-3 bg-[#F0F0F0] rounded-full w-16" />
                              <div className="h-4 bg-[#F0F0F0] rounded-full w-3/4" />
                              <div className="h-3 bg-[#F0F0F0] rounded-full w-1/4" />
                            </div>
                            <div className="flex gap-2">
                              <div className="h-8 w-8 bg-[#F0F0F0] rounded-xl" />
                              <div className="h-8 w-8 bg-[#F0F0F0] rounded-xl" />
                            </div>
                          </div>
                          <div className="h-9 bg-[#F0F0F0] rounded-xl w-full" />
                        </div>
                      ))}
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-[#EFEFEF] rounded-2xl p-10 text-center space-y-3">
                      <CloudUpload className="h-10 w-10 text-[#2585C7]/30 mx-auto" />
                      <p className="text-xs font-black uppercase tracking-widest text-[#02013D]/30">No documents yet</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#2585C7] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                      >
                        Upload Your First Doc
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc) => {
                        const readyChunks = doc.ready_chunks ?? 0;
                        const totalChunks = doc.total_chunks ?? 0;
                        const pct = totalChunks > 0 ? Math.round((readyChunks / totalChunks) * 100) : 0;
                        const voiceMatches = doc.audio_voice === selectedVoice;
                        const canPlay = (readyChunks > 0 || doc.status === "audio_ready") && voiceMatches;
                        const isGenerating = doc.status === "generating" || doc.status === "streaming";
                        const mode = docMode[doc.id] ?? "listen";
                        const isPodcastGenerating = podcastGenerating === doc.id;
                        const isPodcastPlaying = podcastPlayingDocId === doc.id;
                        const subject = subjects[doc.id];

                        return (
                          <div key={doc.id} className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-lg transition-all overflow-hidden ${isPodcastPlaying ? "border-[#61E3F0] shadow-[#61E3F0]/10" : playingDocId === doc.id ? "border-[#2585C7]" : "border-[#EFEFEF] hover:border-[#2585C7]"}`}>
                            <div className="p-5 flex flex-col gap-3">

                              {/* Header: subject tag + filename + action icons */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 flex-1 min-w-0">
                                  {subject ? (
                                    <div className="inline-flex items-center gap-1 bg-[#2585C7]/10 text-[#2585C7] px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mb-1">
                                      {subject}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const tag = prompt("Enter course / subject (e.g. BIO 201, Law of Tort):");
                                        if (tag?.trim()) saveSubject(doc.id, tag.trim());
                                      }}
                                      className="text-[8px] font-black uppercase tracking-widest text-[#02013D]/20 hover:text-[#2585C7] mb-1 block"
                                    >
                                      + Tag course
                                    </button>
                                  )}
                                  <h4 className="font-black text-sm tracking-tight leading-tight line-clamp-1">{doc.filename}</h4>
                                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-[#02013D]/40 uppercase tracking-widest">
                                    <span>{doc.word_count.toLocaleString()} words</span>
                                    {doc.audio_voice && (
                                      <span className="rounded-full bg-[#F7F7F7] px-2 py-0.5 text-[8px] text-[#2585C7]">
                                        {getVoiceMeta(doc.audio_voice).label}
                                      </span>
                                    )}
                                    {doc.status === "audio_ready" && (
                                      <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-2.5 w-2.5" /> Audio Ready
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleDownload(doc.id)}
                                    disabled={readyChunks === 0 || downloadingDocId === doc.id}
                                    className="p-2 rounded-xl text-[#02013D]/30 hover:text-[#2585C7] hover:bg-[#F7F7F7] transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                                    title="Download for offline"
                                  >
                                    {downloadingDocId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleSummarize(doc)}
                                    className="p-2 rounded-xl text-[#02013D]/30 hover:text-[#2585C7] hover:bg-[#F7F7F7] transition-colors"
                                    title="AI Summary"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleViewChapters(doc)}
                                    className={`p-2 rounded-xl transition-colors ${chaptersDocId === doc.id ? "bg-[#2585C7] text-white" : "text-[#02013D]/30 hover:text-[#2585C7] hover:bg-[#F7F7F7]"}`}
                                    title="Chapters"
                                  >
                                    <Library className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDoc(doc.id)}
                                    className="p-2 rounded-xl text-[#02013D]/20 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="Delete document"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Mode toggle */}
                              <div className="flex rounded-xl overflow-hidden border border-[#EFEFEF] w-full">
                                <button
                                  onClick={() => setDocMode(prev => ({ ...prev, [doc.id]: "listen" }))}
                                  className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors ${mode === "listen" ? "bg-[#02013D] text-white" : "bg-white text-[#02013D]/40 hover:text-[#02013D]"}`}
                                >
                                  <Play className="h-3 w-3 fill-current" />
                                  Listen
                                </button>
                                <button
                                  onClick={() => setDocMode(prev => ({ ...prev, [doc.id]: "podcast" }))}
                                  className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors border-l border-[#EFEFEF] ${mode === "podcast" ? "bg-[#61E3F0] text-[#02013D]" : "bg-white text-[#02013D]/40 hover:text-[#02013D]"}`}
                                >
                                  <AudioLines className="h-3 w-3" />
                                  Podcast
                                </button>
                              </div>

                              {/* LISTEN MODE */}
                              {mode === "listen" && (
                                <>
                                  {/* Resume banner — shown when progress is saved and audio isn't already playing */}
                                  {savedProgress[doc.id] && playingDocId !== doc.id && !isGenerating && (
                                    <div className="flex items-center justify-between bg-[#2585C7]/8 border border-[#2585C7]/20 rounded-xl px-3 py-2">
                                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#2585C7]">
                                        <RotateCcw className="h-3 w-3" />
                                        Stopped at chunk {savedProgress[doc.id]! + 1}
                                      </div>
                                      <button
                                        onClick={() => handlePlayChunks(doc.id, savedProgress[doc.id]!, doc.filename)}
                                        className="text-[9px] font-black uppercase tracking-widest text-white bg-[#2585C7] px-2.5 py-1 rounded-lg hover:brightness-110 transition-all"
                                      >
                                        Resume
                                      </button>
                                    </div>
                                  )}
                                  {isGenerating && (
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-[#2585C7] flex items-center gap-1">
                                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                          Generating Nigerian voice audio... {pct}%
                                        </span>
                                        {canPlay && <span className="text-[8px] font-black text-green-600">Ready to play early</span>}
                                      </div>
                                      <div className="w-full h-1.5 bg-[#F7F7F7] rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-[#2585C7] to-[#61E3F0] rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 4)}%` }} />
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex gap-2 items-center">
                                    <select
                                      value={selectedVoice}
                                      onChange={(e) => setSelectedVoice(e.target.value)}
                                      className="rounded-xl border border-[#EFEFEF] bg-[#F7F7F7] px-2.5 py-2 text-[9px] font-black uppercase tracking-widest text-[#02013D] outline-none"
                                    >
                                      {VOICE_OPTIONS.map(v => (
                                        <option key={v.value} value={v.value}>{v.label}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleGenerateAudio(doc)}
                                      disabled={isGenerating && !canPlay}
                                      className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                        playingDocId === doc.id ? "bg-[#61E3F0] text-[#02013D]" :
                                        canPlay ? "bg-[#02013D] text-white hover:bg-[#2585C7]" :
                                        isGenerating ? "bg-[#F7F7F7] text-[#02013D]/30 cursor-wait" :
                                        "bg-[#02013D] text-white hover:bg-[#2585C7]"
                                      }`}
                                    >
                                      {playingDocId === doc.id ? <><Pause className="h-3 w-3 fill-current" /> Pause</> :
                                       isGenerating && !canPlay ? <><Loader2 className="h-3 w-3 animate-spin" /> Preparing...</> :
                                       <><Play className="h-3 w-3 fill-current" /> Play</>}
                                    </button>
                                  </div>
                                </>
                              )}

                              {/* PODCAST MODE */}
                              {mode === "podcast" && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 bg-[#F7F7F7] rounded-xl p-3">
                                    <div className="flex -space-x-2">
                                      <div className="h-7 w-7 rounded-full bg-[#61E3F0] flex items-center justify-center text-[#02013D] text-[9px] font-black border-2 border-white z-10">E</div>
                                      <div className="h-7 w-7 rounded-full bg-[#2585C7] flex items-center justify-center text-white text-[9px] font-black border-2 border-white">A</div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[9px] font-black uppercase tracking-widest text-[#02013D]">Ezinne &amp; Abeo discuss this</div>
                                      <div className="text-[8px] text-[#02013D]/40 font-bold">AI hosts break down your lecture notes like a podcast</div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handlePodcast(doc)}
                                      disabled={isPodcastGenerating}
                                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                        isPodcastPlaying ? "bg-[#61E3F0] text-[#02013D]" :
                                        isPodcastGenerating ? "bg-[#F7F7F7] text-[#02013D]/30 cursor-wait" :
                                        "bg-[#02013D] text-white hover:bg-[#61E3F0] hover:text-[#02013D]"
                                      }`}
                                    >
                                      {isPodcastPlaying ? <><Pause className="h-3 w-3 fill-current" /> Pause Podcast</> :
                                       isPodcastGenerating ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</> :
                                       <><AudioLines className="h-3 w-3" /> Start Podcast</>}
                                    </button>
                                    <button
                                      onClick={() => handlePodcast(doc, true)}
                                      disabled={isPodcastGenerating}
                                      title="Regenerate podcast with fresh AI script"
                                      className="px-2.5 py-2.5 rounded-xl bg-[#F7F7F7] hover:bg-[#61E3F0]/20 text-[#02013D]/40 hover:text-[#02013D] transition-all disabled:opacity-30 disabled:cursor-wait"
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                    </button>
                                  </div>
                                  {/* Language mode selector */}
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => setPodcastMode("standard")}
                                      className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${podcastMode === "standard" ? "bg-[#02013D] text-white" : "bg-[#F7F7F7] text-[#02013D]/40 hover:text-[#02013D]"}`}
                                    >
                                      English
                                    </button>
                                    <button
                                      onClick={() => setPodcastMode("pidgin")}
                                      className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all relative ${podcastMode === "pidgin" ? "bg-[#61E3F0] text-[#02013D]" : "bg-[#F7F7F7] text-[#02013D]/40 hover:text-[#02013D]"}`}
                                    >
                                      Pidgin
                                    </button>
                                    <div className="flex-1" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Chapter list panel */}
                            {chaptersDocId === doc.id && (
                              <div className="border-t-2 border-[#EFEFEF] bg-[#F7F7F7] p-4 space-y-2 max-h-60 overflow-y-auto">
                                <div className="text-[9px] font-black uppercase tracking-widest text-[#02013D]/40 mb-3">
                                  {mode === "podcast" ? "Sections — tap to jump or podcast" : "Chapters — tap to jump"}
                                </div>
                                {chaptersLoading ? (
                                  <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 text-[#2585C7] animate-spin" /></div>
                                ) : chapters.map((ch, i) => (
                                  <div key={i} className={`flex items-center gap-1.5 rounded-xl transition-all ${ch.is_skippable ? "opacity-50" : ""}`}>
                                    <button
                                      onClick={() => canPlay ? handleJumpToChapter(doc.id, i) : undefined}
                                      className="flex-1 flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all text-left group"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`h-6 w-6 rounded-lg text-[9px] font-black flex items-center justify-center shrink-0 ${ch.is_skippable ? "bg-[#F0F0F0] text-[#02013D]/30" : "bg-[#2585C7]/10 text-[#2585C7]"}`}>{i + 1}</div>
                                        <div className="min-w-0">
                                          <span className="text-[10px] font-bold text-[#02013D]/70 group-hover:text-[#02013D] truncate block">{ch.title}</span>
                                          {ch.is_skippable && <span className="text-[8px] font-black uppercase tracking-widest text-orange-400">Non-core · Safe to skip</span>}
                                        </div>
                                      </div>
                                      <span className="text-[8px] font-bold text-[#02013D]/30 shrink-0">{ch.word_count.toLocaleString()}w</span>
                                    </button>
                                    {mode === "podcast" && !ch.is_skippable && (
                                      <button
                                        onClick={() => handlePodcast(doc, false, undefined, i)}
                                        disabled={isPodcastGenerating}
                                        title={`Start podcast about: ${ch.title}`}
                                        className="shrink-0 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#02013D]/50 hover:text-[#02013D] px-2 py-1 rounded-lg hover:bg-[#61E3F0]/20 transition-colors disabled:opacity-30"
                                      >
                                        <AudioLines className="h-3 w-3" />
                                        Podcast
                                      </button>
                                    )}
                                    {ch.is_skippable && canPlay && (
                                      <button
                                        onClick={() => {
                                          const next = chapters[i + 1];
                                          if (next) handleJumpToChapter(doc.id, i + 1);
                                        }}
                                        className="shrink-0 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-orange-400 hover:text-orange-600 px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
                                        title="Skip to next section"
                                      >
                                        <FastForward className="h-3 w-3" />
                                        Skip
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Upload + DRM cards */}
                <section className="hidden md:grid grid-cols-2 gap-4">
                  <div className="bg-[#02013D] text-white p-6 rounded-2xl border-b-4 border-[#61E3F0] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#61E3F0]/10 rounded-full blur-2xl" />
                    <CloudUpload className="h-6 w-6 text-[#61E3F0] mb-3 group-hover:scale-110 transition-transform" />
                    <h4 className="text-lg font-black uppercase tracking-tighter mb-1">New Import</h4>
                    <p className="text-[10px] text-white/40 font-bold leading-relaxed mb-4">Drop a PDF, Word doc, or paste text to generate high-quality AI audio.</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#61E3F0] text-[#02013D] px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                      Upload Now
                    </button>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border-2 border-[#EFEFEF] space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#2585C7]" />
                      <h4 className="text-xs font-black uppercase tracking-widest">DRM Security</h4>
                    </div>
                    <p className="text-[10px] text-[#02013D]/60 font-bold leading-relaxed">Your library is encrypted and locked to this device. No file sharing, no piracy. Pure focus.</p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-[#2585C7] uppercase">
                      <CheckCircle2 className="h-3 w-3" />
                      Active Protection
                    </div>
                  </div>
                </section>
              </div>

              {/* RIGHT SIDEBAR */}
              <aside className="hidden lg:block space-y-8">
                <section className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#02013D]/40">Voices</h3>
                  <div className="bg-white p-5 rounded-2xl border-2 border-[#EFEFEF] space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#61E3F0]/10 rounded-full blur-2xl" />
                    <div className="space-y-1">
                      <div className="text-[8px] font-black uppercase tracking-widest text-[#02013D]/30">Read Aloud Voice</div>
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full rounded-lg border border-[#EFEFEF] bg-[#F7F7F7] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#02013D] outline-none"
                      >
                        {VOICE_OPTIONS.map((v) => (
                          <option key={v.value} value={v.value}>{v.label} — {v.desc}</option>
                        ))}
                      </select>
                      <div className="text-[9px] font-bold text-[#02013D]/40">Nigerian English · Microsoft Azure Neural</div>
                    </div>
                    <div className="pt-2 border-t border-[#EFEFEF]">
                      <div className="text-[8px] font-black uppercase tracking-widest text-[#02013D]/30 mb-2">Podcast Hosts</div>
                      {PODCAST_HOSTS.map((host) => (
                        <div key={host.voice} className="flex items-center gap-3 py-1">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black ${host.voice === "chinenye" ? "bg-[#61E3F0] text-[#02013D]" : "bg-[#2585C7] text-white"}`}>
                            {host.name[0]}
                          </div>
                          <div>
                            <div className="text-[10px] font-black">{host.name}</div>
                            <div className="text-[9px] text-[#02013D]/40 font-bold uppercase tracking-widest">{host.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#02013D]/40">How It Works</h3>
                  <div className="bg-[#02013D] text-white p-5 rounded-2xl space-y-3">
                    {[
                      { icon: "📄", label: "Upload", desc: "Add any PDF, Word doc, or TXT" },
                      { icon: "🎧", label: "Listen", desc: "Ezinne or Abeo reads it aloud" },
                      { icon: "🎙️", label: "Podcast", desc: "Both hosts discuss it like a show" },
                      { icon: "📶", label: "Offline", desc: "Download — no data needed" },
                    ].map((step) => (
                      <div key={step.label} className="flex items-start gap-3">
                        <span className="text-base">{step.icon}</span>
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-widest text-[#61E3F0]">{step.label}</div>
                          <div className="text-[9px] text-white/50 font-bold">{step.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* AI Summary panel */}
                {summaryDocId && (
                  <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#02013D]/40 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-[#2585C7]" />
                      AI Summary
                    </h3>
                    <div className="bg-white p-5 rounded-2xl border-2 border-[#EFEFEF] space-y-3">
                      {summaryLoading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-4 w-4 text-[#2585C7] animate-spin" />
                          <span className="text-[10px] font-bold text-[#02013D]/50">Summarizing with AI...</span>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-[#02013D]/70 leading-relaxed whitespace-pre-wrap">{summary}</p>
                      )}
                      <button onClick={() => { setSummaryDocId(null); setSummary(""); }} className="text-[9px] font-black uppercase tracking-widest text-[#02013D]/30 hover:text-[#2585C7]">Close</button>
                    </div>
                  </section>
                )}

                <section className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#02013D]/40">Elite News</h3>
                  <div className="space-y-3">
                    {[
                      "New Voice Models: Hausa & Igbo arriving Q2.",
                      "Annual Winner's Challenge starts Monday.",
                      "JackPal for Pro Exams now in Beta."
                    ].map((news, i) => (
                      <div key={i} className="flex gap-3 group cursor-pointer">
                        <div className="h-1.5 w-1.5 bg-[#2585C7] rounded-full mt-1.5 flex-shrink-0" />
                        <p className="text-[10px] font-bold text-[#02013D]/70 group-hover:text-[#2585C7] transition-colors">{news}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>

        {/* MOBILE DOCK */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-[#02013D]/95 backdrop-blur-2xl text-white rounded-[2rem] p-2 shadow-2xl z-[200] flex items-center justify-between border border-white/10">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'library', icon: Library, label: 'Library' },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 group w-14 py-2 transition-all duration-300 relative ${activeTab === item.id ? 'text-[#61E3F0] scale-110' : 'text-white/40'}`}>
              <item.icon className="h-5 w-5" />
              <span className={`text-[9px] font-black uppercase tracking-tighter transition-all ${activeTab === item.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{item.label}</span>
              {activeTab === item.id && <div className="absolute -top-1 w-1 h-1 bg-[#61E3F0] rounded-full shadow-[0_0_8px_#61E3F0] animate-pulse" />}
            </button>
          ))}

          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center -mt-12 group relative">
            <div className="absolute inset-0 bg-[#2585C7] rounded-full blur-xl opacity-20 animate-pulse" />
            <div className="w-16 h-16 bg-[#2585C7] rounded-full flex items-center justify-center shadow-2xl shadow-[#2585C7]/40 border-4 border-[#F7F7F7] z-[10] relative hover:scale-105 transition-transform">
              {uploading ? <Loader2 className="h-7 w-7 text-white animate-spin" /> : <CloudUpload className="h-7 w-7 text-white" />}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter text-[#2585C7] mt-1 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">Upload</span>
          </button>

          {[
            { id: 'files', icon: FolderOpen, label: 'Files' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 group w-14 py-2 transition-all duration-300 relative ${activeTab === item.id ? 'text-[#61E3F0] scale-110' : 'text-white/40'}`}>
              <item.icon className="h-5 w-5" />
              <span className={`text-[9px] font-black uppercase tracking-tighter transition-all ${activeTab === item.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{item.label}</span>
              {activeTab === item.id && <div className="absolute -top-1 w-1 h-1 bg-[#61E3F0] rounded-full shadow-[0_0_8px_#61E3F0] animate-pulse" />}
            </button>
          ))}
        </nav>

        {/* DESKTOP FAB */}
        <div className="hidden md:block fixed bottom-10 right-10 z-[300]">
          <div className="relative">
            <div className={`absolute bottom-20 right-0 space-y-4 transition-all duration-300 origin-bottom ${isAddMenuOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10 pointer-events-none'}`}>
              {mainUploadOptions.map((option, index) => (
                <button key={option.label} className="flex items-center gap-4 group" style={{ transitionDelay: `${index * 50}ms` }}
                  onClick={() => option.label === "File" ? (setIsAddMenuOpen(false), fileInputRef.current?.click()) : null}>
                  <span className="bg-[#02013D] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-white/10">{option.label}</span>
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-white" style={{ backgroundColor: option.color }}>
                    <option.icon className="h-6 w-6" />
                  </div>
                </button>
              ))}
              <button onClick={() => { setIsOthersModalOpen(true); setIsAddMenuOpen(false); }} className="flex items-center gap-4 group" style={{ transitionDelay: `150ms` }}>
                <span className="bg-[#02013D] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-white/10">More Options</span>
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white text-[#02013D] shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-[#02013D]">
                  <LayoutGrid className="h-6 w-6" />
                </div>
              </button>
            </div>
            <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className={`h-20 w-20 rounded-3xl flex items-center justify-center shadow-2xl shadow-[#2585C7]/40 border-4 border-white transition-all duration-500 ${isAddMenuOpen ? 'bg-[#02013D] rotate-[135deg]' : 'bg-[#2585C7] hover:scale-105 active:scale-95'}`}>
              <Plus className="h-10 w-10 text-white" />
            </button>
          </div>
        </div>

        {/* UPLOAD MODAL */}
        {isOthersModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#02013D]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsOthersModalOpen(false)} />
            <div className="bg-[#F7F7F7] w-full max-w-2xl rounded-[3rem] border-8 border-[#02013D] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in duration-500">
              <div className="p-10 md:p-12 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black tracking-tighter uppercase italic">Import Library</h3>
                    <p className="text-xs font-bold text-[#02013D]/40 uppercase tracking-widest">Select your source to begin learning</p>
                  </div>
                  <button onClick={() => setIsOthersModalOpen(false)} className="bg-[#02013D] text-white p-3 rounded-2xl hover:bg-[#2585C7] transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {allUploadOptions.map((option) => (
                    <button key={option.label}
                      onClick={() => option.action === "file" ? (setIsOthersModalOpen(false), fileInputRef.current?.click()) : null}
                      className="bg-white p-6 rounded-[2rem] border-2 border-[#EFEFEF] hover:border-[#2585C7] hover:shadow-2xl hover:shadow-[#2585C7]/10 transition-all group text-left space-y-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: option.color }}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-black uppercase tracking-tighter group-hover:text-[#2585C7] transition-colors">{option.label}</div>
                        <p className="text-[9px] font-bold text-[#02013D]/40 uppercase leading-none">{option.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="pt-6 border-t border-[#EFEFEF] flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[#02013D]/20">
                  <span>JackPal Secure Import</span>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Military-grade Encryption</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #EFEFEF; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2585C7; }
      ` }} />
    </div>
  );
}
