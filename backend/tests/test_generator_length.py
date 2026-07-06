from app.rag.generator import _enforce_length, _format_context, _format_profile
from app.eval.types import RetrievedChunk, RetrievedSet


def _words(count: int) -> str:
    return " ".join(f"word{i}" for i in range(count))


def test_short_answers_are_hard_capped():
    result = _enforce_length(_words(100), "short")
    assert len(result.split()) <= 32
    assert result.endswith("…")


def test_medium_answers_are_hard_capped():
    result = _enforce_length(_words(150), "medium")
    assert len(result.split()) <= 58


def test_long_answers_are_hard_capped():
    result = _enforce_length(_words(220), "long")
    assert len(result.split()) <= 90


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
