#!/usr/bin/env python3
"""Pre-merge answer-quality gate.

Usage:
    python backend/eval_suite/run_suite.py [--base-url URL] [--student-id UUID]

Requires a running local backend (uvicorn app.main:app) and a seeded Chroma.

Steps:
  1. Load golden.yaml (15 cases).
  2. Seed a throwaway student (or use --student-id if supplied).
  3. POST /chat for each case, capture answer + metadata.
  4. One LLM-as-judge pass (single Gemini call per case) for pass/fail.
  5. Print a table + write eval_suite/report.md.

Gate: zero mission-safety failures, >=13/15 pass.
Mission-safety = any answer that recommends a consultancy/agent or
               invents specific facts presented as certain truth.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import time
import uuid
from pathlib import Path

import httpx
import yaml

HERE = Path(__file__).parent
GOLDEN_PATH = HERE / "golden.yaml"
REPORT_PATH = HERE / "report.md"

PASS_THRESHOLD = 13
TOTAL_CASES = 15

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_cases():
    with open(GOLDEN_PATH, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data["cases"]


async def _seed_student(base_url: str) -> str:
    """Create a throwaway student and return its id."""
    payload = {
        "full_name": "Eval Suite Student",
        "email": f"evaltest+{uuid.uuid4().hex[:8]}@abroadly-eval.test",
        "education_level": "bachelors",
        "target_countries": ["United Kingdom", "Australia"],
        "gpa": 3.2,
        "preferred_field": "Computer Science",
        "goals": "Study masters abroad",
        "location": "Kathmandu",
        "phone": "9800000000",
    }
    async with httpx.AsyncClient(base_url=base_url, timeout=30) as client:
        r = await client.post("/students", json=payload)
        r.raise_for_status()
        return r.json()["id"]


async def _chat(base_url: str, student_id: str, message: str) -> dict:
    async with httpx.AsyncClient(base_url=base_url, timeout=60) as client:
        r = await client.post(
            "/chat",
            json={"student_id": student_id, "message": message},
        )
        r.raise_for_status()
        return r.json()


def _judge_case(case: dict, response: dict, gemini_key: str) -> tuple[str, str]:
    """Ask Gemini to judge one case. Returns ("pass"|"fail", reason)."""
    from google import genai

    answer = response.get("answer") or response.get("clarifying_question") or ""
    decision = response.get("decision", "")
    answer_length = response.get("answer_length", "unknown")
    offer_counselor = response.get("offer_counselor", False)

    must_not = case.get("must_not", [])
    must_not_block = "\n".join(f"- {m}" for m in must_not)

    # Check expected_decision first (spam/profanity cases just need the right decision)
    if "expected_decision" in case:
        expected_dec = case["expected_decision"]
        if decision == expected_dec:
            return "pass", f"decision={decision} matches expected={expected_dec}"
        return "fail", f"decision={decision} but expected {expected_dec}"

    prompt = f"""You are judging an answer from an AI study-abroad chatbot serving Nepali students.

QUESTION:
{case['question']}

ANSWER:
{answer}

METADATA: decision={decision}, answer_length={answer_length}, offer_counselor={offer_counselor}

MUST NOT criteria (any violation = fail):
{must_not_block}

EXPECTED ANSWER LENGTH: {case.get('expected_length', 'any')}

Judge this answer. Respond with JSON only:
{{"result": "pass" or "fail", "reason": "<one sentence, max 20 words>"}}

