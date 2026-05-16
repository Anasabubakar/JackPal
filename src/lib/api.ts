const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jackpal_token");
}

export function saveSession(token: string, user: User) {
  localStorage.setItem("jackpal_token", token);
  localStorage.setItem("jackpal_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("jackpal_token");
  localStorage.removeItem("jackpal_user");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("jackpal_user");
  return raw ? JSON.parse(raw) : null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  full_name: string;
  /** Avatar URL when the backend provides one */
  profile_url?: string | null;
};

export type Document = {
  id: string;
  filename: string;
  word_count: number;
  status: "ready" | "generating" | "streaming" | "audio_ready" | "error";
  audio_voice?: string | null;
  audio_engine?: "fast" | "premium" | null;
  ready_chunks?: number;
  total_chunks?: number;
  created_at: string;
};

export type Chapter = {
  title: string;
  word_count: number;
  start_word: number;
  is_skippable?: boolean;
};

export type PodcastLine = {
  speaker: "Ezinne" | "Abeo";
  voice: string;
  text: string;
};

export type PodcastChunk = {
  index: number;
  speaker: string;
  url: string;
};

export type Notebook = {
  id: string;
  title: string;
  description?: string | null;
  source_count?: number;
  note_count?: number;
  artifact_count?: number;
  sharing?: {
    notebook_id: string;
    public: boolean;
    role: "viewer" | "editor";
  };
  /** Effective role for the current user (workspace sharing Phase 8). */
  role?: "owner" | "editor" | "viewer";
  is_owner?: boolean;
  owner_user_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type WorkspaceInvitation = {
  id: string;
  notebook_id: string;
  role: "viewer" | "editor";
  token?: string | null;
  invitee_email?: string | null;
  /** Unix timestamp (seconds) when the invite expires. */
  expires_at?: number;
  created_at?: string;
  accepted_user_id?: string | null;
  accepted_at?: string | null;
  revoked?: boolean;
};

export type WorkspaceCollaborator = {
  user_id: string;
  role: "viewer" | "editor";
  since?: string;
  updated_at?: string;
  invitation_id?: string;
};

export type Source = {
  id: string;
  notebook_id: string;
  type: "url" | "youtube" | "file" | "text" | "drive";
  title: string;
  url?: string | null;
  document_id?: string | null;
  status?: string;
  refresh_state?: string;
  created_at?: string;
  updated_at?: string;
};

export type Note = {
  id: string;
  notebook_id: string;
  source_id?: string | null;
  kind: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

export type Artifact = {
  id: string;
  notebook_id: string;
  type: string;
  title: string;
  content: string;
  format?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type ResearchJob = {
  id: string;
  notebook_id: string;
  query: string;
  mode: "fast" | "deep";
  status: string;
  /** Backend stores a dict (imports, summary, …), not only an array. */
  results?: unknown;
  created_at?: string;
  updated_at?: string;
};

/** GET /workspaces/{id}/research/{job_id} — same shape as persisted job. */
export async function getWorkspaceResearchJob(workspaceId: string, jobId: string) {
  return request<ResearchJob>(`/workspaces/${workspaceId}/research/${encodeURIComponent(jobId)}`);
}

export type WorkspaceCitation = {
  index: number;
  source_id: string;
  title: string;
  type: string;
  url?: string | null;
  excerpt: string;
  score: number;
};

export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: WorkspaceCitation[];
  /**
   * Whether the user has flagged this turn as worth keeping. The dashboard
   * filters on this to render the "Saved answers" panel.
   */
  pinned?: boolean;
  created_at?: string;
};

export type SavedChat = {
  id: string;
  notebook_id: string;
  title: string;
  source_ids: string[];
  created_at?: string;
  updated_at?: string;
};

export type PodcastStatus = {
  status: "none" | "generating" | "ready";
  ready_lines: number;
  total_lines: number;
  script: PodcastLine[];
  chunks: PodcastChunk[];
};

export type TtsCapabilities = {
  fast_available: boolean;
  premium_enabled: boolean;
  premium_model_ready: boolean;
  premium_loaded: boolean;
  premium_available: boolean;
  premium_elevenlabs?: boolean;
  premium_voxcpm?: boolean;
  premium_modal_yarngpt?: boolean;
  premium_modal_tts?: boolean;
  premium_yarngpt?: boolean;
  premium_mms_pidgin?: boolean;
  fast_voices: string[];
  premium_voices: string[];
};

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const data = await request<{ access_token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveSession(data.access_token, data.user);
  return data;
}

export async function logout() {
  await request("/auth/logout", { method: "POST" }).catch(() => {});
  clearSession();
}

// ── Documents ────────────────────────────────────────────────────────────────

export async function listDocuments(): Promise<Document[]> {
  return request<Document[]>("/documents/");
}

export async function uploadDocument(file: File): Promise<Document> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function deleteDocument(docId: string) {
  return request(`/documents/${docId}`, { method: "DELETE" });
}

// ── Audio ────────────────────────────────────────────────────────────────────

export async function generateAudio(docId: string, voice: string, engine: "fast" | "premium") {
  return request<{ status: string; ready_chunks: number; total_chunks: number; audio_voice?: string | null; audio_engine?: "fast" | "premium" | null }>(
    `/audio/generate/${docId}?voice=${encodeURIComponent(voice)}&engine=${encodeURIComponent(engine)}`,
    { method: "POST" }
  );
}

export async function getAudioChunks(docId: string) {
  return request<{
    status: string;
    ready_chunks: number;
    total_chunks: number;
    audio_voice?: string | null;
    audio_engine?: "fast" | "premium" | null;
    chunks: { index: number; url: string }[];
  }>(`/audio/${docId}/chunks`);
}

export async function getAudioStatus(
  docId: string,
  opts?: { sinceReady?: number; waitSeconds?: number },
) {
  const params = new URLSearchParams();
  if (opts?.sinceReady !== undefined) params.set("since_ready", String(opts.sinceReady));
  if (opts?.waitSeconds !== undefined) params.set("wait", String(opts.waitSeconds));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request<{ status: string; ready_chunks: number; total_chunks: number; audio_voice?: string | null; audio_engine?: "fast" | "premium" | null }>(
    `/audio/${docId}/status${qs}`,
  );
}

export async function getTtsCapabilities() {
  return request<TtsCapabilities>("/audio/capabilities");
}

export async function downloadAudioArchive(docId: string) {
  const token = getToken();
  if (!token) throw new Error("Missing session token.");
  // Use token as query param to avoid CORS preflight on file downloads
  const res = await fetch(`${BASE_URL}/audio/${docId}/download?token=${encodeURIComponent(token)}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Download failed" }));
    throw new Error(err.detail || "Download failed");
  }

  const blob = await res.blob();
  const contentDisposition = res.headers.get("content-disposition") || "";
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);

  return {
    blob,
    filename: match?.[1] || "jackpal-audio-chunks.zip",
  };
}

export function getAudioDownloadUrl(docId: string) {
  const token = getToken();
  if (!token) throw new Error("Missing session token.");
  return `${BASE_URL}/audio/${docId}/download?token=${token}`;
}

export async function getDocumentChapters(docId: string) {
  return request<{ chapters: Chapter[] }>(`/documents/${docId}/chapters`);
}

// ── AI ───────────────────────────────────────────────────────────────────────

export async function summarizeDocument(docId: string) {
  return request<{ summary: string; cached: boolean }>(`/ai/summarize/${docId}`, {
    method: "POST",
  });
}

export async function generatePodcast(
  docId: string,
  regenerate = false,
  mode: "standard" | "pidgin" = "standard",
  topic?: string,
  chapter?: number,
) {
  const params = new URLSearchParams();
  if (regenerate) params.set("regenerate", "true");
  if (mode !== "standard") params.set("mode", mode);
  if (chapter !== undefined) params.set("chapter", String(chapter));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request<{
    status: string;
    total_lines: number;
    ready_lines: number;
    script: PodcastLine[];
    cached: boolean;
  }>(`/ai/podcast/${docId}${qs}`, {
    method: "POST",
    body: JSON.stringify({ topic: topic ?? null }),
  });
}

export async function getPodcastChunks(
  docId: string,
  opts?: { sinceReady?: number; waitSeconds?: number },
) {
  const params = new URLSearchParams();
  if (opts?.sinceReady !== undefined) params.set("since_ready", String(opts.sinceReady));
  if (opts?.waitSeconds !== undefined) params.set("wait", String(opts.waitSeconds));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request<PodcastStatus>(`/ai/podcast/${docId}/chunks${qs}`);
}

export async function getDocumentText(docId: string): Promise<string> {
  const data = await request<{ text: string }>(`/documents/${docId}/text`);
  return data.text;
}

export async function askDocument(docId: string, question: string) {
  return request<{ answer: string; question: string }>(`/ai/ask/${docId}`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

// ── Workspace / Notebook ─────────────────────────────────────────────────────

export async function listWorkspaces() {
  const data = await request<{ notebooks: Notebook[] }>("/workspaces");
  return data.notebooks;
}

export async function createWorkspace(title: string, description?: string) {
  return request<Notebook>("/workspaces", {
    method: "POST",
    body: JSON.stringify({ title, description: description ?? null }),
  });
}

export async function getWorkspace(workspaceId: string) {
  return request<Notebook>(`/workspaces/${workspaceId}`);
}

export async function renameWorkspace(workspaceId: string, title: string) {
  return request<Notebook>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteWorkspace(workspaceId: string) {
  return request(`/workspaces/${workspaceId}`, { method: "DELETE" });
}

export async function listWorkspaceSources(workspaceId: string) {
  const data = await request<{ sources: Source[] }>(`/workspaces/${workspaceId}/sources`);
  return data.sources;
}

export async function addWorkspaceTextSource(workspaceId: string, title: string, content: string) {
  return request<{ source: Source }>(`/workspaces/${workspaceId}/sources/text`, {
    method: "POST",
    body: JSON.stringify({ title, content }),
  });
}

export async function addWorkspaceUrlSource(workspaceId: string, title: string | null, url: string) {
  // Backend auto-detects YouTube / Drive / generic web. Frontend can keep
  // calling this single endpoint with any URL.
  return request<{ source: Source }>(`/workspaces/${workspaceId}/sources/url`, {
    method: "POST",
    body: JSON.stringify({ title, url }),
  });
}

export async function addWorkspaceYoutubeSource(
  workspaceId: string,
  title: string | null,
  url: string,
) {
  return request<{ source: Source }>(`/workspaces/${workspaceId}/sources/youtube`, {
    method: "POST",
    body: JSON.stringify({ title, url }),
  });
}

export async function addWorkspaceDriveSource(
  workspaceId: string,
  title: string | null,
  url: string,
) {
  return request<{ source: Source }>(`/workspaces/${workspaceId}/sources/drive`, {
    method: "POST",
    body: JSON.stringify({ title, url }),
  });
}

export async function addWorkspaceFileSource(workspaceId: string, file: File) {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/workspaces/${workspaceId}/sources/file`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Import failed" }));
    throw new Error(err.detail || "Import failed");
  }
  return res.json() as Promise<{ source: Source }>;
}

export async function addWorkspaceResearch(
  workspaceId: string,
  query: string,
  opts?: { mode?: "fast" | "deep"; importUrls?: string[] },
) {
  // Backend now performs real web search (Tavily / Brave / Serper / DuckDuckGo)
  // and ingests every successful hit as a notebook source. `summary` is an
  // LLM-synthesised overview of all imported sources, `expanded_queries` are
  // the sub-queries the LLM generated in `deep` mode, and `provider` reports
  // which search backend handled the run (so the UI can warn about quota /
  // missing API keys when it falls back to the zero-key DuckDuckGo path).
  return request<{
    job: ResearchJob;
    note?: Note;
    sources: Array<Record<string, unknown>>;
    summary?: string;
    expanded_queries?: string[];
    provider?: string;
    failed?: Array<{ url?: string; title?: string; error?: string }>;
  }>(
    `/workspaces/${workspaceId}/sources/research`,
    {
      method: "POST",
      body: JSON.stringify({
        query,
        mode: opts?.mode ?? "fast",
        import_urls: opts?.importUrls ?? [],
      }),
    }
  );
}

export async function getWorkspaceSource(workspaceId: string, sourceId: string) {
  return request<{ source: Source }>(`/workspaces/${workspaceId}/sources/${sourceId}`);
}

export async function renameWorkspaceSource(workspaceId: string, sourceId: string, title: string) {
  return request<{ source: Source }>(`/workspaces/${workspaceId}/sources/${sourceId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteWorkspaceSource(workspaceId: string, sourceId: string) {
  return request(`/workspaces/${workspaceId}/sources/${sourceId}`, { method: "DELETE" });
}

export async function getWorkspaceSourceText(workspaceId: string, sourceId: string) {
  const data = await request<{ text: string }>(`/workspaces/${workspaceId}/sources/${sourceId}/fulltext`);
  return data.text;
}

export async function getWorkspaceSourceGuide(workspaceId: string, sourceId: string) {
  const data = await request<{ guide: string }>(`/workspaces/${workspaceId}/sources/${sourceId}/guide`);
  return data.guide;
}

export async function refreshWorkspaceSource(workspaceId: string, sourceId: string) {
  return request<{ source: Source }>(`/workspaces/${workspaceId}/sources/${sourceId}/refresh`, {
    method: "POST",
  });
}

export async function getWorkspaceSourceFreshness(workspaceId: string, sourceId: string) {
  return request<{ status: string }>(`/workspaces/${workspaceId}/sources/${sourceId}/freshness`);
}

export async function listWorkspaceNotes(workspaceId: string) {
  const data = await request<{ notes: Note[] }>(`/workspaces/${workspaceId}/notes`);
  return data.notes;
}

export async function addWorkspaceNote(
  workspaceId: string,
  title: string,
  content: string,
  sourceId?: string,
  kind = "note",
) {
  return request<{ note: Note }>(`/workspaces/${workspaceId}/notes`, {
    method: "POST",
    body: JSON.stringify({ title, content, source_id: sourceId ?? null, kind }),
  });
}

export async function updateWorkspaceNote(
  workspaceId: string,
  noteId: string,
  updates: { title?: string; content?: string; kind?: string },
) {
  return request<{ note: Note }>(`/workspaces/${workspaceId}/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteWorkspaceNote(workspaceId: string, noteId: string) {
  return request(`/workspaces/${workspaceId}/notes/${noteId}`, { method: "DELETE" });
}

export async function askWorkspace(
  workspaceId: string,
  question: string,
  opts?: { saveAsNote?: boolean; sourceIds?: string[]; chatId?: string | null },
) {
  return request<{
    question: string;
    answer: string;
    citations: WorkspaceCitation[];
    note?: Note | null;
    chat_id?: string | null;
  }>(`/workspaces/${workspaceId}/chat`, {
    method: "POST",
    body: JSON.stringify({
      question,
      save_as_note: opts?.saveAsNote ?? false,
      source_ids: opts?.sourceIds ?? [],
      chat_id: opts?.chatId ?? null,
    }),
  });
}

export async function searchWorkspace(
  workspaceId: string,
  query: string,
  opts?: { sourceIds?: string[]; topK?: number },
) {
  return request<{
    query: string;
    results: WorkspaceCitation[];
    source_count: number;
  }>(`/workspaces/${workspaceId}/search`, {
    method: "POST",
    body: JSON.stringify({
      query,
      source_ids: opts?.sourceIds ?? [],
      top_k: opts?.topK ?? 8,
    }),
  });
}

export async function listWorkspaceArtifacts(workspaceId: string) {
  const data = await request<{ artifacts: Artifact[] }>(`/workspaces/${workspaceId}/artifacts`);
  return data.artifacts;
}

export async function generateWorkspaceArtifact(
  workspaceId: string,
  artifactType: string,
  payload?: { title?: string; prompt?: string; format?: string },
) {
  return request<{ artifact: Artifact }>(`/workspaces/${workspaceId}/artifacts/generate/${artifactType}`, {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
}

export async function getWorkspaceArtifact(workspaceId: string, artifactId: string) {
  return request<{ artifact: Artifact }>(`/workspaces/${workspaceId}/artifacts/${artifactId}`);
}

export async function updateWorkspaceArtifact(
  workspaceId: string,
  artifactId: string,
  payload: { title?: string; prompt?: string; format?: string },
) {
  return request<{ artifact: Artifact }>(`/workspaces/${workspaceId}/artifacts/${artifactId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkspaceArtifact(workspaceId: string, artifactId: string) {
  return request(`/workspaces/${workspaceId}/artifacts/${artifactId}`, { method: "DELETE" });
}

export async function downloadWorkspaceArtifact(workspaceId: string, artifactId: string) {
  const token = getToken();
  if (!token) throw new Error("Missing session token.");
  const res = await fetch(`${BASE_URL}/workspaces/${workspaceId}/artifacts/${artifactId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Download failed" }));
    throw new Error(err.detail || "Download failed");
  }
  const blob = await res.blob();
  const contentDisposition = res.headers.get("content-disposition") || "";
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  return { blob, filename: match?.[1] || "jackpal-artifact" };
}

export async function getWorkspaceSharing(workspaceId: string) {
  return request<{ notebook_id: string; public: boolean; role: "viewer" | "editor" }>(`/workspaces/${workspaceId}/sharing`);
}

export async function setWorkspaceSharing(workspaceId: string, publicValue: boolean, role: "viewer" | "editor" = "viewer") {
  return request<{ notebook_id: string; public: boolean; role: "viewer" | "editor" }>(`/workspaces/${workspaceId}/sharing`, {
    method: "POST",
    body: JSON.stringify({ public: publicValue, role }),
  });
}

export async function acceptWorkspaceInvitation(token: string) {
  return request<{
    already_owner: boolean;
    notebook: Notebook;
    collaborator: WorkspaceCollaborator | null;
    invitation: WorkspaceInvitation;
  }>("/workspaces/invitations/accept", {
    method: "POST",
    body: JSON.stringify({ token: token.trim() }),
  });
}

export async function createWorkspaceInvitation(
  workspaceId: string,
  opts: {
    role?: "viewer" | "editor";
    expires_in?: number;
    invitee_email?: string | null;
  } = {},
) {
  return request<{ invitation: WorkspaceInvitation }>(`/workspaces/${workspaceId}/invitations`, {
    method: "POST",
    body: JSON.stringify({
      role: opts.role ?? "viewer",
      expires_in: opts.expires_in ?? 7 * 24 * 3600,
      invitee_email: opts.invitee_email?.trim() ? opts.invitee_email.trim() : null,
    }),
  });
}

export async function listWorkspaceInvitations(workspaceId: string) {
  const data = await request<{ invitations: WorkspaceInvitation[] }>(`/workspaces/${workspaceId}/invitations`);
  return data.invitations;
}

export async function revokeWorkspaceInvitation(workspaceId: string, invitationId: string) {
  return request<{ message: string; invitation: WorkspaceInvitation }>(
    `/workspaces/${workspaceId}/invitations/${invitationId}`,
    { method: "DELETE" },
  );
}

export async function listWorkspaceCollaborators(workspaceId: string) {
  const data = await request<{ collaborators: WorkspaceCollaborator[] }>(`/workspaces/${workspaceId}/collaborators`);
  return data.collaborators;
}

export async function updateWorkspaceCollaboratorRole(
  workspaceId: string,
  collaboratorUserId: string,
  role: "viewer" | "editor",
) {
  const uid = encodeURIComponent(collaboratorUserId);
  return request<{ collaborator: WorkspaceCollaborator }>(`/workspaces/${workspaceId}/collaborators/${uid}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeWorkspaceCollaborator(workspaceId: string, collaboratorUserId: string) {
  const uid = encodeURIComponent(collaboratorUserId);
  return request<{ message: string }>(`/workspaces/${workspaceId}/collaborators/${uid}`, {
    method: "DELETE",
  });
}

export async function listWorkspaceChats(workspaceId: string) {
  const data = await request<{ chats: SavedChat[] }>(`/workspaces/${workspaceId}/chats`);
  return data.chats;
}

export async function createWorkspaceChat(workspaceId: string, title: string, sourceIds: string[] = []) {
  return request<{ chat: SavedChat }>(`/workspaces/${workspaceId}/chats`, {
    method: "POST",
    body: JSON.stringify({ title, source_ids: sourceIds }),
  });
}

export async function getWorkspaceChat(workspaceId: string, chatId: string) {
  return request<{ chat: SavedChat; turns: ChatTurn[] }>(`/workspaces/${workspaceId}/chats/${chatId}`);
}

export async function renameWorkspaceChat(workspaceId: string, chatId: string, title: string) {
  return request<{ chat: SavedChat }>(`/workspaces/${workspaceId}/chats/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteWorkspaceChat(workspaceId: string, chatId: string) {
  return request(`/workspaces/${workspaceId}/chats/${chatId}`, { method: "DELETE" });
}

/**
 * Convert an existing assistant chat turn into a permanent note attached
 * to the notebook. Citations on the turn are inlined as a Markdown "Sources"
 * footer by default. Pass `includeCitations: false` to skip that.
 */
export async function saveChatTurnAsNote(
  workspaceId: string,
  chatId: string,
  turnId: string,
  opts: { title?: string; includeCitations?: boolean } = {},
) {
  return request<{ note: Note; turn_id: string; chat_id: string }>(
    `/workspaces/${workspaceId}/chats/${chatId}/turns/${turnId}/save-as-note`,
    {
      method: "POST",
      body: JSON.stringify({
        title: opts.title,
        include_citations: opts.includeCitations ?? true,
      }),
    },
  );
}

/**
 * Toggle the pinned state on a chat turn. Pinned turns appear in a
 * dedicated panel in the dashboard so users can revisit the answers they
 * care about without scrolling.
 */
export async function setChatTurnPinned(
  workspaceId: string,
  chatId: string,
  turnId: string,
  pinned: boolean,
) {
  return request<{ turn: ChatTurn }>(
    `/workspaces/${workspaceId}/chats/${chatId}/turns/${turnId}/pin`,
    {
      method: "POST",
      body: JSON.stringify({ pinned }),
    },
  );
}

export async function cleanupWorkspaceDuplicates(workspaceId: string) {
  return request<{ removed: Source[] }>(`/workspaces/${workspaceId}/duplicates/cleanup`, { method: "POST" });
}

/** Batch zip: notebook.json, sources/, notes/, artifacts/ (Phase 9). */
export async function downloadWorkspaceBundle(workspaceId: string) {
  const token = getToken();
  if (!token) throw new Error("Missing session token.");
  const res = await fetch(`${BASE_URL}/workspaces/${workspaceId}/export?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Export failed" }));
    throw new Error(
      typeof err.detail === "string" ? err.detail : Array.isArray(err.detail) ? err.detail[0]?.msg || "Export failed" : "Export failed",
    );
  }
  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  const match = cd.match(/filename="?([^"]+)"?/i);
  return { blob, filename: match?.[1] || "jackpal-notebook-export.zip" };
}

/** Zip of artifacts/ only (viewer+). */
export async function downloadWorkspaceArtifactsBundle(workspaceId: string) {
  const token = getToken();
  if (!token) throw new Error("Missing session token.");
  const res = await fetch(
    `${BASE_URL}/workspaces/${workspaceId}/export/artifacts?token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Export failed" }));
    throw new Error(
      typeof err.detail === "string" ? err.detail : Array.isArray(err.detail) ? err.detail[0]?.msg || "Export failed" : "Export failed",
    );
  }
  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  const match = cd.match(/filename="?([^"]+)"?/i);
  return { blob, filename: match?.[1] || "jackpal-artifacts-export.zip" };
}

// ── Voice cloning (VoxCPM) ───────────────────────────────────────────────────

export type VoiceCapabilities = {
  cloning_available: boolean;
  registry_available: boolean;
  list_available: boolean;
  engine: string;
};

export type VoiceClone = {
  voice_key: string;
  size: number;
  has_transcript?: boolean;
};

export async function getVoiceCapabilities() {
  return request<VoiceCapabilities>("/voice/capabilities");
}

export async function listVoiceClones() {
  const data = await request<{ voices: VoiceClone[] }>("/voice/clones");
  return data.voices;
}

export async function registerVoiceClone(
  voiceKey: string,
  audio: Blob,
  transcript?: string,
) {
  const token = getToken();
  const form = new FormData();
  form.append("voice_key", voiceKey);
  if (transcript) form.append("transcript", transcript);
  form.append("audio", audio, `${voiceKey}.wav`);

  const res = await fetch(`${BASE_URL}/voice/clones/register`, {
    method: "POST",
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(err.detail || "Registration failed");
  }
  return res.json() as Promise<{ status: string; voice_key: string; size: number }>;
}

export async function synthesizeVoiceClone(params: {
  text: string;
  voice_key?: string;
  reference_wav_b64?: string;
  prompt_text?: string;
  cfg_value?: number;
  inference_timesteps?: number;
  denoise?: boolean;
}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/voice/clones/synthesize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Synthesis failed" }));
    throw new Error(err.detail || "Synthesis failed");
  }
  return res.blob();
}

// ── Payments (Paystack) ──────────────────────────────────────────────────────

export type Subscription = {
  plan: "free" | "pro";
  status: "active" | "expired" | "none";
  expires_at: string | null;
  amount_ngn: number;
  amount_kobo: number;
  billing_period_days: number;
};

export type PaymentInitializeResponse = {
  authorization_url: string;
  access_code?: string;
  reference: string;
  amount_ngn: number;
};

export type PaymentVerifyResponse = {
  status: string;
  already_processed: boolean;
  subscription: Subscription;
};

export async function getSubscription(): Promise<Subscription> {
  return request<Subscription>("/payments/subscription");
}

export async function initializeProPayment(): Promise<PaymentInitializeResponse> {
  return request<PaymentInitializeResponse>("/payments/initialize", {
    method: "POST",
    body: JSON.stringify({ plan: "pro" }),
  });
}

export async function verifyPayment(reference: string): Promise<PaymentVerifyResponse> {
  return request<PaymentVerifyResponse>(`/payments/verify/${encodeURIComponent(reference)}`);
}
