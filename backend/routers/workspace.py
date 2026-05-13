import csv
import html
import io
import json
import re
import zipfile
from typing import Literal
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, File, HTTPException, Header, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from services.auth_utils import get_user_id, is_local_mode
from services.ai import answer_question, generate_podcast_script, summarize_document
from services.content_filter import filter_document
from services.extractor import extract_text
from services.workspace_rag import (
    build_cited_question,
    build_numbered_context,
    notebook_retrieve,
    to_citations,
)
from services.local_storage import (
    create_artifact,
    create_note,
    create_chat,
    create_notebook,
    create_research_job,
    add_chat_turn,
    cleanup_duplicate_sources,
    delete_artifact,
    delete_chat,
    delete_note,
    delete_notebook,
    delete_source,
    get_notebook,
    get_chat,
    get_research_job,
    get_sharing,
    list_chat_turns,
    list_chats,
    list_artifacts,
    list_notes,
    list_notebooks,
    list_sources,
    rename_notebook,
    rename_chat,
    rename_source,
    save_document_from_text,
    set_sharing,
    update_artifact,
    update_note,
    update_source,
    upsert_source,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])
USE_LOCAL = is_local_mode()


class NotebookCreate(BaseModel):
    title: str
    description: str | None = None


class NotebookUpdate(BaseModel):
    title: str


class NoteCreate(BaseModel):
    title: str
    content: str
    source_id: str | None = None
    kind: str = "note"


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    kind: str | None = None


class SourceTextCreate(BaseModel):
    title: str
    content: str


class SourceUrlCreate(BaseModel):
    title: str | None = None
    url: str


class ResearchCreate(BaseModel):
    query: str
    mode: Literal["fast", "deep"] = "fast"
    import_urls: list[str] = Field(default_factory=list)


class SharingUpdate(BaseModel):
    public: bool = False
    role: Literal["viewer", "editor"] = "viewer"


class ArtifactCreate(BaseModel):
    title: str | None = None
    prompt: str | None = None
    format: str | None = None


class ChatRequest(BaseModel):
    question: str
    save_as_note: bool = False
    source_ids: list[str] = Field(default_factory=list)
    chat_id: str | None = None


class SearchRequest(BaseModel):
    query: str
    source_ids: list[str] = Field(default_factory=list)
    top_k: int = 8


class ChatCreate(BaseModel):
    title: str
    source_ids: list[str] = Field(default_factory=list)


class ChatUpdate(BaseModel):
    title: str


def _require_local() -> None:
    if not USE_LOCAL:
        raise HTTPException(status_code=501, detail="Workspace features are currently available in local mode only.")


