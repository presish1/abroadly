"""The Normalizer — pure function from raw student query to clean English.

Sits BEFORE retrieve in the chat pipeline. The default implementation
delegates to the LLM provider's `normalize()` method (vendor SDK isolation:
all Groq/Gemini imports live in app.rag.llm).

Failure mode: any exception falls through with `original` unchanged. A
normalizer hiccup must never break a chat request — we'd rather miss the
translation than serve a 500.
"""
from __future__ import annotations

import re
from difflib import SequenceMatcher
from pathlib import Path
from typing import Protocol

from app.normalizer.cache import cache
from app.normalizer.types import NormalizationResult
from app.rag.llm import default_llm

_PROMPT_PATH = Path(__file__).parent / "prompt.md"

# Fast-path: skip the LLM normalize round-trip when the query is already plain
# English (saves ~1s/reply). Romanized-Nepali/Hinglish still goes through the LLM.
_EN_STOPWORDS = {
    "the", "what", "how", "do", "does", "i", "you", "is", "are", "a", "an", "for",
    "need", "can", "my", "to", "in", "of", "and", "with", "should", "which", "when",
    "where", "tell", "me", "about", "study", "visa", "university", "cost", "want",
    "after", "before", "get", "there", "best", "good", "help",
    "hello", "hi", "hey", "thanks", "yes", "ok", "okay", "namaste",
}
_NEPALI_MARKERS = {
    "cha", "chha", "chaina", "ma", "ko", "le", "lai", "garne", "garna", "kun",
    "mero", "hamro", "painxa", "paincha", "painxa", "huncha", "hunxa", "hunchha",
    "kasari", "bhayo", "xa", "thiyo", "mildena", "milxa", "leko", "sodhe", "ho",
    "hola", "aba", "kati", "kaha", "ramro", "padhna", "padna", "jane", "bidesh",
    "wala", "tyo", "yo", "malai", "timi", "tapai",
}
_STUDY_TERMS = {
    "scholarship", "scholarships", "grant", "grants", "funding", "bursary", "bursaries",
    "university", "universities", "college", "colleges", "admission", "admissions",
    "application", "applications", "visa", "documents", "document", "transcript",
    "passport", "sop", "ielts", "pte", "toefl", "duolingo", "psychology",
    "engineering", "nursing", "business", "management", "computer", "science",
    "australia", "canada", "uk", "usa", "germany", "japan", "korea",
}
_TERM_CANONICALS = {
    "scholarship": "scholarship",
    "scholarships": "scholarships",
    "university": "university",
    "universities": "universities",
    "psychology": "psychology",
    "admission": "admission",
    "admissions": "admissions",
    "application": "application",
    "applications": "applications",
    "documents": "documents",
    "document": "document",
    "transcript": "transcript",
    "passport": "passport",
    "visa": "visa",
    "IELTS": "IELTS",
    "PTE": "PTE",
    "TOEFL": "TOEFL",
    "Duolingo": "Duolingo",
}
_COMMON_STUDY_TYPOS = {
    "scholarshp": "scholarship",
    "scholarshps": "scholarships",
    "scholorship": "scholarship",
    "scholorships": "scholarships",
    "schlarship": "scholarship",
    "schlarships": "scholarships",
    "univeristy": "university",
    "univeristies": "universities",
    "unversity": "university",
    "unversities": "universities",
    "psycology": "psychology",
    "psychlogy": "psychology",
    "ielst": "IELTS",
    "iltes": "IELTS",
    "tofel": "TOEFL",
}


def _best_study_term(token: str) -> str | None:
    lower = token.lower()
    if lower in _COMMON_STUDY_TYPOS:
        return _COMMON_STUDY_TYPOS[lower]
    if lower in _STUDY_TERMS:
        return None
    if len(lower) < 5:
        return None

    best_term = ""
    best_score = 0.0
    for term in _STUDY_TERMS:
        if abs(len(term) - len(lower)) > 2:
            continue
        score = SequenceMatcher(None, lower, term).ratio()
        if score > best_score:
            best_term = term
            best_score = score
    if best_score >= 0.86:
        return _TERM_CANONICALS.get(best_term, best_term)
    return None


def _correct_study_typos(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        token = match.group(0)
        correction = _best_study_term(token)
        return correction if correction else token

    return re.sub(r"\b[A-Za-z][A-Za-z']*\b", repl, text)


def _looks_english(text: str) -> bool:
    toks = re.findall(r"[a-z']+", text.lower())
    if not toks:
        return False
    if any(t in _NEPALI_MARKERS for t in toks):
        return False
    if any(t in _STUDY_TERMS for t in toks):
        return True
    en = sum(1 for t in toks if t in _EN_STOPWORDS)
    return en >= 2 or (len(toks) <= 4 and en >= 1)


def _load_system_prompt() -> str:
    try:
        return _PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        # Minimal inline fallback so chat keeps working if the file is missing
        return (
            "Translate Nepali- or Hindi-romanized study-abroad questions to "
            "clean English. If already English, return unchanged. Output the "
            "translation only, no quotes."
        )


class Normalizer(Protocol):
    async def normalize(self, query: str) -> NormalizationResult: ...


class LLMNormalizer:
    """Default normalizer — Gemini Flash via the rag.llm provider abstraction."""

    def __init__(self) -> None:
        self._system_prompt = _load_system_prompt()

    async def normalize(self, query: str) -> NormalizationResult:
        original = query.strip()
        if not original:
            return NormalizationResult(original=query, normalized=query, was_changed=False, source="fallback")

        typo_corrected = _correct_study_typos(original)

        # Fast-path: already-English queries don't need the LLM round-trip.
        if _looks_english(typo_corrected):
            return NormalizationResult(
                original=original,
                normalized=typo_corrected,
                was_changed=(typo_corrected != original),
                source="spellcheck" if typo_corrected != original else "english",
            )

        # Cache hit — skip the LLM call entirely
        cached = cache.get(typo_corrected)
        if cached is not None:
            return NormalizationResult(
                original=original,
                normalized=cached,
                was_changed=(cached != original),
                source="cache",
            )

        try:
            normalized_raw = await default_llm.normalize(
                system=self._system_prompt,
                query=typo_corrected,
            )
        except Exception:
            # Don't block the request on a normalizer hiccup
            return NormalizationResult(
                original=original,
                normalized=typo_corrected,
                was_changed=(typo_corrected != original),
                source="fallback",
            )

        normalized = _clean_llm_output(normalized_raw, fallback=typo_corrected)
        cache.set(typo_corrected, normalized)
        if typo_corrected != original:
            cache.set(original, normalized)
        return NormalizationResult(
            original=original,
            normalized=normalized,
            was_changed=(normalized != original),
            source="llm",
        )


def _clean_llm_output(raw: str, fallback: str) -> str:
    """Strip common LLM noise (quotes, "Translation:" prefix, surrounding whitespace).
    If cleaning yields an empty string, return the original — never block on a
    bad model response.
    """
    if not raw:
        return fallback
    s = raw.strip()
    # Strip leading "Output:" / "Translation:" labels the model sometimes adds
    for prefix in ("Output:", "Translation:", "English:"):
        if s.lower().startswith(prefix.lower()):
            s = s[len(prefix) :].strip()
    # Strip a single pair of wrapping quotes
    if len(s) >= 2 and s[0] in {'"', "'"} and s[-1] == s[0]:
        s = s[1:-1].strip()
    return s or fallback


# Process-wide singleton — chat.py imports this directly.
default_normalizer: Normalizer = LLMNormalizer()
