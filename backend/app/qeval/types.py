"""qeval type definitions — QuestionVerdict dataclass + enums."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class QAction(str, Enum):
    answer = "answer"
    clarify = "clarify"
    ignore = "ignore"


class QLength(str, Enum):
    short = "short"
    medium = "medium"
    long = "long"


class QQuality(str, Enum):
    spam = "spam"
    low = "low"
    standard = "standard"
    good = "good"
    strong = "strong"


class QLeadSignal(str, Enum):
    none = "none"
    standard = "standard"
    good = "good"
    strong = "strong"


@dataclass
class QuestionVerdict:
    action: QAction
    length: QLength
    is_spam: bool
    quality: QQuality
    lead_signal: QLeadSignal
    reason: str
    source: str  # "rules" | "llm"


# Returned on any unexpected evaluator error — always lets the request through.
SAFE_DEFAULT_VERDICT = QuestionVerdict(
    action=QAction.answer,
    length=QLength.medium,
    is_spam=False,
    quality=QQuality.standard,
    lead_signal=QLeadSignal.standard,
    reason="safe_default",
    source="rules",
)
