"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  BookOpen,
  ChevronDown,
  Cloud,
  Download,
  Eye,
  FilePlus,
  FileText,
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
  Youtube,
  Files,
} from "lucide-react";
import { Markdown } from "@/components/ui/Markdown";
import { WorkspaceNotebookSearch } from "@/components/workspace/WorkspaceNotebookSearch";
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
      className={`flex items-center justify-center rounded-[10px] bg-[#0f8ce9] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 ${wide ? "h-10 gap-2 px-4 min-w-[149px]" : "size-10"} ${className}`}
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
    onExportNotebook,
    workspaceExporting,
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
  const sourceCountLabel = workspaceSources.length;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col bg-[#010a33] text-white antialiased"
      style={{ fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 pl-[53px] pr-[39px] pt-[38px]">
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Back to notebooks"
          >
            <ArrowRight className="size-5 rotate-180" strokeWidth={2} />
          </button>
          <JackpalsLogo variant="mark" priority className="h-[68px] w-[67px] shrink-0 object-contain" />
          <div className="min-w-0">
            <h1 className="truncate text-[28px] font-medium leading-none tracking-tight">{notebook.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#909296]">
              <span className="rounded-full bg-white/10 px-2 py-0.5 uppercase tracking-wide text-white/90">{wsRole}</span>
              {wsOwner && workspaceSharing && (
                <>
                  <span className="rounded-full bg-[#0f8ce9]/30 px-2 py-0.5 text-white/95">
                    {workspaceSharing.public ? "Public link on" : "Private"}
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5">{workspaceSharing.role} access</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NotebookCollaborationPanel notebookId={workspaceId} onRefresh={() => onCollaborationRefresh()} />
          <HeaderBtn
            wide
            disabled={!canEditNotebook || busy}
            onClick={onUploadHeaderClick}
            title="Import PDFs, links, Drive files, and more"
          >
            <FilePlus className="size-6 shrink-0 opacity-95" strokeWidth={1.75} />
            <span className="text-[18px]">Upload File</span>
          </HeaderBtn>
          {wsOwner ? (
            <>
              <HeaderBtn wide disabled={busy} onClick={onToggleSharingPublic} title="Toggle public sharing">
                <Share2 className="size-6 shrink-0 opacity-95" strokeWidth={1.75} />
                <span className="text-[18px]">{workspaceSharing?.public ? "Sharing on" : "Share"}</span>
              </HeaderBtn>
              <HeaderBtn disabled={busy} onClick={onCycleSharingRole} title="Cycle viewer/editor link role">
                <Sliders className="size-6 opacity-95" strokeWidth={1.75} />
              </HeaderBtn>
            </>
          ) : null}
          <HeaderBtn
            disabled={workspaceExporting || busy}
            onClick={() => void onExportNotebook()}
            title="Export notebook bundle"
          >
            {workspaceExporting ? (
              <Loader2 className="size-6 animate-spin opacity-95" strokeWidth={1.75} />
            ) : (
              <Download className="size-6 opacity-95" strokeWidth={1.75} />
            )}
          </HeaderBtn>
          <HeaderBtn onClick={() => void onLogout()} title="Sign out">
            <User className="size-6 opacity-95" strokeWidth={1.75} />
          </HeaderBtn>
        </div>
      </header>

      {!canEditNotebook && (
        <div className="mx-[53px] mt-4 rounded-xl border border-[#373a40] bg-[#1a1b1e] px-4 py-3 text-[12px] text-[#c1c2c5]">
          Read-only workspace — you can browse and chat, but an editor role is required to add sources or generate studio outputs.
        </div>
      )}

      {/* Columns */}
      <div className={`mt-6 flex min-h-0 flex-1 gap-[28px] pl-[53px] pr-[39px] pb-10 ${sourcesCollapsed ? "" : ""}`}>
        {/* Sources */}
        <aside
          className={`flex shrink-0 flex-col rounded-t-[25px] bg-[rgba(45,107,255,0.19)] transition-[width] duration-200 ${sourcesCollapsed ? "w-[72px]" : "w-[407px]"}`}
        >
          <div className="flex items-center justify-between border-b border-white/15 px-4 pb-3 pt-5">
            {!sourcesCollapsed && (
              <h2 className="text-[23px] font-medium">
                Sources <span className="text-[14px] font-normal text-[#909296]">({sourceCountLabel})</span>
              </h2>
            )}
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
            <div className="flex min-h-0 flex-1 flex-col gap-4 px-8 pb-8 pt-5">
              <button
                type="button"
                disabled={!canEditNotebook || busy}
                onClick={onOpenAddSourcesModal}
                className="flex h-10 w-full items-center justify-center gap-3 rounded-[10px] bg-[#0f8ce9] text-[20px] font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <PlusCircle className="size-6 shrink-0 text-white" strokeWidth={1.75} />
                Add Sources
              </button>

              <div className="flex flex-col gap-3 rounded-xl border border-[#373a40] bg-[#1a1b1e] p-[13px]">
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!canEditNotebook || busy}
                      onClick={() => onResearchModeChange("fast")}
                      className={`inline-flex items-center gap-1 rounded-full border px-[11px] py-[7px] text-[11px] ${researchMode === "fast" ? "border-[#0f8ce9] bg-[#0f8ce9]/25 text-white" : "border-[#373a40] bg-[#2c2e33] text-white/90 hover:bg-[#35373d]"}`}
                    >
                      <Globe className="size-3.5" strokeWidth={2} />
                      Fast
                      <ChevronDown className="size-3 opacity-70" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      disabled={!canEditNotebook || busy}
                      onClick={() => onResearchModeChange("deep")}
                      className={`inline-flex items-center gap-1 rounded-full border px-[11px] py-[7px] text-[11px] ${researchMode === "deep" ? "border-[#0f8ce9] bg-[#0f8ce9]/25 text-white" : "border-[#373a40] bg-[#2c2e33] text-white/90 hover:bg-[#35373d]"}`}
                    >
                      <Link2 className="size-3.5" strokeWidth={2} />
                      Deep
                      <ChevronDown className="size-3 opacity-70" strokeWidth={2} />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!canEditNotebook || busy || !researchQuery.trim()}
                    onClick={() => void onRunWebResearch()}
                    className="flex size-7 items-center justify-center rounded-full bg-[#2c2e33] hover:bg-[#35373d] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Run web research import"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-5 text-white/90" strokeWidth={2} />}
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

              <div className="rounded-xl border border-[#373a40] bg-[#1a1b1e]/80 p-2">
                <WorkspaceNotebookSearch workspaceId={workspaceId} disabled={!canEditNotebook || busy} />
              </div>

              <div className="studio-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                {workspaceSources.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 pb-8 pt-10 text-center">
                    <FileText className="size-6 text-white/80" strokeWidth={1.75} />
                    <p className="text-[14px] font-normal text-white">Saved sources will appear here</p>
                    <p className="max-w-[260px] text-[12px] leading-[19.5px] text-[#909296]">
                      Click Add Sources to add PDFs, websites, text, videos, or audio files — or run a web research query above.
                    </p>
                  </div>
                ) : (
                  workspaceSources.map((source) => (
                    <div
                      key={source.id}
                      className="group flex items-start gap-2 rounded-xl border border-transparent p-2.5 hover:border-white/10 hover:bg-white/5"
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
                          {source.type} · {source.refresh_state || "ready"}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {["url", "youtube", "drive"].includes(source.type) && (
                          <button
                            disabled={!canEditNotebook || refreshingSourceId === source.id}
                            onClick={() => void onRefreshSource(source.id)}
                            className="rounded-lg p-1 text-[#909296] hover:bg-white/10"
                            title="Refresh"
                          >
                            <RefreshCw size={11} className={refreshingSourceId === source.id ? "animate-spin" : ""} />
                          </button>
                        )}
                        <button
                          disabled={!canEditNotebook}
                          onClick={() => void onDeleteSource(source.id)}
                          className="rounded-lg p-1 text-[#f87171] hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Chat */}
        <section className="flex w-[530px] shrink-0 flex-col rounded-t-[25px] bg-[#091c5a]">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 px-6 pb-3 pt-6">
            <h2 className="text-[23px] font-medium">Chat</h2>
            <div className="flex flex-wrap items-center gap-2">
              {workspaceChats.length > 0 && (
                <select
                  value={activeChatId || ""}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    onChatThreadChange(id);
                  }}
                  className="max-w-[140px] rounded-lg border border-white/10 bg-transparent px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#c1c2c5] outline-none"
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
              <div className="flex rounded-lg bg-black/30 p-0.5">
                {(["all", "pick"] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => onChatCorpusScope(scope)}
                    className={`rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${chatCorpusScope === scope ? "bg-white/15 text-white" : "text-[#909296]"}`}
                  >
                    {scope === "all" ? "All sources" : "Pick"}
                  </button>
                ))}
              </div>
              <button type="button" className="rounded-lg p-1 hover:bg-white/10" aria-label="Chat tools">
                <LayoutList className="size-6 text-white/90" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {chatCorpusScope === "pick" && (
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto border-b border-white/10 px-6 py-2">
              {workspaceSources.length === 0 ? (
                <span className="text-[10px] text-[#909296]">No sources to narrow against.</span>
              ) : (
                workspaceSources.map((s) => {
                  const on = chatPickSourceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onTogglePickSource(s.id)}
                      className={`rounded-lg border px-2 py-1 text-[10px] font-semibold ${on ? "border-teal-400/60 bg-teal-500/15 text-teal-200" : "border-white/10 bg-white/5 text-[#909296]"}`}
                    >
                      {s.title}
                    </button>
                  );
                })
              )}
            </div>
          )}

          <div className="studio-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-4 pt-6">
            {activeChatTurns.length === 0 && !workspaceAnswer ? (
              <>
                <p className="text-[36px] leading-[40px] text-[#c1c2c5]">👋</p>
                <h3 className="mt-10 text-[36px] font-normal leading-[40px] tracking-tight">Let&apos;s Cook!</h3>
                <p className="mt-4 max-w-[494px] text-[17px] leading-7 text-[#c1c2c5]">
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

          <div className="mt-auto space-y-3 px-4 pb-6">
            <div className="flex items-center gap-2 rounded-2xl border border-[#373a40] bg-[#1a1b1e] p-2 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
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
                className="min-h-[48px] flex-1 resize-none bg-transparent px-4 py-3 text-[15px] text-white outline-none placeholder:text-[#909296] disabled:opacity-50"
              />
              <div className="flex shrink-0 flex-col items-end gap-2 pr-2">
                <label className="flex cursor-pointer items-center gap-2 text-[10px] uppercase text-[#909296]">
                  <input
                    type="checkbox"
                    checked={saveChatAsNote}
                    onChange={(e) => onSaveChatAsNoteChange(e.target.checked)}
                    className="accent-[#0f8ce9]"
                  />
                  Save reply as note
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-[#909296]">{sourceCountLabel} sources</span>
                  <button
                    type="button"
                    disabled={!canEditNotebook || busy || !chatQuestion.trim()}
                    onClick={() => void onWorkspaceAsk()}
                    className="flex size-10 items-center justify-center rounded-full bg-[#373a40] hover:bg-[#454952] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                  >
                    {busy ? <Loader2 className="size-5 animate-spin text-white" /> : <ArrowRight className="size-5 text-white" strokeWidth={2} />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-center text-[12px] leading-4 text-[#909296]">
              JackPals can be inaccurate; please double check its responses.
            </p>
          </div>
        </section>

        {/* Studio column */}
        <div className="flex w-[355px] shrink-0 flex-col gap-[19px]">
          <div className="flex h-[400px] flex-col rounded-[25px] bg-[#091c5a]">
            <div className="flex items-start justify-between px-8 pb-0 pt-[23px]">
              <h2 className="text-[23px] font-medium">Studio</h2>
              <div className="flex items-center gap-2">
                {busy ? <Loader2 className="size-5 animate-spin text-[#909296]" /> : null}
                <button type="button" className="rounded-lg p-1 hover:bg-white/10" aria-label="Studio shortcuts">
                  <LayoutList className="size-6 text-white/90" strokeWidth={1.75} />
                </button>
              </div>
            </div>
            <div className="mx-8 mt-4 h-px bg-white/10" />
            <div className="studio-scroll grid flex-1 grid-cols-3 gap-[18px] overflow-y-auto px-8 pb-6 pt-6 content-start">
              {STUDIO_TILES.map(({ type, label, Icon }) => (
                <button
                  key={type}
                  type="button"
                  disabled={!canEditNotebook || busy}
                  onClick={() => void onGenerateArtifact(type)}
                  className="flex h-[85px] w-full flex-col items-center justify-start gap-1 rounded-[25px] bg-[#1586ed] pt-[19px] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Icon className="size-6 shrink-0 text-white" strokeWidth={1.75} />
                  <span className="px-1 text-center text-[10px] font-normal leading-5">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-[280px] flex-col rounded-t-[25px] bg-[#091c5a] px-4 pb-6 pt-6">
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
              <div className="studio-scroll flex max-h-[320px] flex-col gap-4 overflow-y-auto pr-1">
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
                            <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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
