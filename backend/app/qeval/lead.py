"""Lead qualification helpers.

Lead signals accumulate per-turn in the students table (not a separate events
table — per-turn detail is in chat_audit anyway).

is_qualified()    — threshold gate (pure function, easy to unit-test)
accumulate_lead() — increments counters + transitions status in-place on the
                    ORM model; the caller (chat.py _finalize) commits.
"""
from __future__ import annotations

from datetime import datetime

# Weighted score: strong=3, good=2, standard=1, none=0
LEAD_WEIGHTS: dict[str, int] = {"strong": 3, "good": 2, "standard": 1, "none": 0}


def is_qualified(strong: int, good: int, standard: int) -> bool:
    """Return True when the student clears the lead-qualification threshold.

    Thresholds (from plan spec; tune via config if traffic over/under-qualifies):
      2 strong  OR  3 good  OR  4 standard
    """
    return strong >= 2 or good >= 3 or standard >= 4


def accumulate_lead(student_model: object, lead_signal: str) -> None:
    """Increment lead counters and transition lead_status on student_model in-place.

    lead_signal: "none" | "standard" | "good" | "strong"
    Caller is responsible for the subsequent db.commit() (handled in _finalize).
    No-ops on "none" or missing signal — rules conservative floor, not an upgrade.
    """
    if not lead_signal or lead_signal == "none":
        return

    # --- Increment matching counter ---
    if lead_signal == "strong":
        student_model.lead_strong_count = (student_model.lead_strong_count or 0) + 1
    elif lead_signal == "good":
        student_model.lead_good_count = (student_model.lead_good_count or 0) + 1
    elif lead_signal == "standard":
        student_model.lead_standard_count = (student_model.lead_standard_count or 0) + 1
    # Unknown value: ignore (fail-open)

    # --- Recompute weighted score ---
    strong = student_model.lead_strong_count or 0
    good = student_model.lead_good_count or 0
    standard = student_model.lead_standard_count or 0
    student_model.lead_score = strong * 3 + good * 2 + standard * 1

    # --- Status transitions ---
    current = student_model.lead_status or "new"

    if current == "new":
        # First standard+ signal moves to engaged.
        student_model.lead_status = "engaged"
        current = "engaged"

    if current != "qualified" and is_qualified(strong, good, standard):
        student_model.lead_status = "qualified"
        # qualified_at stamped exactly once — never overwritten.
        if not student_model.qualified_at:
            student_model.qualified_at = datetime.utcnow()
