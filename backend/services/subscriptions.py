"""User subscription / plan state (local JSON + Supabase user metadata)."""
from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

from services.auth_utils import is_local_mode
from services import payment_ledger

_ACTIVATION_LOCK = threading.Lock()

PRO_PLAN_ID = "pro"
FREE_PLAN_ID = "free"
PRO_BILLING_DAYS = 30

STORAGE_DIR = Path(__file__).parent.parent / "dev_storage"
STORAGE_DIR.mkdir(exist_ok=True)
SUBS_FILE = STORAGE_DIR / "subscriptions.json"


def pro_amount_kobo() -> int:
    return int(os.environ.get("PAYSTACK_PRO_AMOUNT_KOBO", "100000"))


def pro_amount_ngn() -> int:
    return pro_amount_kobo() // 100


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_dt(value: str | None) -> Optional[datetime]:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def _load_local_db() -> dict:
    if SUBS_FILE.exists():
        try:
            return json.loads(SUBS_FILE.read_text())
        except Exception:
            pass
    return {"users": {}}


def _save_local_db(db: dict) -> None:
    SUBS_FILE.write_text(json.dumps(db, indent=2))


def _local_record(user_id: str) -> dict:
    db = _load_local_db()
    users = db.setdefault("users", {})
    if user_id not in users:
        users[user_id] = {"plan": FREE_PLAN_ID, "plan_expires_at": None}
    return users[user_id]


def _supabase_admin():
    from services.supabase import get_supabase_admin

    return get_supabase_admin()


def _metadata_plan(meta: dict | None) -> tuple[str, Optional[datetime]]:
    if not meta:
        return FREE_PLAN_ID, None
    plan = (meta.get("plan") or FREE_PLAN_ID).lower()
    expires = _parse_dt(meta.get("plan_expires_at"))
    if plan == PRO_PLAN_ID and expires and expires <= _utc_now():
        return FREE_PLAN_ID, expires
    return plan, expires


async def get_user_email(user_id: str, authorization: str) -> str:
    if is_local_mode():
        from services.local_auth import get_user_from_token

        token = authorization.split(" ", 1)[1] if authorization.startswith("Bearer ") else ""
        user = get_user_from_token(token)
        if user and user.get("email") and user["email"] != "unknown":
            return user["email"]
        dev = os.environ.get("DEV_USER_EMAIL", "").strip()
        if dev:
            return dev
        raise ValueError("Could not resolve user email for payment.")

    admin = _supabase_admin()
    result = admin.auth.admin.get_user_by_id(user_id)
    email = result.user.email if result and result.user else None
    if not email:
        raise ValueError("User email not found.")
    return email


def get_subscription(user_id: str) -> dict[str, Any]:
    """Return normalized subscription payload for API responses."""
    if is_local_mode():
        rec = _local_record(user_id)
        plan, expires = _metadata_plan(rec)
    else:
        admin = _supabase_admin()
        result = admin.auth.admin.get_user_by_id(user_id)
        meta = (result.user.user_metadata or {}) if result and result.user else {}
        plan, expires = _metadata_plan(meta)

    active_pro = plan == PRO_PLAN_ID and expires and expires > _utc_now()
    status = "active" if active_pro else ("expired" if plan == PRO_PLAN_ID and expires else "none")

    return {
        "plan": PRO_PLAN_ID if active_pro else FREE_PLAN_ID,
        "status": status,
        "expires_at": expires.isoformat() if expires else None,
        "amount_ngn": pro_amount_ngn(),
        "amount_kobo": pro_amount_kobo(),
        "billing_period_days": PRO_BILLING_DAYS,
    }


def _extend_expiry(current: Optional[datetime], days: int) -> datetime:
    now = _utc_now()
    base = current if current and current > now else now
    return base + timedelta(days=days)


def activate_pro(user_id: str, *, reference: str, paystack_data: dict | None = None) -> dict[str, Any]:
    """Idempotently grant Pro after successful payment. Caller must validate Paystack data first."""
    payment_ledger.validate_reference(reference)

    with _ACTIVATION_LOCK:
        owner = payment_ledger.get_processed_owner(reference)
        if owner:
            if owner != user_id:
                raise ValueError("Payment does not belong to this account.")
            return get_subscription(user_id)

        if is_local_mode():
            db = _load_local_db()
            rec = _local_record(user_id)
            current_exp = _parse_dt(rec.get("plan_expires_at"))
            new_exp = _extend_expiry(current_exp, PRO_BILLING_DAYS)
            rec["plan"] = PRO_PLAN_ID
            rec["plan_expires_at"] = new_exp.isoformat()
            rec["last_payment_reference"] = reference
            db.setdefault("users", {})[user_id] = rec
            _save_local_db(db)
        else:
            admin = _supabase_admin()
            result = admin.auth.admin.get_user_by_id(user_id)
            if not result or not result.user:
                raise ValueError("User not found.")

            meta = dict(result.user.user_metadata or {})
            current_exp = _parse_dt(meta.get("plan_expires_at"))
            new_exp = _extend_expiry(current_exp, PRO_BILLING_DAYS)
            meta["plan"] = PRO_PLAN_ID
            meta["plan_expires_at"] = new_exp.isoformat()
            meta["last_payment_reference"] = reference
            if paystack_data:
                customer = paystack_data.get("customer") or {}
                if isinstance(customer, dict) and customer.get("customer_code"):
                    meta["paystack_customer_code"] = customer["customer_code"]

            admin.auth.admin.update_user_by_id(user_id, {"user_metadata": meta})

        amount_kobo = int((paystack_data or {}).get("amount") or pro_amount_kobo())
        paystack_id = (paystack_data or {}).get("id")
        if not payment_ledger.mark_processed(
            reference=reference,
            user_id=user_id,
            amount_kobo=amount_kobo,
            paystack_id=int(paystack_id) if paystack_id is not None else None,
        ):
            raise ValueError("Payment could not be finalized.")

        return get_subscription(user_id)


def is_reference_processed(reference: str) -> bool:
    try:
        return payment_ledger.get_processed_owner(reference) is not None
    except ValueError:
        return False
