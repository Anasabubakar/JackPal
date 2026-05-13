"use client";

import { useCallback, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { searchWorkspace, type WorkspaceCitation } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  workspaceId: string;
  disabled?: boolean;
};

export function WorkspaceNotebookSearch({ workspaceId, disabled }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [results, setResults] = useState<WorkspaceCitation[]>([]);
  const [meta, setMeta] = useState<{ sourceCount: number } | null>(null);

  const run = useCallback(async () => {
    const query = q.trim();
    if (!query || disabled) return;
    setLoading(true);
    setErr("");
    try {
      const data = await searchWorkspace(workspaceId, query, { topK: 10 });
      setResults(data.results ?? []);
      setMeta({ sourceCount: data.source_count });
    } catch (e: unknown) {
      setResults([]);
      setMeta(null);
      setErr(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, q, disabled]);

  return (
    <section
      className={cn("studio-glass-inset rounded-xl p-4 space-y-3")}
      aria-labelledby="notebook-search-heading"
    >
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
        <Search size={14} strokeWidth={2} aria-hidden />
        <h3 id="notebook-search-heading">Find in notebook</h3>
      </div>
      <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
        Retrieval preview across sources — no LLM call. Useful before chat or to spot gaps.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1 grid gap-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
          Query
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void run()}
            disabled={!!disabled || loading}
            placeholder="Keywords or question…"
            className="rounded-lg px-3 py-2 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-2)] disabled:opacity-50"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void run()}
            disabled={!!disabled || loading || !q.trim()}
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] disabled:opacity-50"
            style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Search size={14} aria-hidden />}
            Search
          </button>
        </div>
      </div>
      {err ? (
        <div
          className="rounded-lg px-3 py-2 text-[11px]"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.35)", color: "#fecaca" }}
          role="alert"
        >
          {err}
        </div>
      ) : null}
      {meta && !err && (
        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
          Scanned {meta.sourceCount} source{meta.sourceCount === 1 ? "" : "s"} · {results.length} passage{results.length === 1 ? "" : "s"}
        </p>
      )}
      {results.length > 0 && (
        <ul className="space-y-2 max-h-48 overflow-y-auto studio-scroll list-none">
          {results.map((c) => (
            <li
              key={`${c.index}-${c.source_id}`}
              className="rounded-lg p-2 text-[11px] studio-glass-inset"
              style={{ color: "var(--text-2)" }}
            >
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-mono text-[10px]" style={{ color: "var(--blue)" }}>
                  [{c.index}]
                </span>
                <span className="font-medium" style={{ color: "var(--text-1)" }}>
                  {c.title}
                </span>
                <span className="text-[10px] opacity-80">{c.type}</span>
              </div>
              {c.url ? (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] underline mt-0.5 inline-block"
                  style={{ color: "var(--teal)" }}
                >
                  Open source
                </a>
              ) : null}
              <p className="mt-1 italic opacity-90 leading-snug" style={{ color: "var(--text-3)" }}>
                {c.excerpt.slice(0, 240)}
                {c.excerpt.length > 240 ? "…" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
      {!loading && q.trim() && results.length === 0 && !err && meta && (
        <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
          No passages matched. Add more sources or try different terms.
        </p>
      )}
    </section>
  );
}
