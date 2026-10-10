import logging

from fastapi import FastAPI
from fastapi import HTTPException

from predictor import FEATURE_NAMES, load_metadata, load_model, predict_features
from llm_service import GeminiServiceError, generate_explanation
from schemas import (
    ExplanationRequest,
    ExplanationResponse,
    PredictionRequest,
    PredictionResponse,
)


LOGGER = logging.getLogger(__name__)
DISCLAIMER = (
    "Educational prototype only. This prediction is not a diagnosis and does "
    "not establish a person's actual disease status. Consult a qualified "
    "healthcare professional for medical advice."
)


app = FastAPI(
    title="CardioVision AI Backend",
    description="Initial backend service for CardioVision AI.",
    version="0.2.0",
)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "CardioVision AI backend is running."}


@app.get("/health")
def health() -> dict[str, object]:
    try:
        load_model()
        metadata = load_metadata()
        if metadata.get("feature_order") != FEATURE_NAMES:
            raise ValueError("Model metadata feature order does not match the API.")
        if metadata.get("target_mapping") != {"0": "no disease", "1": "disease"}:
            raise ValueError("Model metadata target mapping is invalid.")
        model_ready = True
        status = "ok"
    except Exception:
        LOGGER.exception("Model readiness check failed")
        model_ready = False
        status = "degraded"

    response: dict[str, object] = {
        "status": status,
        "service": "cardiovision-backend",
        "model_ready": model_ready,
    }
    return response


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    try:
        metadata = load_metadata()
        prediction = predict_features(
            [getattr(request, feature_name) for feature_name in FEATURE_NAMES]
        )
    except (FileNotFoundError, OSError, ValueError) as exc:
        LOGGER.exception("Prediction unavailable")
        raise HTTPException(
            status_code=503,
            detail="Prediction model is unavailable. Train the model before sending requests.",
        ) from exc
    except Exception as exc:
        LOGGER.exception("Prediction failed")
        raise HTTPException(
            status_code=503,
            detail="Prediction model could not process the request.",
        ) from exc

    return {
        "prediction": prediction,
        "label": metadata.get("target_mapping", {}).get(
            str(prediction), f"class {prediction}"
        ),
        "model": metadata.get("selected_model", "unknown"),
        "disclaimer": DISCLAIMER,
    }


@app.post("/explain", response_model=ExplanationResponse)
def explain(request: ExplanationRequest) -> ExplanationResponse:
    if not request.consent_to_external_processing:
        raise HTTPException(
            status_code=400,
            detail=(
                "Explicit consent is required before health-related feature "
                "values are sent to Gemini."
            ),
        )

    try:
        metadata = load_metadata()
        features = [getattr(request, feature_name) for feature_name in FEATURE_NAMES]
        prediction = predict_features(features)
        label = metadata.get("target_mapping", {}).get(
            str(prediction), f"class {prediction}"
        )
        explanation = generate_explanation(prediction, label, features)
    except (FileNotFoundError, OSError, ValueError) as exc:
        LOGGER.exception("Explanation prediction unavailable")
        raise HTTPException(
            status_code=503,
            detail=f"Prediction model is unavailable: {exc}",
        ) from exc
    except GeminiServiceError as exc:
        LOGGER.warning("Gemini explanation unavailable: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Explanation service is unavailable. Configure Gemini and try again later.",
        ) from exc
    except Exception as exc:
        LOGGER.exception("Explanation request failed")
        raise HTTPException(
            status_code=503,
            detail="Explanation service is unavailable. Please try again later.",
        ) from exc

    return {
        "prediction": prediction,
        "label": label,
        "explanation": explanation,
        "model": metadata.get("selected_model", "unknown"),
        "disclaimer": DISCLAIMER,
    }
