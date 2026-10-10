from __future__ import annotations

import os
from typing import Sequence

from dotenv import load_dotenv


DEFAULT_GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_TIMEOUT_MS = 10_000


class GeminiServiceError(RuntimeError):
    """Safe, user-facing error for unavailable Gemini explanations."""


def generate_explanation(
    prediction: int,
    label: str,
    features: Sequence[float],
) -> str:
    """Generate an educational explanation without sending personal data."""
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise GeminiServiceError(
            "Gemini explanations are unavailable because GEMINI_API_KEY is not configured."
        )

    model_name = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)
    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise GeminiServiceError(
            "Gemini explanations are unavailable because the google-genai package is not installed."
        ) from exc

    prompt = (
        "You provide a concise, plain-language educational explanation of a machine-learning "
        "prediction. Do not diagnose the user, claim certainty, recommend medication or "
        "treatment changes, or override the supplied model prediction. State that a qualified "
        "healthcare professional should interpret health concerns. Do not ask for or infer "
        "identity, contact information, or other personal information.\n\n"
        f"Local model prediction class: {prediction}\n"
        f"Verified class label: {label}\n"
        f"Submitted model features in fixed order: {list(features)}\n\n"
        "Explain what this prediction means in general terms and mention that the result is "
        "an educational estimate from a limited dataset, not a clinical diagnosis."
    )

    try:
        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=GEMINI_TIMEOUT_MS),
        )
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        explanation = getattr(response, "text", None)
    except Exception as exc:
        raise GeminiServiceError(
            "Gemini explanations are temporarily unavailable. Please try again later."
        ) from exc

    if not explanation or not explanation.strip():
        raise GeminiServiceError(
            "Gemini returned an empty explanation. Please try again later."
        )
    return explanation.strip()