"""Async transactional email — used by background tasks, never blocks request path.

Failure mode: any exception is logged and swallowed. Email is best-effort; the
student's account creation must succeed even if our SMTP server is down or
mis-configured. Don't let mail problems become user-facing errors.
"""
from __future__ import annotations

import logging
from html import escape
from email.message import EmailMessage
from pathlib import Path

import aiosmtplib

from app.core.config import settings

log = logging.getLogger(__name__)

_TEMPLATE_DIR = Path(__file__).parent.parent / "email_templates"


def _read_template(name: str) -> str:
    return (_TEMPLATE_DIR / name).read_text(encoding="utf-8")


def _render(template: str, **values: str) -> str:
    """Tiny placeholder substitution — `{{ key }}` → values[key].

    Avoids jinja2 dependency. HTML safely contains `{` / `}` (CSS); we only
    replace the explicit `{{ key }}` form which is unambiguous.
    """
    out = template
    for key, value in values.items():
        out = out.replace("{{ " + key + " }}", value)
    return out


async def send_email(*, to: str, subject: str, html: str, text: str) -> bool:
    """Send a single transactional email. Returns True on success, False on failure.

    No-ops (and returns False) if email is not configured. Never raises.
    """
    if not settings.email_enabled:
        log.info("email_skipped: SMTP not configured (to=%s subject=%s)", to, subject)
        return False

    msg = EmailMessage()
    msg["From"] = f"{settings.email_from_name} <{settings.email_from_address}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username,
            password=settings.smtp_password,
            start_tls=True,
            timeout=20,
        )
        log.info("email_sent: to=%s subject=%s", to, subject)
        return True
    except Exception:
        # Log full traceback for debugging but never propagate.
        log.exception("email_send_failed: to=%s subject=%s", to, subject)
        return False


# ---------------------------------------------------------------------------
# Welcome email — fired from /students on first signup.
# ---------------------------------------------------------------------------
def _first_name(full_name: str) -> str:
    """Best-effort first name; falls back to 'there' for empty/edge-case input."""
    if not full_name:
        return "there"
    return full_name.strip().split()[0] if full_name.strip() else "there"


async def send_welcome_email(*, to: str, full_name: str) -> bool:
    """Fire-and-forget welcome message to a newly-created student."""
    first = _first_name(full_name)
    values = {
        "first_name": first,
        "site_url": settings.public_site_url,
        "chat_url": f"{settings.public_site_url}/chat",
        "privacy_url": f"{settings.public_site_url}/privacy",
        "terms_url": f"{settings.public_site_url}/terms",
        "from_address": settings.email_from_address or "hello@abroadly.online",
    }
    html = _render(_read_template("welcome.html"), **values)
    text = _render(_read_template("welcome.txt"), **values)
    subject = f"Welcome to Abroadly, {first}"
    return await send_email(to=to, subject=subject, html=html, text=text)


async def send_service_request_notification(
    *,
    full_name: str,
    email: str,
    phone: str,
    request_type: str,
    test_type: str | None = None,
    preferred_time: str | None = None,
) -> bool:
    """Notify the internal team about every student service request."""
    recipient = settings.lead_notification_email.strip()
    if not recipient:
        log.info("service_request_email_skipped: LEAD_NOTIFICATION_EMAIL not configured")
        return False

    request_label = request_type.replace("_", " ").title()
    details = [
        ("Student", full_name),
        ("Email", email),
        ("Phone", phone),
        ("Request", request_label),
        ("Test", test_type or "Not specified"),
        ("Preferred time", preferred_time or "Not specified"),
    ]
    html_rows = "".join(
        f"<tr><td style='padding:6px 12px 6px 0;color:#6b655c'>{escape(label)}</td>"
        f"<td style='padding:6px 0;font-weight:600'>{escape(value)}</td></tr>"
        for label, value in details
    )
    html = (
        "<div style='font-family:Arial,sans-serif;color:#1b1916'>"
        f"<h2>New {escape(request_label)}</h2><table>{html_rows}</table>"
        f"<p><a href='{escape(settings.public_site_url)}/admin/requests'>Open request inbox</a></p>"
        "</div>"
    )
    text = "New Abroadly service request\n\n" + "\n".join(
        f"{label}: {value}" for label, value in details
    )
    return await send_email(
        to=recipient,
        subject=f"Abroadly: {request_label} from {full_name}",
        html=html,
        text=text,
    )
