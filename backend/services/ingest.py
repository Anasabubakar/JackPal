"""
Source ingestion — turn any URL (web page, YouTube, Google Drive) or raw text
into a normalized {title, text, type, url, metadata} payload that the workspace
router can persist as a notebook source.

Why this lives in its own module:
  * The router previously used a regex `_strip_html` that produced very noisy
    text (kept nav, footer, cookie banners). That hurt RAG quality.
  * NotebookLM-style ingestion has more shapes than "URL" — YouTube transcripts,
    Drive files, plain web articles, and user-pasted text each need different
    handling, and we want one entry point.
  * Research automation (Phase 5) and batch import (Phase 9) both want to reuse
    the same routing without going through HTTP.

Each public function returns the same shape:

    {
        "title":    str,           # display title
        "text":     str,            # plain-text fulltext for RAG / display
        "type":     str,            # "url" | "youtube" | "drive" | "text" | "file"
        "url":      str | None,
        "metadata": dict,           # ingest-specific extras (channel, duration, …)
    }

All extractors degrade gracefully — if a high-quality parser fails, we fall
back to a lower-quality one, and finally to a stub source so the user can still
see *something* in the notebook even when extraction fails entirely.
"""
from __future__ import annotations

import asyncio
import html
import re
from typing import Iterable
from urllib.parse import parse_qs, urlparse

import httpx


# ── URL classification ─────────────────────────────────────────────────────────

_YT_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"}
_DRIVE_HOSTS = {"drive.google.com", "docs.google.com"}


def classify_url(url: str) -> str:
    """Return one of: 'youtube', 'drive', 'url'."""
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return "url"
    if host in _YT_HOSTS:
        return "youtube"
    if host in _DRIVE_HOSTS:
        return "drive"
    return "url"


def youtube_video_id(url: str) -> str | None:
    """Extract the v= or short-form id from any YouTube URL shape."""
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        if host == "youtu.be":
            return parsed.path.lstrip("/").split("/", 1)[0] or None
        if host in _YT_HOSTS:
            qs = parse_qs(parsed.query)
            if "v" in qs and qs["v"]:
                return qs["v"][0]
            # /shorts/<id>, /embed/<id>, /live/<id>
            for prefix in ("/shorts/", "/embed/", "/live/"):
                if parsed.path.startswith(prefix):
                    return parsed.path[len(prefix):].split("/", 1)[0] or None
    except Exception:
        return None
    return None


def drive_file_id(url: str) -> str | None:
    """Extract a Google Drive / Docs file id."""
    try:
        parsed = urlparse(url)
        # /file/d/<ID>/...
        match = re.search(r"/(?:file|document|spreadsheets|presentation)/d/([A-Za-z0-9_-]+)", parsed.path)
        if match:
            return match.group(1)
        # ?id=<ID>
        qs = parse_qs(parsed.query)
        if "id" in qs and qs["id"]:
            return qs["id"][0]
    except Exception:
        return None
    return None


# ── HTML extraction ────────────────────────────────────────────────────────────

def _strip_html_regex(raw_html: str) -> str:
    """Last-resort HTML → text. Used when trafilatura and bs4 both fail."""
    raw_html = re.sub(r"<script\b.*?</script>", " ", raw_html, flags=re.I | re.S)
    raw_html = re.sub(r"<style\b.*?</style>", " ", raw_html, flags=re.I | re.S)
    raw_html = re.sub(r"<[^>]+>", " ", raw_html)
    raw_html = html.unescape(raw_html)
    raw_html = re.sub(r"\s+", " ", raw_html)
    return raw_html.strip()


