"""Lead qualification helpers.

Lead signals accumulate per-turn in the students table (not a separate events
table — per-turn detail is in chat_audit anyway).

accumulate_lead() — awards points and transitions status in-place on the ORM
                    model; the caller (chat.py _finalize / signal endpoint) commits.
signal_points()   — pure function mapping (lead_signal, source) → raw points.
counselor_tier()  — maps a score to the counselor card variant to show.
"""
from __future__ import annotations

from datetime import datetime

SCORE_CEILING = 100

# Typed questions: Groq-classified signal → points
SIGNAL_WEIGHTS: dict[str, int] = {"strong": 6, "good": 4, "standard": 2, "none": 0}

# Non-typed sources: fixed points regardless of Groq classification
SOURCE_WEIGHTS: dict[str, int] = {
    "suggestion": 1,
    "category": 1,   # launcher category card clicks — same weight as suggestion
    "todo": 3,
    "universities": 3,
}

# Document upload: doc_type → points (once per doc type)
DOC_UPLOAD_WEIGHTS: dict[str, int] = {
    "sop": 8,
    "financial": 8,
    "passport": 5,
    "grade_sheet": 5,
    # everything else: 3 (see signal_points_for_doc)
}

# Non-chat event → points
EVENT_WEIGHTS: dict[str, int] = {
    "universities_visit": 2,
    "profile_update": 2,
    "return_visit": 2,
    "doc_panel_open": 1,
    "university_card_click": 1,
}


def signal_points(lead_signal: str, source: str | None = None) -> int:
    """Return points for a chat turn.

    For non-typed sources (suggestion / todo / universities), the source
    determines the flat award; Groq classification is skipped entirely.
    For typed turns (source=None or "typed"), the Groq lead_signal drives points.
    """
    if source and source in SOURCE_WEIGHTS:
        return SOURCE_WEIGHTS[source]
    return SIGNAL_WEIGHTS.get(lead_signal, 0)


def signal_points_for_doc(doc_type: str) -> int:
    return DOC_UPLOAD_WEIGHTS.get(doc_type, 3)


def counselor_tier(score: int) -> str | None:
    """Return which counselor card variant to offer, or None if score too low."""
    if score >= 40:
        return "strong"
    if score >= 30:
        return "medium"
    if score >= 20:
        return "soft"
    return None


def accumulate_lead(
    student_model: object,
    lead_signal: str,
    source: str | None = None,
    extra_points: int = 0,
) -> int:
    """Award points and transition lead_status in-place. Returns points awarded.

    Caller is responsible for the subsequent db.commit() (handled in _finalize).
    """
    points = signal_points(lead_signal, source) + extra_points
    if points <= 0:
        return 0

    # Keep count columns for analytics (signal quality distribution).
    if lead_signal == "strong":
        student_model.lead_strong_count = (student_model.lead_strong_count or 0) + 1
    elif lead_signal == "good":
        student_model.lead_good_count = (student_model.lead_good_count or 0) + 1
    elif lead_signal == "standard":
        student_model.lead_standard_count = (student_model.lead_standard_count or 0) + 1

    # Apply score with ceiling.
    old_score = student_model.lead_score or 0
    new_score = min(old_score + points, SCORE_CEILING)
    student_model.lead_score = new_score

    # Status transitions (score-based, never go backwards).
    current = student_model.lead_status or "new"
    if current == "new" and new_score >= 1:
        student_model.lead_status = "engaged"
        current = "engaged"
    if current != "qualified" and new_score >= 20:
        student_model.lead_status = "qualified"
        if not student_model.qualified_at:
            student_model.qualified_at = datetime.utcnow()

    return points


def accumulate_lead_points(student_model: object, points: int) -> int:
    """Direct-point variant — used by the signal endpoint for non-chat events."""
    if points <= 0:
        return 0
    old_score = student_model.lead_score or 0
    new_score = min(old_score + points, SCORE_CEILING)
    student_model.lead_score = new_score
    current = student_model.lead_status or "new"
    if current == "new" and new_score >= 1:
        student_model.lead_status = "engaged"
        current = "engaged"
    if current != "qualified" and new_score >= 20:
        student_model.lead_status = "qualified"
        if not student_model.qualified_at:
            student_model.qualified_at = datetime.utcnow()
    return points
