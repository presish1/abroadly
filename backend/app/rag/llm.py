"""LLM provider abstraction.

All generation goes through llm.generate(). No Groq/Gemini SDK imports
outside this file. Swap providers by changing the active adapter here.
"""
from __future__ import annotations

from typing import Protocol

from app.core.config import settings

# Per-bucket token caps — deliberately tight because this is a chat surface,
# not a report generator. A deterministic word cap runs after generation too.
LENGTH_MAX_TOKENS: dict[str, int] = {"short": 70, "medium": 130, "long": 210}

# Fallback when length bucket is unknown.
MAX_TOKENS = 220
TEMPERATURE = 0.4

# Generation models, tried in order. gemini-2.5-flash is ~2s/reply; the
# 3.5-flash preview measured 20-40s on this key, so it's intentionally NOT
# used — speed matters far more for chat. Revisit if 3.5-flash gets faster.
GEMINI_MODELS = ["gemini-2.5-flash"]

# Conversation history is a list of {"role": "user"|"assistant", "content": str}.
ChatHistory = list[dict]


class LLMProvider(Protocol):
    async def generate(
        self,
        system: str,
        context: str,
        profile: str,
        query: str,
        history: ChatHistory | None = None,
        mode: str = "full",
        length: str = "medium",
    ) -> str: ...

    async def normalize(self, system: str, query: str) -> str: ...

    async def evaluate_question(
        self,
        system: str,
        message: str,
        history: ChatHistory | None = None,
    ) -> dict: ...


# Tuning for the normalizer call — much smaller + cheaper than generate().
NORMALIZER_MAX_TOKENS = 200
NORMALIZER_TEMPERATURE = 0.0  # deterministic; we want consistent translations
NORMALIZER_MODEL = "gemini-2.0-flash"  # Flash variant — fast, cheap, multilingual


_LENGTH_DIRECTIVES: dict[str, str] = {
    "short": (
        "## Mode: LENGTH=short\n"
        "Reply in 1–2 sentences and no more than 28 words. No bullets, no headers, no lists. "
        "Lead with the direct answer. If a fact needs a caveat, fold it into the sentence."
    ),
    "medium": (
        "## Mode: LENGTH=medium\n"
        "Reply in 30–55 words. Use at most 2 short bullets when a list is essential; "
        "otherwise use a compact paragraph. Lead with the answer and give one next step."
    ),
    "long": (
        "## Mode: LENGTH=long\n"
        "Reply in 60–90 words. Use this space only for an explicitly multi-part request. "
        "Use at most 3 concise bullets. Lead with the answer and end with one next step."
    ),
}


