# PR #55 Review — `improvement-chat-fullstack`

> Reviewer: Claude · Date: 2026-06-01
> PR: https://github.com/stha-hardik/abroadly/pull/55
> Branch: `improvement-chat-fullstack` → `main`
> Stats: 28 files · +2013 / −76 · `mergeStateStatus: CLEAN`

---

## What changed in simple terms

### Question Evaluation Layer

We added a "screening step" before Gemini answers anything. Every question a
student sends now goes through a small, fast AI model (Groq's `llama-3.1-8b`)
first — think of it as a cheap receptionist that reads the question before
passing it to the expensive expert (Gemini). This receptionist decides three
things: how long should the answer be, is this question worth answering at
all, and does it contain any lead signals (signs the student is serious about
studying abroad). Based on this, Gemini gets clear instructions — write 1–2
sentences for simple questions, a medium paragraph for moderate ones, and a
full detailed response only for complex ones. If the question is spam,
gibberish, or contains URLs/profanity, it gets rejected right here and Gemini
never even sees it — saving both time and money.

### Lead Signals & Counselor Card

Previously, the frontend was scanning Gemini's actual answer text using keyword
matching to decide when to show the "Talk to a Counselor" card. This was
fragile — if Gemini rephrased something slightly, or if we changed the prompt,
the card could stop appearing without anyone noticing. Now the backend tracks
meaningful signals across every turn in the conversation — things like asking
about visa requirements, tuition costs, application deadlines, or funding
options. These signals accumulate in the database per student. Once a student
crosses a threshold (2 strong signals, or 3 good ones, or 4 standard ones),
the backend itself sends a flag saying "offer the counselor now." The frontend
just listens for that flag. This means the counselor offer is now consistent,
reliable, and completely immune to how Gemini words its answers.

### Rate Limiting & Abuse Protection

Before this update, anyone could send unlimited messages to the chat endpoint
with no restrictions. We added a three-layer protection system. **First
layer — hard limits**: 20 messages per minute per user, 40 per minute per IP.
If someone hits this, they get a "slow down" response (HTTP 429). **Second
layer — cooldown**: if someone keeps hitting the limit repeatedly, they get a
15-minute cooldown where every request is rejected. **Third layer — abuse
flag**: if they persist even after the cooldown, they get flagged in the
database for admin review. All of this runs before any LLM is called, so
abusive traffic costs nothing. On top of this, there's a deterministic spam
prefilter (no AI involved) that instantly catches URL floods, random
gibberish, and profanity — again, before Gemini even wakes up.

### Observability (Admin Visibility)

Before this update the backend was essentially a black box — there was no way
to tell what was happening inside in real time. Now every single chat request
is broken down and timed stage by stage: how long did the spam check take,
how long did retrieval take, did the question evaluator use AI or fall back
to rules, did Gemini answer or did the Groq fallback kick in. All of this
gets saved to the database per request. There's also a new admin-only
endpoint (`/admin/metrics`) that shows live counters — total chats handled,
spam attempts blocked, Gemini calls made, Groq fallback hits, rate limit
triggers — giving a real-time health dashboard for the chat system without
needing to dig through logs.

---

## What it does — short version

Three things on the chat path: (1) a cheap Groq classifier decides reply
length so Gemini stops writing essays to every question; (2) the backend now
decides when to offer the counsellor (the frontend no longer scans answer
text with a regex); (3) abuse + cost hygiene — rate limiting, spam
prefilter, structured logs + a `/admin/metrics` endpoint. Plus unit tests
and an eval-suite quality gate.

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
