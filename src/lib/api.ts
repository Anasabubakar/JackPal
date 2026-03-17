const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
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

export async function signup(email: string, password: string, full_name: string) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name }),
  });
}

export async function logout() {
  await request("/auth/logout", { method: "POST" }).catch(() => {});
  clearSession();
}

export async function requestPasswordReset(email: string) {
  return request("/auth/reset", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
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

export async function getAudioStatus(docId: string) {
  return request<{ status: string; ready_chunks: number; total_chunks: number; audio_voice?: string | null; audio_engine?: "fast" | "premium" | null }>(
    `/audio/${docId}/status`
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

export async function getPodcastChunks(docId: string) {
  return request<PodcastStatus>(`/ai/podcast/${docId}/chunks`);
}

export async function getDocumentText(docId: string): Promise<string> {
  const data = await request<{ text: string }>(`/documents/${docId}/text`);
  return data.text;
}