def _extract_title(raw_html: str, fallback: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", raw_html, flags=re.I | re.S)
    if match:
        title = html.unescape(match.group(1)).strip()
        if title:
            return title
    return fallback


def _extract_with_trafilatura(raw_html: str, url: str) -> tuple[str | None, str | None]:
    """High-quality main-content extraction. Returns (title, text)."""
    try:
        import trafilatura  # type: ignore
        text = trafilatura.extract(
            raw_html,
            url=url,
            favor_recall=True,
            include_comments=False,
            include_tables=True,
            no_fallback=False,
        )
        if not text:
            return None, None
        try:
            meta = trafilatura.extract_metadata(raw_html, default_url=url)
            title = (meta.title if meta and meta.title else None)
        except Exception:
            title = None
        return title, text.strip()
    except Exception as exc:
        print(f"[ingest] trafilatura failed for {url}: {exc}")
        return None, None


def _extract_with_bs4(raw_html: str) -> tuple[str | None, str | None]:
    """Decent fallback — strips obvious chrome (nav, footer, scripts)."""
    try:
        from bs4 import BeautifulSoup  # type: ignore
        soup = BeautifulSoup(raw_html, "lxml" if _has_lxml() else "html.parser")
        for tag in soup(["script", "style", "noscript", "iframe", "nav", "footer", "aside", "form"]):
            tag.decompose()
        title = (soup.title.string or "").strip() if soup.title else None
        # Prefer <main> / <article> when present
        main = soup.find("main") or soup.find("article") or soup.body or soup
        text = main.get_text("\n", strip=True)
        return title, text.strip()
    except Exception as exc:
        print(f"[ingest] bs4 fallback failed: {exc}")
        return None, None


def _has_lxml() -> bool:
    try:
        import lxml  # noqa: F401
        return True
    except Exception:
        return False


# ── Public: text source ───────────────────────────────────────────────────────

def from_text(title: str, content: str) -> dict:
    return {
        "title":    (title or "Pasted text").strip() or "Pasted text",
        "text":     (content or "").strip(),
        "type":     "text",
        "url":      None,
        "metadata": {"word_count": len((content or "").split())},
    }


# ── Public: web URL ────────────────────────────────────────────────────────────

async def from_url(url: str) -> dict:
    """Dispatch URL → YouTube / Drive / generic web."""
    kind = classify_url(url)
    if kind == "youtube":
        return await from_youtube(url)
    if kind == "drive":
        return await from_drive(url)
    return await from_web(url)


async def from_web(url: str) -> dict:
    """Fetch a normal web page and extract main-content text + title."""
    headers = {
        # A real-ish UA keeps Wikipedia, NYT, Substack etc. from gatekeeping.
        "User-Agent": "Mozilla/5.0 (compatible; JackPalBot/1.0; +https://jackpal.local)",
        "Accept-Language": "en-US,en;q=0.9",
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=30, headers=headers) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        raw = resp.text
        final_url = str(resp.url)

    title, text = _extract_with_trafilatura(raw, final_url)
    if not text or len(text) < 200:
        bs_title, bs_text = _extract_with_bs4(raw)
        if bs_text and len(bs_text) > len(text or ""):
            title, text = bs_title or title, bs_text
    if not text:
        text = _strip_html_regex(raw)

    title = (title or _extract_title(raw, urlparse(final_url).netloc or "Web source")).strip()
    return {
        "title":    title or final_url,
        "text":     text or "",
        "type":     "url",
        "url":      final_url,
        "metadata": {"source_url": final_url, "extractor": "trafilatura" if text else "regex"},
    }


# ── Public: YouTube ────────────────────────────────────────────────────────────

async def from_youtube(url: str) -> dict:
    """
    Pull a YouTube transcript using yt-dlp (subtitles or auto-captions).
    Runs the blocking yt-dlp call in a thread so we don't stall the event loop.
    Falls back to video metadata + a stub message if no transcript exists.
    """
    vid = youtube_video_id(url) or url
    try:
        info = await asyncio.to_thread(_yt_extract_info, url)
    except Exception as exc:
        print(f"[ingest] yt-dlp failed for {url}: {exc}")
        return {
            "title":    f"YouTube {vid}",
            "text":     f"Could not extract YouTube transcript for {url}: {exc}",
            "type":     "youtube",
            "url":      url,
            "metadata": {"video_id": vid, "error": str(exc)},
        }

    title = (info.get("title") or f"YouTube {vid}").strip()
    channel = info.get("channel") or info.get("uploader") or ""
    duration = info.get("duration")
    description = (info.get("description") or "").strip()

    transcript = _yt_transcript_text(info)
    if transcript:
        body = transcript
    elif description:
        body = (
            "(No transcript or captions available for this video. Using the "
            "public description instead — chat answers will be less accurate.)\n\n"
            + description
        )
    else:
        body = f"No transcript, captions, or description available for {url}."

    header = f"# {title}\n"
    if channel:
        header += f"_Channel: {channel}_\n"
    if duration:
        header += f"_Duration: {_fmt_duration(duration)}_\n"
    header += f"_Source: {url}_\n\n"

    return {
        "title":    title,
        "text":     header + body,
        "type":     "youtube",
        "url":      url,
        "metadata": {
            "video_id":     vid,
            "channel":      channel,
            "duration_s":   duration,
            "has_transcript": bool(transcript),
        },
    }


def _yt_extract_info(url: str) -> dict:
    """Synchronous yt-dlp metadata + subtitle fetch. Wrapped in to_thread()."""
    from yt_dlp import YoutubeDL  # type: ignore

    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": ["en", "en-US", "en-GB"],
        "subtitlesformat": "vtt",
        "extract_flat": False,
    }
    with YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=False)


