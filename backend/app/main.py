"""Abroadly FastAPI entrypoint."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.api import admin, auth, chat, onboarding, upload
from app.core.config import settings
from app.core.db import create_tables
from app.core.limiter import _get_client_ip, limiter
from app.core.throttle import record_over_limit


async def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Custom 429 handler — records the over-limit event for Tier 2/3 escalation."""
    try:
        from app.core.metrics import increment as metric_inc
        metric_inc("rate_limit_429s")
        ip = _get_client_ip(request)
        record_over_limit(ip)
    except Exception:
        pass  # fail-open: throttle/metrics update must never 500
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please slow down and try again."},
        headers={"Retry-After": "60"},
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Run startup tasks before serving, cleanup on shutdown."""
    await create_tables()
    yield


app = FastAPI(
    title="Abroadly API",
    description="Student intake + free AI guidance for study-abroad planning.",
    version="0.1.0",
    lifespan=lifespan,
)

# Attach limiter to app state so slowapi middleware can find it.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(onboarding.router, prefix="/students", tags=["onboarding"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {"status": "ok", "env": settings.app_env}
