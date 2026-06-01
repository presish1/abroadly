"""Fallback behaviour when the Groq evaluate_question call fails.

Tests that:
  - evaluate() always returns a verdict (never raises)
  - When evaluate_question raises, source=="rules" and action/length are sane
  - When evaluate_question returns bad JSON values, enum coercion falls back cleanly
  - When qeval_use_llm=False, Groq is never called
"""
import pytest
from unittest.mock import AsyncMock, patch

from app.qeval.evaluator import QuestionEvaluator
from app.qeval.types import QAction, QLength, QLeadSignal, QQuality


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _eval(original: str, normalized: str | None = None, history=None, use_llm: bool = True):
    """Run evaluator with controlled qeval_use_llm."""
    evaluator = QuestionEvaluator()
    with patch("app.core.config.settings.qeval_use_llm", use_llm):
        return await evaluator.evaluate(
            original=original,
            normalized=normalized or original,
            history=history or [],
        )


# ---------------------------------------------------------------------------
# Groq raises → rules fallback
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_groq_failure_returns_rules_verdict():
    """evaluate_question raising must fall back to rules, source='rules', no exception."""
    with patch("app.core.config.settings.qeval_use_llm", True):
        with patch(
            "app.rag.llm.default_llm.evaluate_question",
            new_callable=AsyncMock,
            side_effect=RuntimeError("groq_down"),
        ):
            evaluator = QuestionEvaluator()
            verdict = await evaluator.evaluate(
                original="What IELTS score do I need for Canada?",
                normalized="What IELTS score do I need for Canada?",
                history=[],
            )
    assert verdict.source == "rules"
    assert verdict.action == QAction.answer
    assert not verdict.is_spam


@pytest.mark.asyncio
async def test_groq_failure_no_exception_raised():
    """evaluate() must never propagate the Groq exception."""
    with patch("app.core.config.settings.qeval_use_llm", True):
        with patch(
            "app.rag.llm.default_llm.evaluate_question",
            new_callable=AsyncMock,
            side_effect=ConnectionError("network_error"),
        ):
            evaluator = QuestionEvaluator()
            # Must not raise
            verdict = await evaluator.evaluate("hello", "hello", [])
    assert verdict is not None


# ---------------------------------------------------------------------------
# qeval_use_llm=False → Groq never called
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_use_llm_false_skips_groq():
    mock_fn = AsyncMock(return_value={"action": "answer", "length": "medium",
                                      "is_spam": False, "quality": "standard",
                                      "lead_signal": "standard", "reason": "test"})
    with patch("app.rag.llm.default_llm.evaluate_question", mock_fn):
        verdict = await _eval("What IELTS score for UK?", use_llm=False)

    mock_fn.assert_not_called()
    assert verdict.source == "rules"


# ---------------------------------------------------------------------------
# Rules path — correct length/lead_signal for clear-cut cases
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_rules_path_short_for_yes_no():
    verdict = await _eval("yes", use_llm=False)
    assert verdict.length == QLength.short
    assert verdict.source == "rules"


@pytest.mark.asyncio
async def test_rules_path_long_for_checklist():
    verdict = await _eval("Give me a full checklist for UK student visa", use_llm=False)
    assert verdict.length == QLength.long


@pytest.mark.asyncio
async def test_rules_path_lead_signal_is_standard():
    """Rules-only path always uses standard floor, never inflates to good/strong."""
    verdict = await _eval("What IELTS band do I need for Canada undergrad?", use_llm=False)
    assert verdict.lead_signal == QLeadSignal.standard


# ---------------------------------------------------------------------------
# Groq returns malformed JSON → safe enum coercion
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_bad_enum_values_coerce_to_defaults():
    """Unrecognised enum values from LLM coerce to sane defaults without crashing."""
    bad_response = {
        "action": "INVALID_ACTION",
        "length": "INVALID_LENGTH",
        "is_spam": False,
        "quality": "INVALID_QUALITY",
        "lead_signal": "INVALID_SIGNAL",
        "reason": "test",
    }
    with patch("app.core.config.settings.qeval_use_llm", True):
        with patch(
            "app.rag.llm.default_llm.evaluate_question",
            new_callable=AsyncMock,
            return_value=bad_response,
        ):
            with patch("app.qeval.rules.needs_llm", return_value=True):
                evaluator = QuestionEvaluator()
                verdict = await evaluator.evaluate(
                    original="What documents for UK visa?",
                    normalized="What documents for UK visa?",
                    history=[],
                )
    # Bad enum values → fell back to defaults; no crash
    assert verdict.action == QAction.answer
    assert verdict.length in list(QLength)
    assert verdict.quality == QQuality.standard
    assert verdict.lead_signal == QLeadSignal.standard
