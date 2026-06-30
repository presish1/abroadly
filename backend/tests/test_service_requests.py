from __future__ import annotations

import asyncio
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import BackgroundTasks

from app.api.onboarding import CallRequest, DeletionRequest, request_account_deletion, request_call
from app.models.student import ServiceRequestModel


class _StudentResult:
    def __init__(self, student):
        self.student = student

    def scalar_one_or_none(self):
        return self.student


def test_request_call_persists_each_class_booking():
    student = SimpleNamespace(
        id=uuid.uuid4(),
        full_name="Asha Sharma",
        email="asha@example.com",
        phone="+9779800000000",
        call_consent=False,
        updated_at=None,
    )
    db = SimpleNamespace(
        execute=AsyncMock(return_value=_StudentResult(student)),
        add=MagicMock(),
        commit=AsyncMock(),
        refresh=AsyncMock(),
    )
    tasks = BackgroundTasks()
    payload = CallRequest(
        request_type="class_booking",
        test_type="PTE",
        preferred_time="Sunday morning",
    )

    with patch("app.api.onboarding._to_out", return_value=student):
        result = asyncio.run(request_call(str(student.id), payload, tasks, db))

    assert result is student
    assert student.call_consent is False
    request = db.add.call_args.args[0]
    assert isinstance(request, ServiceRequestModel)
    assert request.request_type == "class_booking"
    assert request.test_type == "PTE"
    assert request.preferred_time == "Sunday morning"
    assert request.status == "pending"
    assert len(tasks.tasks) == 1


def test_counselor_request_sets_call_consent():
    student = SimpleNamespace(
        id=uuid.uuid4(),
        full_name="Asha Sharma",
        email="asha@example.com",
        phone="+9779800000000",
        call_consent=False,
        updated_at=None,
    )
    db = SimpleNamespace(
        execute=AsyncMock(return_value=_StudentResult(student)),
        add=MagicMock(),
        commit=AsyncMock(),
        refresh=AsyncMock(),
    )

    with patch("app.api.onboarding._to_out", return_value=student):
        asyncio.run(
            request_call(
                str(student.id),
                CallRequest(request_type="counselor_call"),
                BackgroundTasks(),
                db,
            )
        )

    assert student.call_consent is True


def test_deletion_request_marks_student_without_deleting():
    student = SimpleNamespace(
        id=uuid.uuid4(),
        full_name="Asha Sharma",
        email="asha@example.com",
        phone="+977 9800000000",
        account_status="active",
        deletion_requested_at=None,
        updated_at=None,
    )
    db = SimpleNamespace(
        execute=AsyncMock(return_value=_StudentResult(student)),
        commit=AsyncMock(),
        refresh=AsyncMock(),
    )

    with patch("app.api.onboarding._to_out", return_value=student):
        result = asyncio.run(
            request_account_deletion(
                str(student.id),
                DeletionRequest(phone="+977-9800000000"),
                db,
            )
        )

    assert result is student
    assert student.account_status == "pending_deletion"
    assert student.deletion_requested_at is not None
    db.commit.assert_awaited_once()
    db.refresh.assert_awaited_once_with(student)


def test_deletion_request_rejects_wrong_phone():
    student = SimpleNamespace(
        id=uuid.uuid4(),
        phone="+977 9800000000",
    )
    db = SimpleNamespace(
        execute=AsyncMock(return_value=_StudentResult(student)),
        commit=AsyncMock(),
        refresh=AsyncMock(),
    )

    with pytest.raises(Exception) as exc:
        asyncio.run(
            request_account_deletion(
                str(student.id),
                DeletionRequest(phone="+977 9811111111"),
                db,
            )
        )

    assert getattr(exc.value, "status_code", None) == 422
    assert getattr(exc.value, "detail", None) == "phone_mismatch"
    db.commit.assert_not_awaited()
