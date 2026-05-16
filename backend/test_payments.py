"""
Payment security tests — run: python test_payments.py
No Paystack API calls; exercises ledger + validation only.
"""
from __future__ import annotations

import os
import tempfile
from pathlib import Path

# Point ledger at temp file before imports
_tmp = tempfile.NamedTemporaryFile(suffix=".json", delete=False)
_tmp.close()
os.environ["PAYSTACK_PRO_AMOUNT_KOBO"] = "100000"

import services.payment_ledger as ledger  # noqa: E402
import services.payment_validation as validation  # noqa: E402

ledger.LEDGER_FILE = Path(_tmp.name)


def test_reference_format():
    ledger.validate_reference("jp_" + "a" * 24)
    try:
        ledger.validate_reference("evil_ref")
        raise AssertionError("expected invalid reference")
    except ValueError:
        pass
    print("[PASS] reference format validation")


def test_pending_and_processed_owner():
    ref = "jp_" + "b" * 24
    ledger.record_pending(reference=ref, user_id="user-a", plan="pro", amount_kobo=100000)
    pending = ledger.get_pending(ref)
    assert pending["user_id"] == "user-a"

    assert ledger.mark_processed(reference=ref, user_id="user-a", amount_kobo=100000)
    assert ledger.get_processed_owner(ref) == "user-a"
    assert ledger.get_pending(ref) is None

    try:
        ledger.assert_reference_owner(ref, "user-b")
        raise AssertionError("expected owner mismatch")
    except ValueError:
        pass
    print("[PASS] pending + processed ownership")


def test_validate_successful_charge():
    ref = "jp_" + "c" * 24
    ledger.record_pending(reference=ref, user_id="user-c", plan="pro", amount_kobo=100000)
    data = {
        "status": "success",
        "currency": "NGN",
        "amount": 100000,
        "metadata": {"user_id": "user-c"},
    }
    validation.validate_successful_charge(
        reference=ref,
        paystack_data=data,
        expected_user_id="user-c",
    )
    try:
        validation.validate_successful_charge(
            reference=ref,
            paystack_data=data,
            expected_user_id="user-other",
        )
        raise AssertionError("expected user mismatch")
    except ValueError:
        pass
    print("[PASS] charge validation + user binding")


def test_underpayment_rejected():
    ref = "jp_" + "d" * 24
    ledger.record_pending(reference=ref, user_id="user-d", plan="pro", amount_kobo=100000)
    data = {
        "status": "success",
        "currency": "NGN",
        "amount": 50000,
        "metadata": {"user_id": "user-d"},
    }
    try:
        validation.validate_successful_charge(
            reference=ref,
            paystack_data=data,
            expected_user_id="user-d",
        )
        raise AssertionError("expected underpayment rejection")
    except ValueError as e:
        assert "amount" in str(e).lower()
    print("[PASS] underpayment rejected")


def main():
    print("\n=== JackPal Payment Security Tests ===\n")
    test_reference_format()
    test_pending_and_processed_owner()
    test_validate_successful_charge()
    test_underpayment_rejected()
    print("\n=== All payment security tests passed ===\n")
    Path(_tmp.name).unlink(missing_ok=True)


if __name__ == "__main__":
    main()
