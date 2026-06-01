# Branch Review: `improvement-chat-fullstack`

> **Merge = live deploy.** Only merge after you're satisfied with this review and the Phase 9 gate is green.

---

## What changed and why

Three pillars to make the chat **smarter, cheaper, and more useful**:

### Pillar 1 — Adaptive-length Question Evaluation
Every student message is now classified before generation. A cheap **Groq `llama-3.1-8b-instant`** call (120 tokens) emits a *verdict*: the right response length (`short` / `medium` / `long`), the lead signal, and quality tier. Gemini uses this to write the right-sized answer the first time instead of always producing an essay. Per-bucket token caps (`short=220, medium=600, long=1000`) are the main cost/latency lever. A deterministic fallback (pure Python rules) fires if Groq is down — the chat never 500s.

### Pillar 2 — Backend-authoritative Lead Qualification
Lead signals accumulate per turn in `students` (counter columns). When a student qualifies (2 strong / 3 good / 4 standard signals), the **backend** sets `offer_counselor=true` in the response. The frontend reads this flag and shows the counselor card — no more fragile regex scanning the answer text. After consent, the offer stops.

### Pillar 3 — Security + Efficiency
- **Rate limiting** via slowapi: 40/min per-IP and 20/min per-(IP+student) on `/chat`; 10/min on `/upload`. Graduated 3-tier escalation (429 → 15-min cooldown → abuse flag).
- **Spam prefilter** (pure deterministic, no LLM) catches junk/URL floods before the normaliser even runs.

**Cross-cutting:** structured JSON logs per request with stage timings; `chat_audit` extended with qeval verdict + latency; `GET /admin/metrics` (JWT) exposes counters.

---

## What's new vs old behaviour

| Behaviour | Before | After |
|---|---|---|
| Reply length | Always `MAX_TOKENS=1000`, no length signal | Adaptive per bucket; short questions get 1–2 sentences |
| Counselor offer | Frontend regex on answer text (`COUNSELOR_HANDOFF_RE` etc.) | Backend `offer_counselor` bool + `offer_reason` field |
| Spam | No spam gate — all messages went through LLM normaliser | `prefilter()` catches before any LLM token |
| Rate limiting | None | slowapi two-limit decorators + graduated escalation |
| Groq eval | None | llama-3.1-8b-instant classifier (fast, cheap); fails open |
| `chat_audit.model_used` | Always `"groq/llama-3.3-70b-versatile"` (wrong) | Primary provider (Gemini when key present) |
| Observability | None | Structured logs, stage timings, in-memory counters |

---

## File-by-file tour

| File | Purpose |
|---|---|
| `backend/app/qeval/types.py` | `QuestionVerdict` dataclass + enums (QAction/Length/Quality/LeadSignal) |
| `backend/app/qeval/rules.py` | Deterministic prefilter (spam+profanity), `rough_length`, `needs_llm` cost guard |
| `backend/app/qeval/prompt.py` | Groq JSON classifier system prompt |
| `backend/app/qeval/evaluator.py` | `QuestionEvaluator.evaluate()` — rules-only or Groq; always fail-open |
| `backend/app/qeval/lead.py` | `is_qualified()` threshold gate; `accumulate_lead()` counter updater |
| `backend/app/rag/llm.py` | `evaluate_question()` Groq call; `_system_with_directives()` length blocks; `LENGTH_MAX_TOKENS` |
| `backend/app/rag/generator.py` | `generate_answer(length=)` param; `_enforce_length()` post-gen guard; `# SEAM:` comment |
| `backend/app/api/chat.py` | Full pipeline: prefilter → normalize → qeval → retrieve → generate → lead accumulation → offer logic |
| `backend/app/core/db.py` | Idempotent migrations: 7 lead cols + `abuse_flagged` on `students`; 6 qeval/observability cols on `chat_audit` |
| `backend/app/core/config.py` | `qeval_use_llm`, rate limit thresholds, throttle config, `handoff_target` |
| `backend/app/core/limiter.py` | Shared slowapi `Limiter` + IP/composite key functions |
| `backend/app/core/throttle.py` | 3-tier escalation policy (in-memory, fail-open) |
| `backend/app/core/metrics.py` | Thread-safe in-memory counters |
| `backend/app/main.py` | Limiter attach + custom 429 handler (calls `record_over_limit`) |
| `backend/app/api/admin.py` | `GET /admin/metrics` counters endpoint (JWT) |
| `backend/app/models/student.py` | Lead + abuse ORM columns; `StudentOut` mirrored |
| `frontend/src/lib/api.ts` | `ChatResponse` gains 5 optional fields (C9-safe) |
| `frontend/src/app/chat/page.tsx` | Deleted regex heuristics; counselor offer driven by `res.offer_counselor`; `CounselorCard` reads `handoff_target` |
| `backend/eval_suite/golden.yaml` | 15 golden test cases |
| `backend/eval_suite/run_suite.py` | Pre-merge quality gate runner + Gemini judge + `report.md` writer |

