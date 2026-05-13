"""
Workspace smoke test — local mode only.

Run from backend/:
    python test_workspace.py
"""

import os

os.environ["SUPABASE_URL"] = ""

from fastapi.testclient import TestClient

from main import app
import routers.workspace as workspace_router
from services.local_auth import login, signup


async def _fake_summary(text: str) -> str:
    return f"Summary: {text[:120].strip()}"


async def _fake_answer(context: str, question: str) -> str:
    return f"Answering '{question}' from {len(context.split())} words of context."


async def _fake_script(text: str, mode: str = "standard") -> list[dict]:
    return [
        {"speaker": "Ezinne", "voice": "chinenye", "text": f"Opening the notebook in {mode} mode."},
        {"speaker": "Abeo", "voice": "jude", "text": f"Corpus size: {len(text.split())} words."},
        {"speaker": "Ezinne", "voice": "chinenye", "text": "That is enough for a notebook audio draft."},
    ]


workspace_router.summarize_document = _fake_summary
workspace_router.answer_question = _fake_answer
workspace_router.generate_podcast_script = _fake_script


def main():
    email = "workspace-smoke@example.com"
    password = "workspace-smoke-password"
    full_name = "Workspace Smoke"
    try:
        signup(email, password, full_name)
    except ValueError:
        pass
    token = login(email, password)["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    with TestClient(app) as client:
        created = client.post("/workspaces", json={"title": "Chemistry Revision"}, headers=headers)
        assert created.status_code == 200, created.text
        notebook = created.json()
        notebook_id = notebook["id"]

        text_source = client.post(
            f"/workspaces/{notebook_id}/sources/text",
            json={"title": "Lecture Notes", "content": "Photosynthesis converts light energy into chemical energy."},
            headers=headers,
        )
        assert text_source.status_code == 200, text_source.text

        file_source = client.post(
            f"/workspaces/{notebook_id}/sources/file",
            files={"file": ("rev.txt", b"Cells are the basic unit of life.", "text/plain")},
            headers=headers,
        )
        assert file_source.status_code == 200, file_source.text

        sources = client.get(f"/workspaces/{notebook_id}/sources", headers=headers)
        assert sources.status_code == 200, sources.text
        assert len(sources.json()["sources"]) >= 2

        note = client.post(
            f"/workspaces/{notebook_id}/notes",
            json={"title": "Revision note", "content": "Remember to revise chloroplasts.", "kind": "note"},
            headers=headers,
        )
        assert note.status_code == 200, note.text

        chat = client.post(
            f"/workspaces/{notebook_id}/chat",
            json={"question": "What does photosynthesis do?", "save_as_note": True, "source_ids": []},
            headers=headers,
        )
        assert chat.status_code == 200, chat.text
        assert "Answering" in chat.json()["answer"]

        saved_chat = client.post(
            f"/workspaces/{notebook_id}/chats",
            json={"title": "Biology Chat", "source_ids": [sources.json()["sources"][0]["id"]]},
            headers=headers,
        )
        assert saved_chat.status_code == 200, saved_chat.text
        chat_id = saved_chat.json()["chat"]["id"]

        chat_with_history = client.post(
            f"/workspaces/{notebook_id}/chat",
            json={
                "question": "Keep this as saved history?",
                "save_as_note": False,
                "source_ids": [],
                "chat_id": chat_id,
            },
            headers=headers,
        )
        assert chat_with_history.status_code == 200, chat_with_history.text

        chat_thread = client.get(
            f"/workspaces/{notebook_id}/chats/{chat_id}",
            headers=headers,
        )
        assert chat_thread.status_code == 200, chat_thread.text
        assert len(chat_thread.json()["turns"]) >= 2

        guide = client.get(
            f"/workspaces/{notebook_id}/sources/{sources.json()['sources'][0]['id']}/guide",
            headers=headers,
        )
        assert guide.status_code == 200, guide.text

        artifact = client.post(
            f"/workspaces/{notebook_id}/artifacts/generate/report",
            json={"title": "Study Report"},
            headers=headers,
        )
        assert artifact.status_code == 200, artifact.text
        artifact_id = artifact.json()["artifact"]["id"]

        download = client.get(
            f"/workspaces/{notebook_id}/artifacts/{artifact_id}/download",
            headers=headers,
        )
        assert download.status_code == 200, download.text

        audio_artifact = client.post(
            f"/workspaces/{notebook_id}/artifacts/generate/audio",
            json={"title": "Audio Overview"},
            headers=headers,
        )
        assert audio_artifact.status_code == 200, audio_artifact.text

        sharing = client.post(
            f"/workspaces/{notebook_id}/sharing",
            json={"public": True, "role": "editor"},
            headers=headers,
        )
        assert sharing.status_code == 200, sharing.text
        assert sharing.json()["public"] is True

        duplicates = client.post(
            f"/workspaces/{notebook_id}/duplicates/cleanup",
            headers=headers,
        )
        assert duplicates.status_code == 200, duplicates.text

        deleted = client.delete(f"/workspaces/{notebook_id}", headers=headers)
        assert deleted.status_code == 200, deleted.text

    print("[PASS] Workspace notebook/source/artifact smoke test")


if __name__ == "__main__":
    main()
