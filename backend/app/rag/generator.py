"""LLM generation — delegates to llm.py provider abstraction.

Invoked when the eval layer returns PROCEED, or in 'partial' mode when
retrieval is thin but the question is in-scope and we want to give the
student something more useful than a refusal.
"""
from __future__ import annotations

import re
from pathlib import Path

from app.eval.types import RetrievedSet
from app.rag.llm import ChatHistory, default_llm

_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "system_prompt.md"


def _load_system_prompt() -> str:
    try:
        return _PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return "You are Abroadly, a free opensource study-abroad guidance assistant."


_JUNK_RE = re.compile(r"(?i)^([a-z])\1+$")  # "iii", "aaa", repeated single letter
_PLACEHOLDER_VALUES = {
    "abc", "abcd", "asdf", "qwerty", "test", "testing", "n/a", "na",
    "none", "null", "unknown", "not sure", "not provided", "-", "--",
}


def _is_junk(value: str) -> bool:
    s = value.strip()
    lowered = s.lower()
    if len(s) < 2:
        return True
    if lowered in _PLACEHOLDER_VALUES:
        return True
    if _JUNK_RE.fullmatch(s):
        return True
    # all-consonant or vowel-less short blobs like "Iii"/"xyz" with no real content
    if len(s) <= 4 and not re.search(r"[aeiouAEIOU]", s) and s.isalpha():
        return True
    return False


def _format_profile(student: dict) -> str:
    """Render only real, meaningful profile fields. Junk/placeholder string
    values (e.g. "Iii") are dropped so the model never echoes them."""
    skip = {"id"}
    parts = []
    for k, v in student.items():
        if k in skip or v in (None, "", [], {}):
            continue
        if isinstance(v, str) and _is_junk(v):
            continue
        parts.append(f"{k}: {v}")
    if not parts:
        return "No verified student profile data from Postgres is available yet."
    return "\n".join([
        "Verified Postgres student-profile facts only. Missing fields are unknown; do not infer them.",
        *parts,
    ])


def _clean_title(raw: str) -> str:
    """Turn 12-faq-nepali-students.md → FAQ Nepali students."""
    name = re.sub(r"^\d+-", "", raw)
    name = re.sub(r"\.(md|txt|pdf)$", "", name)
    name = name.replace("-", " ").replace("_", " ").strip()
    if name:
        name = name[0].upper() + name[1:]
    return name or raw


def _format_context(retrieved: RetrievedSet) -> str:
    """Format chunks as GENERAL reference material. The header makes clear this
    is background knowledge about studying abroad — NOT the student's personal
    data — so the model never attributes example numbers (e.g. a sample
    "4 backlogs" or a sample GPA) to the student."""
    if not retrieved.chunks:
        return "(no reference material retrieved)"
    parts = [
        "The following are GENERAL reference excerpts about studying abroad. "
        "They are background info only — never treat numbers or examples here "
        "as the student's own details.",
    ]
    for c in retrieved.chunks:
        raw_title = c.metadata.get("title", "unknown source")
        title = _clean_title(raw_title)
        parts.append(f"[{title}]\n{c.text}")
    return "\n\n".join(parts)


def _clean_response(text: str) -> str:
    """Strip all source references, trailing sections, and formatting artifacts."""
    text = re.sub(r"\[Source:[^\]]*\]", "", text)
    text = re.sub(r"\*\*Sources?\*\*[\s\S]*?(?=\n\*\*|$)", "", text)
    text = re.sub(r"Sources?:\s*\n[\s\S]*?(?=\n\*\*|$)", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


_WORD_LIMITS = {"short": 45, "medium": 75, "long": 120}

# Natural continuation line appended when trimming would lose too much meaning.
_CONTINUATION = "I can break this down further if you want."


def _enforce_length(text: str, length: str) -> str:
    """Trim a generated reply to the word budget, preferring complete sentences.

    Strategy:
      1. If the reply is within budget → return unchanged.
      2. Find the last sentence-ending punctuation within the word budget.
      3. If that sentence end preserves ≥50% of the budgeted text → trim there.
      4. Otherwise append a short natural continuation line so the student
         knows they can ask for more, instead of seeing an awkward "…".
    """
    limit = _WORD_LIMITS.get(length, _WORD_LIMITS["medium"])
    words = list(re.finditer(r"\S+", text))
    if len(words) <= limit:
        return text

    # Text up to the word-limit boundary.
    budget_text = text[:words[limit - 1].end()].rstrip()

    # Find all sentence-ending punctuation (. ! ?) optionally followed by
    # closing bold markers, within the budgeted window.
    sentence_ends = list(re.finditer(r"[.!?](?:\*\*)?(?=\s|$)", budget_text))

    if sentence_ends:
        best = sentence_ends[-1]
        trimmed = budget_text[:best.end()].rstrip()
        # Accept if we keep at least 50% of the budgeted text length.
        if len(trimmed) >= len(budget_text) * 0.50:
            if trimmed.count("**") % 2:
                trimmed += "**"
            return trimmed

    # Sentence-end trim would lose too much meaning → find the last sentence
    # end in the FULL text (not just the budget window) that is closest to the
    # budget, then append a continuation hint.
    all_ends = list(re.finditer(r"[.!?](?:\*\*)?(?=\s|$)", text))
    for end in reversed(all_ends):
        candidate = text[:end.end()].rstrip()
        candidate_words = len(candidate.split())
        # Allow up to 15% over budget to land on a sentence boundary.
        if candidate_words <= int(limit * 1.15):
            if candidate.count("**") % 2:
                candidate += "**"
            return candidate

    # Last resort: hard clip at budget + continuation line.
    clipped = budget_text.rstrip(" ,:;-–—•")
    if clipped.count("**") % 2:
        clipped += "**"
    # End on the last complete sentence within the clipped text, if any.
    inner_ends = list(re.finditer(r"[.!?](?:\*\*)?(?=\s|$)", clipped))
    if inner_ends:
        clipped = clipped[:inner_ends[-1].end()].rstrip()
    else:
        clipped = clipped.rstrip(" ,:;-–—•") + "."
    return clipped + "\n\n" + _CONTINUATION


async def generate_answer(
    query: str,
    retrieved: RetrievedSet,
    student: dict,
    history: ChatHistory | None = None,
    mode: str = "full",
    length: str = "medium",
) -> str:
    system = _load_system_prompt()
    context = _format_context(retrieved)
    profile = _format_profile(student)
    answer = await default_llm.generate(
        system=system,
        context=context,
        profile=profile,
        query=query,
        history=history,
        mode=mode,
        length=length,
    )
    answer = _clean_response(answer)
    return _enforce_length(answer, length)
