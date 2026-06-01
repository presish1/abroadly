"""Chat endpoint — retrieve -> rerank -> evaluate -> (generate | partial-answer | clarify | refuse).

Refusal-first: the eval layer runs before generation. If the scope is denied,
no LLM call is made. For low-confidence-but-in-scope queries we now run a
'partial-answer' generation that names the gap and points at the authoritative
source — better than a bare clarifier when retrieval is thin but plausible.

Every request carries request_id + trace_id for observability and audit.
Every turn (user + assistant) is persisted to chat_turns for conversation memory.
"""
from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from slowapi.errors import RateLimitExceeded
from sqlalchemy import bindparam, select, text
from sqlalchemy.dialects.postgresql import JSONB as SAJsonb
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_session
from app.core.limiter import limiter, _get_ip_and_student
from app.core.metrics import increment as metric_inc
from app.core.throttle import is_cooling_down, record_over_limit, should_flag_for_admin
from app.eval import policies
from app.eval.evaluator import default_evaluator
from app.eval.types import Decision, EvalDecision
from app.models.student import ChatTurnModel, ChatTurnOut, StudentModel
from app.normalizer import default_normalizer
from app.qeval import default_question_evaluator
from app.qeval import rules as qeval_rules
from app.qeval.lead import accumulate_lead
from app.rag.generator import generate_answer, _clean_title
from app.rag.reranker import rerank
from app.rag.retriever import retrieve

log = logging.getLogger("abroadly.chat")

router = APIRouter()


def _ms(start: float) -> int:
    """Elapsed milliseconds since `start` (from time.monotonic())."""
    return int((time.monotonic() - start) * 1000)


# How many prior turns to feed the LLM. Keeps the prompt small and the
# token bill predictable; bump if conversations consistently outgrow it.
HISTORY_TURN_LIMIT = 10


class ChatRequest(BaseModel):
    student_id: str = Field(..., description="Existing student profile id")
    message: str = Field(..., min_length=1, max_length=4000)
    trace_id: str | None = Field(None, description="Caller-supplied trace id; generated if omitted")


class Source(BaseModel):
    chunk_id: str
    source_type: str
    score: float
    title: str | None = None


class ChatResponse(BaseModel):
    request_id: str
    trace_id: str
    decision: Decision
    confidence: float
    answer: str | None = None
    clarifying_question: str | None = None
    clarification_needed: bool = False
    sources: list[Source] = []
    reason: str
    debug: dict | None = None  # only populated in dev
    # New optional fields (all have safe defaults so old clients are unaffected — C9)
    answer_length: str | None = None          # "short" | "medium" | "long"
    offer_counselor: bool = False             # server-authoritative handoff signal
    offer_reason: str | None = None           # "qualified" | "question" | None
    lead_status: str | None = None            # "new" | "engaged" | "qualified"
    handoff_target: str | None = None         # "prisma" | "partner"


async def _persist_audit(
    db: AsyncSession,
    *,
    request_id: str,
    trace_id: str,
    student_id: str,
    query: str,
    normalized_query: str | None,
    chunk_ids: list[str],
    retrieval_scores: list[float],
    eval_decision: str,
    eval_confidence: float,
    model_used: str,
    qeval_action: str | None = None,
    qeval_length: str | None = None,
    qeval_lead_signal: str | None = None,
    qeval_source: str | None = None,
    latency_ms: int | None = None,   # populated in Phase 6 observability
    provider: str | None = None,      # populated in Phase 6 observability
) -> None:
    """Async INSERT into chat_audit. `query` is the raw student input;
    `normalized_query` is the post-normalizer English version used for retrieval."""
    stmt = text(
        """
        INSERT INTO chat_audit
            (request_id, trace_id, student_id, query, normalized_query,
             chunk_ids, retrieval_scores,
             eval_decision, eval_confidence, model_used,
             qeval_action, qeval_length, qeval_lead_signal, qeval_source,
             latency_ms, provider,
             created_at)
        VALUES
            (:request_id, :trace_id, :student_id, :query, :normalized_query,
             :chunk_ids, :retrieval_scores,
             :eval_decision, :eval_confidence, :model_used,
             :qeval_action, :qeval_length, :qeval_lead_signal, :qeval_source,
             :latency_ms, :provider,
             :created_at)
        """
    ).bindparams(
        bindparam("chunk_ids", type_=SAJsonb()),
        bindparam("retrieval_scores", type_=SAJsonb()),
    )
    await db.execute(
        stmt,
        {
            "request_id": request_id,
            "trace_id": trace_id,
            "student_id": student_id,
            "query": query,
            "normalized_query": normalized_query,
            "chunk_ids": chunk_ids,
            "retrieval_scores": retrieval_scores,
            "eval_decision": eval_decision,
            "eval_confidence": eval_confidence,
            "model_used": model_used,
            "qeval_action": qeval_action,
            "qeval_length": qeval_length,
            "qeval_lead_signal": qeval_lead_signal,
            "qeval_source": qeval_source,
            "latency_ms": latency_ms,
            "provider": provider,
            "created_at": datetime.utcnow(),
        },
    )