**Plan:** `C:\Users\bhim1\.claude\plans\so-can-i-just-synthetic-pixel.md`

---

## How to run and test locally

```bash
# 1. Checkout
git checkout improvement-chat-fullstack

# 2. Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload   # needs .env with GEMINI_API_KEY + GROQ_API_KEY + POSTGRES_URL

# 3. Seed Chroma (if not already seeded)
python scripts/seed_knowledge.py

# 4. Frontend
cd ../frontend
npm install
npm run dev   # needs NEXT_PUBLIC_API_URL=http://localhost:8000/api

# 5. Unit tests
cd ../backend
pytest tests/test_qeval_rules.py tests/test_qeval_fallback.py tests/test_lead.py \
       tests/test_eval.py tests/test_normalizer.py -v

# 6. Smoke checks (with jq)
curl -s -X POST http://localhost:8000/chat \
  -H 'Content-Type: application/json' \
  -d '{"student_id":"<id>","message":"Is IELTS required for the UK?"}' | jq '.answer_length,.offer_counselor'
# Expected: "short", false

curl -s -X POST http://localhost:8000/chat \
  -d '{"student_id":"<id>","message":"aaaa http://x.com http://y.com"}' | jq '.reason'
# Expected: "spam"  (no LLM call)

# Kill GROQ_API_KEY and verify fallback:
GROQ_API_KEY="" uvicorn app.main:app --reload
# Chat should still answer; chat_audit.qeval_source="rules"

# 7. Pre-merge quality gate (requires running backend + seeded Chroma)
python backend/eval_suite/run_suite.py
# Must print GATE GREEN with zero mission-safety failures and >=13/15 pass
```

---

## What to look for in review

- **C1 removed cleanly:** `COUNSELOR_HANDOFF_RE` deleted; offer now from `res.offer_counselor` — prompt edits can't break the handoff.
- **C3 preserved:** profanity check runs on the ORIGINAL message (prefilter step 1), before normalization.
- **C9 preserved:** all new `ChatResponse` fields are optional with defaults — no renames.
- **C6 untouched:** no new `chat_turns` role; new columns are on `students`/`chat_audit` only.
- **Fail-open everywhere:** `evaluate()`, `evaluate_question()`, `accumulate_lead()`, throttle, metrics all catch exceptions silently — zero new 500 paths on the chat endpoint.
- **No deploy substrate touched:** `deploy.yml`, `docker-compose.prod.yml`, `Caddyfile`, Dockerfiles are unchanged.
- **Groq/Gemini SDK imports** remain only in `backend/app/rag/llm.py`.
- **All DB changes** use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — safe additive-only, run at startup.

---

## Merge checklist

- [ ] Phase 9 gate green: `python backend/eval_suite/run_suite.py` → 0 mission-safety failures, ≥13/15 pass
- [ ] `pytest tests/test_qeval_rules.py tests/test_qeval_fallback.py tests/test_lead.py tests/test_eval.py tests/test_normalizer.py` → all pass
- [ ] `npm run build` (frontend) → no errors
- [ ] Manually click through `/chat` — short vs long replies render, counselor card appears only when backend says so
- [ ] No secrets or API keys in the diff
- [ ] **Merge = live deploy to `abroadly.online` via GitHub Actions. Only merge on green light.**
