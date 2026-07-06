"""Counselor handoff decision helpers.

Kept outside api/chat.py so the logic is easy to unit-test without importing
FastAPI route dependencies.
"""
from __future__ import annotations

import re

from app.eval.types import Decision
from app.qeval.lead import counselor_tier


_CONFUSED_HANDOFF_REASONS = {
    "scope_unknown_history",
    "retrieval_below_threshold",
    "retrieval_below_threshold_partial",
    "grounding_below_threshold",
    "grounding_below_threshold_partial",
}

_ANSWER_HANDOFF_RE = re.compile(
    r"\b("
    r"prisma can walk|"
    r"real person|"
    r"human (?:counsell?or|help|advisor)|"
    r"talk to (?:a )?(?:human|person|counsell?or|advisor)|"
    r"connect with someone|"
    r"personal walkthrough|"
    r"walk through this with you"
    r")\b",
    re.IGNORECASE,
)


def counselor_offer_for_response(
    *,
    response_decision: Decision,
    response_answer: str | None,
    call_consent: bool,
    lead_score: int | None,
    response_reason: str | None = None,
) -> tuple[bool, str | None, str | None]:
    """Return (offer, reason, tier) for the frontend counselor card."""
    if call_consent:
        return False, None, None
    if response_decision == Decision.OUT_OF_SCOPE and response_answer:
        return True, "question", "strong"
    if response_decision == Decision.LOW_CONFIDENCE and response_answer:
        if response_reason in _CONFUSED_HANDOFF_REASONS:
            return True, "question", "strong"
    if response_answer and _ANSWER_HANDOFF_RE.search(response_answer):
        return True, "question", "strong"

    tier = counselor_tier(lead_score or 0)
    if not tier:
        return False, None, None
    return True, "qualified" if tier == "strong" else "question", tier