async def _load_history(db: AsyncSession, student_id: uuid.UUID, limit: int) -> list[dict]:
    """Most recent N turns for this student, ordered oldest→newest for LLM context."""
    stmt = (
        select(ChatTurnModel)
        .where(ChatTurnModel.student_id == student_id)
        .order_by(ChatTurnModel.created_at.desc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()
    rows = list(reversed(rows))  # chronological for the LLM
    return [{"role": r.role, "content": r.content} for r in rows]


async def _persist_turn(
    db: AsyncSession,
    *,
    student_id: uuid.UUID,
    role: str,
    content: str,
    eval_decision: str | None = None,
) -> None:
    db.add(
        ChatTurnModel(
            student_id=student_id,
            role=role,
            content=content,
            eval_decision=eval_decision,
        )
    )


@router.post("", response_model=ChatResponse)
@limiter.limit(settings.rate_limit_chat_ip)
@limiter.limit(settings.rate_limit_chat_student, key_func=_get_ip_and_student)
async def chat_endpoint(
    request: Request,
    req: ChatRequest,
    db: AsyncSession = Depends(get_session),
) -> ChatResponse:
    # --- Tier 2 cooldown check (before any LLM/DB work) ---
    _client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or str(request.client.host)
    if is_cooling_down(_client_ip) or is_cooling_down(req.student_id):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please wait before trying again."},
            headers={"Retry-After": str(settings.throttle_cooldown_s)},
        )

    # Store student_id on request.state so the composite key_func can read it.
    request.state.student_id = req.student_id
    metric_inc("chat_total")

    request_id = str(uuid.uuid4())
    trace_id = req.trace_id or str(uuid.uuid4())
    _t0 = time.monotonic()
    _stage_ms: dict[str, int] = {}

    # Load real student profile from PG
    try:
        sid = uuid.UUID(req.student_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_student_id")

    result = await db.execute(select(StudentModel).where(StudentModel.id == sid))
    student_model = result.scalar_one_or_none()
    if not student_model:
        raise HTTPException(status_code=404, detail="student_not_found")
    if not student_model.profile_completed:
        raise HTTPException(status_code=403, detail="student_profile_incomplete")

    student = {
        "id": str(student_model.id),
        "full_name": student_model.full_name,
        "email": student_model.email,
        "education_level": student_model.education_level,
        "gpa": student_model.gpa,
        "expected_gpa": student_model.expected_gpa,
        "target_countries": student_model.target_countries,
        "preferred_field": student_model.preferred_field,
        "location": student_model.location,
        "goals": student_model.goals,
    }

    if settings.ai_globally_paused or student_model.ai_paused:
        await _persist_turn(db, student_id=sid, role="user", content=req.message)
        await db.commit()
        return ChatResponse(
            request_id=request_id, trace_id=trace_id,
            decision=Decision.PROCEED, confidence=1.0,
            answer="A counselor is reviewing your case and will reply shortly. Hang tight!",
            sources=[], reason="ai_paused",
        )

    history = await _load_history(db, sid, HISTORY_TURN_LIMIT)

    # --- qeval entry point 1: prefilter on the ORIGINAL message ---
    # Runs before normalization so slurs/spam can't be sanitized away (C3).
    # Catches both spam (junk/URL floods/zero-alpha) and profanity.
    pf = qeval_rules.prefilter(req.message)
    if pf["is_profanity"] or pf["is_spam"]:
        reason_key = "profanity" if pf["is_profanity"] else "spam"
        metric_inc("spam_rejects")
        log.info(
            '{"event":"chat","request_id":"%s","trace_id":"%s","prefilter_reject":true,'
            '"reason":"%s","total_ms":%d}',
            request_id, trace_id, reason_key, _ms(_t0),
        )
        await _persist_turn(db, student_id=sid, role="user", content=req.message)
        await db.commit()
        return ChatResponse(
            request_id=request_id, trace_id=trace_id,
            decision=Decision.OUT_OF_SCOPE, confidence=0.0,
            answer=policies.REFUSAL_TEMPLATES.get(reason_key, policies.REFUSAL_TEMPLATES["default"]),
            sources=[], reason=reason_key,
        )

    # Language normalization — Hinglish/Nepali-romanized → English.
    _ts = time.monotonic()
    normalization = await default_normalizer.normalize(req.message)
    _stage_ms["normalize"] = _ms(_ts)
    original_message = normalization.original
    query = normalization.normalized
    normalized_query_for_audit = query if normalization.was_changed else None

    # --- qeval entry point 2: full question verdict (after normalize, before retrieve) ---
    _ts = time.monotonic()
    verdict = await default_question_evaluator.evaluate(
        original=original_message,
        normalized=query,
        history=history,
    )
    _stage_ms["qeval"] = _ms(_ts)
    if verdict.source == "llm":
        metric_inc("groq_eval_calls")

    _ts = time.monotonic()
    retrieved = await retrieve(query=query, student_id=req.student_id)
    retrieved = await rerank(query=query, retrieved=retrieved)
    _stage_ms["retrieve"] = _ms(_ts)
    decision: EvalDecision = default_evaluator.evaluate(query=query, student=student, retrieved=retrieved)

    sources = [
        Source(
            chunk_id=c.id,
            source_type=c.source_type,
            score=c.score,
            title=_clean_title(c.metadata.get("title", "")),
        )
        for c in retrieved.chunks
    ]

    # model_used + provider reflect the primary provider (Gemini when key present).
    # Written before generation — represents expected provider, not confirmed.
    _provider = "gemini" if settings.gemini_api_key else "groq"
    _model_used = "gemini/gemini-2.5-flash" if settings.gemini_api_key else "groq/llama-3.3-70b-versatile"

    await _persist_audit(
        db,
        request_id=request_id,
        trace_id=trace_id,
        student_id=req.student_id,
        query=original_message,
        normalized_query=normalized_query_for_audit,
        chunk_ids=[c.id for c in retrieved.chunks],
        retrieval_scores=[c.score for c in retrieved.chunks],
        eval_decision=decision.decision,
        eval_confidence=decision.confidence,
        model_used=_model_used,
        qeval_action=verdict.action.value,
        qeval_length=verdict.length.value,
        qeval_lead_signal=verdict.lead_signal.value,
        qeval_source=verdict.source,
        provider=_provider,
    )

    # User turn stored as what they actually typed — preserves their voice in history.
    await _persist_turn(db, student_id=sid, role="user", content=original_message)

    base = dict(
        request_id=request_id,
        trace_id=trace_id,
        decision=decision.decision,
        confidence=decision.confidence,
        reason=decision.reason,
    )

    async def _finalize(resp: ChatResponse) -> ChatResponse:
        # Persist assistant turn (only when there's a real answer to remember)
        if resp.answer:
            await _persist_turn(
                db,
                student_id=sid,
                role="assistant",
                content=resp.answer,
                eval_decision=str(resp.decision),
            )

        # Lead accumulation — only on real answers, never on refusals.
        answering = (
            resp.answer is not None
            and resp.decision not in (Decision.OUT_OF_SCOPE, Decision.ESCALATE)
        )
        if answering:
            accumulate_lead(student_model, verdict.lead_signal.value)
            metric_inc("gemini_calls" if _provider == "gemini" else "groq_fallback_hits")

        # Server-authoritative counselor offer (replaces frontend regex heuristic).
        # Checked AFTER accumulation so this-turn qualification is captured.
        offer_counselor = False
        offer_reason: str | None = None
        if not student_model.call_consent:
            if student_model.lead_status == "qualified":
                offer_counselor = True
                offer_reason = "qualified"
            elif verdict.lead_signal.value == "strong":
                offer_counselor = True
                offer_reason = "question"

        total_ms = _ms(_t0)
        # Update audit row's latency_ms — we know it now.
        # (provider was already written; latency_ms requires a follow-up UPDATE)
        try:
            await db.execute(
                text("UPDATE chat_audit SET latency_ms=:ms WHERE request_id=:rid"),
                {"ms": total_ms, "rid": request_id},
            )
        except Exception:
            pass  # fail-open: latency column may not exist on old schema yet

        await db.commit()

        # Structured per-request log — one JSON line for each chat turn.
        log.info(
            '{"event":"chat","request_id":"%s","trace_id":"%s",'
            '"qeval_source":"%s","length":"%s","lead_signal":"%s","lead_status":"%s",'
            '"decision":"%s","provider":"%s","offer_counselor":%s,'
            '"prefilter_reject":false,'
            '"normalize_ms":%d,"qeval_ms":%d,"retrieve_ms":%d,"total_ms":%d}',
            request_id, trace_id,
            verdict.source, verdict.length.value, verdict.lead_signal.value,
            student_model.lead_status or "new",
            str(resp.decision), _provider,
            "true" if offer_counselor else "false",
            _stage_ms.get("normalize", 0), _stage_ms.get("qeval", 0),
            _stage_ms.get("retrieve", 0), total_ms,
        )

        return resp.model_copy(update={
            "answer_length": verdict.length.value if resp.answer else None,
            "offer_counselor": offer_counselor,
            "offer_reason": offer_reason,
            "lead_status": student_model.lead_status,
            "handoff_target": settings.handoff_target,
        })

    if decision.decision == Decision.PROCEED:
        _ts = time.monotonic()
        answer = await generate_answer(
            query=query,
            retrieved=retrieved,
            student=student,
            history=history,
            mode="full",
            length=verdict.length.value,
        )
        _stage_ms["generate"] = _ms(_ts)
        return await _finalize(ChatResponse(**base, answer=answer, sources=sources))

    if decision.decision == Decision.LOW_CONFIDENCE:
        # In-scope but thin retrieval. Rather than dead-ending on a hardcoded
        # clarifier (which ignores the conversation), let the LLM answer in
        # gap-honest "partial" mode whenever we have ANYTHING to work with:
        #   - thin-but-plausible retrieval (the original partial path), OR
        #   - an ongoing conversation (short follow-ups like "masters" / "yes"
        #     that only make sense with history), OR
        #   - the query carries real intent (more than a couple of words).
        #
        # The partial-mode system prompt is gap-honest and asks a sharp
        # clarifying question itself when it genuinely needs one — far smarter
        # than a canned template. Hard refusals (OUT_OF_SCOPE / ESCALATE) are
        # handled below and are unaffected.
        has_history = len(history) > 0
        has_intent = len(query.split()) >= 3
        if decision.debug.get("partial_answer") or has_history or has_intent:
            _ts = time.monotonic()
            answer = await generate_answer(
                query=query,
                retrieved=retrieved,
                student=student,
                history=history,
                mode="partial",
                length=verdict.length.value,
            )
            _stage_ms["generate"] = _ms(_ts)
            return await _finalize(ChatResponse(**base, answer=answer, sources=sources))
        # Truly cold, contextless one-word opener — a sharp clarifier is best.
        return await _finalize(
            ChatResponse(
                **base,
                clarification_needed=True,
                clarifying_question=decision.clarifying_question,
            )
        )

    if decision.decision == Decision.OUT_OF_SCOPE:
        return await _finalize(ChatResponse(**base, answer=decision.refusal_message))

    if decision.decision == Decision.ESCALATE:
        # No consultancy attachment — point at the official portal instead.
        return await _finalize(
            ChatResponse(
                **base,
                answer=decision.refusal_message
                or "This step happens on the official government / university portal — not through a consultancy.",
            )
        )

    raise HTTPException(status_code=500, detail="unknown_eval_decision")


@router.get("/history/{student_id}", response_model=list[ChatTurnOut])
async def chat_history(
    student_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_session),
) -> list[ChatTurnOut]:
    """Return chronological chat history for a student. Used by frontend on /chat mount."""
    try:
        sid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_student_id")

    stmt = (
        select(ChatTurnModel)
        .where(ChatTurnModel.student_id == sid)
        .order_by(ChatTurnModel.created_at.desc())
        .limit(min(max(limit, 1), 200))
    )
    rows = (await db.execute(stmt)).scalars().all()
    rows = list(reversed(rows))
    return [
        ChatTurnOut(
            id=str(r.id),
            role=r.role,  # type: ignore[arg-type]
            content=r.content,
            eval_decision=r.eval_decision,
            created_at=r.created_at,
        )
        for r in rows
    ]
