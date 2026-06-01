"""Shared slowapi Limiter instance.

Imported by main.py (to attach to app.state) and by api/chat.py + api/upload.py
(to apply @limiter.limit decorators). Kept here to avoid circular imports.
"""
from __future__ import annotations

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def _get_client_ip(request: Request) -> str:
    """Real client IP — Caddy sets X-Forwarded-For; fall back to remote addr."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


def _get_ip_and_student(request: Request) -> str:
    """Composite key: IP + student_id. Stops one student rotating IPs AND
    stops one IP rotating fake student_ids (two independent limits)."""
    ip = _get_client_ip(request)
    body_student = None
    # Path param for GET; body param for POST (already parsed by FastAPI, accessible via state)
    if hasattr(request.state, "student_id"):
        body_student = request.state.student_id
    return f"{ip}:{body_student or 'anon'}"


# Single Limiter — key_func is per-IP for the first decorator; the second
# decorator uses a custom key_func for the composite key.
limiter = Limiter(key_func=_get_client_ip)
