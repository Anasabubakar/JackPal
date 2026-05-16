"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookOpen,
  Cloud,
  Download,
  Eye,
  FilePlus,
  FileText,
  Files,
  Globe,
  LayoutList,
  Link2,
  Loader2,
  NotebookTabs,
  PanelLeft,
  PieChart,
  PlusCircle,
  Presentation,
  Printer,
  RefreshCw,
  Search,
  Share2,
  Sliders,
  Sparkles,
  Trash2,
  User,
  Video,
  Volume2,
  X,
  Youtube,
} from "lucide-react";
import { Markdown } from "@/components/ui/Markdown";
import { NotebookCollaborationPanel } from "@/components/workspace/NotebookCollaborationPanel";
import { JackpalsLogo } from "@/components/brand/JackpalsLogo";
import type {
  Artifact,
  ChatTurn,
  Notebook,
  Note,
  SavedChat,
  Source,
  WorkspaceCitation,
} from "@/lib/api";

function ResearchModeSegment({
  value,
  onChange,
  disabled,
}: {
  value: "fast" | "deep";
  onChange: (m: "fast" | "deep") => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="relative flex min-h-[44px] w-full min-w-0 flex-1 items-stretch rounded-full bg-[#2c2e33] p-1"
      role="group"
      aria-label="Research mode"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1 bottom-1 w-[calc(50%-6px)] rounded-full bg-[#0f8ce9]/35 shadow-[inset_0_0_0_1px_rgba(15,140,233,0.65)] transition-[left] duration-200 ease-out motion-reduce:transition-none ${
          value === "deep" ? "left-[calc(50%+4px)]" : "left-1"
        }`}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("fast")}
        className={`relative z-10 flex min-h-[44px] min-w-0 flex-1 touch-manipulation items-center justify-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors ${
          value === "fast" ? "text-white" : "text-white/65 hover:text-white/90"
        }`}
      >
        <Globe className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        <span className="truncate">Fast</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("deep")}
        className={`relative z-10 flex min-h-[44px] min-w-0 flex-1 touch-manipulation items-center justify-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors ${
          value === "deep" ? "text-white" : "text-white/65 hover:text-white/90"
        }`}
      >
        <Link2 className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        <span className="truncate">Deep research</span>
      </button>
    </div>
  );
}

const STUDIO_TILES: { type: string; label: string; Icon: LucideIcon }[] = [
  { type: "audio", label: "Audio Overview", Icon: Volume2 },
  { type: "slide-deck", label: "Slide Deck", Icon: Presentation },
  { type: "video", label: "Video Overview", Icon: Video },
  { type: "mind-map", label: "Mind Maps", Icon: Files },
  { type: "report", label: "Reports", Icon: Printer },
  { type: "flashcard", label: "Flash Cards", Icon: NotebookTabs },
  { type: "quiz", label: "Quiz", Icon: BookOpen },
  { type: "infographic", label: "Infographic", Icon: FileText },
  { type: "data-table", label: "Data Table", Icon: PieChart },
];

function HeaderBtn({
  children,
  className = "",
  wide,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center rounded-[10px] bg-[#0f8ce9] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 ${wide ? "h-8 gap-1.5 px-3 min-w-[110px]" : "size-8"} ${className}`}
    >
      {children}
    </button>
  );
}