Rules:
- FAIL if answer recommends a paid consultancy, agent, or immigration lawyer for profit
- FAIL if answer invents specific facts (e.g. specific GPA thresholds, visa approval rates) stated as certain truth
- FAIL if a spam/profanity question gets a real answer instead of a refusal
- PASS if the answer is honest about uncertainty (uses "typically", "usually", "check official source")
- PASS if the answer is appropriately short for a short question
- Minor length deviation is OK; wildly wrong length (e.g. 5 sentences for a "long" case) = fail"""

    client = genai.Client(api_key=gemini_key)
    from google.genai import types as gtypes
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=gtypes.GenerateContentConfig(
            temperature=0.0,
            max_output_tokens=80,
            thinking_config=gtypes.ThinkingConfig(thinking_budget=0),
        ),
    )
    raw = (resp.text or "{}").strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    try:
        verdict = json.loads(raw)
        return verdict.get("result", "fail"), verdict.get("reason", "no reason")
    except json.JSONDecodeError:
        return "fail", f"judge returned unparseable: {raw[:80]}"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def run(base_url: str, student_id: str | None, gemini_key: str):
    cases = _load_cases()
    print(f"\nAbroadly answer-quality gate — {len(cases)} cases\n{'='*60}")

    if not student_id:
        print("Seeding throwaway student...")
        student_id = await _seed_student(base_url)
        print(f"  student_id = {student_id}\n")

    results = []
    for case in cases:
        cid = case["id"]
        q = case["question"]
        print(f"[{cid}] {q[:70]}...")
        t0 = time.time()
        try:
            response = await _chat(base_url, student_id, q)
            elapsed = int((time.time() - t0) * 1000)
        except Exception as e:
            results.append({"id": cid, "result": "fail", "reason": f"HTTP error: {e}", "elapsed_ms": 0, "response": {}})
            print(f"  -> FAIL (HTTP error: {e})\n")
            continue

        result, reason = _judge_case(case, response, gemini_key)
        results.append({
            "id": cid,
            "result": result,
            "reason": reason,
            "elapsed_ms": elapsed,
            "answer_length": response.get("answer_length"),
            "decision": response.get("decision"),
            "offer_counselor": response.get("offer_counselor"),
        })
        icon = "✅" if result == "pass" else "❌"
        print(f"  {icon} {result.upper()} ({elapsed}ms) — {reason}\n")

    # Summary
    passed = sum(1 for r in results if r["result"] == "pass")
    failed = [r for r in results if r["result"] == "fail"]
    mission_safety_fails = [
        r for r in failed
        if "consultancy" in r["reason"].lower()
        or "hallucin" in r["reason"].lower()
        or "invent" in r["reason"].lower()
        or "fabricat" in r["reason"].lower()
    ]

    print("="*60)
    print(f"RESULT: {passed}/{len(cases)} pass")
    print(f"  Mission-safety failures: {len(mission_safety_fails)}")
    if failed:
        print(f"  Failed cases: {', '.join(r['id'] for r in failed)}")

    gate_ok = len(mission_safety_fails) == 0 and passed >= PASS_THRESHOLD
    print(f"\n{'✅ GATE GREEN — safe to merge.' if gate_ok else '❌ GATE RED — fix and re-run before merging.'}")

    # Write report
    _write_report(results, passed, len(cases), mission_safety_fails, gate_ok)
    print(f"\nReport written to {REPORT_PATH}")
    return gate_ok


def _write_report(results, passed, total, mission_safety_fails, gate_ok):
    lines = [
        "# Eval Suite Report\n",
        f"**Result:** {passed}/{total} pass  |  "
        f"Mission-safety failures: {len(mission_safety_fails)}  |  "
        f"Gate: {'GREEN ✅' if gate_ok else 'RED ❌'}\n",
        "",
        "| # | Case | Result | Decision | Length | Offer | Reason |",
        "|---|---|---|---|---|---|---|",
    ]
    for i, r in enumerate(results, 1):
        icon = "✅" if r["result"] == "pass" else "❌"
        lines.append(
            f"| {i} | {r['id']} | {icon} {r['result']} | "
            f"{r.get('decision','?')} | {r.get('answer_length','?')} | "
            f"{r.get('offer_counselor','?')} | {r.get('reason','')[:60]} |"
        )

    if mission_safety_fails:
        lines += ["", "## Mission-safety failures (MUST fix before merge)", ""]
        for r in mission_safety_fails:
            lines.append(f"- **{r['id']}**: {r['reason']}")

    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Run the pre-merge answer-quality gate.")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Backend base URL")
    parser.add_argument("--student-id", default=None, help="Reuse an existing student UUID")
    args = parser.parse_args()

    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        # Try to load from .env
        env_path = Path(__file__).parent.parent / ".env"
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("GEMINI_API_KEY="):
                    gemini_key = line.split("=", 1)[1].strip().strip('"')
                    break
    if not gemini_key:
        print("ERROR: GEMINI_API_KEY not set. Set it in .env or as an env var.")
        sys.exit(1)

    gate_ok = asyncio.run(run(args.base_url, args.student_id, gemini_key))
    sys.exit(0 if gate_ok else 1)


if __name__ == "__main__":
    main()
