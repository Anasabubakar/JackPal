"""Shared Paystack transaction validation before granting Pro."""
from __future__ import annotations

from typing import Any

from services import payment_ledger, subscriptions


def resolve_owner(reference: str, paystack_data: dict[str, Any]) -> str:
    """
    Determine which user owns this payment.
    Prefer our pending ledger (set at initialize); fall back to Paystack metadata.
    """
    payment_ledger.validate_reference(reference)

    pending = payment_ledger.get_pending(reference)
    if pending and pending.get("user_id"):
        return str(pending["user_id"])

    meta = paystack_data.get("metadata") or {}
    meta_user_id = str(meta.get("user_id") or "").strip()
    if meta_user_id:
        return meta_user_id

    processed_owner = payment_ledger.get_processed_owner(reference)
    if processed_owner:
        return processed_owner

    raise ValueError("Cannot identify payment owner.")


def validate_successful_charge(
    *,
    reference: str,
    paystack_data: dict[str, Any],
    expected_user_id: str,
    expected_amount_kobo: int | None = None,
) -> None:
    """Raise ValueError if transaction must not grant Pro."""
    payment_ledger.validate_reference(reference)

    if paystack_data.get("status") != "success":
        raise ValueError("Payment was not successful.")

    currency = str(paystack_data.get("currency") or "").upper()
    if currency and currency != "NGN":
        raise ValueError("Unsupported payment currency.")

    amount = int(paystack_data.get("amount") or 0)
    required = expected_amount_kobo if expected_amount_kobo is not None else subscriptions.pro_amount_kobo()
    if amount < required:
        raise ValueError("Payment amount mismatch.")

    owner = resolve_owner(reference, paystack_data)
    if owner != expected_user_id:
        raise ValueError("Payment does not belong to this account.")

    payment_ledger.assert_reference_owner(reference, expected_user_id)
