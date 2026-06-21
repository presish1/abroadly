"""Google OAuth student sign-in helpers."""
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi import HTTPException

from app.api import auth
from app.core.config import settings


def test_google_authorize_url_uses_configured_redirect(monkeypatch):
    monkeypatch.setattr(settings, "google_oauth_client_id", "client-id.apps.googleusercontent.com")
    monkeypatch.setattr(settings, "google_oauth_redirect_uri", "https://abroadly.online/auth/google/callback")

    parsed = urlparse(auth._google_authorize_url("state-123"))
    params = parse_qs(parsed.query)

    assert parsed.scheme == "https"
    assert parsed.netloc == "accounts.google.com"
    assert params["client_id"] == ["client-id.apps.googleusercontent.com"]
    assert params["redirect_uri"] == ["https://abroadly.online/auth/google/callback"]
    assert params["response_type"] == ["code"]
    assert params["state"] == ["state-123"]
    assert "openid" in params["scope"][0]
    assert "email" in params["scope"][0]
    assert "profile" in params["scope"][0]


def test_student_session_token_round_trips(monkeypatch):
    student_id = "3a2f37dd-329a-4b80-b7ef-1a7f72f83fd7"
    monkeypatch.setattr(settings, "jwt_secret", "test-secret-for-google-student-cookie")

    token = auth._create_student_session_token(student_id)

    assert auth._decode_student_session_token(token) == student_id


@pytest.mark.asyncio
async def test_google_profile_requires_verified_email():
    with pytest.raises(HTTPException) as exc:
        await auth._upsert_google_student(None, {"email": "student@example.com", "email_verified": False})

    assert exc.value.status_code == 400
    assert exc.value.detail == "google_email_not_verified"


def test_complete_profile_requires_non_blank_phone():
    with pytest.raises(HTTPException) as exc:
        auth._clean_required_text("   ", "phone_required")

    assert exc.value.status_code == 422
    assert exc.value.detail == "phone_required"


def _profile_payload(**overrides):
    payload = {
        "full_name": "Sita Sharma",
        "phone": "+977 9812345678",
        "location": "Kathmandu",
        "education_level": "plus_two",
        "qualification_year": 2026,
        "score_type": "gpa",
        "academic_score": "3.4",
        "english_test_taken": False,
        "english_goal": "not_looking",
        "target_countries": ["Australia"],
        "preferred_field": "Computer Science",
        "intended_study_level": "Bachelor's",
        "preferred_intake": "February 2027",
        "call_consent": False,
    }
    payload.update(overrides)
    return payload


def test_complete_profile_accepts_no_test_path():
    req = auth.CompleteProfileRequest(**_profile_payload())
    assert req.english_test_taken is False
    assert req.english_goal == "not_looking"


def test_complete_profile_requires_scores_for_completed_test():
    with pytest.raises(ValueError, match="english_overall_score_required"):
        auth.CompleteProfileRequest(
            **_profile_payload(
                english_test_taken=True,
                english_goal=None,
                english_test_type="IELTS",
                english_overall_score="",
            )
        )


def test_complete_profile_requires_class_timing_when_requested():
    with pytest.raises(ValueError, match="english_class_timing_required"):
        auth.CompleteProfileRequest(
            **_profile_payload(english_goal="join_class", english_class_timing="")
        )