class GroqGeminiLLM:
    """Gemini 2.5 Flash primary (stronger context/instruction following);
    Groq llama-3.3-70b fallback when Gemini is unavailable or rate-limited."""

    async def generate(
        self,
        system: str,
        context: str,
        profile: str,
        query: str,
        history: ChatHistory | None = None,
        mode: str = "full",
        length: str = "medium",
    ) -> str:
        import logging
        log = logging.getLogger("abroadly.llm")

        if settings.gemini_api_key:
            try:
                return await self._gemini(system, context, profile, query, history or [], mode, length)
            except Exception as e:
                log.error("Gemini failed: %s: %s", type(e).__name__, e)
        if settings.groq_api_key:
            try:
                return await self._groq(system, context, profile, query, history or [], mode, length)
            except Exception as e:
                log.error("Groq failed: %s: %s", type(e).__name__, e)
        return "Sorry, I'm having trouble connecting right now. Please try again in a moment."

    @staticmethod
    def _system_with_directives(system: str, mode: str, length: str) -> str:
        """Append length directive then (optionally) partial-mode instruction."""
        directive = _LENGTH_DIRECTIVES.get(length, _LENGTH_DIRECTIVES["medium"])
        result = system + "\n\n" + directive
        if mode == "partial":
            result += (
                "\n\n## Mode: PARTIAL\nThe retrieved context is thin for this "
                "question. Answer the part you can ground, then explicitly name "
                "what you don't know, then point the student at the authoritative "
                "official source (university registrar URL, embassy URL, government "
                "immigration portal). Do not pretend the gap doesn't exist. Do not "
                "refuse the whole question because one part is missing."
            )
        return result

    @staticmethod
    def _user_payload(profile: str, context: str, query: str) -> str:
        return (
            f"<student-profile>\n{profile}\n</student-profile>\n\n"
            f"<knowledge-base>\n{context}\n</knowledge-base>\n\n"
            f"<student-message>\n{query}\n</student-message>\n\n"
            f"IMPORTANT: Respond to the student's actual message above. "
            f"Only reference facts from their profile or knowledge base. "
            f"Do not invent information they haven't shared."
        )

    async def _groq(
        self,
        system: str,
        context: str,
        profile: str,
        query: str,
        history: ChatHistory,
        mode: str,
        length: str,
    ) -> str:
        from groq import AsyncGroq

        client = AsyncGroq(api_key=settings.groq_api_key)
        messages: list[dict] = [{"role": "system", "content": self._system_with_directives(system, mode, length)}]
        for turn in history[-4:]:
            role = turn.get("role")
            content = turn.get("content")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": self._user_payload(profile, context, query)})

        max_tok = LENGTH_MAX_TOKENS.get(length, MAX_TOKENS)
        for model in ("llama-3.3-70b-versatile", "llama-3.1-8b-instant"):
            try:
                resp = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=TEMPERATURE,
                    max_tokens=max_tok,
                )
                return resp.choices[0].message.content.strip()
            except Exception:
                continue
        raise RuntimeError("All Groq models failed")

    async def _gemini(
        self,
        system: str,
        context: str,
        profile: str,
        query: str,
        history: ChatHistory,
        mode: str,
        length: str,
    ) -> str:
        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)
        contents = []
        for t in history[-4:]:
            role = t.get("role")
            content = t.get("content")
            if role in ("user", "assistant") and content:
                contents.append(genai.types.Content(
                    role="user" if role == "user" else "model",
                    parts=[genai.types.Part(text=content)],
                ))
        contents.append(genai.types.Content(
            role="user",
            parts=[genai.types.Part(text=self._user_payload(profile, context, query))],
        ))

        max_tok = LENGTH_MAX_TOKENS.get(length, MAX_TOKENS)
        # Disable the model's "thinking" phase — the biggest latency lever on
        # 2.5/3.x flash. If a model rejects it, the GEMINI_MODELS loop falls
        # through to the next model (and ultimately Groq).
        config = genai.types.GenerateContentConfig(
            system_instruction=self._system_with_directives(system, mode, length),
            temperature=TEMPERATURE,
            max_output_tokens=max_tok,
            thinking_config=genai.types.ThinkingConfig(thinking_budget=0),
        )
        # Prefer the newest flash; fall back to known-good IDs if a newer one
        # isn't available on this API key/region.
        last_err: Exception | None = None
        for model in GEMINI_MODELS:
            try:
                response = await client.aio.models.generate_content(
                    model=model, contents=contents, config=config,
                )
                text = (response.text or "").strip()
                if text:
                    return text
            except Exception as e:
                last_err = e
                continue
        if last_err:
            raise last_err
        raise RuntimeError("All Gemini models returned empty")

    async def normalize(self, system: str, query: str) -> str:
        if not settings.gemini_api_key:
            raise RuntimeError("normalizer_unavailable: no GEMINI_API_KEY")

        from google import genai

        client = genai.Client(api_key=settings.gemini_api_key)
        response = await client.aio.models.generate_content(
            model=NORMALIZER_MODEL,
            contents=query,
            config=genai.types.GenerateContentConfig(
                system_instruction=system,
                temperature=NORMALIZER_TEMPERATURE,
                max_output_tokens=NORMALIZER_MAX_TOKENS,
            ),
        )
        return (response.text or "").strip()

    async def evaluate_question(
        self,
        system: str,
        message: str,
        history: ChatHistory | None = None,
    ) -> dict:
        """Classify a student question using Groq llama-3.1-8b-instant (JSON mode).

        Uses temperature=0.0 for deterministic output. Raises on any failure so
        the caller (evaluator.py) can fall back to the rules verdict — never 500s.
        """
        import json

        from groq import AsyncGroq

        if not settings.groq_api_key:
            raise RuntimeError("evaluate_question: no GROQ_API_KEY")

        client = AsyncGroq(api_key=settings.groq_api_key)

        # Include last 2 turns as context so the classifier handles follow-ups.
        user_content = message
        if history:
            recent = history[-2:]
            ctx_lines = [
                f"{t['role']}: {t['content'][:120]}"
                for t in recent
                if t.get("role") in ("user", "assistant") and t.get("content")
            ]
            if ctx_lines:
                user_content = (
                    "[Recent conversation]\n"
                    + "\n".join(ctx_lines)
                    + f"\n\n[Question to classify]\n{message}"
                )

        resp = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_content},
            ],
            temperature=0.0,
            max_tokens=120,
            response_format={"type": "json_object"},
        )
        raw = (resp.choices[0].message.content or "").strip()
        return json.loads(raw)  # raises json.JSONDecodeError on bad output → caller falls back


# Single instance — swap this to change the provider for the whole app.
default_llm: LLMProvider = GroqGeminiLLM()
