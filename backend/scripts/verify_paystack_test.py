#!/usr/bin/env python3
"""Verify Paystack test keys and initialize a dummy checkout (no charge until you pay)."""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

# backend/
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")
load_dotenv(ROOT / ".env.local", override=True)

from services import paystack_client


def _check_key() -> None:
    key = os.environ.get("PAYSTACK_SECRET_KEY", "").strip()
    if not key:
        print("FAIL: PAYSTACK_SECRET_KEY is not set in .env or .env.local")
        sys.exit(1)
    if key.startswith("sk_test_"):
        print("OK: Using Paystack TEST secret key (sk_test_…)")
    elif key.startswith("sk_live_"):
        print("WARN: Using LIVE key (sk_live_…). Switch to sk_test_ for local testing.")
        sys.exit(1)
    else:
        print("FAIL: PAYSTACK_SECRET_KEY should start with sk_test_ or sk_live_")
        sys.exit(1)

    amount = os.environ.get("PAYSTACK_PRO_AMOUNT_KOBO", "100000")
    frontend = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    print(f"     Amount: {amount} kobo (₦{int(amount) // 100:,})")
    print(f"     Callback base: {frontend}/payment/callback")


async def _initialize_smoke() -> None:
    email = os.environ.get("PAYSTACK_TEST_EMAIL", "payments-test@example.com")
    amount = int(os.environ.get("PAYSTACK_PRO_AMOUNT_KOBO", "100000"))
    callback = f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')}/payment/callback"
    reference = f"jp_{os.urandom(12).hex()}"

    print(f"\nInitializing test transaction (email={email}, ref={reference})…")
    data = await paystack_client.initialize_transaction(
        email=email,
        amount_kobo=amount,
        callback_url=callback,
        metadata={"plan": "pro", "smoke_test": True},
        reference=reference,
    )
    url = data.get("authorization_url", "")
    if "checkout.paystack.com" not in url and "standard.paystack.com" not in url:
        print(f"FAIL: Unexpected checkout URL: {url}")
        sys.exit(1)
    print("OK: Paystack accepted initialize request.")
    print(f"     Reference: {data.get('reference')}")
    print(f"     Open in browser to complete test payment:\n     {url}")
    print(
        "\nTest card: 4084084084084081 | Exp: any future date | CVV: 408"
        "\nPIN: 0000 | OTP: 123456"
    )


def main() -> None:
    _check_key()
    asyncio.run(_initialize_smoke())


if __name__ == "__main__":
    main()
