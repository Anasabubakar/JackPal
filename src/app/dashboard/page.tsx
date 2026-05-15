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
  Download,
  SkipBack,
  SkipForward,
  AudioLines,
  Trash2,
  RotateCcw,
  FastForward,
  Bookmark,
  RefreshCw,
  BookOpen,
  ListChecks,
  Layers,
  Network,
  LayoutTemplate,
  Table,
  CircleHelp,
  Settings,
  MoreVertical,
  AlertCircle,
  LayoutGrid as GridIcon,
  List as ListIcon,
  ChevronDown,
  Youtube,
  MessageSquare,
  Sparkles,
  Info,
  Upload,
  Check,
  Eye,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { JackpalsLogo } from "@/components/brand/JackpalsLogo";
import { Markdown } from "@/components/ui/Markdown";
import {
  PlusIcon,
  HouseIcon as HomeIcon,
  CloudUploadIcon,
  MicIcon,
  SparklesIcon,
  LayoutGridIcon,
} from "@animateicons/react/lucide";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ease, dur } from "@/lib/motion";
import { FadeUp, SlideIn, SpringScale } from "@/components/ui/MotionPrimitives";
import { NotebookCollaborationPanel } from "@/components/workspace/NotebookCollaborationPanel";
import { WorkspaceNotebookSearch } from "@/components/workspace/WorkspaceNotebookSearch";
import {
  getUser,
  logout,
  listDocuments,
  uploadDocument,
  generateAudio,
  getTtsCapabilities,
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
  listWorkspaces,
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  listWorkspaceSources,
  addWorkspaceTextSource,
  addWorkspaceUrlSource,
  addWorkspaceFileSource,
  addWorkspaceResearch,
  renameWorkspaceSource,
  deleteWorkspaceSource,
  getWorkspaceSourceText,
  getWorkspaceSourceGuide,
  refreshWorkspaceSource,
  getWorkspaceSourceFreshness,
  listWorkspaceNotes,
  addWorkspaceNote,
  updateWorkspaceNote,
  deleteWorkspaceNote,
  askWorkspace,
  listWorkspaceArtifacts,
  generateWorkspaceArtifact,
  deleteWorkspaceArtifact,
  downloadWorkspaceArtifact,
  getWorkspaceSharing,
  setWorkspaceSharing,
  listWorkspaceChats,
  createWorkspaceChat,
  getWorkspaceChat,
  renameWorkspaceChat,
  deleteWorkspaceChat,
  cleanupWorkspaceDuplicates,
  downloadWorkspaceBundle,
  downloadWorkspaceArtifactsBundle,
  saveChatTurnAsNote,
  setChatTurnPinned,
  type Document,
  type Chapter,
  type PodcastLine,
  type Notebook,
  type Source,
  type Note,
  type Artifact,
  type SavedChat,
  type ChatTurn,
  type WorkspaceCitation,
  type TtsCapabilities,
} from "@/lib/api";
import { ArtifactViewer } from "@/components/workspace/ArtifactViewer";
import { WorkspaceNotebookFigma } from "@/components/dashboard/WorkspaceNotebookFigma";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const VOICE_OPTIONS = [
  { value: "chinenye", label: "Ezinne", desc: "Female · Nigerian English" },
  { value: "jude",     label: "Abeo",   desc: "Male · Nigerian English" },
];
const PODCAST_HOSTS = [
  { voice: "chinenye", name: "Ezinne", role: "Asks the questions" },
  { voice: "jude",     name: "Abeo",   role: "Breaks it down" },
];

const ARTIFACT_DEFS: { type: string; label: string; blurb: string; Icon: any }[] = [
  { type: "audio", label: "Audio brief", blurb: "Narrated overview of the corpus", Icon: AudioLines },
  { type: "video", label: "Video overview", blurb: "Structured scene outline for an overview clip", Icon: Video },
  { type: "slide-deck", label: "Slide deck", blurb: "Slides with narration beats you can export", Icon: LayoutTemplate },
  { type: "quiz", label: "Quiz", blurb: "Self-check questions grounded in sources", Icon: ListChecks },
  { type: "flashcard", label: "Flashcards", blurb: "Front/back cards for drills and review", Icon: Layers },
  { type: "infographic", label: "Infographic", blurb: "Dense visual summary of key ideas", Icon: ImageIcon },
  { type: "report", label: "Report", blurb: "Structured written synthesis", Icon: FileText },
  { type: "data-table", label: "Data table", blurb: "Comparable facts in rows and columns", Icon: Table },
  { type: "mind-map", label: "Mind map", blurb: "Hierarchy of concepts and links", Icon: Network },
  { type: "study-guide", label: "Study guide", blurb: "Outline-style guide for revision", Icon: BookOpen },
];

const SPEED_OPTIONS = [0.9, 1, 1.25, 1.5, 1.75];

type WorkspaceSourceMode = "text" | "url" | "youtube" | "drive" | "file" | "research";

