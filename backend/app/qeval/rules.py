"""Deterministic qeval helpers — no LLM, no I/O.

Three public functions:
  prefilter(original)           → {is_spam, is_profanity}  — gates the request
  rough_length(text, history_len) → QLength                 — fallback length guess
  needs_llm(original, normalized) → bool                    — cost guard
"""
from __future__ import annotations

import re

from app.qeval.types import QLength

# ---------------------------------------------------------------------------
# Spam heuristics
# ---------------------------------------------------------------------------

_URL_RE = re.compile(r"https?://\S+")
_REPEAT_CHAR_RE = re.compile(r"(.)\1{4,}")  # same char 5+ times in a row


def _is_spam(text: str) -> bool:
    """Return True for obvious junk with no study-abroad content."""
    stripped = text.strip()
    if not stripped:
        return True
    alpha_count = sum(1 for c in stripped if c.isalpha())
    if alpha_count == 0:
        return True
    # Two or more URLs is almost always a spam flood.
    if len(_URL_RE.findall(stripped)) >= 2:
        return True
    # Repeated character runs (e.g. "aaaaaaa", "!!!!!!"), ignoring spaces.
    if _REPEAT_CHAR_RE.search(stripped.replace(" ", "")):
        return True
    # Very low alpha ratio (mostly symbols/numbers with little text).
    if len(stripped) > 8 and alpha_count / len(stripped) < 0.2:
        return True
    return False


# ---------------------------------------------------------------------------
# Prefilter — runs on the ORIGINAL message before normalization
# ---------------------------------------------------------------------------

def prefilter(original: str) -> dict:
    """Check original message for spam and profanity.

    Called before normalization so the normalizer cannot sanitize slurs away
    (preserving contract C3 from the chat-layer report).

    Returns {"is_spam": bool, "is_profanity": bool}.
    The caller (chat.py) decides which refusal template to use and returns early;
    the is_profanity check supersedes is_spam when both are true.
    """
    from app.eval.scope_check import classify_scope

    is_profanity = classify_scope(original) == "profanity"
    is_spam = _is_spam(original)
    return {"is_spam": is_spam, "is_profanity": is_profanity}


# ---------------------------------------------------------------------------
# Rough length — fallback used when the LLM verdict is unavailable
# ---------------------------------------------------------------------------

_YES_NO_RE = re.compile(
    r"^(yes|no|yeah|nope|yep|ok|okay|sure|nah|hmm|maybe)\s*[.!?]?$", re.I
)

_LONG_KEYWORDS = re.compile(
    r"\b(list|checklist|compare|everything|step[\s\-]by[\s\-]step|full\s+guide|overview|all\s+requirements|walk\s+me\s+through)\b",
    re.I,
)


def rough_length(text: str, history_len: int) -> QLength:
    """Fallback-only length guess. The LLM verdict takes priority over this."""
    words = text.strip().split()
    n = len(words)

    if _YES_NO_RE.match(text.strip()):
        return QLength.short
    if n <= 4:
        return QLength.short
    if _LONG_KEYWORDS.search(text) or n >= 35:
        return QLength.long
    return QLength.medium


# ---------------------------------------------------------------------------
# Cost guard — skip the Groq call when a rule verdict is obviously good enough
# ---------------------------------------------------------------------------

_GREETING_RE = re.compile(
    r"^(hello|hi|hey|namaste|namaskar|good\s+morning|good\s+evening|"
    r"thanks|thank\s+you|dhanyabad|sup|what\s*'?s\s+up)\s*[.!?]?$",
    re.I,
)


def needs_llm(original: str, normalized: str) -> bool:
    """Return False when a deterministic verdict is reliable enough (cost guard).

    The LLM is skipped for:
    - One-word messages (follow-ups, single tokens)
    - Greetings (hello, hi, namaste, …)
    - Yes/no acknowledgements
    """
    stripped = original.strip()
    if len(stripped.split()) <= 1:
        return False
    if _GREETING_RE.match(stripped):
        return False
    if _YES_NO_RE.match(stripped):
        return False
    return True
