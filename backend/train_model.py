from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


BACKEND_DIR = Path(__file__).resolve().parent
DATASET_PATH = BACKEND_DIR.parent / "HeartDisease PredictionML" / "heart.csv"
MODEL_DIR = BACKEND_DIR / "models"
MODEL_PATH = MODEL_DIR / "heart_disease_pipeline.joblib"
METADATA_PATH = MODEL_DIR / "metadata.json"

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
TARGET_NAME = "target"
TARGET_CLASSES = {0, 1}
RANDOM_SEED = 42
TEST_SIZE = 0.2

NUMERIC_FEATURES = ["age", "trestbps", "chol", "thalach", "oldpeak"]
CATEGORICAL_FEATURES = [
    "sex",
    "cp",
    "fbs",
    "restecg",
    "exang",
    "slope",
    "ca",
    "thal",
]


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("numeric", StandardScaler(), NUMERIC_FEATURES),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            ),
        ]
    )


def build_candidates() -> dict[str, Pipeline]:
    return {
        "logistic_regression": Pipeline(
            steps=[
                ("preprocessor", build_preprocessor()),
                (
                    "classifier",
                    LogisticRegression(max_iter=2000, random_state=RANDOM_SEED),
                ),
            ]
        ),
        "random_forest": Pipeline(
            steps=[
                ("preprocessor", build_preprocessor()),
                (
                    "classifier",
                    RandomForestClassifier(
                        n_estimators=300,
                        max_depth=7,
                        random_state=RANDOM_SEED,
                        n_jobs=-1,
                    ),
                ),
            ]
        ),
    }


def validate_dataset(data: pd.DataFrame) -> None:
    required_columns = FEATURE_NAMES + [TARGET_NAME]
    missing_columns = [column for column in required_columns if column not in data.columns]
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {missing_columns}")

    if data[required_columns].isna().any().any():
        raise ValueError("Dataset contains missing values in required columns.")

    observed_classes = set(data[TARGET_NAME].unique())
    if observed_classes != TARGET_CLASSES:
        raise ValueError(
            f"Expected target classes {sorted(TARGET_CLASSES)}, "
            f"observed {sorted(observed_classes)}."
        )


def calculate_metrics(model: Pipeline, X_test: pd.DataFrame, y_test: pd.Series) -> dict[str, Any]:
    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)[:, 1]
    matrix = confusion_matrix(y_test, predictions, labels=[0, 1])
    report = classification_report(
        y_test,
        predictions,
        labels=[0, 1],
        output_dict=True,
        zero_division=0,
    )

    return {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "precision": float(precision_score(y_test, predictions, zero_division=0)),
        "recall": float(recall_score(y_test, predictions, zero_division=0)),
        "f1": float(f1_score(y_test, predictions, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, probabilities)),
        "confusion_matrix": matrix.tolist(),
        "classification_report": report,
    }


def main() -> None:
    if not DATASET_PATH.is_file():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    data = pd.read_csv(DATASET_PATH)
    validate_dataset(data)

    X = data[FEATURE_NAMES].copy()
    y = data[TARGET_NAME].astype(int)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_SEED,
        stratify=y,
    )

    candidate_metrics: dict[str, dict[str, Any]] = {}
    fitted_models: dict[str, Pipeline] = {}
    for name, candidate in build_candidates().items():
        candidate.fit(X_train, y_train)
        fitted_models[name] = candidate
        candidate_metrics[name] = calculate_metrics(candidate, X_test, y_test)

    selected_name = max(
        candidate_metrics,
        key=lambda name: (
            candidate_metrics[name]["roc_auc"],
            candidate_metrics[name]["f1"],
            candidate_metrics[name]["accuracy"],
        ),
    )
    selected_model = fitted_models[selected_name]

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(selected_model, MODEL_PATH)
    dataset_hash = hashlib.sha256(DATASET_PATH.read_bytes()).hexdigest()
    metadata = {
        "artifact": MODEL_PATH.name,
        "selected_model": selected_name,
        "feature_order": FEATURE_NAMES,
        "target": TARGET_NAME,
        "target_mapping": {"0": "no disease", "1": "disease"},
        "random_seed": RANDOM_SEED,
        "test_size": TEST_SIZE,
        "dataset": {
            "path": str(DATASET_PATH),
            "sha256": dataset_hash,
            "rows": int(data.shape[0]),
            "columns": int(data.shape[1]),
            "target_counts": {
                str(value): int(count) for value, count in y.value_counts().sort_index().items()
            },
            "train_rows": int(len(X_train)),
            "test_rows": int(len(X_test)),
        },
        "metrics": candidate_metrics,
        "limitations": [
            "Educational prototype only; test metrics do not establish clinical effectiveness.",
            "The dataset is small and may not represent the broader population.",
        ],
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"Selected model: {selected_name}")
    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved metadata: {METADATA_PATH}")
    for name, metrics in candidate_metrics.items():
        print(
            f"{name}: accuracy={metrics['accuracy']:.3f}, "
            f"precision={metrics['precision']:.3f}, "
            f"recall={metrics['recall']:.3f}, "
            f"f1={metrics['f1']:.3f}, "
            f"roc_auc={metrics['roc_auc']:.3f}, "
            f"confusion_matrix={metrics['confusion_matrix']}"
        )


if __name__ == "__main__":
    main()
