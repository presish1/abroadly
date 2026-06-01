# PR #55 Review — `improvement-chat-fullstack`

> Reviewer: Claude · Date: 2026-06-01
> PR: https://github.com/stha-hardik/abroadly/pull/55
> Branch: `improvement-chat-fullstack` → `main`
> Stats: 28 files · +2013 / −76 · `mergeStateStatus: CLEAN`

---

## What it does (one paragraph)

Three things, all on the chat path: (1) a cheap Groq classifier decides if the
reply should be **short / medium / long** so Gemini stops writing essays to every
question, with per-bucket token caps; (2) the **backend** now decides when to
offer the counsellor (the frontend no longer scans the answer text with a regex
that prompt edits could silently break); (3) **abuse + cost hygiene** — rate
limiting, a spam prefilter that runs before any LLM token, and structured logs
+ a `/admin/metrics` endpoint. Plus unit tests + an eval-suite quality gate.

---

## Verified against the branch-review doc

| Claim | Actual |
|---|---|
| 28 files, +2013 / −76 | ✓ exact match |
| Deploy substrate untouched | ✓ no `docker-compose`, `deploy.yml`, `Caddyfile`, or `Dockerfile` in diff |
| `COUNSELOR_HANDOFF_RE` removed | ✓ only mentions left are in `BRANCH-REVIEW.md` itself, no code refs |
| DB changes additive-only | ✓ all `ADD COLUMN IF NOT EXISTS`, zero DROP/RENAME |
| `ChatResponse` new fields C9-safe | ✓ all optional with `?` |
| Groq/Gemini SDK imports only in `llm.py` | ⚠️ minor doc inaccuracy — `upload.py`, `retriever.py`, `seed_knowledge.py` also import Gemini, **but those are pre-existing on `main`** and unchanged by this PR. Not a blocker; just an outdated invariant in the doc. |
| No secrets in diff | ✓ clean |
| Mergeable | ✓ GitHub says `CLEAN`, no conflicts |

---

## What I'd want before merging

1. **Run the eval suite** the PR itself demands:
   ```bash
   python backend/eval_suite/run_suite.py
   ```
   Must print `GATE GREEN` with **0 mission-safety failures** and **≥13/15 pass**.
   This is the highest-value check because it validates answer *quality*, not
   just code correctness. **No CI runs this automatically — only a human can
   press the button.**

2. **Frontend build sanity:**
   ```bash
   cd frontend && npm run build
   ```
   Quick check that nothing TS-broke.

3. **Manual smoke test** on a staging container:
   - Ask one short question (e.g. *"Is IELTS required for the UK?"*) — expect
     a 1–2 sentence reply, no counsellor card.
   - Ask one long question (e.g. *"Walk me through the full Australia
     subclass 500 application timeline."*) — expect a multi-paragraph reply.
   - Confirm the counsellor card appears **only when the backend sends
     `offer_counselor: true`** — not whenever the answer text mentions a
     counsellor.

---

## Verdict

**Don't merge yet — but it's close.**

Code is well-scoped, additive, fail-open everywhere. The risks aren't
structural; they're operational:

- Rate-limit defaults might under-tune for legit traffic (40/min IP,
  20/min user — looks generous, but real traffic patterns will tell).
- Groq classifier could hallucinate a wrong length bucket (mediums get
  cut off, shorts get bloated).

Those only show up at runtime, which is exactly what the eval suite is
designed to catch. **Run the gate, then merge.**

---

## Quick reference — files touched

| Area | Files |
|---|---|
| Backend qeval pipeline | `backend/app/qeval/{types,rules,prompt,evaluator,lead}.py` |
| Backend LLM + generation | `backend/app/rag/{llm,generator}.py` |
| Backend chat orchestration | `backend/app/api/chat.py` |
| Backend infra | `backend/app/core/{db,config,limiter,throttle,metrics}.py`, `backend/app/main.py` |
| Backend models | `backend/app/models/student.py`, `backend/app/api/admin.py` |
| Frontend | `frontend/src/app/chat/page.tsx`, `frontend/src/lib/api.ts` |
| Tests | `backend/tests/test_qeval_rules.py`, `test_qeval_fallback.py`, `test_lead.py` |
| Quality gate | `backend/eval_suite/golden.yaml`, `backend/eval_suite/run_suite.py` |
| Docs | `BRANCH-REVIEW.md` |
