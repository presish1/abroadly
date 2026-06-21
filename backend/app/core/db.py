"""Postgres (async SQLAlchemy) + Chroma client singletons."""
from __future__ import annotations

from typing import AsyncGenerator

import chromadb
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# --- Postgres ---------------------------------------------------------------
engine = create_async_engine(settings.postgres_url, pool_pre_ping=True)
SessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine, expire_on_commit=False
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency. Yields an async SQLAlchemy session."""
    async with SessionLocal() as session:
        yield session


# --- Chroma -----------------------------------------------------------------
_chroma_collection: chromadb.Collection | None = None


def get_chroma() -> chromadb.Collection:
    """Return the Chroma collection. Lazy-init, process-wide singleton."""
    global _chroma_collection
    if _chroma_collection is None:
        client = chromadb.PersistentClient(path=settings.chroma_dir)
        _chroma_collection = client.get_or_create_collection(
            name=settings.chroma_collection,
            metadata={"hnsw:space": "l2"},
        )
    return _chroma_collection


# --- Table creation ---------------------------------------------------------
_CREATE_STUDENTS = """
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    location TEXT,
    education_level TEXT NOT NULL,
    gpa FLOAT,
    expected_gpa FLOAT,
    qualification_year INT,
    score_type TEXT,
    academic_score TEXT,
    english_test_taken BOOLEAN,
    english_test_type TEXT,
    english_overall_score TEXT,
    english_lowest_score TEXT,
    english_goal TEXT,
    english_class_timing TEXT,
    planned_english_test TEXT,
    target_countries JSONB DEFAULT '[]',
    preferred_field TEXT,
    intended_study_level TEXT,
    preferred_intake TEXT,
    budget_range TEXT,
    goals TEXT,
    profile_completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""

_CREATE_CHAT_AUDIT = """
CREATE TABLE IF NOT EXISTS chat_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL,
    trace_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    query TEXT NOT NULL,
    normalized_query TEXT,
    chunk_ids JSONB DEFAULT '[]',
    retrieval_scores JSONB DEFAULT '[]',
    eval_decision TEXT NOT NULL,
    eval_confidence FLOAT,
    model_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

# Idempotent migration — adds normalized_query to existing chat_audit rows.
# Safe to run repeatedly.
_ADD_NORMALIZED_QUERY = """
ALTER TABLE chat_audit ADD COLUMN IF NOT EXISTS normalized_query TEXT;
"""

_CREATE_CHAT_TURNS = """
CREATE TABLE IF NOT EXISTS chat_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    eval_decision TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

_CREATE_CHAT_TURNS_INDEX = """
CREATE INDEX IF NOT EXISTS ix_chat_turns_student_created
    ON chat_turns (student_id, created_at);
"""

_CREATE_SERVICE_REQUESTS = """
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL,
    test_type TEXT,
    preferred_time TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
"""

_CREATE_SERVICE_REQUEST_INDEXES = (
    "CREATE INDEX IF NOT EXISTS ix_service_requests_status_created ON service_requests (status, created_at);",
    "CREATE INDEX IF NOT EXISTS ix_service_requests_student_created ON service_requests (student_id, created_at);",
)


_ADD_AI_PAUSED = """
ALTER TABLE students ADD COLUMN IF NOT EXISTS ai_paused BOOLEAN DEFAULT FALSE;
"""

_ADD_EXPECTED_GPA = """
ALTER TABLE students ADD COLUMN IF NOT EXISTS expected_gpa FLOAT;
"""

_ADD_PROFILE_COMPLETED = """
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
"""

_ADD_CALL_CONSENT = """
ALTER TABLE students ADD COLUMN IF NOT EXISTS call_consent BOOLEAN DEFAULT FALSE;
"""

_ADD_ONBOARDING_DETAILS = (
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS qualification_year INT;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS score_type TEXT;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_score TEXT;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS english_test_taken BOOLEAN;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS english_test_type TEXT;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS english_overall_score TEXT;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS english_lowest_score TEXT;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS english_goal TEXT;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS english_class_timing TEXT;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS planned_english_test TEXT;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS intended_study_level TEXT;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_intake TEXT;",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS budget_range TEXT;",
)

_BACKFILL_PROFILE_COMPLETED = """
UPDATE students
SET profile_completed = TRUE
WHERE profile_completed IS NOT TRUE
  AND (
    phone IS NOT NULL
    OR location IS NOT NULL
    OR gpa IS NOT NULL
    OR expected_gpa IS NOT NULL
    OR preferred_field IS NOT NULL
    OR goals IS NOT NULL
    OR jsonb_array_length(COALESCE(target_countries, '[]'::jsonb)) > 0
  );
"""

