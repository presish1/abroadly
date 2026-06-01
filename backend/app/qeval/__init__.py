"""Question Evaluation Layer — classifies each message and emits a response
directive (length bucket, action, spam/quality, lead signal) that is injected
into the generation prompt so Gemini writes the right-sized answer the first time.

Mirrors backend/app/eval/ conventions; kept separate so the existing
rule-based retrieval/grounding evaluator is not affected.
"""
from app.qeval.evaluator import default_question_evaluator
from app.qeval.types import QuestionVerdict, QAction, QLength, QQuality, QLeadSignal

__all__ = [
    "default_question_evaluator",
    "QuestionVerdict",
    "QAction",
    "QLength",
    "QQuality",
    "QLeadSignal",
]
