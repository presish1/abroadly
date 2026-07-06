from app.rag.generator import _enforce_length, _format_context, _format_profile
from app.eval.types import RetrievedChunk, RetrievedSet


def _words(count: int) -> str:
    return " ".join(f"word{i}" for i in range(count))


def test_short_answers_are_hard_capped():
    result = _enforce_length(_words(100), "short")
    # New limit is 45 words; result may include continuation line.
    word_count = len(result.split())
    assert word_count <= 55  # 45 + continuation line (~10 words)


def test_medium_answers_are_hard_capped():
    result = _enforce_length(_words(150), "medium")
    word_count = len(result.split())
    assert word_count <= 85  # 75 + continuation line (~10 words)


def test_long_answers_are_hard_capped():
    result = _enforce_length(_words(220), "long")
    word_count = len(result.split())
    assert word_count <= 148  # 120 + ~15% overflow for sentence boundary + continuation


def test_answer_inside_budget_is_unchanged():
    answer = "Yes. Upload your transcript so I can check your actual grades."
    assert _enforce_length(answer, "medium") == answer


def test_profile_formatter_drops_placeholder_values():
    profile = _format_profile({
        "id": "student-id",
        "full_name": "Asha Sharma",
        "preferred_field": "abc",
        "goals": "testing",
        "gpa": 3.4,
    })

    assert "Verified Postgres student-profile facts only" in profile
    assert "full_name: Asha Sharma" in profile
    assert "gpa: 3.4" in profile
    assert "abc" not in profile
    assert "testing" not in profile
    assert "student-id" not in profile


def test_context_formatter_marks_retrieved_numbers_as_general_examples():
    context = _format_context(
        RetrievedSet(chunks=[
            RetrievedChunk(
                id="chunk-1",
                text="Example: students with 4 backlogs may need extra evidence.",
                metadata={"title": "12-faq.md"},
                score=0.8,
                source_type="global",
            )
        ])
    )

    assert "GENERAL reference excerpts" in context
    assert "never treat numbers or examples here as the student's own details" in context
    assert "4 backlogs" in context


def test_enforce_length_prefers_sentence_boundaries():
    """When trimming, the function should prefer ending at a sentence boundary."""
    text = "IELTS 6.5 is the usual minimum for UK universities. Some accept 6.0 with pre-sessional English. Check the specific course page for exact requirements."
    result = _enforce_length(text, "short")
    # Should end at a sentence boundary, not mid-word
    assert result.rstrip().endswith(".") or result.rstrip().endswith("!")


def test_enforce_length_adds_continuation_when_needed():
    """When sentence trimming would lose too much, append a natural continuation."""
    # Create text with no sentence ends (no periods) that exceeds the budget.
    long_no_periods = "word " * 80
    long_no_periods = long_no_periods.strip()
    result = _enforce_length(long_no_periods, "short")
    assert "break this down" in result
