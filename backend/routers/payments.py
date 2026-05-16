"""Paystack payments — initialize, verify, webhook."""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import secrets
from urllib.parse import urlparse

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field

from services.auth_utils import get_user_id
from services import paystack_client, payment_ledger, payment_validation, subscriptions

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])

ALLOWED_CHECKOUT_HOSTS = frozenset(
    {
        "checkout.paystack.com",
        "standard.paystack.com",
    }
)


class InitializePaymentBody(BaseModel):
    plan: str = Field(default="pro", pattern="^pro$")


def _frontend_url() -> str:
    return os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")


def _callback_url() -> str:
    return f"{_frontend_url()}/payment/callback"


def _assert_checkout_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_CHECKOUT_HOSTS:
        logger.error("Unexpected Paystack checkout URL host: %s", parsed.hostname)
        raise HTTPException(status_code=502, detail="Invalid payment redirect from provider.")
    return url


@router.get("/plans")
async def list_plans():
    return {
        "plans": [
            {
                "id": subscriptions.FREE_PLAN_ID,
                "name": "Free",
                "amount_ngn": 0,
                "amount_kobo": 0,
            },
            {
                "id": subscriptions.PRO_PLAN_ID,
                "name": "Pro",
                "amount_ngn": subscriptions.pro_amount_ngn(),
                "amount_kobo": subscriptions.pro_amount_kobo(),
                "interval": "monthly",
                "billing_period_days": subscriptions.PRO_BILLING_DAYS,
            },
        ]
    }


@router.get("/subscription")
async def get_my_subscription(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    return subscriptions.get_subscription(user_id)


@router.post("/initialize")
async def initialize_payment(
    body: InitializePaymentBody,
    authorization: str = Header(...),
):
    if not os.environ.get("PAYSTACK_SECRET_KEY", "").strip():
        raise HTTPException(
            status_code=503,
            detail="Payments are not configured. Add PAYSTACK_SECRET_KEY on the server.",
        )

    user_id = get_user_id(authorization)
    sub = subscriptions.get_subscription(user_id)
    if sub["plan"] == subscriptions.PRO_PLAN_ID and sub["status"] == "active":
        raise HTTPException(status_code=400, detail="You already have an active Pro subscription.")

    try:
        email = await subscriptions.get_user_email(user_id, authorization)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    reference = f"jp_{secrets.token_hex(12)}"
    amount_kobo = subscriptions.pro_amount_kobo()

    try:
        data = await paystack_client.initialize_transaction(
            email=email,
            amount_kobo=amount_kobo,
            callback_url=_callback_url(),
            metadata={
                "user_id": user_id,
                "plan": subscriptions.PRO_PLAN_ID,
                "product": "JackPal Pro",
            },
            reference=reference,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    paystack_ref = str(data.get("reference") or reference)
    payment_ledger.record_pending(
        reference=paystack_ref,
        user_id=user_id,
        plan=subscriptions.PRO_PLAN_ID,
        amount_kobo=amount_kobo,
    )

    return {
        "authorization_url": _assert_checkout_url(data["authorization_url"]),
        "reference": paystack_ref,
        "amount_ngn": subscriptions.pro_amount_ngn(),
    }


@router.get("/verify/{reference}")
async def verify_payment(reference: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)

    try:
        payment_ledger.validate_reference(reference)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payment reference.")

    owner = payment_ledger.get_processed_owner(reference)
    if owner:
        if owner != user_id:
            raise HTTPException(status_code=403, detail="Payment does not belong to this account.")
        sub = subscriptions.get_subscription(user_id)
        return {"status": "success", "already_processed": True, "subscription": sub}

    try:
        data = await paystack_client.verify_transaction(reference)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    try:
        payment_validation.validate_successful_charge(
            reference=reference,
            paystack_data=data,
            expected_user_id=user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        sub = subscriptions.activate_pro(user_id, reference=reference, paystack_data=data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    logger.info("Pro activated for user %s via reference %s", user_id, reference)
    return {"status": "success", "already_processed": False, "subscription": sub}


def _verify_paystack_signature(payload: bytes, signature: str | None) -> bool:
    secret = os.environ.get("PAYSTACK_SECRET_KEY", "").strip()
    if not secret or not signature:
        return False
    digest = hmac.new(secret.encode(), payload, hashlib.sha512).hexdigest()
    return hmac.compare_digest(digest, signature)


@router.post("/webhook")
async def paystack_webhook(request: Request):
    raw = await request.body()
    signature = request.headers.get("x-paystack-signature")

    if not _verify_paystack_signature(raw, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature.")

    try:
        event = json.loads(raw.decode())
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload.")

    event_type = event.get("event")
    data = event.get("data") or {}

    if event_type != "charge.success":
        return {"received": True}

    reference = str(data.get("reference") or "")
    if not reference:
        return {"received": True}

    try:
        payment_ledger.validate_reference(reference)
    except ValueError:
        logger.warning("Webhook ignored unknown reference format: %s", reference)
        return {"received": True}

    if payment_ledger.get_processed_owner(reference):
        return {"received": True}

    try:
        owner = payment_validation.resolve_owner(reference, data)
        payment_validation.validate_successful_charge(
            reference=reference,
            paystack_data=data,
            expected_user_id=owner,
        )
        subscriptions.activate_pro(owner, reference=reference, paystack_data=data)
        logger.info("Webhook activated Pro for user %s reference %s", owner, reference)
    except ValueError as e:
        logger.warning("Webhook charge.success not applied for %s: %s", reference, e)

    return {"received": True}
