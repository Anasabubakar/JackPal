"""Paystack API client — initialize and verify transactions."""
from __future__ import annotations

import os
from typing import Any

import httpx

PAYSTACK_BASE = "https://api.paystack.co"

DEFAULT_CHANNELS = ("card", "bank", "ussd")


def normalize_metadata(metadata: dict[str, Any]) -> dict[str, str]:
    """Paystack hosted checkout expects flat string metadata only."""
    out: dict[str, str] = {}
    for key, value in metadata.items():
        if value is None or isinstance(value, (dict, list)):
            continue
        out[str(key)] = str(value)
    return out


def checkout_channels() -> list[str]:
    raw = os.environ.get("PAYSTACK_CHECKOUT_CHANNELS", "").strip()
    if not raw:
        return list(DEFAULT_CHANNELS)
    channels = [c.strip() for c in raw.split(",") if c.strip()]
    return channels or list(DEFAULT_CHANNELS)


def _secret_key() -> str:
    key = os.environ.get("PAYSTACK_SECRET_KEY", "").strip()
    if not key:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured.")
    return key


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_secret_key()}",
        "Content-Type": "application/json",
    }


async def initialize_transaction(
    *,
    email: str,
    amount_kobo: int,
    callback_url: str,
    metadata: dict[str, Any],
    reference: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "email": email.strip(),
        "amount": int(amount_kobo),
        "currency": "NGN",
        "callback_url": callback_url,
        "metadata": normalize_metadata(metadata),
        "channels": checkout_channels(),
    }
    if reference:
        payload["reference"] = reference

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{PAYSTACK_BASE}/transaction/initialize",
            headers=_headers(),
            json=payload,
        )
    body = res.json()
    if not res.is_success or not body.get("status"):
        message = body.get("message") or "Paystack initialize failed."
        raise RuntimeError(message)
    data = body.get("data") or {}
    if not data.get("authorization_url") or not data.get("reference"):
        raise RuntimeError("Paystack returned an incomplete initialize response.")
    return data


async def verify_transaction(reference: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{PAYSTACK_BASE}/transaction/verify/{reference}",
            headers=_headers(),
        )
    body = res.json()
    if not res.is_success or not body.get("status"):
        message = body.get("message") or "Paystack verify failed."
        raise RuntimeError(message)
    return body["data"]
