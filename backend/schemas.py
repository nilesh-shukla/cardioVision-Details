from __future__ import annotations

import math
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    age: float = Field(description="Age in years.")
    sex: float
    cp: float
    trestbps: float
    chol: float
    fbs: float
    restecg: float
    thalach: float
    exang: float
    oldpeak: float
    slope: float
    ca: float
    thal: float

    @field_validator(
        "age",
        "sex",
        "cp",
        "trestbps",
        "chol",
        "fbs",
        "restecg",
        "thalach",
        "exang",
        "oldpeak",
        "slope",
        "ca",
        "thal",
        mode="before",
    )
    @classmethod
    def validate_numeric_feature(cls, value: Any) -> Any:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError("must be a finite number")
        if not math.isfinite(value):
            raise ValueError("must be a finite number")
        return float(value)


class PredictionResponse(BaseModel):
    prediction: int
    label: str
    model: str
    disclaimer: str


class ExplanationResponse(BaseModel):
    prediction: int
    label: str
    explanation: str
    model: str
    disclaimer: str


class ExplanationRequest(PredictionRequest):
    consent_to_external_processing: bool = Field(
        default=False,
        description="Explicitly allow sending submitted feature values to Gemini.",
    )