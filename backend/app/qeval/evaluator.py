"""Question evaluator — returns a QuestionVerdict directive.

Phase 1 (qeval_use_llm=False): deterministic rules only.
Phase 3 adds: Groq JSON call when needs_llm() is True and qeval_use_llm=True.

The evaluator assumes the caller (chat.py) has already run prefilter() and
returned early for spam/profanity — this function only handles in-scope messages.

Fail-open contract: any exception → SAFE_DEFAULT_VERDICT, no 500.
"""
from __future__ import annotations

import logging

from app.qeval import rules as qrules
from app.qeval.types import (
    QAction,
    QLeadSignal,
    QLength,
    QQuality,
    QuestionVerdict,
    SAFE_DEFAULT_VERDICT,
)

log = logging.getLogger("abroadly.qeval")

ChatHistory = list[dict]


def _rules_verdict(normalized: str, history: ChatHistory) -> QuestionVerdict:
    """Build a rules-only verdict. Used when LLM is disabled or unavailable."""
    length = qrules.rough_length(normalized, len(history))
    return QuestionVerdict(
        action=QAction.answer,
        length=length,
        is_spam=False,
        quality=QQuality.standard,
        # Conservative floor: rules never inflate a lead signal.
        # The LLM is the primary source of good/strong signals.
        lead_signal=QLeadSignal.standard,
        reason="rules_verdict",
        source="rules",
    )


class QuestionEvaluator:
    def evaluate(
        self,
        original: str,
        normalized: str,
        history: ChatHistory,
    ) -> QuestionVerdict:
        """Classify the question and return a directive.

        Caller guarantees original is not spam/profanity (prefilter ran first).
        """
        try:
            return self._evaluate(original, normalized, history)
        except Exception as exc:
            log.warning("qeval.evaluate failed (%s: %s) — using safe default", type(exc).__name__, exc)
            return SAFE_DEFAULT_VERDICT

    def _evaluate(
        self,
        original: str,
        normalized: str,
        history: ChatHistory,
    ) -> QuestionVerdict:
        from app.core.config import settings

        # Skip LLM entirely when feature-flagged off or not needed.
        if not settings.qeval_use_llm or not qrules.needs_llm(original, normalized):
            return _rules_verdict(normalized, history)

        # --- Phase 3 seam: Groq JSON call ---
        # When qeval_use_llm=True and needs_llm() is True, call Groq here.
        # For now fall through to rules (Phase 3 implements this block).
        return _rules_verdict(normalized, history)


# Single instance — swap this line to change evaluator app-wide.
default_question_evaluator = QuestionEvaluator()
