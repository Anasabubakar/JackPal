"""
Payment ledger — pending checkouts and processed references.

All Paystack activations must be traceable to a reference we created at initialize
time, with the owning user_id recorded before redirecting to Paystack.
"""
from __future__ import annotations

import json
import re
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

_LEDGER_LOCK = threading.Lock()
STORAGE_DIR = Path(__file__).parent.parent / "dev_storage"
STORAGE_DIR.mkdir(exist_ok=True)
LEDGER_FILE = STORAGE_DIR / "payment_ledger.json"

REFERENCE_PATTERN = re.compile(r"^jp_[a-f0-9]{24}$")
PENDING_TTL = timedelta(hours=48)


def validate_reference(reference: str) -> None:
    if not reference or not REFERENCE_PATTERN.match(reference):
        raise ValueError("Invalid payment reference.")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _load() -> dict:
    if LEDGER_FILE.exists():
        try:
            return json.loads(LEDGER_FILE.read_text())
        except Exception:
            pass
    return {"pending": {}, "processed": {}}


def _save(db: dict) -> None:
    LEDGER_FILE.write_text(json.dumps(db, indent=2))


def record_pending(*, reference: str, user_id: str, plan: str, amount_kobo: int) -> None:
    validate_reference(reference)
    with _LEDGER_LOCK:
        db = _load()
        db.setdefault("pending", {})[reference] = {
            "user_id": user_id,
            "plan": plan,
            "amount_kobo": amount_kobo,
            "created_at": _utc_now().isoformat(),
        }
        _save(db)


def get_pending(reference: str) -> Optional[dict[str, Any]]:
    validate_reference(reference)
    pending = _load().get("pending", {}).get(reference)
    if not pending:
        return None
    created = pending.get("created_at")
    if created:
        try:
            created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            if created_dt.tzinfo is None:
                created_dt = created_dt.replace(tzinfo=timezone.utc)
            if _utc_now() - created_dt > PENDING_TTL:
                return None
        except ValueError:
            return None
    return pending


def get_processed_owner(reference: str) -> Optional[str]:
    validate_reference(reference)
    rec = _load().get("processed", {}).get(reference)
    if not rec:
        return None
    return str(rec.get("user_id") or "") or None


def mark_processed(
    *,
    reference: str,
    user_id: str,
    amount_kobo: int,
    paystack_id: int | None = None,
) -> bool:
    """
    Mark reference processed atomically. Returns False if already owned by another user.
    """
    validate_reference(reference)
    with _LEDGER_LOCK:
        db = _load()
        processed = db.setdefault("processed", {})
        existing = processed.get(reference)
        if existing:
            return str(existing.get("user_id")) == user_id

        processed[reference] = {
            "user_id": user_id,
            "amount_kobo": amount_kobo,
            "paystack_id": paystack_id,
            "at": _utc_now().isoformat(),
        }
        db.get("pending", {}).pop(reference, None)
        _save(db)
        return True


def assert_reference_owner(reference: str, user_id: str) -> None:
    """Raise ValueError if reference is tied to a different user."""
    owner = get_processed_owner(reference)
    if owner and owner != user_id:
        raise ValueError("Payment does not belong to this account.")

    pending = get_pending(reference)
    if pending and str(pending.get("user_id")) != user_id:
        raise ValueError("Payment does not belong to this account.")