_SET_PROFILE_COMPLETED_DEFAULT = """
ALTER TABLE students ALTER COLUMN profile_completed SET DEFAULT TRUE;
"""

_FIX_ROLE_CONSTRAINT = """
DO $$ BEGIN
    ALTER TABLE chat_turns DROP CONSTRAINT IF EXISTS chat_turns_role_check;
    ALTER TABLE chat_turns ADD CONSTRAINT chat_turns_role_check
        CHECK (role IN ('user', 'assistant', 'counselor'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
"""

# --- Lead qualification columns on students ---
_ADD_LEAD_SCORE = "ALTER TABLE students ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0;"
_ADD_LEAD_STRONG = "ALTER TABLE students ADD COLUMN IF NOT EXISTS lead_strong_count INT DEFAULT 0;"
_ADD_LEAD_GOOD = "ALTER TABLE students ADD COLUMN IF NOT EXISTS lead_good_count INT DEFAULT 0;"
_ADD_LEAD_STANDARD = "ALTER TABLE students ADD COLUMN IF NOT EXISTS lead_standard_count INT DEFAULT 0;"
_ADD_LEAD_STATUS = "ALTER TABLE students ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'new';"
_ADD_QUALIFIED_AT = "ALTER TABLE students ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;"

_ADD_ABUSE_FLAGGED = "ALTER TABLE students ADD COLUMN IF NOT EXISTS abuse_flagged BOOLEAN DEFAULT FALSE;"

# --- qeval verdict + observability columns on chat_audit ---
_ADD_QEVAL_ACTION = "ALTER TABLE chat_audit ADD COLUMN IF NOT EXISTS qeval_action TEXT;"
_ADD_QEVAL_LENGTH = "ALTER TABLE chat_audit ADD COLUMN IF NOT EXISTS qeval_length TEXT;"
_ADD_QEVAL_LEAD_SIGNAL = "ALTER TABLE chat_audit ADD COLUMN IF NOT EXISTS qeval_lead_signal TEXT;"
_ADD_QEVAL_SOURCE = "ALTER TABLE chat_audit ADD COLUMN IF NOT EXISTS qeval_source TEXT;"
_ADD_LATENCY_MS = "ALTER TABLE chat_audit ADD COLUMN IF NOT EXISTS latency_ms INT;"
_ADD_PROVIDER = "ALTER TABLE chat_audit ADD COLUMN IF NOT EXISTS provider TEXT;"


async def create_tables() -> None:
    """Create all application tables if they don't exist + run idempotent migrations."""
    async with engine.begin() as conn:
        await conn.execute(text(_CREATE_STUDENTS))
        await conn.execute(text(_CREATE_CHAT_AUDIT))
        await conn.execute(text(_ADD_NORMALIZED_QUERY))
        await conn.execute(text(_CREATE_CHAT_TURNS))
        await conn.execute(text(_CREATE_CHAT_TURNS_INDEX))
        await conn.execute(text(_CREATE_SERVICE_REQUESTS))
        for statement in _CREATE_SERVICE_REQUEST_INDEXES:
            await conn.execute(text(statement))
        await conn.execute(text(_ADD_AI_PAUSED))
        await conn.execute(text(_ADD_EXPECTED_GPA))
        await conn.execute(text(_ADD_PROFILE_COMPLETED))
        await conn.execute(text(_ADD_CALL_CONSENT))
        for statement in _ADD_ONBOARDING_DETAILS:
            await conn.execute(text(statement))
        await conn.execute(text(_BACKFILL_PROFILE_COMPLETED))
        await conn.execute(text(_SET_PROFILE_COMPLETED_DEFAULT))
        await conn.execute(text(_FIX_ROLE_CONSTRAINT))
        await conn.execute(text(_ADD_LEAD_SCORE))
        await conn.execute(text(_ADD_LEAD_STRONG))
        await conn.execute(text(_ADD_LEAD_GOOD))
        await conn.execute(text(_ADD_LEAD_STANDARD))
        await conn.execute(text(_ADD_LEAD_STATUS))
        await conn.execute(text(_ADD_QUALIFIED_AT))
        await conn.execute(text(_ADD_ABUSE_FLAGGED))
        await conn.execute(text(_ADD_QEVAL_ACTION))
        await conn.execute(text(_ADD_QEVAL_LENGTH))
        await conn.execute(text(_ADD_QEVAL_LEAD_SIGNAL))
        await conn.execute(text(_ADD_QEVAL_SOURCE))
        await conn.execute(text(_ADD_LATENCY_MS))
        await conn.execute(text(_ADD_PROVIDER))
