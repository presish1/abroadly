from app.rag.generator import _enforce_length


def _words(count: int) -> str:
    return " ".join(f"word{i}" for i in range(count))


def test_short_answers_are_hard_capped():
    result = _enforce_length(_words(100), "short")
    assert len(result.split()) <= 45
    assert result.endswith("…")


def test_medium_answers_are_hard_capped():
    result = _enforce_length(_words(150), "medium")
    assert len(result.split()) <= 75


def test_long_answers_are_hard_capped():
    result = _enforce_length(_words(220), "long")
    assert len(result.split()) <= 125


def test_answer_inside_budget_is_unchanged():
    answer = "Yes. Upload your transcript so I can check your actual grades."
    assert _enforce_length(answer, "medium") == answer