def _notebook_or_404(notebook_id: str, user_id: str) -> dict:
    notebook = get_notebook(notebook_id, user_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found.")
    return notebook


def _source_or_404(source_id: str, user_id: str) -> dict:
    from services.local_storage import get_source

    source = get_source(source_id, user_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found.")
    return source


def _note_or_404(note_id: str, user_id: str) -> dict:
    from services.local_storage import _notes

    note = _notes.get(note_id)
    if not note or (note["user_id"] != user_id):
        raise HTTPException(status_code=404, detail="Note not found.")
    return note


def _artifact_or_404(artifact_id: str, user_id: str) -> dict:
    from services.local_storage import _artifacts

    artifact = _artifacts.get(artifact_id)
    if not artifact or (artifact["user_id"] != user_id):
        raise HTTPException(status_code=404, detail="Artifact not found.")
    return artifact


def _source_payload(source: dict) -> dict:
    return {
        "id": source["id"],
        "notebook_id": source["notebook_id"],
        "type": source["type"],
        "title": source["title"],
        "url": source.get("url"),
        "document_id": source.get("document_id"),
        "status": source.get("status", "ready"),
        "refresh_state": source.get("refresh_state", "fresh"),
        "created_at": source.get("created_at"),
        "updated_at": source.get("updated_at"),
    }


def _notebook_payload(notebook: dict, user_id: str) -> dict:
    sources = list_sources(notebook["id"], user_id)
    notes = list_notes(notebook["id"], user_id)
    artifacts = list_artifacts(notebook["id"], user_id)
    sharing = get_sharing(notebook["id"], user_id)
    return {
        "id": notebook["id"],
        "title": notebook["title"],
        "description": notebook.get("description", ""),
        "source_count": len(sources),
        "note_count": len(notes),
        "artifact_count": len(artifacts),
        "sharing": sharing,
        "created_at": notebook.get("created_at"),
        "updated_at": notebook.get("updated_at"),
    }


def _collect_corpus(notebook_id: str, user_id: str) -> str:
    notebook = _notebook_or_404(notebook_id, user_id)
    chunks: list[str] = []
    for source in list_sources(notebook["id"], user_id):
        if source.get("fulltext"):
            chunks.append(f"# {source['title']}\n{source['fulltext']}".strip())
    for note in list_notes(notebook["id"], user_id):
        if note.get("content"):
            chunks.append(f"## Note: {note['title']}\n{note['content']}".strip())
    return "\n\n".join(chunks).strip()


def _strip_html(raw_html: str) -> str:
    raw_html = re.sub(r"<script\b.*?</script>", " ", raw_html, flags=re.I | re.S)
    raw_html = re.sub(r"<style\b.*?</style>", " ", raw_html, flags=re.I | re.S)
    raw_html = re.sub(r"<[^>]+>", " ", raw_html)
    raw_html = html.unescape(raw_html)
    raw_html = re.sub(r"\s+", " ", raw_html)
    return raw_html.strip()


async def _fetch_url(url: str) -> tuple[str, str]:
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        body = resp.text
    title_match = re.search(r"<title[^>]*>(.*?)</title>", body, flags=re.I | re.S)
    title = html.unescape(title_match.group(1)).strip() if title_match else urlparse(url).netloc or "Web Source"
    text = _strip_html(body)
    return title, text


def _sentence_list(text: str, limit: int = 8) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    result = [p.strip() for p in parts if p.strip()]
    return result[:limit]


def _slug_title(title: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9]+", "-", title).strip("-").lower()
    return safe or "source"


def _make_markdown_table(rows: list[dict], headers: list[str]) -> str:
    out = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        out.append("| " + " | ".join(str(row.get(h, "")) for h in headers) + " |")
    return "\n".join(out)


async def _build_source_guide(text: str, title: str) -> str:
    summary = await summarize_document(text[:12000] if text else "")
    sentences = _sentence_list(text, limit=5)
    bullets = "\n".join(f"- {item}" for item in sentences[:5]) if sentences else "- No extracted text available."
    return f"# {title}\n\n## Summary\n{summary}\n\n## Key Passages\n{bullets}"


async def _import_text_source(
    notebook_id: str,
    user_id: str,
    title: str,
    text: str,
    *,
    source_type: str = "text",
    url: str | None = None,
) -> dict:
    filename = f"{_slug_title(title)}.txt"
    doc = save_document_from_text(user_id, filename, text, source_type=source_type)
    source = upsert_source(
        notebook_id,
        user_id,
        source_type=source_type,
        title=title,
        content=text,
        url=url,
        document_id=doc["id"],
        metadata={"filename": filename},
    )
    return source


@router.get("")
@router.get("/")
async def list_workspaces(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    notebooks = list_notebooks(user_id)
    return {"notebooks": [_notebook_payload(nb, user_id) for nb in notebooks]}


@router.post("")
@router.post("/")
async def create_workspace(body: NotebookCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    notebook = create_notebook(user_id, body.title, body.description or "")
    return _notebook_payload(notebook, user_id)


@router.get("/{notebook_id}")
async def get_workspace(notebook_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    return _notebook_payload(_notebook_or_404(notebook_id, user_id), user_id)


@router.patch("/{notebook_id}")
async def rename_workspace(notebook_id: str, body: NotebookUpdate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    notebook = rename_notebook(notebook_id, user_id, body.title)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found.")
    return _notebook_payload(notebook, user_id)


@router.delete("/{notebook_id}")
async def remove_workspace(notebook_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    if not delete_notebook(notebook_id, user_id):
        raise HTTPException(status_code=404, detail="Notebook not found.")
    return {"message": "Notebook deleted."}


@router.get("/{notebook_id}/sources")
async def get_sources(notebook_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    return {"sources": [_source_payload(src) for src in list_sources(notebook_id, user_id)]}


@router.post("/{notebook_id}/sources/text")
async def add_text_source(notebook_id: str, body: SourceTextCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    source = await _import_text_source(notebook_id, user_id, body.title, body.content, source_type="text")
    return {"source": _source_payload(source)}


@router.post("/{notebook_id}/sources/url")
async def add_url_source(notebook_id: str, body: SourceUrlCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    title = body.title
    text = ""
    if body.url:
        try:
            fetched_title, fetched_text = await _fetch_url(body.url)
            title = title or fetched_title
            text = fetched_text
        except Exception as exc:
            title = title or body.url
            text = f"Imported URL: {body.url}\n\nCould not fetch content: {exc}"
    source = await _import_text_source(notebook_id, user_id, title or body.url, text, source_type="url", url=body.url)
    return {"source": _source_payload(source)}


@router.post("/{notebook_id}/sources/file")
async def add_file_source(
    notebook_id: str,
    file: UploadFile = File(...),
    authorization: str = Header(...),
):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    file_bytes = await file.read()
    extracted = filter_document(file_bytes, file.filename or "upload").text
    if not extracted.strip():
        extracted = extract_text(file_bytes, file.filename or "upload")
    if not extracted.strip():
        raise HTTPException(status_code=422, detail="File appears empty or unreadable.")
    source = await _import_text_source(notebook_id, user_id, file.filename or "Uploaded File", extracted, source_type="file")
    return {"source": _source_payload(source)}


@router.post("/{notebook_id}/sources/research")
async def research_sources(notebook_id: str, body: ResearchCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    imports: list[dict] = []
    for url in body.import_urls:
        try:
            source = await add_url_source(notebook_id, SourceUrlCreate(url=url), authorization)
            imports.append(source["source"])
        except Exception as exc:
            imports.append({"url": url, "error": str(exc)})
    job = create_research_job(notebook_id, user_id, query=body.query, mode=body.mode, status="ready", results=imports)
    note = create_note(
        notebook_id,
        user_id,
        title=f"Research: {body.query[:42]}",
        content=f"Research query: {body.query}\n\nImported sources:\n" + "\n".join(
            f"- {item.get('title') or item.get('url') or 'Source'}" for item in imports
        ),
        kind="research",
    )
    return {"job": job, "note": note, "sources": imports}


@router.get("/{notebook_id}/sources/{source_id}")
async def get_source_detail(notebook_id: str, source_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    return {"source": _source_payload(_source_or_404(source_id, user_id))}


@router.patch("/{notebook_id}/sources/{source_id}")
async def rename_source_detail(
    notebook_id: str,
    source_id: str,
    body: NotebookUpdate,
    authorization: str = Header(...),
):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    source = rename_source(source_id, user_id, body.title)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found.")
    return {"source": _source_payload(source)}


@router.delete("/{notebook_id}/sources/{source_id}")
async def remove_source_detail(notebook_id: str, source_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    if not delete_source(source_id, user_id):
        raise HTTPException(status_code=404, detail="Source not found.")
    return {"message": "Source deleted."}


@router.get("/{notebook_id}/sources/{source_id}/fulltext")
async def get_source_fulltext(notebook_id: str, source_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    source = _source_or_404(source_id, user_id)
    return {"text": source.get("fulltext", "")}


@router.get("/{notebook_id}/sources/{source_id}/guide")
async def get_source_guide(notebook_id: str, source_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    source = _source_or_404(source_id, user_id)
    guide = source.get("guide")
    if not guide:
        guide = await _build_source_guide(source.get("fulltext", ""), source["title"])
        update_source(source_id, user_id, {"guide": guide})
    return {"guide": guide}


@router.post("/{notebook_id}/sources/{source_id}/refresh")
async def refresh_source(notebook_id: str, source_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    source = _source_or_404(source_id, user_id)
    if source.get("type") not in {"url", "youtube", "drive"}:
        raise HTTPException(status_code=400, detail="This source type cannot be refreshed.")
    if source.get("url"):
        try:
            title, text = await _fetch_url(source["url"])
            update_source(source_id, user_id, {"title": title, "fulltext": text, "content": text, "refresh_state": "fresh"})
        except Exception as exc:
            update_source(source_id, user_id, {"refresh_state": "stale", "status": "error", "metadata": {"error": str(exc)}})
    return {"source": _source_payload(_source_or_404(source_id, user_id))}


@router.get("/{notebook_id}/sources/{source_id}/freshness")
async def source_freshness(notebook_id: str, source_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    source = _source_or_404(source_id, user_id)
    return {"status": source.get("refresh_state", "fresh")}


@router.get("/{notebook_id}/notes")
async def get_notes(notebook_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    return {"notes": list_notes(notebook_id, user_id)}


@router.post("/{notebook_id}/notes")
async def add_note(notebook_id: str, body: NoteCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    note = create_note(
        notebook_id,
        user_id,
        title=body.title,
        content=body.content,
        source_id=body.source_id,
        kind=body.kind,
    )
    return {"note": note}


@router.patch("/{notebook_id}/notes/{note_id}")
async def edit_note(notebook_id: str, note_id: str, body: NoteUpdate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    note = _note_or_404(note_id, user_id)
    updates = {}
    if body.title is not None:
        updates["title"] = body.title
    if body.content is not None:
        updates["content"] = body.content
    if body.kind is not None:
        updates["kind"] = body.kind
    updated = update_note(note_id, user_id, updates)
    return {"note": updated or note}


@router.delete("/{notebook_id}/notes/{note_id}")
async def remove_note(notebook_id: str, note_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    if not delete_note(note_id, user_id):
        raise HTTPException(status_code=404, detail="Note not found.")
    return {"message": "Note deleted."}


@router.post("/{notebook_id}/chat")
async def notebook_chat(
    notebook_id: str,
    body: ChatRequest,
    authorization: str = Header(...),
):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question is empty.")

    sources = list_sources(notebook_id, user_id)
    if body.source_ids:
        wanted = {sid for sid in body.source_ids}
        sources = [src for src in sources if src["id"] in wanted]

    # 1. Retrieve top passages across the (possibly filtered) source set.
    passages = notebook_retrieve(sources, question)

    # 2. Build the cited context block. Fall back to "everything we have"
    #    only when retrieval found nothing — usually means RAG is still
    #    indexing or sources have no fulltext yet.
    if passages:
        context = build_numbered_context(passages)
        cited_question = build_cited_question(question)
    else:
        context = "\n\n".join(
            f"{src['title']}:\n{src.get('fulltext', '')}"
            for src in sources
            if src.get("fulltext")
        )
        if not context.strip():
            context = _collect_corpus(notebook_id, user_id)
        cited_question = question

    if not context.strip():
        raise HTTPException(status_code=422, detail="Notebook has no readable sources.")

    answer = await answer_question(context, cited_question)

    # 3. Citation payload — rich when RAG succeeded, slim fallback otherwise.
    if passages:
        citations = to_citations(passages)
    else:
        citations = [
            {
                "index":     i + 1,
                "source_id": source["id"],
                "title":     source["title"],
                "type":      source["type"],
                "url":       source.get("url"),
                "excerpt":   (source.get("fulltext") or "")[:280],
                "score":     0.0,
            }
            for i, source in enumerate(sources)
            if source.get("fulltext")
        ]

    note = None
    if body.save_as_note:
        note = create_note(
            notebook_id,
            user_id,
            title=f"Answer: {question[:40]}",
            content=answer,
            kind="answer",
        )

    chat = None
    if body.chat_id:
        chat = get_chat(body.chat_id, user_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found.")
    elif body.save_as_note:
        chat = create_chat(notebook_id, user_id, f"Chat about {question[:40]}", body.source_ids)

    if chat:
        add_chat_turn(chat["id"], user_id, role="user", content=question, citations=[])
        add_chat_turn(chat["id"], user_id, role="assistant", content=answer, citations=citations)

    return {
        "question":  question,
        "answer":    answer,
        "citations": citations,
        "note":      note,
        "chat_id":   chat["id"] if chat else None,
    }


@router.post("/{notebook_id}/search")
async def notebook_search(
    notebook_id: str,
    body: SearchRequest,
    authorization: str = Header(...),
):
    """Retrieval-only preview — returns the top passages without calling the LLM.

    Used by the workspace UI for source filtering, "find in notebook" search,
    and previewing what the chat endpoint would see before spending tokens.
    """
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    query = (body.query or "").strip()
    if not query:
        raise HTTPException(status_code=422, detail="Search query is empty.")

    sources = list_sources(notebook_id, user_id)
    if body.source_ids:
        wanted = {sid for sid in body.source_ids}
        sources = [src for src in sources if src["id"] in wanted]

    passages = notebook_retrieve(sources, query, max_chunks=max(1, min(body.top_k, 20)))
    return {
        "query":       query,
        "results":     to_citations(passages),
        "source_count": len(sources),
    }


@router.get("/{notebook_id}/artifacts")
async def get_artifacts(notebook_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    return {"artifacts": list_artifacts(notebook_id, user_id)}


@router.get("/{notebook_id}/chats")
async def get_chats(notebook_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    return {"chats": list_chats(notebook_id, user_id)}


@router.post("/{notebook_id}/chats")
async def create_saved_chat(notebook_id: str, body: ChatCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    chat = create_chat(notebook_id, user_id, body.title, body.source_ids)
    return {"chat": chat}


@router.get("/{notebook_id}/chats/{chat_id}")
async def get_saved_chat(notebook_id: str, chat_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    chat = get_chat(chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return {"chat": chat, "turns": list_chat_turns(chat_id, user_id)}


@router.patch("/{notebook_id}/chats/{chat_id}")
async def rename_saved_chat(notebook_id: str, chat_id: str, body: ChatUpdate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    chat = rename_chat(chat_id, user_id, body.title)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return {"chat": chat}


@router.delete("/{notebook_id}/chats/{chat_id}")
async def delete_saved_chat(notebook_id: str, chat_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    if not delete_chat(chat_id, user_id):
        raise HTTPException(status_code=404, detail="Chat not found.")
    return {"message": "Chat deleted."}


@router.post("/{notebook_id}/duplicates/cleanup")
async def cleanup_sources(notebook_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    removed = cleanup_duplicate_sources(notebook_id, user_id)
    return {"removed": [_source_payload(item) for item in removed]}


async def _generate_artifact_content(
    notebook_id: str,
    user_id: str,
    artifact_type: str,
    prompt: str | None,
) -> tuple[str, str, str]:
    corpus = _collect_corpus(notebook_id, user_id)
    if not corpus.strip():
        raise HTTPException(status_code=422, detail="Notebook has no source text to build from.")

    title = prompt or artifact_type.replace("-", " ").title()
    if artifact_type in {"report", "study-guide", "summary"}:
        summary = await summarize_document(corpus[:14000])
        content = f"# {title}\n\n{summary}"
        return title, content, "markdown"

    if artifact_type == "audio":
        script = await generate_podcast_script(corpus[:14000])
        content = json.dumps(script, indent=2)
        return title, content, "json"

    if artifact_type in {"quiz", "flashcard"}:
        sentences = _sentence_list(corpus, limit=6)
        rows = []
        for idx, sentence in enumerate(sentences, 1):
            stem = sentence.rstrip(".")
            rows.append({
                "item": idx,
                "prompt": f"What is a key idea from sentence {idx}?",
                "answer": stem,
            })
        content = json.dumps(rows, indent=2)
        return title, content, "json"

    if artifact_type == "mind-map":
        data = {
            "title": title,
            "children": [
                {
                    "title": source["title"],
                    "children": [
                        {"title": item[:80]}
                        for item in _sentence_list(source.get("fulltext", ""), limit=4)
                    ],
                }
                for source in list_sources(notebook_id, user_id)
            ],
        }
        return title, json.dumps(data, indent=2), "json"

    if artifact_type == "data-table":
        rows = [
            {
                "title": source["title"],
                "type": source["type"],
                "status": source.get("status", "ready"),
                "created_at": source.get("created_at", ""),
            }
            for source in list_sources(notebook_id, user_id)
        ]
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=["title", "type", "status", "created_at"])
        writer.writeheader()
        writer.writerows(rows)
        return title, buf.getvalue(), "csv"

    if artifact_type == "slide-deck":
        slides = ["# " + title]
        for source in list_sources(notebook_id, user_id)[:8]:
            slides.append(f"## {source['title']}\n{source.get('fulltext', '')[:700]}")
        return title, "\n\n---\n\n".join(slides), "markdown"

    if artifact_type == "infographic":
        content = f"# {title}\n\n" + "\n".join(
            f"## {source['title']}\n- {source.get('fulltext', '')[:220]}"
            for source in list_sources(notebook_id, user_id)[:10]
        )
        return title, content, "markdown"

    if artifact_type == "video":
        outline = {
            "title": title,
            "scenes": [
                {"scene": idx + 1, "title": source["title"], "notes": source.get("fulltext", "")[:500]}
                for idx, source in enumerate(list_sources(notebook_id, user_id)[:8])
            ],
        }
        return title, json.dumps(outline, indent=2), "json"

    content = f"# {title}\n\n{await summarize_document(corpus[:14000])}"
    return title, content, "markdown"


@router.post("/{notebook_id}/artifacts/generate/{artifact_type}")
async def generate_artifact(
    notebook_id: str,
    artifact_type: str,
    body: ArtifactCreate,
    authorization: str = Header(...),
):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    title, content, fmt = await _generate_artifact_content(notebook_id, user_id, artifact_type, body.title or body.prompt)
    artifact = create_artifact(
        notebook_id,
        user_id,
        artifact_type=artifact_type,
        title=title,
        content=content,
        fmt=body.format or fmt,
        metadata={"prompt": body.prompt},
    )
    return {"artifact": artifact}


@router.get("/{notebook_id}/artifacts/{artifact_id}")
async def get_artifact_detail(notebook_id: str, artifact_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    return {"artifact": _artifact_or_404(artifact_id, user_id)}


@router.patch("/{notebook_id}/artifacts/{artifact_id}")
async def update_artifact_detail(
    notebook_id: str,
    artifact_id: str,
    body: ArtifactCreate,
    authorization: str = Header(...),
):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    artifact = update_artifact(
        artifact_id,
        user_id,
        {
            **({"title": body.title} if body.title is not None else {}),
            **({"content": body.prompt} if body.prompt is not None else {}),
            **({"format": body.format} if body.format is not None else {}),
        },
    )
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found.")
    return {"artifact": artifact}


@router.delete("/{notebook_id}/artifacts/{artifact_id}")
async def remove_artifact_detail(notebook_id: str, artifact_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    if not delete_artifact(artifact_id, user_id):
        raise HTTPException(status_code=404, detail="Artifact not found.")
    return {"message": "Artifact deleted."}


@router.get("/{notebook_id}/artifacts/{artifact_id}/download")
async def download_artifact(notebook_id: str, artifact_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    artifact = _artifact_or_404(artifact_id, user_id)
    content = artifact.get("content", "")
    fmt = artifact.get("format", "text")

    if artifact["type"] == "audio":
        script = json.loads(content or "[]")
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("script.json", json.dumps(script, indent=2))
            zf.writestr("README.txt", "Audio overview script. Pair this with the existing document podcast flow for audio export.")
        buf.seek(0)
        return Response(
            content=buf.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{artifact["title"]}.zip"'},
        )

    if fmt == "csv":
        media_type = "text/csv"
        ext = "csv"
    elif fmt == "json":
        media_type = "application/json"
        ext = "json"
    else:
        media_type = "text/markdown"
        ext = "md"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{artifact["title"]}.{ext}"'},
    )


@router.get("/{notebook_id}/sharing")
async def get_sharing_state(notebook_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    return get_sharing(notebook_id, user_id)


@router.post("/{notebook_id}/sharing")
async def update_sharing_state(notebook_id: str, body: SharingUpdate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    sharing = set_sharing(notebook_id, user_id, body.public, body.role)
    return sharing


@router.get("/{notebook_id}/research/{job_id}")
async def get_research_state(notebook_id: str, job_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    _require_local()
    _notebook_or_404(notebook_id, user_id)
    job = get_research_job(job_id, user_id)
    if not job:
        raise HTTPException(status_code=404, detail="Research job not found.")
    return job
