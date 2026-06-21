"""Student + ChatTurn schemas (pydantic) + SQLAlchemy ORM models."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import Boolean, Column, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import DeclarativeBase

EducationLevel = Literal["plus_two", "a_levels", "bba", "bachelors", "other"]
ChatRole = Literal["user", "assistant", "counselor"]


# ---------------------------------------------------------------------------
# SQLAlchemy ORM
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    pass


class StudentModel(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(120), nullable=False)
    email = Column(String, nullable=False, unique=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    education_level = Column(String, nullable=False)
    gpa = Column(Float, nullable=True)
    expected_gpa = Column(Float, nullable=True)
    qualification_year = Column(Integer, nullable=True)
    score_type = Column(String(32), nullable=True)
    academic_score = Column(String(32), nullable=True)
    english_test_taken = Column(Boolean, nullable=True)
    english_test_type = Column(String(40), nullable=True)
    english_overall_score = Column(String(24), nullable=True)
    english_lowest_score = Column(String(24), nullable=True)
    english_goal = Column(String(32), nullable=True)
    english_class_timing = Column(String(32), nullable=True)
    planned_english_test = Column(String(40), nullable=True)
    target_countries = Column(JSONB, nullable=False, default=list)
    preferred_field = Column(String, nullable=True)
    intended_study_level = Column(String(32), nullable=True)
    preferred_intake = Column(String(80), nullable=True)
    budget_range = Column(String(80), nullable=True)
    goals = Column(Text, nullable=True)
    ai_paused = Column(Boolean, default=False, server_default="false")
    profile_completed = Column(Boolean, default=True, server_default="true")
    call_consent = Column(Boolean, default=False, server_default="false")
    # Lead qualification columns (accumulated per chat turn)
    lead_score = Column(Integer, default=0, server_default="0")
    lead_strong_count = Column(Integer, default=0, server_default="0")
    lead_good_count = Column(Integer, default=0, server_default="0")
    lead_standard_count = Column(Integer, default=0, server_default="0")
    lead_status = Column(String(16), default="new", server_default="'new'")
    qualified_at = Column(TIMESTAMP(timezone=True), nullable=True)
    # Throttle Tier 3: flagged for admin review after persistent abuse
    abuse_flagged = Column(Boolean, default=False, server_default="false")
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)


class ChatTurnModel(Base):
    __tablename__ = "chat_turns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    role = Column(String(16), nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    eval_decision = Column(String(32), nullable=True)  # null for user turns
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("ix_chat_turns_student_created", "student_id", "created_at"),
    )


class ServiceRequestModel(Base):
    __tablename__ = "service_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    request_type = Column(String(32), nullable=False)
    test_type = Column(String(40), nullable=True)
    preferred_time = Column(String(80), nullable=True)
    phone = Column(String(40), nullable=True)
    status = Column(String(16), nullable=False, default="pending", server_default="pending")
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    resolved_at = Column(TIMESTAMP(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_service_requests_status_created", "status", "created_at"),
        Index("ix_service_requests_student_created", "student_id", "created_at"),
    )


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class StudentBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = None
    location: str | None = Field(None, description="City / district in Nepal")
    education_level: EducationLevel
    gpa: float | None = Field(None, ge=0, le=4.5)
    expected_gpa: float | None = Field(None, ge=0, le=4.5)
    qualification_year: int | None = Field(None, ge=1950, le=2035)
    score_type: str | None = Field(None, max_length=32)
    academic_score: str | None = Field(None, max_length=32)
    english_test_taken: bool | None = None
    english_test_type: str | None = Field(None, max_length=40)
    english_overall_score: str | None = Field(None, max_length=24)
    english_lowest_score: str | None = Field(None, max_length=24)
    english_goal: str | None = Field(None, max_length=32)
    english_class_timing: str | None = Field(None, max_length=32)
    planned_english_test: str | None = Field(None, max_length=40)
    target_countries: list[str] = Field(default_factory=list)
    goals: str | None = Field(None, max_length=2000)
    preferred_field: str | None = None
    intended_study_level: str | None = Field(None, max_length=32)
    preferred_intake: str | None = Field(None, max_length=80)
    budget_range: str | None = Field(None, max_length=80)


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    location: str | None = None
    education_level: EducationLevel | None = None
    gpa: float | None = Field(None, ge=0, le=4.5)
    expected_gpa: float | None = Field(None, ge=0, le=4.5)
    qualification_year: int | None = Field(None, ge=1950, le=2035)
    score_type: str | None = None
    academic_score: str | None = None
    english_test_taken: bool | None = None
    english_test_type: str | None = None
    english_overall_score: str | None = None
    english_lowest_score: str | None = None
    english_goal: str | None = None
    english_class_timing: str | None = None
    planned_english_test: str | None = None
    target_countries: list[str] | None = None
    goals: str | None = None
    preferred_field: str | None = None
    intended_study_level: str | None = None
    preferred_intake: str | None = None
    budget_range: str | None = None


class StudentOut(StudentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ai_paused: bool = False
    profile_completed: bool = True
    call_consent: bool = False
    lead_score: int = 0
    lead_status: str = "new"
    abuse_flagged: bool = False
    created_at: datetime
    updated_at: datetime


class ChatTurnOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: ChatRole
    content: str
    eval_decision: str | None = None
    created_at: datetime
