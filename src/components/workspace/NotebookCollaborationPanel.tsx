'use client';

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Link2, Loader2, Mail, Trash2, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createWorkspaceInvitation,
  listWorkspaceCollaborators,
  listWorkspaceInvitations,
  removeWorkspaceCollaborator,
  revokeWorkspaceInvitation,
  updateWorkspaceCollaboratorRole,
  type WorkspaceCollaborator,
  type WorkspaceInvitation,
} from "@/lib/api";

type Props = {
  notebookId: string;
  onRefresh: () => Promise<void>;
};

function formatExpiry(expiresAt: number | undefined): string {
  if (expiresAt == null || Number.isNaN(expiresAt)) return "—";
  const ms = expiresAt > 1e12 ? expiresAt : expiresAt * 1000;
  try {
    return new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function inviteStatus(inv: WorkspaceInvitation, nowSec: number): "pending" | "accepted" | "revoked" | "expired" {
  if (inv.revoked) return "revoked";
  if (inv.accepted_user_id || inv.accepted_at) return "accepted";
  const exp = inv.expires_at;
  if (exp != null && typeof exp === "number" && nowSec > exp) return "expired";
  return "pending";
}

function shortenUserId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function inviteLinkFromToken(token: string): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  return `${origin}/dashboard/invite?invite=${encodeURIComponent(token)}`;
}

export function NotebookCollaborationPanel({ notebookId, onRefresh }: Props) {
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [collaborators, setCollaborators] = useState<WorkspaceCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  const [inviteRole, setInviteRole] = useState<"viewer" | "editor">("viewer");
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [expiresPreset, setExpiresPreset] = useState<string>("604800");

  const nowSec = Math.floor(Date.now() / 1000);

  const expiresInSeconds = useMemo(() => {
    const n = Number(expiresPreset);
    if (!Number.isFinite(n)) return 7 * 24 * 3600;
    return Math.min(90 * 24 * 3600, Math.max(300, Math.round(n)));
  }, [expiresPreset]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [inv, collab] = await Promise.all([
        listWorkspaceInvitations(notebookId),
        listWorkspaceCollaborators(notebookId),
      ]);
      setInvitations(inv);
      setCollaborators(collab);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load sharing data.");
    } finally {
      setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreateInvite() {
    setBusy("Creating invite…");
    setError("");
    try {
      await createWorkspaceInvitation(notebookId, {
        role: inviteRole,
        expires_in: expiresInSeconds,
        invitee_email: inviteeEmail.trim() || null,
      });
      setInviteeEmail("");
      await load();
      await onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not create invitation.");
    } finally {
      setBusy("");
    }
  }

  async function handleRevoke(invitationId: string) {
    setBusy("Revoking…");
    setError("");
    try {
      await revokeWorkspaceInvitation(notebookId, invitationId);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not revoke invitation.");
    } finally {
      setBusy("");
    }
  }

  async function handleRoleChange(userId: string, role: "viewer" | "editor") {
    setBusy("Updating role…");
    setError("");
    try {
      await updateWorkspaceCollaboratorRole(notebookId, userId, role);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update role.");
    } finally {
      setBusy("");
    }
  }

  async function handleRemoveCollab(userId: string) {
    if (!confirm("Remove this collaborator from the notebook?")) return;
    setBusy("Removing…");
    setError("");
    try {
      await removeWorkspaceCollaborator(notebookId, userId);
      await load();
      await onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not remove collaborator.");
    } finally {
      setBusy("");
    }
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(""), 2000);
    } catch {
      setError("Clipboard unavailable. Copy manually.");
    }
  }

  const pendingInvites = invitations.filter((i) => inviteStatus(i, nowSec) === "pending");

  return (
    <section
      className={cn("studio studio-glass studio-glass-interactive rounded-2xl p-4 sm:p-5 space-y-5")}
      aria-labelledby="notebook-share-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="notebook-share-heading" className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Share notebook
          </h3>
          <p className="text-[12px] mt-1 max-w-xl" style={{ color: "var(--text-2)" }}>
            Invite collaborators with a link or email label. Only you can manage invites and roles.
          </p>
        </div>
        {loading && <Loader2 className="animate-spin shrink-0" size={18} style={{ color: "var(--text-3)" }} aria-hidden />}
      </div>

      {(error || busy) && (
        <div
          className="rounded-xl px-3 py-2 text-[11px] flex flex-wrap items-center justify-between gap-2"
          style={{
            background: error ? "rgba(248,113,113,0.08)" : "var(--surface-2)",
            border: `1px solid ${error ? "rgba(248,113,113,0.35)" : "var(--border)"}`,
            color: error ? "#fecaca" : "var(--text-2)",
          }}
          role={error ? "alert" : undefined}
        >
          <span>{error || busy}</span>
          {error && (
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
              style={{ color: "var(--text-3)" }}
              onClick={() => setError("")}
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="studio-glass-inset rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            <UserPlus size={14} strokeWidth={2} aria-hidden />
            New invitation
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
              Role
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "viewer" | "editor")}
                className="rounded-lg px-3 py-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-2)]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </label>
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
              Expires in
              <select
                value={expiresPreset}
                onChange={(e) => setExpiresPreset(e.target.value)}
                className="rounded-lg px-3 py-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-2)]"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
              >
                <option value="86400">1 day</option>
                <option value="604800">7 days</option>
                <option value="2592000">30 days</option>
                <option value="7776000">90 days</option>
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
            <span className="inline-flex items-center gap-1.5">
              <Mail size={12} aria-hidden />
              Invitee email (optional)
            </span>
            <input
              type="email"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
              placeholder="colleague@company.com"
              autoComplete="off"
              className="rounded-lg px-3 py-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-2)]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
            />
          </label>
          <button
            type="button"
            onClick={() => void handleCreateInvite()}
            disabled={!!busy}
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-2)]"
            style={{ background: "var(--blue)" }}
          >
            {busy === "Creating invite…" ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            Create invite
          </button>
        </div>

        <div className="studio-glass-inset rounded-xl p-4 space-y-3 min-h-[140px]">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            <Users size={14} strokeWidth={2} aria-hidden />
            Collaborators ({collaborators.length})
          </div>
          {!loading && collaborators.length === 0 ? (
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
              No collaborators yet. Accepted invites appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {collaborators.map((c) => (
                <li
                  key={c.user_id}
                  className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-2 studio-glass-inset"
                >
                  <span className="text-[12px] font-mono truncate flex-1 min-w-[8rem]" style={{ color: "var(--text-1)" }} title={c.user_id}>
                    {shortenUserId(c.user_id)}
                  </span>
                  <select
                    value={c.role}
                    onChange={(e) => void handleRoleChange(c.user_id, e.target.value as "viewer" | "editor")}
                    disabled={!!busy}
                    className="rounded-lg px-2 py-1.5 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    type="button"
                    title="Remove collaborator"
                    onClick={() => void handleRemoveCollab(c.user_id)}
                    disabled={!!busy}
                    className="shrink-0 rounded-lg p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                    style={{ color: "#f87171" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="studio-glass-inset rounded-xl p-4 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
          Invitations
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-3)" }}>
            <Loader2 size={14} className="animate-spin" />
            Loading…
          </div>
        ) : invitations.length === 0 ? (
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
            No invitations yet. Create one to share access with a secure link.
          </p>
        ) : (
          <ul className="space-y-2">
            {invitations.map((inv) => {
              const st = inviteStatus(inv, nowSec);
              const link = inv.token ? inviteLinkFromToken(inv.token) : "";
              const showCopy = st === "pending" && inv.token;
              return (
                <li
                  key={inv.id}
                  className="rounded-xl p-3 grid gap-2 sm:grid-cols-[1fr_auto] studio-glass-inset"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                        {inv.role}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
                        style={{
                          background:
                            st === "pending"
                              ? "rgba(42, 154, 120, 0.15)"
                              : st === "accepted"
                                ? "rgba(44, 123, 229, 0.14)"
                                : "rgba(148, 163, 184, 0.12)",
                          color: st === "pending" ? "var(--teal)" : st === "accepted" ? "var(--blue)" : "var(--text-3)",
                        }}
                      >
                        {st}
                      </span>
                      {inv.invitee_email && (
                        <span className="text-[11px] truncate flex items-center gap-1" style={{ color: "var(--text-2)" }}>
                          <Mail size={11} aria-hidden />
                          {inv.invitee_email}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono truncate" style={{ color: "var(--text-3)" }}>
                      Expires {formatExpiry(inv.expires_at)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                    {showCopy && (
                      <>
                        <button
                          type="button"
                          onClick={() => void copyText("link", link)}
                          className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                          style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
                        >
                          <Link2 size={12} />
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() => inv.token && void copyText("token", inv.token)}
                          className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                          style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
                        >
                          <Copy size={12} />
                          Copy token
                        </button>
                      </>
                    )}
                    {st === "pending" && (
                      <button
                        type="button"
                        onClick={() => void handleRevoke(inv.id)}
                        disabled={!!busy}
                        className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                        style={{ border: "1px solid rgba(248,113,113,0.45)", color: "#fecaca" }}
                      >
                        <Trash2 size={12} />
                        Revoke
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {copyFeedback && (
        <p className="text-[11px]" style={{ color: "var(--teal)" }} role="status">
          Copied {copyFeedback} to clipboard.
        </p>
      )}

      {pendingInvites.length > 0 && (
        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
          {pendingInvites.length} pending invitation{pendingInvites.length === 1 ? "" : "s"}.
        </p>
      )}

      <p className="text-[11px] pt-1 border-t" style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
        Joining with a link?{" "}
        <Link
          href="/dashboard/invite"
          className="font-semibold underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] rounded"
          style={{ color: "var(--blue)" }}
        >
          Accept invite
        </Link>
      </p>
    </section>
  );
}
