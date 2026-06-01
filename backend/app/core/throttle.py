"""Graduated rate-limit escalation policy (3 tiers).

In-memory only — acceptable for a single-VPS deployment. Cleared on restart.
Seam: replace the dict + timestamps with Redis for multi-instance scaling.

Tier 1 — slowapi handles the 429 automatically (no state here).
Tier 2 — repeated offenders get a cooling-down window; /chat returns 429
         immediately without touching qeval/LLM.
Tier 3 — persistently abusive student_id gets abuse_flagged=True in DB so
         a human admin can review and manually pause the account.

Fail-open contract: any exception in this module must let the request through,
never cause a 500.
"""
from __future__ import annotations

import logging
import time
from collections import defaultdict
from typing import NamedTuple

from app.core.config import settings

log = logging.getLogger("abroadly.throttle")


class _OffenderRecord(NamedTuple):
    over_limit_timestamps: list[float]  # rolling window of over-limit events
    cooldown_until: float               # epoch; 0.0 = not in cooldown


# keyed by IP or student_id string
_offenders: dict[str, _OffenderRecord] = defaultdict(
    lambda: _OffenderRecord(over_limit_timestamps=[], cooldown_until=0.0)
)


def _record(key: str) -> _OffenderRecord:
    rec = _offenders[key]
    # Drop timestamps outside the rolling window
    now = time.time()
    cutoff = now - settings.throttle_burst_window_s
    fresh = [t for t in rec.over_limit_timestamps if t > cutoff]
    updated = _OffenderRecord(over_limit_timestamps=fresh, cooldown_until=rec.cooldown_until)
    _offenders[key] = updated
    return updated


def is_cooling_down(key: str) -> bool:
    """Return True when this key is in Tier 2 cooldown (request should 429 immediately)."""
    try:
        rec = _record(key)
        return rec.cooldown_until > time.time()
    except Exception:
        return False  # fail-open


def record_over_limit(key: str) -> None:
    """Called when slowapi issues a 429 for this key. Escalates tiers as needed."""
    try:
        rec = _record(key)
        now = time.time()
        fresh = rec.over_limit_timestamps + [now]
        cooldown_until = rec.cooldown_until

        if len(fresh) >= settings.throttle_flag_threshold:
            # Tier 3: mark for admin review (handled by caller who has DB access)
            log.warning("throttle: Tier 3 flag triggered for key=%s burst_count=%d", key, len(fresh))

        if len(fresh) >= 3 and cooldown_until <= now:
            # Tier 2: enter cooling-down
            cooldown_until = now + settings.throttle_cooldown_s
            log.info("throttle: Tier 2 cooldown started for key=%s until=%.0f", key, cooldown_until)

        _offenders[key] = _OffenderRecord(
            over_limit_timestamps=fresh,
            cooldown_until=cooldown_until,
        )
    except Exception as exc:
        log.debug("throttle.record_over_limit error (ignored): %s", exc)


def should_flag_for_admin(key: str) -> bool:
    """Return True if this key has hit the Tier 3 threshold."""
    try:
        rec = _record(key)
        return len(rec.over_limit_timestamps) >= settings.throttle_flag_threshold
    except Exception:
        return False  # fail-open
