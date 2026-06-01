"""In-memory counters for chat pipeline observability.

Exposed at GET /admin/metrics (JWT-protected). No Prometheus needed; leave a
seam below noting where a /metrics exporter would slot in if desired later.

Counters are never persisted — cleared on restart. The durable record is
chat_audit (latency_ms, provider, qeval_* columns).

SEAM: to add a Prometheus /metrics endpoint, swap the dict for a
      prometheus_client.Counter/Gauge registry and expose /metrics via a
      starlette route. The increment calls below stay the same.
"""
from __future__ import annotations

import threading

_lock = threading.Lock()

_counters: dict[str, int] = {
    "chat_total": 0,
    "spam_rejects": 0,
    "gemini_calls": 0,
    "groq_eval_calls": 0,
    "groq_fallback_hits": 0,
    "rate_limit_429s": 0,
    "qeval_llm_failures": 0,
}


def increment(key: str, by: int = 1) -> None:
    """Increment a counter. Fail-open — any error is silently ignored."""
    try:
        with _lock:
            _counters[key] = _counters.get(key, 0) + by
    except Exception:
        pass


def snapshot() -> dict[str, int]:
    """Return a copy of the current counters."""
    with _lock:
        return dict(_counters)
