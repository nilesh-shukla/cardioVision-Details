from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

import app
import predictor
from llm_service import GeminiServiceError


VALID_PAYLOAD = {
    "age": 63,
    "sex": 1,
    "cp": 3,
    "trestbps": 145,
    "chol": 233,
    "fbs": 1,
    "restecg": 0,
    "thalach": 150,
    "exang": 0,
    "oldpeak": 2.3,
    "slope": 0,
    "ca": 0,
    "thal": 1,
}

client = TestClient(app.app)


def test_root() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"]


def test_health_when_artifact_present() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["model_ready"] is True


def test_production_origin_is_allowed_for_health() -> None:
    response = client.get(
        "/health",
        headers={"Origin": "https://cardio-vision-details.vercel.app"},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "https://cardio-vision-details.vercel.app"
    )


def test_production_origin_preflight_is_allowed() -> None:
    response = client.options(
        "/predict",
        headers={
            "Origin": "https://cardio-vision-details.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "https://cardio-vision-details.vercel.app"
    )
    assert response.headers["access-control-allow-methods"]


def test_predict_valid_request() -> None:
    response = client.post("/predict", json=VALID_PAYLOAD)
    assert response.status_code == 200
    body = response.json()
    assert body["prediction"] in (0, 1)
    assert body["label"] in ("no disease", "disease")
    assert body["model"] == "random_forest"
    assert "not a diagnosis" in body["disclaimer"]


def test_missing_required_field() -> None:
    payload = {key: value for key, value in VALID_PAYLOAD.items() if key != "age"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_invalid_feature_type_and_non_finite_value() -> None:
    invalid_type = {**VALID_PAYLOAD, "age": "not-a-number"}
    assert client.post("/predict", json=invalid_type).status_code == 422

    non_finite = {**VALID_PAYLOAD, "age": "Infinity"}
    assert client.post("/predict", json=non_finite).status_code == 422


def test_missing_model_artifact(monkeypatch) -> None:
    missing_path = Path("missing-model.joblib")
    monkeypatch.setattr(predictor, "DEFAULT_MODEL_PATH", missing_path)
    response = client.post("/predict", json=VALID_PAYLOAD)
    assert response.status_code == 503
    assert "unavailable" in response.json()["detail"].lower()


def test_target_is_not_accepted() -> None:
    response = client.post("/predict", json={**VALID_PAYLOAD, "target": 1})
    assert response.status_code == 422


def test_extra_feature_is_rejected() -> None:
    response = client.post("/predict", json={**VALID_PAYLOAD, "unexpected": 1})
    assert response.status_code == 422


def test_predictor_rejects_wrong_feature_count() -> None:
    try:
        predictor.predict_features([0] * 12)
    except ValueError as exc:
        assert "exactly 13" in str(exc)
    else:
        raise AssertionError("Expected an invalid feature count to be rejected.")


def test_explain_uses_mocked_gemini(monkeypatch) -> None:
    monkeypatch.setattr(
        app,
        "generate_explanation",
        lambda prediction, label, features: "Educational explanation.",
    )
    response = client.post(
        "/explain",
        json={**VALID_PAYLOAD, "consent_to_external_processing": True},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["prediction"] in (0, 1)
    assert body["explanation"] == "Educational explanation."


def test_explain_missing_key(monkeypatch) -> None:
    monkeypatch.setattr(
        app,
        "generate_explanation",
        lambda prediction, label, features: (_ for _ in ()).throw(
            GeminiServiceError("Gemini explanations are unavailable because GEMINI_API_KEY is not configured.")
        ),
    )
    response = client.post(
        "/explain",
        json={**VALID_PAYLOAD, "consent_to_external_processing": True},
    )
    assert response.status_code == 503
    assert response.json()["detail"] == (
        "Explanation service is unavailable. Configure Gemini and try again later."
    )


def test_explain_prediction_is_computed_locally(monkeypatch) -> None:
    monkeypatch.setattr(app, "predict_features", lambda features: 1)
    monkeypatch.setattr(
        app,
        "generate_explanation",
        lambda prediction, label, features: f"Explanation for class {prediction}.",
    )
    response = client.post(
        "/explain",
        json={
            **VALID_PAYLOAD,
            "prediction": 0,
            "consent_to_external_processing": True,
        },
    )
    assert response.status_code == 422

    response = client.post(
        "/explain",
        json={**VALID_PAYLOAD, "consent_to_external_processing": True},
    )
    assert response.status_code == 200
    assert response.json()["prediction"] == 1


def test_explain_requires_external_processing_consent() -> None:
    response = client.post("/explain", json=VALID_PAYLOAD)
    assert response.status_code == 400
    assert "consent" in response.json()["detail"].lower()
