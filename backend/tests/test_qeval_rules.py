"""Unit tests for qeval rules layer.

Run with: pytest backend/tests/test_qeval_rules.py

Tests cover:
  - prefilter: spam detection, profanity detection, clean messages pass through
  - rough_length: short/medium/long classification
  - needs_llm: cost guard skips greetings, one-word, yes/no follow-ups
"""
from app.qeval.rules import prefilter, rough_length, needs_llm
from app.qeval.types import QLength


# ---------------------------------------------------------------------------
# prefilter — spam
# ---------------------------------------------------------------------------

def test_spam_url_flood():
    pf = prefilter("aaaa http://spam.com http://evil.com buy now")
    assert pf["is_spam"] is True
    assert pf["is_profanity"] is False


def test_spam_repeated_chars():
    pf = prefilter("aaaaaaaaaa hello")
    assert pf["is_spam"] is True


def test_spam_zero_alpha():
    pf = prefilter("12345 !!!!! ##### 99999")
    assert pf["is_spam"] is True


def test_spam_empty():
    pf = prefilter("   ")
    assert pf["is_spam"] is True


def test_clean_message_not_spam():
    pf = prefilter("What IELTS score do I need for UK?")
    assert pf["is_spam"] is False
    assert pf["is_profanity"] is False


def test_clean_short_message_not_spam():
    pf = prefilter("hello")
    assert pf["is_spam"] is False
    assert pf["is_profanity"] is False


# ---------------------------------------------------------------------------
# prefilter — profanity
# ---------------------------------------------------------------------------

def test_profanity_detected():
    pf = prefilter("muji help me with visa")
    assert pf["is_profanity"] is True


def test_profanity_english():
    pf = prefilter("fuck you")
    assert pf["is_profanity"] is True


def test_visa_question_not_profanity():
    pf = prefilter("What visa do I need to study in Australia?")
    assert pf["is_profanity"] is False
    assert pf["is_spam"] is False


# ---------------------------------------------------------------------------
# rough_length
# ---------------------------------------------------------------------------

def test_yes_no_is_short():
    assert rough_length("yes", 0) == QLength.short
    assert rough_length("no", 0) == QLength.short
    assert rough_length("okay", 2) == QLength.short


def test_short_question_is_short():
    assert rough_length("Is IELTS required?", 0) == QLength.short  # 3 words


def test_checklist_keyword_is_long():
    assert rough_length("Give me a full checklist of documents for UK visa", 0) == QLength.long


def test_compare_keyword_is_long():
    assert rough_length("Compare Australia and Canada for IT masters", 0) == QLength.long


def test_long_query_by_word_count():
    long_q = " ".join(["word"] * 40)
    assert rough_length(long_q, 0) == QLength.long


def test_typical_question_is_medium():
    assert rough_length("What are the requirements for a UK student visa?", 0) == QLength.medium


def test_sop_review_medium_by_rules():
    # rough_length is a fallback only; 20-word SOP question has no list-keywords,
    # so rules return medium. The LLM (Phase 3) upgrades this to long.
    q = "Can you help me review my SOP and shortlist universities in the UK for computer science masters within my budget?"
    assert rough_length(q, 0) == QLength.medium


# ---------------------------------------------------------------------------
# needs_llm — cost guard
# ---------------------------------------------------------------------------

def test_needs_llm_false_for_one_word():
    assert needs_llm("masters", "masters") is False


def test_needs_llm_false_for_greeting():
    assert needs_llm("hello", "hello") is False
    assert needs_llm("namaste", "namaste") is False
    assert needs_llm("Hi!", "Hi!") is False
    assert needs_llm("thanks", "thanks") is False


def test_needs_llm_false_for_yes_no():
    assert needs_llm("yes", "yes") is False
    assert needs_llm("okay", "okay") is False
    assert needs_llm("no", "no") is False


def test_needs_llm_true_for_real_question():
    assert needs_llm("What IELTS score do I need for UK?", "What IELTS score do I need for UK?") is True


def test_needs_llm_true_for_complex():
    q = "Can you review my SOP and shortlist unis for Canada masters in CS?"
    assert needs_llm(q, q) is True


def test_needs_llm_true_for_visa_question():
    assert needs_llm("How do I apply for an Australian student visa?", "How do I apply for an Australian student visa?") is True
