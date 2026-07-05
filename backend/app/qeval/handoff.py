"""Counselor handoff decision helpers.

Kept outside api/chat.py so the logic is easy to unit-test without importing
FastAPI route dependencies.
"""
from __future__ import annotations

from app.eval.types import Decision
from app.qeval.lead import counselor_tier


def counselor_offer_for_response(
    *,
    response_decision: Decision,
    response_answer: str | None,
    call_consent: bool,
    lead_score: int | None,
) -> tuple[bool, str | None, str | None]:
    """Return (offer, reason, tier) for the frontend counselor card."""
    if call_consent:
        return False, None, None
    if response_decision == Decision.OUT_OF_SCOPE and response_answer:
        return True, "question", "strong"

    tier = counselor_tier(lead_score or 0)
    if not tier:
        return False, None, None
    return True, "qualified" if tier == "strong" else "question", tier