def _yt_transcript_text(info: dict) -> str:
    """Pick best English caption track, fetch the .vtt, strip cues to plain text."""
    candidates: list[dict] = []
    for bag_name in ("subtitles", "automatic_captions"):
        bag = info.get(bag_name) or {}
        for lang in ("en", "en-US", "en-GB", "en-orig"):
            tracks = bag.get(lang) or []
            for track in tracks:
                if track.get("ext") in ("vtt", "srv1", "srv3", "ttml") and track.get("url"):
                    candidates.append(track)
    if not candidates:
        return ""

    try:
        # yt-dlp gives us a direct caption URL — fetch synchronously, we're already
        # inside a thread.
        import urllib.request
        req = urllib.request.Request(candidates[0]["url"], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:  # noqa: S310
            raw = resp.read().decode("utf-8", errors="ignore")
    except Exception as exc:
        print(f"[ingest] caption fetch failed: {exc}")
        return ""

    return _clean_vtt(raw)


_VTT_CUE_LINE = re.compile(r"\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}.*")
_VTT_TAGS     = re.compile(r"<[^>]+>")


def _clean_vtt(raw: str) -> str:
    """Strip VTT headers, timing cues, and inline tags into a plain transcript."""
    lines_out: list[str] = []
    for raw_line in raw.splitlines():
        line = raw_line.strip()
        if not line or line.upper() in {"WEBVTT", "NOTE"}:
            continue
        if _VTT_CUE_LINE.match(line):
            continue
        if line.isdigit():
            continue
        line = _VTT_TAGS.sub("", line)
        # YouTube auto-captions often duplicate consecutive lines — collapse.
        if lines_out and lines_out[-1] == line:
            continue
        lines_out.append(line)
    return " ".join(lines_out).strip()


def _fmt_duration(seconds: int | float) -> str:
    s = int(seconds or 0)
    h, rem = divmod(s, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


# ── Public: Google Drive ──────────────────────────────────────────────────────

async def from_drive(url: str) -> dict:
    """
    Import a publicly shared Google Drive file. We don't use the API — we fetch
    the public export URL for the file id. This works for Docs, Sheets, Slides,
    and 'Anyone with the link' uploads. Private files return a stub.
    """
    file_id = drive_file_id(url)
    if not file_id:
        return {
            "title":    "Google Drive file",
            "text":     f"Could not parse a Drive file id from {url}.",
            "type":     "drive",
            "url":      url,
            "metadata": {"error": "no_file_id"},
        }

    # Try the txt export endpoint for Docs first, then a generic download.
    candidates: Iterable[str] = (
        f"https://docs.google.com/document/d/{file_id}/export?format=txt",
        f"https://drive.google.com/uc?export=download&id={file_id}",
    )
    headers = {"User-Agent": "Mozilla/5.0 (compatible; JackPalBot/1.0)"}
    text = ""
    title = "Drive file"
    final_url = url

    async with httpx.AsyncClient(follow_redirects=True, timeout=30, headers=headers) as client:
        for candidate in candidates:
            try:
                resp = await client.get(candidate)
                if resp.status_code == 200 and resp.text:
                    text = resp.text
                    final_url = str(resp.url)
                    # Docs export sometimes returns HTML when the file isn't public.
                    if "<title>Sign in" in text or "accounts.google.com" in text[:2000]:
                        text = ""
                        continue
                    break
            except Exception as exc:
                print(f"[ingest] drive fetch {candidate} failed: {exc}")
                continue

    if not text:
        return {
            "title":    "Google Drive file",
            "text":     f"Drive file is not publicly shared, or export is unavailable: {url}",
            "type":     "drive",
            "url":      url,
            "metadata": {"file_id": file_id, "error": "not_public_or_export_failed"},
        }

    # Some exports include a metadata header — keep the first non-empty line as title.
    for line in text.splitlines():
        line = line.strip()
        if line:
            title = line[:200]
            break

    return {
        "title":    title,
        "text":     text.strip(),
        "type":     "drive",
        "url":      url,
        "metadata": {"file_id": file_id, "export_url": final_url},
    }