/** A reusable glassmorphic centered modal for actions. */
const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`relative z-10 w-full ${maxWidth} rounded-[2rem] overflow-hidden shadow-2xl border border-white/10`}
          style={{ background: "var(--glass-bg)", backdropFilter: "blur(var(--glass-blur))" }}
        >
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-[20px] font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-syne)" }}>{title}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto studio-scroll">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  // New UI States
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [isPodcastModalOpen, setIsPodcastModalOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<"imported" | "podcasts" | "studio" | "workspaces">("workspaces");
  const [showBanner, setShowBanner] = useState(true);
  const [searchExpanded, setSearchExpanded] = useState(false);

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

  // AI Summary — per-doc
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

  // Workspace / notebooks
  const [workspaces, setWorkspaces] = useState<Notebook[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspaceSources, setWorkspaceSources] = useState<Source[]>([]);
  const [workspaceNotes, setWorkspaceNotes] = useState<Note[]>([]);
  const [workspaceArtifacts, setWorkspaceArtifacts] = useState<Artifact[]>([]);
  const [workspaceChats, setWorkspaceChats] = useState<SavedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatTurns, setActiveChatTurns] = useState<ChatTurn[]>([]);
  const [workspaceSharing, setWorkspaceSharingState] = useState<{ public: boolean; role: "viewer" | "editor" } | null>(null);
  const [activeWorkspaceSourceId, setActiveWorkspaceSourceId] = useState<string | null>(null);
  const [activeWorkspaceSourceText, setActiveWorkspaceSourceText] = useState("");
  const [activeWorkspaceSourceGuide, setActiveWorkspaceSourceGuide] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceBusy, setWorkspaceBusy] = useState("");
  const [workspaceTitle, setWorkspaceTitle] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [sourceMode, setSourceMode] = useState<WorkspaceSourceMode>("text");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceContent, setSourceContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [researchQuery, setResearchQuery] = useState("");
  const [researchMode, setResearchMode] = useState<"fast" | "deep">("fast");
  const [researchImportUrls, setResearchImportUrls] = useState("");
  const [lastResearchRun, setLastResearchRun] = useState<{
    jobId: string;
    summary: string;
    provider: string;
    imported: number;
    failedImports: number;
    deepQueries?: string[];
  } | null>(null);
  const [refreshingSourceId, setRefreshingSourceId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [chatQuestion, setChatQuestionWorkspace] = useState("");
  const [workspaceAnswer, setWorkspaceAnswer] = useState("");
  /** Citations from the latest ask (and cleared when question changes). */
  const [lastWorkspaceCitations, setLastWorkspaceCitations] = useState<WorkspaceCitation[]>([]);
  const [saveChatAsNote, setSaveChatAsNote] = useState(false);
  const [workspaceExporting, setWorkspaceExporting] = useState(false);
  const [workspaceArtifactsExporting, setWorkspaceArtifactsExporting] = useState(false);
  const [workspaceSubTab, setWorkspaceSubTab] = useState<"sources" | "notes" | "artifacts" | "chat" | "studio">("sources");
  const [workspaceFileName, setWorkspaceFileName] = useState("");
  const workspaceFileInputRef = useRef<HTMLInputElement>(null);
  const [ttsCaps, setTtsCaps] = useState<TtsCapabilities | null>(null);
  const [listenEngine, setListenEngine] = useState<"fast" | "premium">("fast");
  const [chatCorpusScope, setChatCorpusScope] = useState<"all" | "pick">("all");
  const [chatPickSourceIds, setChatPickSourceIds] = useState<string[]>([]);
  const [artifactViewerId, setArtifactViewerId] = useState<string | null>(null);

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
    const mq = window.matchMedia("(max-width: 767px)");
    const syncLayout = () => setIsMobileLayout(mq.matches);
    syncLayout();
    mq.addEventListener("change", syncLayout);

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
    fetchWorkspaces();
    // Warm up Render backend so user's first Listen/Podcast click hits an
    // awake container instead of paying 30-50s cold-start.
    fetch(`${API_URL}/audio/capabilities`).catch(() => {});
    void getTtsCapabilities()
      .then((caps) => {
        setTtsCaps(caps);
        const savedEng = localStorage.getItem("jackpal_listen_engine");
        if (savedEng === "premium" && caps.premium_available) setListenEngine("premium");
      })
      .catch(() => {});
    return () => mq.removeEventListener("change", syncLayout);
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("jackpal_listen_engine", listenEngine);
  }, [mounted, listenEngine]);

  useEffect(() => {
    if (ttsCaps && !ttsCaps.premium_available && listenEngine === "premium") {
      setListenEngine("fast");
    }
  }, [ttsCaps, listenEngine]);

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    setActiveWorkspaceSourceId(null);
    setActiveWorkspaceSourceText("");
    setActiveWorkspaceSourceGuide("");
    setChatCorpusScope("all");
    setChatPickSourceIds([]);
    loadWorkspaceDetails(selectedWorkspaceId);
  }, [selectedWorkspaceId]);

  useEffect(() => {
    setChatPickSourceIds((prev) => prev.filter((id) => workspaceSources.some((s) => s.id === id)));
  }, [workspaceSources]);

  useEffect(() => {
    if (!artifactViewerId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArtifactViewerId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [artifactViewerId]);

  useEffect(() => {
    setLastResearchRun(null);
  }, [selectedWorkspaceId]);

  useEffect(() => {
    if (!mounted) return;
    const tab = searchParams.get("tab");
    const nb = searchParams.get("notebook");
    if (tab === "workspace") setActiveTab("workspace");
    if (nb && workspaces.some((w) => w.id === nb)) setSelectedWorkspaceId(nb);
  }, [mounted, searchParams, workspaces]);

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
    if (!hasGenerating) return;
    let cancelled = false;

    const tickOne = async (doc: Document): Promise<Document> => {
      if (doc.status !== "generating" && doc.status !== "streaming") return doc;
      try {
        const s = await getAudioStatus(doc.id, {
          sinceReady: doc.ready_chunks ?? 0,
          waitSeconds: 20,
        });
        const mergedEngine = s.audio_engine ?? doc.audio_engine;
        const mergedVoice = s.audio_voice ?? doc.audio_voice;
        const statusChanged =
          s.status !== doc.status
          || s.ready_chunks !== doc.ready_chunks
          || mergedEngine !== doc.audio_engine
          || mergedVoice !== doc.audio_voice;
        if (statusChanged) {
          return {
            ...doc,
            status: s.status as Document["status"],
            ready_chunks: s.ready_chunks,
            total_chunks: s.total_chunks,
            audio_voice: mergedVoice,
            audio_engine: mergedEngine,
          };
        }
      } catch { /* network blip — loop will retry */ }
      return doc;
    };

    const loop = async () => {
      while (!cancelled) {
        const current = documentsRef.current;
        const generating = current.filter(d => d.status === "generating" || d.status === "streaming");
        if (!generating.length) return;
        const tickStart = Date.now();
        const updates = await Promise.all(generating.map(tickOne));
        if (cancelled) return;
        const byId = new Map(updates.map(u => [u.id, u]));
        let anyChanged = false;
        const next = documentsRef.current.map(d => {
          const u = byId.get(d.id);
          if (!u) return d;
          if (
            u.status !== d.status
            || u.ready_chunks !== d.ready_chunks
            || u.audio_engine !== d.audio_engine
            || u.audio_voice !== d.audio_voice
          ) {
            anyChanged = true;
          }
          return u;
        });
        if (anyChanged) setDocuments(next);
        // Backend may not support ?wait=N (older deploys) — sleep before
        // next iteration to avoid a busy loop hammering the API.
        if (!anyChanged && Date.now() - tickStart < 1500) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    };
    loop();

    return () => { cancelled = true; };
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

  async function fetchWorkspaces() {
    setWorkspaceLoading(true);
    try {
      const notebooks = await listWorkspaces();
      setWorkspaces(notebooks);
      setSelectedWorkspaceId((prev) => {
        if (prev && notebooks.some((nb) => nb.id === prev)) return prev;
        return notebooks[0]?.id ?? null;
      });
    } catch {
      setWorkspaceError("Could not load workspaces.");
    } finally {
      setWorkspaceLoading(false);
    }
  }

  async function loadWorkspaceDetails(workspaceId: string) {
    try {
      const [sources, notes, artifacts, sharing, chats] = await Promise.all([
        listWorkspaceSources(workspaceId),
        listWorkspaceNotes(workspaceId),
        listWorkspaceArtifacts(workspaceId),
        getWorkspaceSharing(workspaceId),
        listWorkspaceChats(workspaceId),
      ]);
      setWorkspaceSources(sources);
      setWorkspaceNotes(notes);
      setWorkspaceArtifacts(artifacts);
      setWorkspaceSharingState(sharing);
      setWorkspaceChats(chats);
      setActiveChatId((prev) => (prev && chats.some((chat) => chat.id === prev) ? prev : chats[0]?.id ?? null));
    } catch {
      setWorkspaceError("Could not load notebook details.");
    }
  }

  useEffect(() => {
    if (!selectedWorkspaceId || !activeChatId) {
      setActiveChatTurns([]);
      return;
    }
    getWorkspaceChat(selectedWorkspaceId, activeChatId)
      .then((data) => setActiveChatTurns(data.turns || []))
      .catch(() => setActiveChatTurns([]));
  }, [selectedWorkspaceId, activeChatId]);

  async function inspectWorkspaceSource(source: Source) {
    if (!selectedWorkspaceId) return;
    setActiveWorkspaceSourceId(source.id);
    try {
      const [text, guide] = await Promise.all([
        getWorkspaceSourceText(selectedWorkspaceId, source.id),
        getWorkspaceSourceGuide(selectedWorkspaceId, source.id).catch(() => ""),
      ]);
      setActiveWorkspaceSourceText(text);
      setActiveWorkspaceSourceGuide(guide);
    } catch {
      setActiveWorkspaceSourceText("");
      setActiveWorkspaceSourceGuide("");
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
      if (Math.abs(now - lastTimeUpdateRef.current) < 1) return;
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

  async function handleCreateWorkspace() {
    const title = workspaceTitle.trim();
    if (!title || workspaceBusy) return;
    setWorkspaceBusy("Creating notebook...");
    setWorkspaceError("");
    try {
      const created = await createWorkspace(title, workspaceDescription.trim() || undefined);
      setWorkspaceTitle("");
      setWorkspaceDescription("");
      await fetchWorkspaces();
      setSelectedWorkspaceId(created.id);
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not create notebook.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleRenameWorkspace(workspaceId: string) {
    const current = workspaces.find((item) => item.id === workspaceId);
    const next = prompt("Rename notebook", current?.title || "");
    if (!next?.trim()) return;
    setWorkspaceBusy("Renaming notebook...");
    try {
      await renameWorkspace(workspaceId, next.trim());
      await fetchWorkspaces();
      if (selectedWorkspaceId === workspaceId) {
        setSelectedWorkspaceId(workspaceId);
      }
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not rename notebook.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleDeleteWorkspace(workspaceId: string) {
    if (!confirm("Delete this notebook and all of its notes, sources, and artifacts?")) return;
    setWorkspaceBusy("Deleting notebook...");
    try {
      await deleteWorkspace(workspaceId);
      await fetchWorkspaces();
      setSelectedWorkspaceId((prev) => (prev === workspaceId ? null : prev));
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not delete notebook.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleAddWorkspaceSource(overrideMode?: WorkspaceSourceMode) {
    if (!selectedWorkspaceId || workspaceBusy) return;
    const mode = overrideMode ?? sourceMode;
    setWorkspaceBusy("Importing source...");
    setWorkspaceError("");
    try {
      if (mode === "file") {
        const file = workspaceFileInputRef.current?.files?.[0];
        if (!file) throw new Error("Choose a file first.");
        await addWorkspaceFileSource(selectedWorkspaceId, file);
        if (workspaceFileInputRef.current) workspaceFileInputRef.current.value = "";
        setWorkspaceFileName("");
      } else if (mode === "url" || mode === "youtube" || mode === "drive") {
        if (!sourceUrl.trim()) throw new Error("Enter a URL or link.");
        await addWorkspaceUrlSource(selectedWorkspaceId, sourceTitle.trim() || null, sourceUrl.trim());
      } else if (mode === "research") {
        if (!researchQuery.trim()) throw new Error("Enter a research query.");
        const extraLines = researchImportUrls
          .split("\n")
          .map((s) => s.replace(/\r$/, "").trim())
          .filter(Boolean);
        const result = await addWorkspaceResearch(selectedWorkspaceId, researchQuery.trim(), {
          mode: researchMode,
          importUrls: extraLines.length ? extraLines : undefined,
        });
        const rawImports = (result.sources ?? []) as Array<Record<string, unknown> & { error?: string }>;
        const failedImports = rawImports.filter((x) => "error" in x && x.error).length;
        const imported = rawImports.filter((x) => !("error" in x && x.error)).length;
        const sum = result.summary ?? "";
        setLastResearchRun({
          jobId: result.job?.id ?? "",
          summary: sum.length > 700 ? `${sum.slice(0, 700)}…` : sum,
          provider: result.provider ?? "none",
          imported,
          failedImports,
          deepQueries: result.expanded_queries,
        });
      } else {
        if (!sourceContent.trim()) throw new Error("Enter source text.");
        await addWorkspaceTextSource(selectedWorkspaceId, sourceTitle.trim() || "Pasted Notes", sourceContent.trim());
      }
      setSourceContent("");
      setSourceTitle("");
      setSourceUrl("");
      setResearchQuery("");
      setResearchImportUrls("");
      await loadWorkspaceDetails(selectedWorkspaceId);
      await fetchWorkspaces();
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not import source.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleWorkspaceNoteSave() {
    if (!selectedWorkspaceId || workspaceBusy) return;
    if (!noteTitle.trim() || !noteContent.trim()) return;
    setWorkspaceBusy("Saving note...");
    try {
      await addWorkspaceNote(selectedWorkspaceId, noteTitle.trim(), noteContent.trim());
      setNoteTitle("");
      setNoteContent("");
      await loadWorkspaceDetails(selectedWorkspaceId);
      await fetchWorkspaces();
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not save note.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleWorkspaceAsk() {
    const selectedWs = selectedWorkspaceId
      ? workspaces.find((item) => item.id === selectedWorkspaceId) ?? null
      : null;
    const wsRole = selectedWs ? (selectedWs.role ?? "owner") : "owner";
    const canAsk = wsRole === "owner" || wsRole === "editor";
    if (!selectedWorkspaceId || workspaceBusy || !chatQuestion.trim() || !canAsk) return;
    if (chatCorpusScope === "pick" && chatPickSourceIds.length === 0) {
      setWorkspaceError("Pick at least one source, or switch to “All sources”.");
      return;
    }
    setWorkspaceError("");
    setWorkspaceBusy("Thinking...");
    try {
      const result = await askWorkspace(selectedWorkspaceId, chatQuestion.trim(), {
        saveAsNote: saveChatAsNote,
        chatId: activeChatId,
        sourceIds: chatCorpusScope === "pick" ? chatPickSourceIds : undefined,
      });
      setWorkspaceAnswer(result.answer);
      setLastWorkspaceCitations(result.citations ?? []);
      setChatQuestionWorkspace("");
      await loadWorkspaceDetails(selectedWorkspaceId);
      await fetchWorkspaces();
      if (activeChatId && selectedWorkspaceId) {
        const refreshed = await getWorkspaceChat(selectedWorkspaceId, activeChatId).catch(() => null);
        setActiveChatTurns(refreshed?.turns || []);
      }
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not answer question.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleWorkspaceGenerate(artifactType: string, title?: string) {
    if (!selectedWorkspaceId || workspaceBusy) return;
    setWorkspaceBusy(`Generating ${artifactType}...`);
    try {
      await generateWorkspaceArtifact(selectedWorkspaceId, artifactType, { title });
      await loadWorkspaceDetails(selectedWorkspaceId);
      await fetchWorkspaces();
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : `Could not generate ${artifactType}.`);
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleDownloadWorkspaceBundle() {
    if (!selectedWorkspaceId || workspaceExporting || workspaceArtifactsExporting) return;
    setWorkspaceExporting(true);
    setWorkspaceError("");
    try {
      const { blob, filename } = await downloadWorkspaceBundle(selectedWorkspaceId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not export notebook.");
    } finally {
      setWorkspaceExporting(false);
    }
  }

  async function handleDownloadWorkspaceArtifactsBundle() {
    if (!selectedWorkspaceId || workspaceExporting || workspaceArtifactsExporting) return;
    setWorkspaceArtifactsExporting(true);
    setWorkspaceError("");
    try {
      const { blob, filename } = await downloadWorkspaceArtifactsBundle(selectedWorkspaceId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not export artifacts.");
    } finally {
      setWorkspaceArtifactsExporting(false);
    }
  }

  async function handleDownloadWorkspaceArtifact(artifactId: string) {
    if (!selectedWorkspaceId) return;
    try {
      const { blob, filename } = await downloadWorkspaceArtifact(selectedWorkspaceId, artifactId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not download artifact.");
    }
  }

  async function handleSetSharing(publicValue: boolean, role: "viewer" | "editor") {
    if (!selectedWorkspaceId || workspaceBusy) return;
    setWorkspaceBusy("Updating sharing...");
    try {
      await setWorkspaceSharing(selectedWorkspaceId, publicValue, role);
      await loadWorkspaceDetails(selectedWorkspaceId);
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not update sharing.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleCreateSavedChat() {
    if (!selectedWorkspaceId || workspaceBusy) return;
    const title = prompt("Chat title", "Study chat");
    if (!title?.trim()) return;
    setWorkspaceBusy("Creating chat...");
    try {
      const created = await createWorkspaceChat(selectedWorkspaceId, title.trim(), []);
      await loadWorkspaceDetails(selectedWorkspaceId);
      setActiveChatId(created.chat.id);
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not create chat.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleRenameSavedChat(chatId: string) {
    if (!selectedWorkspaceId || workspaceBusy) return;
    const current = workspaceChats.find((chat) => chat.id === chatId);
    const title = prompt("Rename chat", current?.title || "");
    if (!title?.trim()) return;
    setWorkspaceBusy("Renaming chat...");
    try {
      await renameWorkspaceChat(selectedWorkspaceId, chatId, title.trim());
      await loadWorkspaceDetails(selectedWorkspaceId);
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not rename chat.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleDeleteSavedChat(chatId: string) {
    if (!selectedWorkspaceId || workspaceBusy) return;
    if (!confirm("Delete this chat history?")) return;
    setWorkspaceBusy("Deleting chat...");
    try {
      await deleteWorkspaceChat(selectedWorkspaceId, chatId);
      await loadWorkspaceDetails(selectedWorkspaceId);
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setActiveChatTurns([]);
      }
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not delete chat.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleCleanupDuplicates() {
    if (!selectedWorkspaceId || workspaceBusy) return;
    setWorkspaceBusy("Cleaning duplicates...");
    try {
      await cleanupWorkspaceDuplicates(selectedWorkspaceId);
      await loadWorkspaceDetails(selectedWorkspaceId);
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not clean duplicates.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleRefreshWorkspaceSource(sourceId: string) {
    if (!selectedWorkspaceId || workspaceBusy) return;
    setRefreshingSourceId(sourceId);
    setWorkspaceError("");
    try {
      await refreshWorkspaceSource(selectedWorkspaceId, sourceId);
      await loadWorkspaceDetails(selectedWorkspaceId);
      const sources = await listWorkspaceSources(selectedWorkspaceId);
      const src = sources.find((s) => s.id === sourceId);
      if (src && activeWorkspaceSourceId === sourceId) {
        await inspectWorkspaceSource(src);
      }
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not refresh source.");
    } finally {
      setRefreshingSourceId(null);
    }
  }

  async function handlePinChatTurn(turnId: string, pinned: boolean) {
    if (!selectedWorkspaceId || !activeChatId) return;
    const nb = workspaces.find((w) => w.id === selectedWorkspaceId);
    const role = nb?.role ?? "owner";
    if (role !== "owner" && role !== "editor") return;
    setWorkspaceBusy(pinned ? "Pinning answer…" : "Unpinning…");
    setWorkspaceError("");
    try {
      await setChatTurnPinned(selectedWorkspaceId, activeChatId, turnId, pinned);
      const refreshed = await getWorkspaceChat(selectedWorkspaceId, activeChatId);
      setActiveChatTurns(refreshed.turns || []);
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not update pin.");
    } finally {
      setWorkspaceBusy("");
    }
  }

  async function handleSaveChatTurnAsNote(turnId: string) {
    if (!selectedWorkspaceId || !activeChatId) return;
    const nb = workspaces.find((w) => w.id === selectedWorkspaceId);
    const role = nb?.role ?? "owner";
    if (role !== "owner" && role !== "editor") return;
    setWorkspaceBusy("Saving answer as note…");
    setWorkspaceError("");
    try {
      await saveChatTurnAsNote(selectedWorkspaceId, activeChatId, turnId);
      await loadWorkspaceDetails(selectedWorkspaceId);
      await fetchWorkspaces();
    } catch (err: unknown) {
      setWorkspaceError(err instanceof Error ? err.message : "Could not save note.");
    } finally {
      setWorkspaceBusy("");
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
    setPodcastGenerating(null);
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

    // Immediate UI ack — flips button to Loading and shows SyncReader so
    // the user sees their click landed instead of staring at a frozen
    // library while we wait for the backend.
    setCurrentDocId(doc.id);
    setCurrentTitle(doc.filename);
    setIsAudioLoading(true);
    loadDocumentText(doc.id);

    const engine = listenEngine === "premium" && ttsCaps?.premium_available ? "premium" : "fast";
    const docEngine = doc.audio_engine ?? "fast";

    // If pre-generated chunks exist → instant chunk playlist
    const hasMatchingReadyAudio = ((doc.ready_chunks ?? 0) > 0 || doc.status === "audio_ready")
      && doc.audio_voice === selectedVoice
      && docEngine === engine;
    if (hasMatchingReadyAudio) {
      try {
        const { chunks } = await getAudioChunks(doc.id);
        if (chunks.length > 0) {
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
    try {
      const status = await generateAudio(doc.id, selectedVoice, engine);
      setDocuments((prev) => prev.map((item) => (
        item.id === doc.id
          ? {
              ...item,
              status: status.status as Document["status"],
              ready_chunks: status.ready_chunks,
              total_chunks: status.total_chunks,
              audio_voice: status.audio_voice ?? selectedVoice,
              audio_engine: status.audio_engine ?? engine,
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

  // Global keyboard shortcuts for the player
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input/textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (!currentDocId && !podcastPlayingDocId) return;
      const audio = audioRef.current;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (!audio) return;
        if (audio.paused) audio.play().catch(() => {}); else audio.pause();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        skipBy(-10);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        skipBy(10);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const i = SPEED_OPTIONS.indexOf(playbackRate);
        const next = SPEED_OPTIONS[Math.min(SPEED_OPTIONS.length - 1, i + 1)];
        setPlaybackRate(next);
        if (audio) audio.playbackRate = next;
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const i = SPEED_OPTIONS.indexOf(playbackRate);
        const next = SPEED_OPTIONS[Math.max(0, i - 1)];
        setPlaybackRate(next);
        if (audio) audio.playbackRate = next;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentDocId, podcastPlayingDocId, playbackRate]);

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
    setPodcastPlayingDocId(docId);
    setCurrentTitle(documents.find(d => d.id === docId)?.filename ?? "Podcast");

    lastTimeUpdateRef.current = 0;
    audio.ontimeupdate = () => {
      const now = audio.currentTime || 0;
      if (Math.abs(now - lastTimeUpdateRef.current) < 1) return;
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
      clearInterval(msgInterval);
      setIsAudioLoading(false);
      setPodcastGenerating(null);
      if (isNotFound) fetchDocuments();
      return;
    }

    let lastScriptLen = 0;
    let lastReady = 0;
    const startedAt = Date.now();
    const poll = async (): Promise<void> => {
      // 150s ceiling — Render free tier cold-start can be 30-50s alone, then
      // Groq 8-15s + TTS pipeline. Need headroom on a freshly-deployed container.
      while (Date.now() - startedAt < 150_000) {
        const tickStart = Date.now();
        try {
          const res = await getPodcastChunks(doc.id, { sinceReady: lastReady, waitSeconds: 20 });
          if (res.script?.length && res.script.length !== lastScriptLen) {
            lastScriptLen = res.script.length;
            setPodcastScript(res.script);
          }
          if (res.chunks.length > 0) {
            clearInterval(msgInterval);
            podcastQueueRef.current = res.chunks.map(c => ({ url: c.url, speaker: c.speaker }));
            podcastIndexRef.current = 0;
            playNextPodcastChunk(doc.id);
            return;
          }
          lastReady = res.ready_lines || 0;
          if ((res.status as string) === "failed" || (res.status as string) === "error") break;
          // Backend returned fast with no progress — likely doesn't support
          // ?wait=N (older deploys). Sleep before retrying to avoid busy loop.
          if (Date.now() - tickStart < 1500) {
            await new Promise(r => setTimeout(r, 1500));
          }
        } catch {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
      clearInterval(msgInterval);
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      setUploadError(
        `Podcast didn't start within ${elapsed}s. Backend may be cold (Render free tier sleeps after 15min) — try again in 30s, or check Render logs for errors.`
      );
      setIsAudioLoading(false);
      setPodcastGenerating(null);
    };
    poll();
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

  if (!mounted) {
    return (
      <div className="studio flex h-screen max-h-[100dvh] min-h-0 bg-[var(--ink)] p-8 gap-8 overflow-hidden">
        {/* Sidebar Skeleton */}
        <div className="w-[240px] flex-shrink-0 flex flex-col gap-6 p-6">
          <div className="h-7 w-32 rounded bg-white/10 animate-pulse" />
          <div className="space-y-4">
            <div className="h-10 w-full rounded-full bg-white/10 animate-pulse" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="h-16 w-full rounded-3xl bg-white/5 animate-pulse" />
          <div className="h-24 w-full rounded-[2rem] bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
          <div className="grid grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-[2rem] bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
      className="studio studio-glass-chrome w-24 flex-shrink-0 flex flex-col items-center py-5 gap-1 z-40 border-r"
      style={{ borderColor: "var(--glass-border)" }}
    >
      <div className="mb-5 px-1 w-full flex justify-center">
        <JackpalsLogo variant="wordmark" priority className="h-8 w-auto max-w-[5.5rem]" />
      </div>
      {[
        { id: "home", Icon: Library, label: "Library" },
        { id: "workspace", Icon: LayoutGrid, label: "Workspace" },
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
        {/* Redesigned Compact Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white tracking-tight">My Dashboard</h1>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="px-4 py-2 text-sm rounded-full bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 transition-all w-64"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-full bg-blue-600 hover:bg-blue-700 transition-colors">
              <Plus size={16} />
              Upload
            </button>
          </div>
        </header>

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

        {/* Dashboard Grid Content */}
        <div className="flex-1 overflow-y-auto studio-scroll p-6">
          {docsLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-10 py-12">
              {!hasSearch ? (
                <>
                  <label className="mx-auto block w-full max-w-lg cursor-pointer">
                    <div
                      className="upload-zone flex flex-col items-center gap-5 rounded-2xl px-8 py-12 transition-all hover:border-[var(--blue)]"
                      style={{ border: "1.5px dashed var(--border)", background: "var(--surface)" }}
                    >
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                      >
                        {uploading ? (
                          <Loader2 size={22} className="animate-spin" style={{ color: "var(--blue)" }} />
                        ) : (
                          <CloudUpload size={22} strokeWidth={1.5} style={{ color: "var(--blue)" }} />
                        )}
                      </div>
                      <div className="text-center">
                        <div className="mb-1 text-[14px] font-semibold" style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)" }}>
                          {uploading ? "Uploading…" : "Drop your notes here"}
                        </div>
                        <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                          PDF · DOCX · TXT · up to 10 MB
                        </div>
                      </div>
                      <div
                        className="rounded-lg px-5 py-2 text-[11px] font-bold uppercase tracking-widest"
                        style={{ background: "var(--blue)", color: "#fff" }}
                      >
                        Browse files
                      </div>
                    </div>
                    <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-center text-[11px]" style={{ color: "var(--text-3)", fontFamily: "var(--font-syne)" }}>
                      Becomes a podcast in ~30 s, hosted by
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <div className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold" style={{ background: "var(--teal)", color: "var(--ink)" }}>E</div>
                        <span className="text-[11px] font-medium" style={{ color: "var(--text-2)", fontFamily: "var(--font-syne)" }}>Ezinne</span>
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--text-3)" }}>&amp;</span>
                      <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--blue)] text-[8px] font-bold text-white">A</div>
                        <span className="text-[11px] font-medium" style={{ color: "var(--text-2)", fontFamily: "var(--font-syne)" }}>Abeo</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-white/50">
                  No documents match &quot;{searchQuery}&quot;
                </p>
              )}
            </div>
          ) : (
            <div className="px-3 pt-3 pb-24 space-y-0.5">
              <div className="px-3 pb-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-3)" }}>
                  {filteredDocuments.length} {filteredDocuments.length === 1 ? "document" : "documents"}
                  {hasSearch && ` · "${searchQuery}"`}
                </span>
              </div>
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
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
                      <div className="w-5 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(currentDocId === doc.id || podcastPlayingDocId === doc.id) ? playerProgress : 100}%`,
                            background: "linear-gradient(90deg, var(--teal) 0%, #61E3F0 100%)",
                            boxShadow: "0 0 10px rgba(97, 227, 240, 0.45)",
                            transition: "width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
                          }}
                        />
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
                      {doc.audio_engine === "premium" && doc.status === "audio_ready" && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(44, 123, 229, 0.2)",
                            color: "var(--blue)",
                            border: "1px solid rgba(44,123,229,0.35)",
                          }}
                          title="Generated with premium TTS"
                        >
                          Vox
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(() => {
                      const isThisListenLoading = isAudioLoading && currentDocId === doc.id && !podcastPlayingDocId && !podcastGenerating;
                      const isThisListenPlaying = playingDocId === doc.id;
                      const listenBusy = isThisListenLoading || isThisListenPlaying;
                      const isThisPodcastLoading = podcastGenerating === doc.id && !podcastPlayingDocId;
                      const isThisPodcastPlaying = podcastPlayingDocId === doc.id;
                      const podcastBusy = isThisPodcastLoading || isThisPodcastPlaying;
                      return (
                        <>
                          <motion.button
                            whileTap={{ scale: 0.93 }}
                            disabled={isThisListenLoading || podcastBusy}
                            onClick={e => { e.stopPropagation(); handleGenerateAudio(doc); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: listenBusy ? "var(--teal)" : "var(--blue)" }}
                          >
                            {isThisListenLoading ? <Loader2 size={11} className="animate-spin" /> : isThisListenPlaying ? <Pause size={11} strokeWidth={2} /> : <Play size={11} strokeWidth={2} />}
                            {isThisListenLoading ? "Loading" : isThisListenPlaying ? "Playing" : "Listen"}
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.93 }}
                            disabled={isThisPodcastLoading || (listenBusy && !isThisPodcastPlaying)}
                            onClick={e => { e.stopPropagation(); handlePodcast(doc); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={ podcastBusy ? { background: "var(--teal)", color: "var(--ink)", border: "1px solid var(--teal)" } : { border: "1px solid var(--teal)", color: "var(--teal)" } }
                          >
                            {isThisPodcastLoading ? <Loader2 size={11} className="animate-spin" /> : isThisPodcastPlaying ? <Pause size={11} strokeWidth={2} /> : <Mic2 size={11} strokeWidth={2} />}
                            {isThisPodcastLoading ? "Loading" : isThisPodcastPlaying ? "Playing" : "Podcast"}
                          </motion.button>
                        </>
                      );
                    })()}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const WorkspaceView = () => {
    const selectedWorkspace = selectedWorkspaceId
      ? workspaces.find((item) => item.id === selectedWorkspaceId) ?? null
      : null;
    const wsRole = selectedWorkspace ? (selectedWorkspace.role ?? "owner") : "owner";
    const wsOwner = selectedWorkspace ? (selectedWorkspace.is_owner ?? (wsRole === "owner")) : false;
    const canEditNotebook = wsRole === "owner" || wsRole === "editor";

    // kept for TS compat — unused after refactor
    const TabNav = () => (
      <nav
        className="sticky top-0 z-30 flex flex-wrap items-center gap-1 p-1.5 rounded-2xl mb-4"
        style={{
          background: "rgba(12, 12, 18, 0.45)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {[
          { id: "sources" as const, label: "Corpus", Icon: LayoutGrid },
          { id: "notes" as const, label: "Notes", Icon: FileText },
          { id: "chat" as const, label: "Chat", Icon: MessageSquare },
          { id: "artifacts" as const, label: "Artifacts", Icon: Sparkles },
          { id: "studio" as const, label: "Studio", Icon: Mic2 },
        ].map(({ id, label, Icon: NavIcon }) => {
          const active = workspaceSubTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setWorkspaceSubTab(id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
              style={{ 
                background: active ? "var(--blue)" : "transparent",
                color: active ? "white" : "var(--text-2)",
                boxShadow: active ? "0 4px 12px rgba(44, 123, 229, 0.25)" : "none"
              }}
            >
              <NavIcon size={14} className={active ? "opacity-100" : "opacity-70"} aria-hidden />
              {label}
            </button>
          );
        })}
      </nav>
    );

    return (
      <motion.div
        key="workspace"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: dur.smooth, ease: ease.out }}
        className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#010a33]"
      >
        {/* Status/error banner */}
        {(workspaceError || workspaceBusy) && (
          <div
            className="mx-4 mt-2 px-4 py-2 rounded-xl text-[11px] flex items-center justify-between gap-3 flex-shrink-0 animate-in fade-in slide-in-from-top-2"
            style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}
            role={workspaceError ? "alert" : "status"}
          >
            <div className="flex items-center gap-2">
              {workspaceBusy && <Loader2 size={12} className="animate-spin" />}
              <span>{workspaceError || workspaceBusy}</span>
            </div>
            {workspaceError && (
              <button onClick={() => setWorkspaceError("")} style={{ color: "var(--text-3)" }}><X size={12} /></button>
            )}
          </div>
        )}

        {!selectedWorkspace ? (
          /* ── NOTEBOOKS HOME VIEW ── */
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[#373a40]/80 px-8 py-6">
              <h2 className="text-[22px] font-semibold text-white" style={{ fontFamily: "var(--font-inter)" }}>
                Your workspaces
              </h2>
              <div className="flex-1" />
              <input
                value={workspaceTitle}
                onChange={(e) => setWorkspaceTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
                placeholder="New workspace name"
                className="w-44 rounded-full border border-[#373a40] bg-[#1a1b1e] px-4 py-2 text-[12px] text-white outline-none transition-all placeholder:text-[#909296] focus:w-60 focus:border-[#0f8ce9]"
              />
              <button
                onClick={handleCreateWorkspace}
                disabled={!!workspaceBusy || !workspaceTitle.trim()}
                className="flex items-center gap-1.5 rounded-full bg-[#0f8ce9] px-5 py-2 text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} /> Create
              </button>
            </div>

            <div className="flex-1 overflow-y-auto studio-scroll p-6">
              {workspaceLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
                  ))}
                </div>
              ) : workspaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                  <BookOpen size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-[16px] font-bold">No notebooks yet</p>
                  <p className="text-[13px] mt-2">Name one above and hit Create</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {workspaces.map((workspace) => {
                    const rowOwner = workspace.is_owner ?? workspace.role === "owner";
                    return (
                      <div
                        key={workspace.id}
                        onClick={() => setSelectedWorkspaceId(workspace.id)}
                        className="group relative flex cursor-pointer flex-col rounded-[22px] border border-[#373a40] bg-[#091c5a] p-5 transition-all hover:-translate-y-0.5 hover:border-[#0f8ce9]/50"
                      >
                        <div className="text-3xl mb-3 select-none">📖</div>
                        <h3 className="mb-3 line-clamp-2 text-[14px] font-semibold leading-snug text-white">{workspace.title}</h3>
                        <div className="mt-auto flex items-center gap-3 text-[10px] text-[#909296]">
                          <span className="flex items-center gap-1"><Layers size={10} />{workspace.source_count ?? 0}</span>
                          <span className="flex items-center gap-1"><FileText size={10} />{workspace.note_count ?? 0}</span>
                          <span className="flex items-center gap-1"><Sparkles size={10} />{workspace.artifact_count ?? 0}</span>
                        </div>
                        {rowOwner && (
                          <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRenameWorkspace(workspace.id); }} className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-3)]" title="Rename"><MoreVertical size={12} /></button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteWorkspace(workspace.id); }} className="p-1 rounded-lg hover:bg-red-500/10 text-[var(--text-3)] hover:text-red-400" title="Delete"><Trash2 size={12} /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <WorkspaceNotebookFigma
            notebook={selectedWorkspace}
            workspaceId={selectedWorkspaceId!}
            canEditNotebook={canEditNotebook}
            wsOwner={wsOwner}
            wsRole={wsRole}
            workspaceSharing={workspaceSharing}
            onBack={() => setSelectedWorkspaceId(null)}
            onToggleSharingPublic={() =>
              handleSetSharing(!(workspaceSharing?.public ?? false), workspaceSharing?.role ?? "viewer")
            }
            onCycleSharingRole={() =>
              handleSetSharing(workspaceSharing?.public ?? false, workspaceSharing?.role === "viewer" ? "editor" : "viewer")
            }
            onExportNotebook={() => void handleDownloadWorkspaceBundle()}
            workspaceExporting={workspaceExporting}
            onCollaborationRefresh={async () => {
              await fetchWorkspaces();
              await loadWorkspaceDetails(selectedWorkspaceId!);
            }}
            workspaceSources={workspaceSources}
            workspaceBusy={workspaceBusy}
            onOpenAddSourcesModal={() => {
              setIsAddModalOpen(true);
              setActiveSidebarItem("workspaces");
              setActiveTab("workspace");
            }}
            onUploadHeaderClick={() => {
              setSourceMode("file");
              setIsAddModalOpen(true);
              setActiveSidebarItem("workspaces");
              setActiveTab("workspace");
            }}
            researchQuery={researchQuery}
            onResearchQueryChange={setResearchQuery}
            researchMode={researchMode}
            onResearchModeChange={setResearchMode}
            onRunWebResearch={() => void handleAddWorkspaceSource("research")}
            lastResearchRun={
              lastResearchRun
                ? {
                    summary: lastResearchRun.summary,
                    provider: lastResearchRun.provider,
                    imported: lastResearchRun.imported,
                    failedImports: lastResearchRun.failedImports,
                  }
                : null
            }
            onDismissResearch={() => setLastResearchRun(null)}
            onRefreshSource={(id) => void handleRefreshWorkspaceSource(id)}
            refreshingSourceId={refreshingSourceId}
            onDeleteSource={async (sourceId) => {
              if (!selectedWorkspaceId || !confirm("Delete source?")) return;
              await deleteWorkspaceSource(selectedWorkspaceId, sourceId);
              await loadWorkspaceDetails(selectedWorkspaceId);
            }}
            workspaceChats={workspaceChats}
            activeChatId={activeChatId}
            onChatThreadChange={(id) => {
              setActiveChatId(id);
              if (id && selectedWorkspaceId) {
                void getWorkspaceChat(selectedWorkspaceId, id).then((t) => setActiveChatTurns(t?.turns || []));
              } else {
                setActiveChatTurns([]);
              }
            }}
            onCreateChat={() => void handleCreateSavedChat()}
            chatCorpusScope={chatCorpusScope}
            onChatCorpusScope={(scope) => {
              setChatCorpusScope(scope);
              if (scope === "all") setChatPickSourceIds([]);
            }}
            chatPickSourceIds={chatPickSourceIds}
            onTogglePickSource={(id) =>
              setChatPickSourceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
            }
            activeChatTurns={activeChatTurns}
            workspaceAnswer={workspaceAnswer}
            chatQuestion={chatQuestion}
            onChatQuestionChange={setChatQuestionWorkspace}
            onWorkspaceAsk={() => void handleWorkspaceAsk()}
            saveChatAsNote={saveChatAsNote}
            onSaveChatAsNoteChange={setSaveChatAsNote}
            onPinTurn={(turnId, pinned) => handlePinChatTurn(turnId, pinned)}
            onSaveTurnAsNote={(turnId) => handleSaveChatTurnAsNote(turnId)}
            onGenerateArtifact={(type) => void handleWorkspaceGenerate(type)}
            workspaceArtifacts={workspaceArtifacts}
            workspaceNotes={workspaceNotes}
            noteTitle={noteTitle}
            noteContent={noteContent}
            onNoteTitleChange={setNoteTitle}
            onNoteContentChange={setNoteContent}
            onSaveNote={() => void handleWorkspaceNoteSave()}
            onOpenArtifact={setArtifactViewerId}
            onDownloadArtifact={(artifactId) => void handleDownloadWorkspaceArtifact(artifactId)}
            onDeleteArtifact={async (artifactId) => {
              if (!selectedWorkspaceId || !confirm("Delete artifact?")) return;
              await deleteWorkspaceArtifact(selectedWorkspaceId, artifactId);
              await loadWorkspaceDetails(selectedWorkspaceId);
            }}
            onDeleteNote={async (noteId) => {
              if (!selectedWorkspaceId || !confirm("Delete note?")) return;
              await deleteWorkspaceNote(selectedWorkspaceId, noteId);
              await loadWorkspaceDetails(selectedWorkspaceId);
            }}
            artifactIcons={ARTIFACT_DEFS.map(({ type, Icon }) => ({ type, Icon }))}
            onLogout={async () => {
              await logout();
              router.push("/login");
            }}
          />
        )}

        {/* Artifact View Modal */}
        <AnimatePresence>
          {artifactViewerId && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setArtifactViewerId(null)} />
              {(() => {
                const art = workspaceArtifacts.find((a) => a.id === artifactViewerId);
                return (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10" style={{ background: "rgba(12, 12, 18, 0.95)" }}>
                    <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0 bg-white/[0.02]">
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--blue)] mb-1">Generated Output</div>
                        <h2 className="text-[20px] font-bold truncate text-[var(--text-1)]" style={{ fontFamily: "var(--font-syne)" }}>{art?.title ?? "Artifact Preview"}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => art && void handleDownloadWorkspaceArtifact(art.id)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"><Download size={16} /> <span className="max-sm:hidden">Download</span></button>
                        <button onClick={() => setArtifactViewerId(null)} className="p-3 rounded-2xl bg-white/5 text-[var(--text-3)] hover:text-white transition-all"><X size={20} /></button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto studio-scroll p-6 sm:p-10 min-h-0">
                      {art ? <ArtifactViewer artifact={art} /> : <div className="flex h-full items-center justify-center opacity-20"><Loader2 className="animate-spin" size={40} /></div>}
                    </div>
                    <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-center">
                      <p className="text-[10px] text-[var(--text-3)] font-bold uppercase tracking-widest">JackPal AI · {art?.type} · Final Render</p>
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    );
  };

  const SyncReader = () => (
    <motion.div key="reader" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: dur.smooth, ease: ease.out }} className="flex-1 flex flex-col overflow-hidden">
      <div className="studio studio-glass-chrome flex items-center gap-3 px-5 py-3 flex-shrink-0 border-b" style={{ borderColor: "var(--glass-border)" }}>
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
    <motion.div key="theater" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: dur.smooth, ease: ease.out }} className="flex-1 flex flex-col overflow-hidden">
      <div className="studio studio-glass-chrome flex items-center gap-3 px-5 py-3 flex-shrink-0 w-full border-b" style={{ borderColor: "var(--glass-border)" }}>
        <button
          onClick={() => { stopPodcast(); stopAudio(); }}
          className="p-1 rounded-lg transition-colors"
          style={{ color: "var(--text-3)" }}
          title={podcastGenerating && !podcastPlayingDocId ? "Cancel" : "Back to library"}
        >
          <ChevronRight size={16} strokeWidth={1.75} className="rotate-180" />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--teal)", fontFamily: "var(--font-syne)" }}>
          {podcastGenerating && !podcastPlayingDocId ? "Generating podcast" : "Podcast"}
        </span>
        <span className="text-[12px] truncate flex-1" style={{ color: "var(--text-2)" }}>{currentTitle}</span>
        {podcastGenerating && !podcastPlayingDocId && (
          <button
            onClick={() => { stopPodcast(); stopAudio(); }}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors"
            style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
          >
            Cancel
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col items-center overflow-y-auto studio-scroll w-full">
      {podcastGenerating && !podcastPlayingDocId && (
        <div className="w-full max-w-lg mx-auto mt-10 px-4">
          <FadeUp>
            <div className="studio studio-glass studio-glass-interactive rounded-2xl p-8 flex flex-col items-center gap-6">
              <div className="w-full max-w-xs">
                <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: "78%",
                      background: "linear-gradient(90deg, var(--teal) 0%, #61E3F0 100%)",
                      boxShadow: "0 0 18px rgba(97, 227, 240, 0.45)",
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.28) 48%, transparent 68%)",
                      animation: "shimmer 2.2s linear infinite",
                    }}
                  />
                </div>
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
              <div key={index} className="flex gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors" style={index === podcastChunkIndex ? { background: "var(--teal-dim)", borderLeft: "2px solid var(--teal)" } : { borderLeft: "2px solid transparent" }} onClick={() => jumpToPodcastLine(index)}>
                <div className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5" style={line.speaker === "Ezinne" ? { background: "var(--teal)", color: "var(--ink)" } : { background: "var(--blue)", color: "white" }}>{line.speaker?.[0] ?? "E"}</div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>{line.speaker}</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: index === podcastChunkIndex ? "var(--text-1)" : "var(--text-2)" }}>{line.text}</div>
                </div>
              </div>
            ))}
          </div>
        </SlideIn>
      )}
      </div>
    </motion.div>
  );

  const RightPanel = () => (
    <AnimatePresence>
      {selectedDocId && selectedDoc && (
        <>
          {isMobileLayout && (
            <motion.button
              key="panel-backdrop"
              type="button"
              aria-label="Close document panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55] bg-black/45 md:hidden"
              onClick={() => setSelectedDocId(null)}
            />
          )}
          <motion.aside
            key="panel"
            initial={
              isMobileLayout
                ? { x: "100%", opacity: 1 }
                : { width: 0, opacity: 0 }
            }
            animate={
              isMobileLayout
                ? { x: 0, opacity: 1 }
                : { width: 304, opacity: 1 }
            }
            exit={isMobileLayout ? { x: "100%" } : { width: 0, opacity: 0 }}
            transition={ease.spring}
            className={
              isMobileLayout
                ? "studio studio-glass-chrome fixed top-0 right-0 bottom-0 z-[60] flex w-full max-w-[304px] flex-shrink-0 flex-col overflow-hidden shadow-2xl md:hidden border-l"
                : "studio studio-glass-chrome relative hidden h-full flex-shrink-0 overflow-hidden md:flex border-l"
            }
            style={{ borderColor: "var(--glass-border)" }}
          >
            <div className="h-full min-h-0 overflow-y-auto studio-scroll p-5 space-y-6">
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
                  {summaryLoadingId === selectedDocId ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} strokeWidth={1.75} />}
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
                <Search size={10} strokeWidth={1.75} />
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
        </>
      )}
    </AnimatePresence>
  );

  const PlayerBar = ({ detailRight = "0px" }: { detailRight?: string }) => {
    if (!currentDocId && !podcastPlayingDocId && !isAudioLoading) return null;
    const isPodcast = !!podcastPlayingDocId;
    const isPlaying = isPodcast ? !!podcastPlayingDocId : !!playingDocId;
    const accent = isPodcast ? "var(--teal)" : "var(--blue)";
    const accentInk = isPodcast ? "var(--ink)" : "white";
    const togglePlay = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) audio.play().catch(() => {}); else audio.pause();
    };
    return (
      <div
        className="studio studio-glass-chrome fixed bottom-0 z-50 flex flex-col border-t bg-[var(--ink)]"
        style={{
          left: "var(--sidebar-width)",
          right: detailRight,
          paddingBottom: "max(0px, env(safe-area-inset-bottom))",
          borderColor: "var(--border)",
        }}
      >
        {/* Progress bar — full-width, top edge */}
        <div
          className="relative h-1.5 cursor-pointer group"
          style={{ background: "var(--surface-3)" }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seekWithinCurrent(pct * 100);
          }}
        >
          <div
            className="h-full"
            style={{
              width: `${playerProgress}%`,
              background: accent,
              transition: "width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${playerProgress}% - 6px)`, background: accent, boxShadow: `0 0 0 4px ${accent}33` }}
          />
        </div>

        {/* Main controls row */}
        <div className="flex items-center gap-3 sm:gap-5 px-3 sm:px-6 py-2.5 sm:py-3">
          {/* Title + speaker */}
          <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0 w-32 sm:w-56">
            <div
              className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-[12px] font-bold"
              style={{ background: accent, color: accentInk }}
            >
              {isPodcast ? (currentSpeaker?.[0] ?? "E") : <AudioLines size={14} strokeWidth={1.75} />}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold truncate" style={{ color: "var(--text-1)" }}>{currentTitle}</div>
              <div className="text-[10px] truncate" style={{ color: "var(--text-3)" }}>
                {isPodcast ? (currentSpeaker ? `${currentSpeaker} · podcast` : "Podcast") : "Listening"}
              </div>
            </div>
          </div>

          {/* Center transport controls */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => skipBy(-10)}
              className="flex items-center gap-1 transition-colors"
              style={{ color: "var(--text-2)" }}
              title="Skip back 10s (←)"
            >
              <SkipBack size={18} strokeWidth={1.75} />
              <span className="text-[10px] font-bold tabular-nums max-sm:hidden">10</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.86 }}
              onClick={togglePlay}
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full transition-shadow"
              style={{
                background: accent,
                color: accentInk,
                boxShadow: `0 4px 24px ${isPodcast ? "rgba(42,154,120,0.4)" : "rgba(44,123,229,0.4)"}`,
              }}
              title="Play / pause (Space)"
            >
              {isAudioLoading ? <Loader2 size={22} className="animate-spin" /> : isPlaying ? <Pause size={22} strokeWidth={2} /> : <Play size={22} strokeWidth={2} className="ml-0.5" />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => skipBy(10)}
              className="flex items-center gap-1 transition-colors"
              style={{ color: "var(--text-2)" }}
              title="Skip forward 10s (→)"
            >
              <span className="text-[10px] font-bold tabular-nums max-sm:hidden">10</span>
              <SkipForward size={18} strokeWidth={1.75} />
            </motion.button>
          </div>

          {/* Time */}
          <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4 min-w-0">
            <div className="text-[11px] tabular-nums flex-shrink-0 max-sm:hidden" style={{ color: "var(--text-3)" }}>
              <span style={{ color: "var(--text-1)" }}>{formatTime(currentTime)}</span>
              <span className="mx-1.5">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Speed picker — pills */}
            <div className="flex items-center rounded-full overflow-hidden flex-shrink-0" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              {SPEED_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setPlaybackRate(s); if (audioRef.current) audioRef.current.playbackRate = s; }}
                  className="text-[10px] font-bold px-2 sm:px-2.5 py-1 transition-colors tabular-nums"
                  style={{
                    background: playbackRate === s ? accent : "transparent",
                    color: playbackRate === s ? accentInk : "var(--text-3)",
                  }}
                  title={`${s}x speed`}
                >
                  {s}×
                </button>
              ))}
            </div>

            {/* Download — only for Listen */}
            {currentDocId && !isPodcast && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDownload(currentDocId)}
                className="flex-shrink-0 transition-colors max-sm:hidden"
                style={{ color: "var(--text-3)" }}
                title="Download audio"
              >
                <Download size={16} strokeWidth={1.75} />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="studio flex h-screen max-h-[100dvh] min-h-0 overflow-hidden bg-[#010a33] text-[var(--text-1)]">
      <audio ref={audioRef} />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AnimatePresence mode="wait">{WorkspaceView()}</AnimatePresence>
        </div>
      </div>

      {/* ── Action Modals ───────────────────────────────────────────────────────── */}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Import Source" maxWidth="max-w-2xl">
        <div className="space-y-6">
          <div className="flex items-center gap-2 p-1.5 rounded-[1.5rem] bg-black/40 border border-white/5 shadow-inner">
            {(["text", "url", "youtube", "drive", "file", "research"] as const).map((mode) => {
              const Icon = mode === "text" ? FileText : mode === "url" ? Globe : mode === "youtube" ? Youtube : mode === "drive" ? Cloud : mode === "file" ? CloudUpload : Search;
              const active = sourceMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setSourceMode(mode)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    active ? "bg-[var(--brand-blue)] text-white shadow-xl" : "text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-white/5"
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{mode}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {(sourceMode === "text" || sourceMode === "url" || sourceMode === "youtube" || sourceMode === "drive") && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-3)] px-1">Title</label>
                <input
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  placeholder={sourceMode === "text" ? "Note title" : "Source title (optional)"}
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-[14px] font-bold text-white placeholder-white/10 outline-none focus:border-[var(--brand-blue)] transition-all"
                />
              </div>
            )}

            {(sourceMode === "url" || sourceMode === "youtube" || sourceMode === "drive") && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-3)] px-1">Link</label>
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="Paste URL here..."
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-[14px] font-bold text-white placeholder-white/10 outline-none focus:border-[var(--brand-blue)] transition-all"
                />
              </div>
            )}

            {sourceMode === "text" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-3)] px-1">Content</label>
                <textarea
                  value={sourceContent}
                  onChange={(e) => setSourceContent(e.target.value)}
                  placeholder="Paste study text here..."
                  rows={8}
                  className="w-full bg-white/5 border-2 border-white/5 rounded-3xl py-4 px-6 text-[14px] font-bold text-white placeholder-white/10 outline-none focus:border-[var(--brand-blue)] transition-all resize-none"
                />
              </div>
            )}

            {sourceMode === "research" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-3)] px-1">Query</label>
                  <textarea
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    placeholder="What do you want to learn?"
                    rows={4}
                    className="w-full bg-white/5 border-2 border-white/5 rounded-3xl py-4 px-6 text-[14px] font-bold text-white placeholder-white/10 outline-none focus:border-[var(--brand-blue)] transition-all resize-none"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    {(["fast", "deep"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setResearchMode(m)}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          researchMode === m ? "bg-[var(--brand-blue)] text-white shadow-lg" : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-[var(--text-3)]">
                    {researchMode === "fast" ? "Quick web search" : "Deep multi-stage bibliography build"}
                  </span>
                </div>
              </div>
            )}

            {sourceMode === "file" && (
              <div 
                className="group relative flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[var(--brand-blue)] transition-all cursor-pointer"
                onClick={() => workspaceFileInputRef.current?.click()}
              >
                <input
                  ref={workspaceFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-[var(--blue-dim)] group-hover:text-[var(--brand-blue)]">
                  <CloudUpload size={40} strokeWidth={1.5} />
                </div>
                <p className="text-[16px] font-bold text-white">{workspaceFileName || "Click to browse or drop file"}</p>
                <p className="text-[12px] text-[var(--text-3)] mt-2 uppercase font-black tracking-widest">PDF · DOCX · TXT up to 20MB</p>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="px-8 py-3.5 rounded-full text-[13px] font-bold text-[var(--text-3)] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleAddWorkspaceSource();
                setIsAddModalOpen(false);
              }}
              disabled={!!workspaceBusy}
              className="px-10 py-3.5 rounded-full text-[13px] font-black uppercase tracking-widest bg-[var(--brand-blue)] text-white shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {workspaceBusy ? "Processing..." : "Import Source"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isCreateNoteModalOpen} onClose={() => setIsCreateNoteModalOpen(false)} title="Quick Note">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-3)] px-1">Concept Name</label>
            <input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="e.g., Nigerian Constitutional Law"
              className="w-full bg-white/5 border-2 border-white/5 rounded-2xl py-4 px-6 text-[14px] font-bold text-white placeholder-white/10 outline-none focus:border-[var(--brand-blue)] transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-3)] px-1">Note Details</label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write down key takeaways..."
              rows={10}
              className="w-full bg-white/5 border-2 border-white/5 rounded-[2rem] py-4 px-6 text-[14px] font-bold text-white placeholder-white/10 outline-none focus:border-[var(--brand-blue)] transition-all resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsCreateNoteModalOpen(false)} className="px-8 py-3.5 rounded-full text-[13px] font-bold text-[var(--text-3)] hover:text-white transition-colors">Cancel</button>
            <button
              onClick={() => {
                handleWorkspaceNoteSave();
                setIsCreateNoteModalOpen(false);
              }}
              className="px-10 py-3.5 rounded-full text-[13px] font-black uppercase tracking-widest bg-[var(--teal)] text-white shadow-xl shadow-teal-900/20 active:scale-[0.98] transition-all"
            >
              Save to Library
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPodcastModalOpen} onClose={() => setIsPodcastModalOpen(false)} title="Create Podcast" maxWidth="max-w-3xl">
        <div className="space-y-8 py-4">
          <div className="text-center space-y-2">
            <p className="text-[14px] text-[var(--text-3)]">Pick a tool to generate audio-first study content from your corpus.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {ARTIFACT_DEFS.map(({ type, label, blurb, Icon: ArtIcon }) => (
              <button
                key={type}
                onClick={() => {
                  handleWorkspaceGenerate(type);
                  setIsPodcastModalOpen(false);
                  setActiveSidebarItem("workspaces");
                  setWorkspaceSubTab("artifacts");
                }}
                className="group relative flex items-start gap-5 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-[var(--brand-blue)] hover:bg-[var(--blue-dim)] transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 group-hover:scale-125 transition-all pointer-events-none">
                  <ArtIcon size={64} />
                </div>
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-white/10 group-hover:scale-110 transition-all">
                  <ArtIcon size={28} className="text-[var(--text-2)] group-hover:text-white" />
                </div>
                <div className="min-w-0 pr-8">
                  <h4 className="text-[16px] font-black text-white uppercase tracking-tight italic" style={{ fontFamily: "var(--font-syne)" }}>{label}</h4>
                  <p className="text-[12px] text-[var(--text-3)] mt-1.5 leading-snug line-clamp-2 group-hover:text-[var(--text-2)] transition-colors">{blurb}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {PlayerBar({ detailRight: "var(--detail-pane-width)" })}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div
          className="studio flex h-screen max-h-[100dvh] min-h-0 items-center justify-center"
          style={{ background: "var(--ink)", color: "var(--text-3)" }}
        >
          <Loader2 className="animate-spin" size={28} aria-hidden />
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}