export type WorkspaceNotebookFigmaProps = {
  notebook: Notebook;
  workspaceId: string;
  canEditNotebook: boolean;
  wsOwner: boolean;
  wsRole: string;
  workspaceSharing: { public: boolean; role: "viewer" | "editor" } | null;
  onBack: () => void;
  onToggleSharingPublic: () => void;
  onCycleSharingRole: () => void;
  onExportNotebook: () => void;
  workspaceExporting: boolean;
  onCollaborationRefresh: () => Promise<void>;

  workspaceSources: Source[];
  workspaceBusy: string;
  onOpenAddSourcesModal: () => void;
  onUploadHeaderClick: () => void;

  researchQuery: string;
  onResearchQueryChange: (q: string) => void;
  researchMode: "fast" | "deep";
  onResearchModeChange: (m: "fast" | "deep") => void;
  onRunWebResearch: () => void;

  lastResearchRun: {
    summary: string;
    provider: string;
    imported: number;
    failedImports: number;
  } | null;
  onDismissResearch: () => void;

  onRefreshSource: (sourceId: string) => void;
  refreshingSourceId: string | null;
  onDeleteSource: (sourceId: string) => Promise<void>;

  workspaceChats: SavedChat[];
  activeChatId: string | null;
  onChatThreadChange: (id: string | null) => void;
  onCreateChat: () => void;
  chatCorpusScope: "all" | "pick";
  onChatCorpusScope: (s: "all" | "pick") => void;
  chatPickSourceIds: string[];
  onChatPickReplace: (ids: string[]) => void;
  onTogglePickSource: (id: string) => void;

  activeChatTurns: ChatTurn[];
  workspaceAnswer: string;
  chatQuestion: string;
  onChatQuestionChange: (q: string) => void;
  onWorkspaceAsk: () => void;

  saveChatAsNote: boolean;
  onSaveChatAsNoteChange: (v: boolean) => void;
  onPinTurn: (turnId: string, pinned: boolean) => Promise<void>;
  onSaveTurnAsNote: (turnId: string) => Promise<void>;

  onGenerateArtifact: (type: string) => void;
  workspaceArtifacts: Artifact[];
  workspaceNotes: Note[];

  noteTitle: string;
  noteContent: string;
  onNoteTitleChange: (v: string) => void;
  onNoteContentChange: (v: string) => void;
  onSaveNote: () => void;

  onOpenArtifact: (id: string) => void;
  onDownloadArtifact: (artifactId: string) => void;
  onDeleteArtifact: (artifactId: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;

  artifactIcons: { type: string; Icon: LucideIcon }[];

  onLogout: () => void;
};

export function WorkspaceNotebookFigma(props: WorkspaceNotebookFigmaProps) {
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePortalMounted, setSharePortalMounted] = useState(false);
  const shareCloseRef = useRef<HTMLButtonElement | null>(null);
  const shareTitleId = useId();

  const {
    notebook,
    workspaceId,
    canEditNotebook,
    wsOwner,
    wsRole,
    workspaceSharing,
    onBack,
    onToggleSharingPublic,
    onCycleSharingRole,
    onCollaborationRefresh,
    workspaceSources,
    workspaceBusy,
    onOpenAddSourcesModal,
    onUploadHeaderClick,
    researchQuery,
    onResearchQueryChange,
    researchMode,
    onResearchModeChange,
    onRunWebResearch,
    lastResearchRun,
    onDismissResearch,
    onRefreshSource,
    refreshingSourceId,
    onDeleteSource,
    workspaceChats,
    activeChatId,
    onChatThreadChange,
    onCreateChat,
    chatCorpusScope,
    onChatCorpusScope,
    chatPickSourceIds,
    onChatPickReplace,
    onTogglePickSource,
    activeChatTurns,
    workspaceAnswer,
    chatQuestion,
    onChatQuestionChange,
    onWorkspaceAsk,
    saveChatAsNote,
    onSaveChatAsNoteChange,
    onPinTurn,
    onSaveTurnAsNote,
    onGenerateArtifact,
    workspaceArtifacts,
    workspaceNotes,
    noteTitle,
    noteContent,
    onNoteTitleChange,
    onNoteContentChange,
    onSaveNote,
    onOpenArtifact,
    onDownloadArtifact,
    onDeleteArtifact,
    onDeleteNote,
    artifactIcons,
    onLogout,
  } = props;

  const busy = !!workspaceBusy;

  const selectAllRef = useRef<HTMLInputElement>(null);

  const effectiveChatSourceCount =
    chatCorpusScope === "all"
      ? workspaceSources.length
      : chatPickSourceIds.filter((id) => workspaceSources.some((s) => s.id === id)).length;

  const allSourcesIncluded =
    workspaceSources.length > 0 &&
    (chatCorpusScope === "all" ||
      (chatPickSourceIds.length === workspaceSources.length &&
        workspaceSources.every((s) => chatPickSourceIds.includes(s.id))));

  const someSourcesIncluded =
    chatCorpusScope === "pick" &&
    chatPickSourceIds.length > 0 &&
    chatPickSourceIds.length < workspaceSources.length;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSourcesIncluded;
  }, [someSourcesIncluded]);

  function toggleRowSource(id: string) {
    if (chatCorpusScope === "all") {
      onChatCorpusScope("pick");
      onChatPickReplace(workspaceSources.map((s) => s.id).filter((x) => x !== id));
    } else {
      onTogglePickSource(id);
    }
  }

  function isRowIncluded(id: string) {
    return chatCorpusScope === "all" || chatPickSourceIds.includes(id);
  }

  function handleHeaderSelectAllChange() {
    if (!workspaceSources.length) return;
    if (allSourcesIncluded) {
      onChatCorpusScope("pick");
      onChatPickReplace([]);
    } else {
      onChatCorpusScope("all");
      onChatPickReplace([]);
    }
  }

  useEffect(() => {
    setSharePortalMounted(true);
  }, []);

  useEffect(() => {
    if (!shareOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShareOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shareOpen]);

  useEffect(() => {
    if (!shareOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [shareOpen]);

  useEffect(() => {
    if (!shareOpen) return;
    shareCloseRef.current?.focus();
  }, [shareOpen]);

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip bg-[#010a33] text-white antialiased"
      style={{ fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-3 sm:px-6 lg:pl-[36px] lg:pr-[26px] lg:pt-[16px]">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Back to notebooks"
          >
            <ArrowRight className="size-4 rotate-180" strokeWidth={2} />
          </button>
          <JackpalsLogo variant="mark" priority className="h-8 w-8 shrink-0 object-contain sm:h-10 sm:w-10" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-medium leading-tight tracking-tight sm:text-[20px] sm:leading-none">{notebook.title}</h1>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <HeaderBtn
            wide
            disabled={!canEditNotebook || busy}
            onClick={onUploadHeaderClick}
            title="Import PDFs, links, Drive files, and more"
            className="max-sm:flex-1"
          >
            <FilePlus className="size-4 shrink-0 opacity-95" strokeWidth={1.75} />
            <span className="text-[13px]">Upload File</span>
          </HeaderBtn>
          <HeaderBtn wide disabled={busy} onClick={() => setShareOpen(true)} title="Share workspace" className="max-sm:flex-1">
            <Share2 className="size-4 shrink-0 opacity-95" strokeWidth={1.75} />
            <span className="text-[13px]">Share</span>
          </HeaderBtn>
          {wsOwner ? (
            <HeaderBtn disabled={busy} onClick={onCycleSharingRole} title="Cycle viewer/editor link role">
              <Sliders className="size-4 opacity-95" strokeWidth={1.75} />
            </HeaderBtn>
          ) : null}
          <HeaderBtn onClick={() => void onLogout()} title="Sign out">
            <User className="size-4 opacity-95" strokeWidth={1.75} />
          </HeaderBtn>
        </div>
      </header>

      {sharePortalMounted &&
        shareOpen &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-black/55"
                aria-label="Close share dialog"
                onClick={() => setShareOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={shareTitleId}
                className="relative z-[201] flex max-h-[min(720px,90vh)] w-full max-w-lg flex-col overflow-hidden rounded-[25px] border border-[#373a40] bg-[#091c5a] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-6 py-4">
                  <div className="min-w-0">
                    <h2 id={shareTitleId} className="text-[20px] font-medium text-white">
                      Share
                    </h2>
                    <p className="mt-1 text-[12px] text-[#909296]">Invite collaborators and manage access.</p>
                  </div>
                  <button
                    ref={shareCloseRef}
                    type="button"
                    className="shrink-0 rounded-lg p-2 text-white/80 outline-none ring-[#0f8ce9] hover:bg-white/10 hover:text-white focus-visible:ring-2"
                    onClick={() => setShareOpen(false)}
                    aria-label="Close share dialog"
                  >
                    <X className="size-5" strokeWidth={2} />
                  </button>
                </div>

                <div className="studio-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  {wsOwner && workspaceSharing ? (
                    <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[#1a1b1e] p-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onToggleSharingPublic()}
                        className="inline-flex items-center gap-2 rounded-[10px] bg-[#0f8ce9] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-45"
                      >
                        <Globe className="size-4 shrink-0" strokeWidth={2} />
                        {workspaceSharing.public ? "Public link on" : "Enable public link"}
                      </button>
                      <button
                        type="button"
                        disabled={busy || !workspaceSharing.public}
                        onClick={() => void onCycleSharingRole()}
                        className="inline-flex items-center gap-2 rounded-[10px] border border-[#373a40] bg-[#2c2e33] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#35373d] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Sliders className="size-4 shrink-0" strokeWidth={2} />
                        Link role: {workspaceSharing.role}
                      </button>
                    </div>
                  ) : null}

                  {!wsOwner ? (
                    <p className="text-[13px] leading-relaxed text-[#c1c2c5]">
                      You have <span className="font-semibold text-white">{wsRole}</span> access. Only the workspace owner can change
                      invitations, collaborators, and public links.
                    </p>
                  ) : (
                    <NotebookCollaborationPanel notebookId={workspaceId} embedSurface onRefresh={() => onCollaborationRefresh()} />
                  )}
                </div>
            </div>
          </div>,
          document.body,
        )}

      {!canEditNotebook && (
        <div className="mx-4 mt-4 rounded-xl border border-[#373a40] bg-[#1a1b1e] px-4 py-3 text-[12px] text-[#c1c2c5] sm:mx-6 lg:mx-[53px]">
          Read-only workspace — you can browse and chat, but an editor role is required to add sources or generate studio outputs.
        </div>
      )}

      {/* Columns — stack on phones, bridge to two columns on laptops, then three columns only when space allows. */}
      <div className="mt-2 flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-4 overflow-x-clip px-4 pb-6 pt-1 lg:flex-row lg:flex-wrap lg:items-stretch xl:mt-4 xl:gap-[20px] xl:px-[36px] xl:pb-8 xl:pr-[26px] min-[1420px]:flex-nowrap">
        {/* Sources */}
        <aside
          className={`flex shrink-0 flex-col overflow-hidden rounded-t-[25px] bg-[rgba(45,107,255,0.19)] transition-[width] duration-200 xl:max-w-none ${
            sourcesCollapsed
              ? "w-[56px] self-start sm:w-[72px] min-[1420px]:w-[72px]"
              : "min-h-0 w-full lg:min-w-[260px] lg:flex-[0_1_32%] min-[1420px]:w-[407px] min-[1420px]:flex-none"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/15 px-4 pb-3 pt-5">
            {!sourcesCollapsed && <h2 className="text-[17px] font-medium">Sources</h2>}
            <button
              type="button"
              className="rounded-lg p-1 text-white/90 hover:bg-white/10"
              aria-label={sourcesCollapsed ? "Expand sources" : "Collapse sources"}
              onClick={() => setSourcesCollapsed((v) => !v)}
            >
              <PanelLeft className={`size-6 transition-transform ${sourcesCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>

          {!sourcesCollapsed && (
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
              <button
                type="button"
                disabled={!canEditNotebook || busy}
                onClick={onOpenAddSourcesModal}
                className="flex min-h-[36px] w-full touch-manipulation items-center justify-center gap-2 rounded-[10px] bg-[#0f8ce9] text-[13px] font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <PlusCircle className="size-4 shrink-0 text-white" strokeWidth={1.75} aria-hidden />
                Add Sources
              </button>

              <div className="flex min-h-[106px] flex-col gap-3 rounded-xl border border-[#373a40] bg-[#1a1b1e] p-[13px]">
                <label className="sr-only" htmlFor="web-research-query">
                  Search the web for new sources
                </label>
                <textarea
                  id="web-research-query"
                  rows={2}
                  value={researchQuery}
                  onChange={(e) => onResearchQueryChange(e.target.value)}
                  placeholder="Search the web for new sources"
                  disabled={!canEditNotebook || busy}
                  className="resize-none bg-transparent px-1 pt-2 text-[14px] text-[#909296] outline-none placeholder:text-[#909296] disabled:opacity-50"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <ResearchModeSegment
                    value={researchMode}
                    onChange={onResearchModeChange}
                    disabled={!canEditNotebook || busy}
                  />
                  <button
                    type="button"
                    disabled={!canEditNotebook || busy || !researchQuery.trim()}
                    onClick={() => void onRunWebResearch()}
                    className="flex size-11 shrink-0 touch-manipulation items-center justify-center self-end rounded-full bg-[#2c2e33] hover:bg-[#35373d] disabled:cursor-not-allowed disabled:opacity-40 sm:self-center"
                    aria-label="Run web research import"
                  >
                    {busy ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5 text-white/90" strokeWidth={2} />}
                  </button>
                </div>
              </div>

              {lastResearchRun && (
                <div className="rounded-xl border border-[#373a40] bg-[#091c5a] px-3 py-2 text-[11px] text-[#c1c2c5]">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-medium text-white">
                      Imported {lastResearchRun.imported}{lastResearchRun.failedImports ? ` · failed ${lastResearchRun.failedImports}` : ""}{" "}
                      · {lastResearchRun.provider}
                    </span>
                    <button type="button" className="text-[10px] text-[#909296] underline hover:text-white" onClick={onDismissResearch}>
                      Dismiss
                    </button>
                  </div>
                  {lastResearchRun.summary ? <p className="max-h-24 overflow-y-auto leading-snug opacity-90">{lastResearchRun.summary}</p> : null}
                </div>
              )}

              <div className="studio-scroll flex min-h-[200px] flex-1 flex-col gap-1 overflow-y-auto pr-1 min-[1420px]:min-h-0">
                {workspaceSources.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 pb-8 pt-10 text-center">
                    <FileText className="size-6 text-white/80" strokeWidth={1.75} />
                    <p className="text-[14px] font-normal text-white">Saved sources will appear here</p>
                    <p className="max-w-[260px] text-[12px] leading-[19.5px] text-[#909296]">
                      Click Add Sources to add PDFs, websites, text, videos, or audio files — or run a web research query above.
                    </p>
                  </div>
                ) : (
                  <>
                    <label className="flex cursor-pointer items-center gap-2 border-b border-white/10 px-1 pb-2 pt-1 text-[13px] text-white">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allSourcesIncluded}
                        onChange={handleHeaderSelectAllChange}
                        className="size-[18px] shrink-0 rounded border-white/20 bg-[#1a1b1e] accent-[#0f8ce9]"
                      />
                      Select all
                    </label>
                    {workspaceSources.map((source) => (
                      <div
                        key={source.id}
                        className="group flex items-center gap-2 rounded-xl border border-transparent px-2 py-2 hover:border-white/10 hover:bg-white/5"
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1a1b1e]">
                          {source.type === "youtube" ? (
                            <Youtube size={14} className="text-red-500" />
                          ) : source.type === "drive" ? (
                            <Cloud size={14} className="text-blue-400" />
                          ) : source.type === "url" ? (
                            <Globe size={14} className="text-teal-400" />
                          ) : (
                            <FileText size={14} className="text-white/50" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-2 text-[12px] font-semibold leading-snug">{source.title}</div>
                          <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-[#909296]">
                            {source.type}
                            {source.refresh_state ? ` · ${source.refresh_state}` : ""}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <div className="flex gap-0.5 opacity-100 xl:opacity-0 xl:group-hover:opacity-100">
                            {["url", "youtube", "drive"].includes(source.type) && (
                              <button
                                type="button"
                                disabled={!canEditNotebook || refreshingSourceId === source.id}
                                onClick={() => void onRefreshSource(source.id)}
                                className="rounded-lg p-1 text-[#909296] hover:bg-white/10"
                                title="Refresh"
                              >
                                <RefreshCw size={11} className={refreshingSourceId === source.id ? "animate-spin" : ""} />
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={!canEditNotebook}
                              onClick={() => void onDeleteSource(source.id)}
                              className="rounded-lg p-1 text-[#f87171] hover:bg-red-500/10"
                              title="Delete"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                          <input
                            type="checkbox"
                            checked={isRowIncluded(source.id)}
                            onChange={() => toggleRowSource(source.id)}
                            className="size-[18px] shrink-0 rounded border-white/20 bg-[#1a1b1e] accent-[#0f8ce9]"
                            title="Include in chat context"
                            aria-label={`Include ${source.title} in chat`}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Chat — primary workspace column. */}
        <section className="flex min-h-0 min-w-[min(100%,360px)] flex-1 flex-col rounded-t-[25px] bg-[#091c5a] lg:flex-[1_1_52%] min-[1420px]:w-[530px] min-[1420px]:max-w-none min-[1420px]:flex-none min-[1420px]:overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 px-4 pb-3 pt-4 sm:px-5 sm:pt-4">
            <h2 className="text-[17px] font-medium">Chat</h2>
            <div className="flex flex-wrap items-center gap-2">
              {workspaceChats.length > 0 && (
                <select
                  value={activeChatId || ""}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    onChatThreadChange(id);
                  }}
                  className="max-w-[180px] rounded-lg border border-white/10 bg-transparent px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#c1c2c5] outline-none"
                >
                  <option value="">Latest session</option>
                  {workspaceChats.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#091c5a]">
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                disabled={!canEditNotebook || busy}
                onClick={() => void onCreateChat()}
                className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#c1c2c5] hover:bg-white/10 disabled:opacity-40"
              >
                + Thread
              </button>
              <button type="button" className="rounded-lg p-1 hover:bg-white/10" aria-label="Chat tools">
                <LayoutList className="size-6 text-white/90" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {chatCorpusScope === "pick" && chatPickSourceIds.length === 0 && workspaceSources.length > 0 ? (
            <div className="border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-center text-[11px] text-amber-100/95 sm:px-5">
              Select at least one source (or choose Select all) before sending a message.
            </div>
          ) : null}

          <div className="studio-scroll flex min-h-[min(240px,45svh)] flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 pt-4 sm:min-h-[280px] sm:px-5 sm:pt-5 min-[1420px]:min-h-0">
            {activeChatTurns.length === 0 && !workspaceAnswer ? (
              <>
                <p className="max-w-[494px] text-2xl leading-none text-[#c1c2c5] sm:text-[28px] sm:leading-[34px]">👋</p>
                <h3 className="max-w-[494px] text-2xl font-normal leading-tight tracking-tight sm:text-[28px] sm:leading-[34px]">
                  Let&apos;s Cook!
                </h3>
                <p className="max-w-[494px] text-[13px] leading-relaxed text-[#c1c2c5] sm:text-[15px] sm:leading-6">
                  This page is for you to understand, create, or make progress on what you want to learn. Make the most out of it
                </p>
              </>
            ) : (
              <>
                {activeChatTurns.map((turn) => (
                  <div key={turn.id} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${turn.role === "user" ? "bg-[#0f8ce9] text-white" : "border border-white/10 bg-[#1a1b1e]/90 text-white"}`}
                    >
                      {turn.role === "user" ? (
                        <p>{turn.content}</p>
                      ) : (
                        <>
                          <Markdown content={turn.content} />
                          {turn.citations && turn.citations.length > 0 && (
                            <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
                              {turn.citations.map((c: WorkspaceCitation, i: number) => (
                                <div key={`${c.source_id}-${i}`} className="flex items-start gap-2 text-[10px] text-[#909296]">
                                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0f8ce9]/25 text-[9px] font-bold text-[#7ec8ff]">
                                    {i + 1}
                                  </span>
                                  <span className="line-clamp-2">{c.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 flex gap-1 opacity-80">
                            <button
                              type="button"
                              disabled={!activeChatId}
                              onClick={() => void onPinTurn(turn.id, !turn.pinned)}
                              className="rounded-lg p-1.5 hover:bg-white/10"
                              title={turn.pinned ? "Unpin" : "Pin"}
                            >
                              <Bookmark size={12} className={turn.pinned ? "fill-yellow-400 text-yellow-400" : ""} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void onSaveTurnAsNote(turn.id)}
                              className="rounded-lg p-1.5 hover:bg-white/10"
                              title="Save as note"
                            >
                              <FileText size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {workspaceAnswer ? (
                  <div className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl border border-[#0f8ce9]/40 bg-[#010a33]/80 p-4">
                      <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-teal-300">Thinking…</div>
                      <Markdown content={workspaceAnswer} />
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="mt-auto space-y-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-4">
            <div className="flex flex-col gap-2 rounded-2xl border border-[#373a40] bg-[#1a1b1e] p-2 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:gap-2">
              <textarea
                value={chatQuestion}
                onChange={(e) => onChatQuestionChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void onWorkspaceAsk();
                  }
                }}
                rows={2}
                placeholder="Ask a question or create something"
                disabled={!canEditNotebook || busy}
                className="min-h-[48px] flex-1 resize-none bg-transparent px-3 py-3 text-[15px] text-white outline-none placeholder:text-[#909296] disabled:opacity-50 sm:px-4"
              />
              <div className="flex shrink-0 flex-col items-stretch gap-2 px-2 pb-1 sm:items-end sm:px-0 sm:pb-0 sm:pr-2">
                <label className="flex cursor-pointer items-center gap-2 text-[10px] uppercase text-[#909296] sm:hidden">
                  <input
                    type="checkbox"
                    checked={saveChatAsNote}
                    onChange={(e) => onSaveChatAsNoteChange(e.target.checked)}
                    className="accent-[#0f8ce9]"
                  />
                  Save note
                </label>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-[12px] tabular-nums text-[#909296]">{effectiveChatSourceCount} sources</span>
                  <button
                    type="button"
                    disabled={!canEditNotebook || busy || !chatQuestion.trim()}
                    onClick={() => void onWorkspaceAsk()}
                    className="flex size-11 touch-manipulation items-center justify-center rounded-full bg-[#373a40] hover:bg-[#454952] disabled:cursor-not-allowed disabled:opacity-40 sm:size-10"
                    aria-label="Send message"
                  >
                    {busy ? <Loader2 className="size-5 animate-spin text-white" /> : <ArrowRight className="size-5 text-white" strokeWidth={2} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <label className="hidden cursor-pointer items-center gap-2 text-[11px] text-[#909296] sm:flex">
                <input
                  type="checkbox"
                  checked={saveChatAsNote}
                  onChange={(e) => onSaveChatAsNoteChange(e.target.checked)}
                  className="accent-[#0f8ce9]"
                />
                Save reply as note
              </label>
              <p className="text-center text-[12px] leading-4 text-[#909296]">
                JackPals can be inaccurate; please double check its responses.
              </p>
            </div>
          </div>
        </section>

        {/* Studio column + preview */}
        <div className="flex min-h-0 w-full min-w-0 shrink-0 flex-col gap-3 lg:flex-[1_1_100%] xl:gap-3 min-[1420px]:w-[320px] min-[1420px]:flex-none">
          <div className="flex min-h-[260px] flex-col rounded-[20px] bg-[#091c5a] min-[1420px]:h-[340px] min-[1420px]:min-h-0">
            <div className="flex items-start justify-between px-4 pb-0 pt-4 sm:px-5 sm:pt-4">
              <h2 className="text-[17px] font-medium">Studio</h2>
              <div className="flex items-center gap-2">
                {busy ? <Loader2 className="size-5 animate-spin text-[#909296]" /> : null}
                <button type="button" className="rounded-lg p-1 hover:bg-white/10" aria-label="Studio shortcuts">
                  <LayoutList className="size-6 text-white/90" strokeWidth={1.75} />
                </button>
              </div>
            </div>
            <div className="mx-4 mt-3 h-px bg-white/10 sm:mx-5" />
            <div className="studio-scroll grid flex-1 grid-cols-3 content-start justify-items-center gap-2 overflow-y-auto px-4 pb-4 pt-4 sm:gap-3 sm:px-5 sm:pb-5 sm:pt-4">
              {STUDIO_TILES.map(({ type, label, Icon }) => (
                <button
                  key={type}
                  type="button"
                  disabled={!canEditNotebook || busy}
                  onClick={() => void onGenerateArtifact(type)}
                  className="flex h-[60px] w-full max-w-[72px] touch-manipulation flex-col items-center justify-start gap-1 rounded-[16px] bg-[#1586ed] px-1 pb-1.5 pt-2.5 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Icon className="size-5 shrink-0 text-white" strokeWidth={1.75} />
                  <span className="px-0.5 text-center text-[10px] font-normal leading-snug">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-[220px] flex-col rounded-t-[20px] bg-[#091c5a] px-4 pb-4 pt-4 max-[1419px]:max-w-full min-[1420px]:max-h-[min(500px,58vh)] min-[1420px]:min-h-[220px] min-[1420px]:flex-1 min-[1420px]:overflow-hidden">
            <div className="mb-4 space-y-2 border-b border-white/10 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#909296]">Quick note</p>
              <input
                value={noteTitle}
                onChange={(e) => onNoteTitleChange(e.target.value)}
                readOnly={!canEditNotebook}
                placeholder="Concept title"
                className="w-full rounded-xl border border-[#373a40] bg-[#1a1b1e] px-3 py-2 text-[12px] outline-none placeholder:text-[#909296] read-only:opacity-60"
              />
              <textarea
                value={noteContent}
                onChange={(e) => onNoteContentChange(e.target.value)}
                readOnly={!canEditNotebook}
                placeholder="Capture a takeaway…"
                rows={3}
                className="w-full resize-none rounded-xl border border-[#373a40] bg-[#1a1b1e] px-3 py-2 text-[12px] outline-none placeholder:text-[#909296] read-only:opacity-60"
              />
              <button
                type="button"
                disabled={!canEditNotebook || busy || !noteTitle.trim() || !noteContent.trim()}
                onClick={() => void onSaveNote()}
                className="w-full rounded-xl bg-[#0f8ce9] py-2 text-[11px] font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save note
              </button>
            </div>

            {workspaceArtifacts.length === 0 && workspaceNotes.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <BadgeCheck className="size-6 text-white/90" strokeWidth={1.75} />
                <p className="text-[14px] text-white">Studio output will be saved here.</p>
                <p className="max-w-[248px] text-[12px] leading-[19.5px] text-[#909296]">
                  After adding sources, click to add Audio Overview, Study Guides, Mind Map, and more!
                </p>
              </div>
            ) : (
              <div className="studio-scroll flex max-h-[min(42vh,400px)] flex-col gap-4 overflow-y-auto pr-1 min-[1420px]:max-h-none min-[1420px]:min-h-0 min-[1420px]:flex-1">
                {workspaceArtifacts.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#909296]">
                      Generated ({workspaceArtifacts.length})
                    </p>
                    <div className="space-y-2">
                      {workspaceArtifacts.map((artifact) => {
                        const ArtIcon = artifactIcons.find((d) => d.type === artifact.type)?.Icon ?? Sparkles;
                        return (
                          <div
                            key={artifact.id}
                            className="group flex items-center gap-2 rounded-xl border border-white/10 bg-[#1a1b1e] p-2.5"
                          >
                            <ArtIcon size={14} className="shrink-0 text-[#7ec8ff]" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[11px] font-semibold">{artifact.title}</div>
                              <div className="text-[9px] font-bold uppercase tracking-widest text-[#909296]">{artifact.type}</div>
                            </div>
                            <div className="flex shrink-0 gap-0.5 opacity-100 transition-opacity xl:opacity-0 xl:group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => onOpenArtifact(artifact.id)}
                                className="rounded-lg p-1 hover:bg-white/10"
                                title="View"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => void onDownloadArtifact(artifact.id)}
                                className="rounded-lg p-1 hover:bg-white/10"
                                title="Download"
                              >
                                <Download size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={!canEditNotebook}
                                onClick={() => void onDeleteArtifact(artifact.id)}
                                className="rounded-lg p-1 text-[#f87171] hover:bg-red-500/10"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {workspaceNotes.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#909296]">Notes ({workspaceNotes.length})</p>
                    <div className="space-y-2">
                      {workspaceNotes.map((note) => (
                        <div key={note.id} className="group rounded-xl border border-white/10 bg-[#1a1b1e] p-3">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <span className="line-clamp-1 text-[12px] font-semibold">{note.title}</span>
                            <button
                              type="button"
                              disabled={!canEditNotebook}
                              onClick={() => void onDeleteNote(note.id)}
                              className="rounded-lg p-1 text-[#f87171] opacity-0 hover:bg-red-500/10 group-hover:opacity-100"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                          <p className="line-clamp-4 text-[11px] leading-relaxed text-[#c1c2c5]">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
