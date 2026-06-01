"""Question evaluator — returns a QuestionVerdict directive.

Phase 1 (qeval_use_llm=False): deterministic rules only.
Phase 3: Groq JSON call when needs_llm() is True and qeval_use_llm=True.

The evaluator assumes the caller (chat.py) has already run prefilter() and
returned early for spam/profanity — this function only handles in-scope messages.

Fail-open contract: any exception → rules verdict (source="rules"), no 500.
"""
from __future__ import annotations

import logging
from typing import TypeVar

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

_E = TypeVar("_E")


def _safe_enum(enum_cls: type[_E], value: object, default: _E) -> _E:
    """Coerce a raw string from the LLM into an enum, falling back to default."""
    try:
        return enum_cls(value)  # type: ignore[call-arg]
    except (ValueError, KeyError, TypeError):
        return default


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
    async def evaluate(
        self,
        original: str,
        normalized: str,
        history: ChatHistory,
    ) -> QuestionVerdict:
        """Classify the question and return a directive.

        Caller guarantees original is not spam/profanity (prefilter ran first).
        Fail-open: any exception returns rules verdict, never raises.
        """
        try:
            return await self._evaluate(original, normalized, history)
        except Exception as exc:
            log.warning("qeval.evaluate failed (%s: %s) — using safe default", type(exc).__name__, exc)
            return SAFE_DEFAULT_VERDICT

    async def _evaluate(
        self,
        original: str,
        normalized: str,
        history: ChatHistory,
    ) -> QuestionVerdict:
        from app.core.config import settings

        # Skip LLM entirely when feature-flagged off or not needed for this query.
        if not settings.qeval_use_llm or not qrules.needs_llm(original, normalized):
            return _rules_verdict(normalized, history)

        # Groq JSON call — cheap llama-3.1-8b-instant for classification only.
        # Failure falls back to rules so a Groq outage never inflates lead signals.
        from app.qeval.prompt import SYSTEM_PROMPT
        from app.rag.llm import default_llm

        try:
            raw = await default_llm.evaluate_question(
                system=SYSTEM_PROMPT,
                message=original,
                history=history,
            )
            fallback_length = qrules.rough_length(normalized, len(history))
            return QuestionVerdict(
                action=_safe_enum(QAction, raw.get("action"), QAction.answer),
                length=_safe_enum(QLength, raw.get("length"), fallback_length),
                is_spam=bool(raw.get("is_spam", False)),
                quality=_safe_enum(QQuality, raw.get("quality"), QQuality.standard),
                lead_signal=_safe_enum(QLeadSignal, raw.get("lead_signal"), QLeadSignal.standard),
                reason=str(raw.get("reason", "llm_verdict"))[:100],
                source="llm",
            )
        except Exception as exc:
            log.warning("qeval Groq call failed (%s: %s) — falling back to rules", type(exc).__name__, exc)
            try:
                from app.core.metrics import increment as metric_inc
                metric_inc("qeval_llm_failures")
            except Exception:
                pass
            return _rules_verdict(normalized, history)


# Single instance — swap this line to change evaluator app-wide.
default_question_evaluator = QuestionEvaluator()
