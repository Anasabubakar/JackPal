"""
Research automation — given a query, find good sources on the web, ingest them
through services.ingest, and (optionally) synthesize a short overview via the
existing LLM router in services.ai.

Why this exists
---------------
notebooklm-py's "research" mode in NotebookLM is closed-source: the CLI just
polls Google's hosted notebook service and waits for it to dump curated sources
back. We can't reuse that. Instead, this module gives JackPal an
equivalent-flavor pipeline that runs entirely in-process:

    query → web_search()          # find candidate URLs
          → dedupe + filter        # drop trackers, duplicates, low-value hosts
          → ingest_from_url() each # turn each URL into clean fulltext (Phase 4)
          → llm_complete(...)      # synthesize a short overview
          → return everything

Provider strategy
-----------------
Search backends are tried in order of declared API key availability and quality:

    1. Tavily   (TAVILY_API_KEY)       — AI-tuned web search, gives clean text
    2. Brave    (BRAVE_SEARCH_API_KEY) — high-quality general results
    3. Serper   (SERPER_API_KEY)       — Google results via Serper.dev
    4. DuckDuckGo HTML scraping        — zero-key fallback

The zero-key path means research works out of the box. Operators who care about
quality can layer in an API key without code changes.

Modes
-----
* ``fast``  — single search, top N results, parallel ingest, no query expansion
* ``deep``  — LLM generates 3-5 sub-queries first, fans out, merges + dedupes,
              then ingests. Slower, broader coverage, better for "explore X".

Everything is best-effort: a hard failure in any one ingest is reported per-URL
inside the results list, so the caller can persist a partial research job and
the user still sees what worked.
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
from typing import Literal
from urllib.parse import quote_plus, urlparse

import httpx

from .ai import _llm_complete
from .ingest import from_url as ingest_from_url

logger = logging.getLogger(__name__)

ResearchMode = Literal["fast", "deep"]

# Hosts that almost never carry the substance of a topic — tracking domains,
# pure social posts, login walls. We don't ban them outright (a Twitter post can
# be a legit primary source), but we de-prioritize them when ranking results.
_LOW_VALUE_HOSTS = {
    "pinterest.com",
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "tiktok.com",
    "reddit.com",  # often useful, but lots of duplicate threads
}

# Hard skip — these are aggregator/tracker domains that produce no readable
# article body even after trafilatura. Saves a slow ingest round-trip.
_SKIP_HOSTS = {
    "google.com",
    "www.google.com",
    "bing.com",
    "duckduckgo.com",
    "youtube.com",  # videos handled by /sources/youtube, not generic research
    "www.youtube.com",
}


# ── Public API ─────────────────────────────────────────────────────────────────


async def run_research(
    query: str,
    mode: ResearchMode = "fast",
    *,
    max_results: int = 6,
    timeout_per_source: float = 25.0,
) -> dict:
    """
    Execute a full research run.

    Returns:
        {
            "query":        str,
            "mode":         "fast" | "deep",
            "expanded":     list[str],     # sub-queries (deep only, else [query])
            "candidates":   list[dict],    # raw search hits (url/title/snippet/host)
            "sources":      list[dict],    # successful ingests, ready for upsert
            "failed":       list[dict],    # per-URL ingest errors
            "summary":      str,           # short LLM overview, may be ""
            "provider":     str,           # which search backend was used
        }
    """
    query = (query or "").strip()
    if not query:
        return {
            "query": "",
            "mode": mode,
            "expanded": [],
            "candidates": [],
            "sources": [],
            "failed": [],
            "summary": "",
            "provider": "none",
        }

    if mode == "deep":
        expanded = await _expand_query(query)
    else:
        expanded = [query]

    provider = "none"
    all_hits: list[dict] = []
    for sub in expanded:
        try:
            provider, hits = await _search(sub, k=max_results)
        except Exception as exc:
            logger.warning("research: search failed for %r: %s", sub, exc)
            continue
        all_hits.extend(hits)

    candidates = _dedupe_and_rank(all_hits, k=max_results)

    sources, failed = await _ingest_candidates(candidates, timeout=timeout_per_source)

    summary = await _summarize(query, sources) if sources else ""

    return {
        "query": query,
        "mode": mode,
        "expanded": expanded,
        "candidates": candidates,
        "sources": sources,
        "failed": failed,
        "summary": summary,
        "provider": provider,
    }


# ── Query expansion (deep mode) ────────────────────────────────────────────────


async def _expand_query(query: str) -> list[str]:
    """Use the LLM router to produce 3-5 angle queries for broader coverage."""
    prompt = (
        "You are helping plan a research session.\n"
        f"Topic: {query}\n\n"
        "Output 4 short web-search queries that together cover the topic from "
        "different angles: definition, mechanism, examples, criticism. "
        "Return ONE query per line, no numbering, no quotes."
    )
    try:
        raw = await _llm_complete(prompt, max_tokens=200, timeout=30)
    except Exception as exc:
        logger.warning("research: query expansion failed (%s); using original query only", exc)
        return [query]

    lines = [ln.strip(" -•\t") for ln in raw.splitlines() if ln.strip()]
    lines = [ln for ln in lines if 4 <= len(ln) <= 140]
    # Always keep the original query so a bad expansion doesn't drop the user's
    # actual intent.
    return ([query] + lines)[:5]


# ── Search providers ───────────────────────────────────────────────────────────


async def _search(query: str, *, k: int = 6) -> tuple[str, list[dict]]:
    """
    Try search providers in declared-priority order. Returns (provider, hits).
    Falls back to DuckDuckGo HTML scraping if no API keys are configured.
    """
    if os.getenv("TAVILY_API_KEY"):
        try:
            return "tavily", await _search_tavily(query, k=k)
        except Exception as exc:
            logger.warning("research: tavily failed (%s); falling back", exc)

    if os.getenv("BRAVE_SEARCH_API_KEY"):
        try:
            return "brave", await _search_brave(query, k=k)
        except Exception as exc:
            logger.warning("research: brave failed (%s); falling back", exc)

    if os.getenv("SERPER_API_KEY"):
        try:
            return "serper", await _search_serper(query, k=k)
        except Exception as exc:
            logger.warning("research: serper failed (%s); falling back", exc)

    return "duckduckgo", await _search_duckduckgo(query, k=k)


async def _search_tavily(query: str, *, k: int) -> list[dict]:
    api_key = os.environ["TAVILY_API_KEY"]
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            "https://api.tavily.com/search",
            json={
                "api_key": api_key,
                "query": query,
                "max_results": k,
                "search_depth": "basic",
                "include_answer": False,
            },
        )
        resp.raise_for_status()
        data = resp.json()
    hits = []
    for item in data.get("results", [])[:k]:
        url = item.get("url")
        if not url:
            continue
        hits.append({
            "url": url,
            "title": item.get("title") or url,
            "snippet": item.get("content") or "",
            "host": _host(url),
        })
    return hits


async def _search_brave(query: str, *, k: int) -> list[dict]:
    api_key = os.environ["BRAVE_SEARCH_API_KEY"]
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            "https://api.search.brave.com/res/v1/web/search",
            params={"q": query, "count": k},
            headers={
                "Accept": "application/json",
                "X-Subscription-Token": api_key,
            },
        )
        resp.raise_for_status()
        data = resp.json()
    hits = []
    for item in (data.get("web") or {}).get("results", [])[:k]:
        url = item.get("url")
        if not url:
            continue
        hits.append({
            "url": url,
            "title": item.get("title") or url,
            "snippet": item.get("description") or "",
            "host": _host(url),
        })
    return hits


async def _search_serper(query: str, *, k: int) -> list[dict]:
    api_key = os.environ["SERPER_API_KEY"]
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            "https://google.serper.dev/search",
            json={"q": query, "num": k},
            headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
    hits = []
    for item in data.get("organic", [])[:k]:
        url = item.get("link")
        if not url:
            continue
        hits.append({
            "url": url,
            "title": item.get("title") or url,
            "snippet": item.get("snippet") or "",
            "host": _host(url),
        })
    return hits


# DuckDuckGo HTML endpoint — no API key, but rate-limited and brittle.
# It exists primarily so that the research feature works out of the box; users
# that care should set TAVILY_API_KEY.
_DDG_RESULT_RE = re.compile(
    r'<a[^>]+class="result__a"[^>]+href="(?P<href>[^"]+)"[^>]*>(?P<title>.*?)</a>'
    r'.*?<a[^>]+class="result__snippet"[^>]*>(?P<snippet>.*?)</a>',
    re.DOTALL,
)


async def _search_duckduckgo(query: str, *, k: int) -> list[dict]:
    url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
    headers = {
        # Pretending to be a normal browser dramatically reduces empty
        # responses from DDG's HTML endpoint.
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        resp = await client.post(url, headers=headers, data={"q": query})
        resp.raise_for_status()
        html_body = resp.text

    hits: list[dict] = []
    for match in _DDG_RESULT_RE.finditer(html_body):
        href = match.group("href")
        # DDG wraps real targets in /l/?uddg=<url>. Unwrap.
        real = _unwrap_ddg(href)
        if not real:
            continue
        hits.append({
            "url": real,
            "title": _strip_tags(match.group("title")),
            "snippet": _strip_tags(match.group("snippet")),
            "host": _host(real),
        })
        if len(hits) >= k:
            break
    return hits


def _unwrap_ddg(href: str) -> str | None:
    if not href:
        return None
    if href.startswith("//"):
        href = "https:" + href
    if "duckduckgo.com" not in href:
        return href
    # /l/?uddg=https%3A%2F%2Fexample.com%2F&rut=...
    try:
        from urllib.parse import parse_qs, urlparse as _u
        q = parse_qs(_u(href).query)
        if "uddg" in q and q["uddg"]:
            return q["uddg"][0]
    except Exception:
        return None
    return None


def _strip_tags(snippet: str) -> str:
    return re.sub(r"<[^>]+>", "", snippet or "").strip()


# ── Candidate ranking / dedupe ─────────────────────────────────────────────────


def _dedupe_and_rank(hits: list[dict], *, k: int) -> list[dict]:
    """De-duplicate by host+path, hard-skip aggregator domains, and rank by a
    cheap heuristic so we ingest the most promising URLs first."""
    seen: set[str] = set()
    out: list[dict] = []
    for hit in hits:
        url = (hit.get("url") or "").strip()
        if not url:
            continue
        host = (hit.get("host") or _host(url)).lower()
        if host in _SKIP_HOSTS:
            continue
        # Cheap canonical key: scheme-less host + path (drop fragments/queries)
        key = _canonical_key(url)
        if key in seen:
            continue
        seen.add(key)
        out.append({**hit, "host": host, "score": _score(hit)})

    out.sort(key=lambda h: h["score"], reverse=True)
    return out[:k]


def _canonical_key(url: str) -> str:
    try:
        parts = urlparse(url)
        return f"{(parts.hostname or '').lower()}{parts.path.rstrip('/')}"
    except Exception:
        return url


def _score(hit: dict) -> float:
    host = (hit.get("host") or _host(hit.get("url") or "")).lower()
    score = 1.0
    if host in _LOW_VALUE_HOSTS:
        score -= 0.4
    # Prefer hits with a real snippet over bare titles.
    if len(hit.get("snippet") or "") > 80:
        score += 0.3
    # Domain-trust nudge: edu/gov-ish wins ties.
    if host.endswith(".edu") or host.endswith(".gov") or host.endswith(".ac.uk"):
        score += 0.3
    return score


def _host(url: str) -> str:
    try:
        return (urlparse(url).hostname or "").lower()
    except Exception:
        return ""


# ── Ingestion ──────────────────────────────────────────────────────────────────


async def _ingest_candidates(
    candidates: list[dict],
    *,
    timeout: float,
) -> tuple[list[dict], list[dict]]:
    """Fan out ingest_from_url() across all candidates in parallel."""
    if not candidates:
        return [], []

    async def _one(cand: dict) -> tuple[dict | None, dict | None]:
        url = cand["url"]
        try:
            payload = await asyncio.wait_for(ingest_from_url(url), timeout=timeout)
        except Exception as exc:
            return None, {"url": url, "title": cand.get("title"), "error": str(exc)}
        # Drop near-empty extractions — they pollute the notebook.
        if not (payload.get("text") or "").strip():
            return None, {"url": url, "title": cand.get("title"), "error": "empty extraction"}
        payload.setdefault("metadata", {})
        payload["metadata"]["search_snippet"] = cand.get("snippet")
        payload["metadata"]["search_host"] = cand.get("host")
        return payload, None

    results = await asyncio.gather(*[_one(c) for c in candidates], return_exceptions=False)

    sources: list[dict] = []
    failed: list[dict] = []
    for ok, err in results:
        if ok is not None:
            sources.append(ok)
        if err is not None:
            failed.append(err)
    return sources, failed


# ── Synthesis ──────────────────────────────────────────────────────────────────


async def _summarize(query: str, sources: list[dict]) -> str:
    """Produce a short overview that frames the imported sources.

    Each source contributes a brief excerpt — we cap aggressively so we never
    blow past the LLM context window even when ingest pulls a 200kB article.
    """
    if not sources:
        return ""

    bullets = []
    for i, src in enumerate(sources, 1):
        title = src.get("title") or src.get("url") or f"Source {i}"
        text = (src.get("text") or "").strip()
        excerpt = text[:1500].rsplit(" ", 1)[0] if len(text) > 1500 else text
        bullets.append(f"[{i}] {title}\n{excerpt}")

    prompt = (
        f"Topic: {query}\n\n"
        "You have been given excerpts from several web sources. Write a concise "
        "research overview (4-7 sentences) that synthesises what the sources "
        "collectively say about the topic. Cite sources inline like [1], [2]. "
        "Do not invent facts not present in the excerpts.\n\n"
        + "\n\n---\n\n".join(bullets)
    )

    try:
        return (await _llm_complete(prompt, max_tokens=500, timeout=60)).strip()
    except Exception as exc:
        logger.warning("research: synthesis failed: %s", exc)
        return ""
