from __future__ import annotations

import json
from pathlib import Path
from typing import Sequence

import joblib
import numpy as np
import pandas as pd


FEATURE_NAMES = [
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
]

DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "models" / "heart_disease_pipeline.joblib"
DEFAULT_METADATA_PATH = Path(__file__).resolve().parent / "models" / "metadata.json"


def load_model(model_path: Path | str | None = None):
    """Load the trusted pipeline produced by train_model.py."""
    path = Path(model_path) if model_path is not None else DEFAULT_MODEL_PATH
    if not path.is_file():
        raise FileNotFoundError(f"Model artifact not found: {path}")
    return joblib.load(path)


def predict_features(
    features: Sequence[float],
    model_path: Path | str | None = None,
) -> int:
    """Predict a target class from the 13 features in FEATURE_NAMES order."""
    if len(features) != len(FEATURE_NAMES):
        raise ValueError(
            f"Expected exactly {len(FEATURE_NAMES)} features in the required order; "
            f"received {len(features)}."
        )

    try:
        values = np.asarray(features, dtype=float)
    except (TypeError, ValueError) as exc:
        raise ValueError("All model features must be numeric.") from exc

    if not np.isfinite(values).all():
        raise ValueError("All model features must be finite numbers.")

    model = load_model(model_path)
    input_frame = pd.DataFrame([values], columns=FEATURE_NAMES)
    prediction = model.predict(input_frame)
    return int(prediction[0])


def load_metadata(metadata_path: Path | str | None = None) -> dict:
    """Load metadata written alongside the trained pipeline."""
    path = Path(metadata_path) if metadata_path is not None else DEFAULT_METADATA_PATH
    if not path.is_file():
        raise FileNotFoundError(f"Model metadata not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))