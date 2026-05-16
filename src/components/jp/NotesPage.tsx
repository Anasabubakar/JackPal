'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useJp, JP_SUBJECTS, type JpTheme } from '@/store/jpStore';
import {
  listWorkspaceNotes,
  addWorkspaceNote,
  deleteWorkspaceNote,
  type Note,
} from '@/lib/api';

interface NotesPageProps {
  theme: JpTheme;
  accent: string;
  frame?: 'desktop' | 'mobile';
}

type FilterKind = 'All' | 'Highlights' | 'Bookmarks' | 'Notes';
const FILTERS: FilterKind[] = ['All', 'Highlights', 'Bookmarks', 'Notes'];

function kindFromApiKind(kind: string): 'highlight' | 'bookmark' | 'note' {
  if (kind === 'highlight') return 'highlight';
  if (kind === 'bookmark') return 'bookmark';
  return 'note';
}

function guessSubject(text: string): string {
  const t = text.toLowerCase();
  if (/bio|plant|ecolog|photosyn|cell|organism/.test(t)) return 'Biology';
  if (/econ|demand|supply|market|financ/.test(t)) return 'Economics';
  if (/law|legal|const|court|tort/.test(t)) return 'Law';
  if (/chem|organic|mol|reaction/.test(t)) return 'Chemistry';
  if (/lit|novel|poem|fiction/.test(t)) return 'Literature';
  if (/math|calculus|algebra|equation/.test(t)) return 'Math';
  return 'Biology';
}

function formatDate(str?: string): string {
  if (!str) return 'Recently';
  try {
    const diff = Math.floor((Date.now() - new Date(str).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return new Date(str).toLocaleDateString();
  } catch { return 'Recently'; }
}

export function NotesPage({ theme: t, accent, frame = 'desktop' }: NotesPageProps) {
  const { workspaceId } = useJp();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKind>('All');
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const loadNotes = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const data = await listWorkspaceNotes(workspaceId);
      setNotes(data);
    } catch (e) {
      console.error('Failed to load notes:', e);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleAdd = async () => {
    if (!workspaceId || !newTitle.trim() || !newContent.trim()) return;
    try {
      const result = await addWorkspaceNote(workspaceId, newTitle.trim(), newContent.trim(), undefined, 'note');
      setNotes(prev => [result.note, ...prev]);
      setNewTitle('');
      setNewContent('');
      setAdding(false);
    } catch (e) {
      console.error('Failed to add note:', e);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!workspaceId) return;
    try {
      await deleteWorkspaceNote(workspaceId, noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  };

  const filtered = notes.filter(n => {
    const k = kindFromApiKind(n.kind);
    if (filter === 'All') return true;
    if (filter === 'Highlights') return k === 'highlight';
    if (filter === 'Bookmarks') return k === 'bookmark';
    if (filter === 'Notes') return k === 'note';
    return true;
  });

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: frame === 'mobile' ? '16px 16px 100px' : 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        fontFamily: "'Syne', sans-serif",
      }}
      className="jp-scroll"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: t.ink, fontFamily: "'Fraunces', Georgia, serif" }}>
          Highlights & notes
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 100,
                  border: `1px solid ${filter === f ? accent : t.border}`,
                  background: filter === f ? `${accent}18` : 'transparent',
                  color: filter === f ? accent : t.muted,
                  fontSize: 12,
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: filter === f ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAdding(true)}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 10,
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Syne', sans-serif",
            }}
          >
            + New note
          </button>
        </div>
      </div>

      {/* Add note form */}
      {adding && (
        <div
          style={{
            background: t.card,
            border: `1px solid ${accent}44`,
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>New note</div>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Title (e.g. document name or topic)"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              background: t.inset,
              border: `1px solid ${t.border}`,
              color: t.ink,
              fontSize: 13,
              fontFamily: "'Syne', sans-serif",
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Your highlight, bookmark, or note text…"
            rows={4}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              background: t.inset,
              border: `1px solid ${t.border}`,
              color: t.ink,
              fontSize: 13,
              fontFamily: "'Syne', sans-serif",
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleAdd}
              style={{
                flex: 1, height: 38, borderRadius: 10,
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Save note
            </button>
            <button
              onClick={() => { setAdding(false); setNewTitle(''); setNewContent(''); }}
              style={{
                flex: 1, height: 38, borderRadius: 10,
                background: 'transparent', border: `1px solid ${t.border}`,
                color: t.muted, fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: t.muted, fontSize: 13 }}>
          Loading notes…
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: 20,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>◇</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.ink, fontFamily: "'Fraunces', Georgia, serif", marginBottom: 8 }}>
            No notes yet
          </div>
          <div style={{ fontSize: 13, color: t.muted, marginBottom: 20 }}>
            Add highlights, bookmarks, and notes as you study
          </div>
          <button
            onClick={() => setAdding(true)}
            style={{
              height: 40, padding: '0 24px', borderRadius: 10,
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Add your first note
          </button>
        </div>
      )}

      {/* Notes grid */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: frame === 'mobile' ? '1fr' : 'repeat(2, 1fr)',
            gap: 16,
          }}
        >
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              t={t}
              accent={accent}
              onDelete={() => handleDelete(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── NoteCard ───────────────────────────────────────────────────────────────────

function NoteCard({ note, t, accent, onDelete }: {
  note: Note;
  t: JpTheme;
  accent: string;
  onDelete: () => void;
}) {
  const kind = kindFromApiKind(note.kind);
  const subjectKey = guessSubject(note.title + ' ' + note.content);
  const subj = JP_SUBJECTS[subjectKey] || JP_SUBJECTS['Biology'];
  const noteColor = kind === 'highlight' ? '#F5A623' : kind === 'bookmark' ? accent : '#10B981';

  return (
    <div
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Doc strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${t.border}`, background: t.card2 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: `${subj.ink}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
        }}>
          {subj.glyph}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {note.title}
          </div>
          <div style={{ fontSize: 10, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>
            {formatDate(note.created_at)}
          </div>
        </div>
        <div style={{
          fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em', fontWeight: 700,
          padding: '3px 8px', borderRadius: 100,
          background: `${noteColor}20`, color: noteColor, border: `1px solid ${noteColor}44`,
        }}>
          {kind === 'highlight' ? 'HIGHLIGHT' : kind === 'bookmark' ? 'BOOKMARK' : 'NOTE'}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          fontSize: 13, fontFamily: "'Fraunces', Georgia, serif", color: t.ink2, lineHeight: 1.6,
          borderLeft: `3px solid ${noteColor}`, paddingLeft: 12, fontStyle: 'italic',
        }}>
          "{note.content}"
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderTop: `1px solid ${t.border}` }}>
        <button
          style={{
            flex: 1, height: 32, borderRadius: 8,
            background: `${accent}18`, border: `1px solid ${accent}33`, color: accent,
            fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne', sans-serif",
          }}
        >
          ◫ Open in reader
        </button>
        <button
          onClick={onDelete}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'transparent', border: `1px solid ${t.border}`,
            color: '#EF4444', fontSize: 14, cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
