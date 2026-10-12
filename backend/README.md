# CardioVision AI Backend

# CardioVision AI Backend

Minimal FastAPI backend for an educational heart-disease prediction prototype.
The local scikit-learn pipeline makes the prediction; Gemini is optional and
only produces a plain-language explanation of that local result.

## Minimal architecture

- `app.py` - FastAPI routes and readiness checks
- `schemas.py` - strict request and response validation
- `predictor.py` - loading and invoking the trusted generated pipeline
- `train_model.py` - reproducible training and metadata generation
- `llm_service.py` - optional Gemini explanation service
- `models/` - tracked model artifacts required at runtime

There is no database, authentication, Docker, microservice layer, or frontend
integration in this stage.

## Dataset and features

Training reads `..\HeartDisease PredictionML\heart.csv`, which contains 303
rows, 14 columns, and target classes `0` (no disease) and `1` (disease) in
the verified training metadata. The 13 input features are:

`age`, `sex`, `cp`, `trestbps`, `chol`, `fbs`, `restecg`, `thalach`, `exang`,
`oldpeak`, `slope`, `ca`, `thal`

The generated metadata records the feature order, target mapping, dataset
hash, split seed, and evaluation metrics. These metrics are for this small
dataset only and do not establish clinical effectiveness.

## Windows setup

From PowerShell:

```powershell
cd D:\Projects\Mini_Project\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If PowerShell blocks script activation, run the server with the virtual
environment's interpreter directly:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app:app --reload
```

## Start the development server

With the virtual environment activated:

```powershell
python -m uvicorn app:app --reload
```

The service is available at `http://127.0.0.1:8000`, `https://cardiovision-details.onrender.com/`.

For a clean setup, use the local virtual environment's interpreter for every
command. Do not install backend dependencies globally.

## Deploy to Render

Set the Render service root directory to `backend`, use the following build
command, and configure the start command without `--reload`:

```text
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port $PORT
```

The Render environment must provide `PORT`. Set `GEMINI_API_KEY` only if the
optional `/explain` endpoint is enabled; `/health` and `/predict` do not
require it. The tracked files in `models/` are loaded at runtime and must be
included in the deployment checkout.

## Configure Gemini explanations

Create a local `backend\.env` file from `.env.example` and replace only the
placeholder with a newly issued Gemini API key:

```powershell
Copy-Item .env.example .env
```

Set `GEMINI_MODEL` only if a different model is enabled for your account. Never
commit `.env` or expose the key to the frontend. If the key is missing, invalid,
or the Gemini service is unavailable, `POST /explain` returns HTTP 503 rather
than fabricating an explanation.

The submitted feature values are health-related data and are sent to the
external Gemini provider only when `/explain` is called with explicit consent.
Do not submit names, email addresses, account identifiers, or other personal
identifiers.

## Train the model

Install the dependencies from `requirements.txt`, then run:

```powershell
python train_model.py
```

This validates the source CSV, compares Logistic Regression and Random Forest
pipelines using a fixed stratified split, and writes the selected pipeline and
metadata to `backend\models\`. Deployment uses the tracked artifacts already
present in that directory; retraining is not part of the Render start command.

The model is an educational prototype. Its test metrics do not establish
clinical effectiveness, and the small dataset may not represent the broader
population.

## Prediction API

Example request:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:8000/predict `
  -ContentType "application/json" `
  -Body '{"age":63,"sex":1,"cp":3,"trestbps":145,"chol":233,"fbs":1,"restecg":0,"thalach":150,"exang":0,"oldpeak":2.3,"slope":0,"ca":0,"thal":1}'
```

Example response shape:

```json
{
  "prediction": 1,
  "label": "disease",
  "model": "random_forest",
  "disclaimer": "Educational prototype only. This prediction is not a diagnosis and does not establish a person's actual disease status. Consult a qualified healthcare professional for medical advice."
}
```

## Explanation API

`POST /explain` accepts the same 13 feature fields as `/predict`, plus the
required opt-in field `consent_to_external_processing`. Set that field to
`true` only after the user has been informed that submitted health-related
values will be sent to the external Gemini provider. The server computes the
prediction locally and then sends only the prediction, verified label, and
submitted model features to Gemini. A client-supplied prediction is not
accepted. Without explicit consent, the endpoint returns HTTP 400.

Example:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:8000/explain `
  -ContentType "application/json" `
  -Body '{"age":63,"sex":1,"cp":3,"trestbps":145,"chol":233,"fbs":1,"restecg":0,"thalach":150,"exang":0,"oldpeak":2.3,"slope":0,"ca":0,"thal":1,"consent_to_external_processing":true}'
```

The explanation is educational text generated from the local model result. No
names, emails, account identifiers, or other personal identifiers are sent to
Gemini. Both predictions and explanations are educational and are not clinical
diagnoses.

## Run tests

With the virtual environment activated:

```powershell
python -m pytest
```

The test suite uses mocked Gemini calls and never needs a real API key or paid
request. A clean environment should report all tests passing after installing
`requirements.txt`.

## Troubleshooting

- **Missing model:** run `python train_model.py` from `backend`. `/health`
  remains degraded and prediction routes return HTTP 503 until both the
  pipeline and compatible metadata exist.
- **Missing Gemini key:** copy `.env.example` to `.env` and configure a newly
  issued key. `/predict` does not require Gemini; only `/explain` does.
- **Dependency installation:** confirm the local `.venv` is active, then run
  `python -m pip install -r requirements.txt`. If network or policy rules
  prevent installation, use the configured environment and report which checks
  could not run.

The API does not accept the `target` label as an input. This project is an
educational prototype, not a clinical diagnostic tool. Model test metrics do
not establish clinical effectiveness. Stage 3 validates numeric, finite
features and rejects unknown fields, but intentionally does not impose
unverified clinical limits on the feature values.

## Endpoints

- `GET /` - service message
- `GET /health` - application and model artifact readiness
- `POST /predict` - validated prediction using the trained pipeline
- `POST /explain` - local prediction followed by an optional Gemini explanation
- `GET /docs` - FastAPI Swagger UI

## Safety and privacy limitations

Predictions and Gemini explanations are educational estimates, not clinical
diagnoses. They must not be used to make treatment or medication decisions.
The model was trained on a small dataset and has not been clinically validated.
Gemini can be unavailable because of configuration, quota, network, or provider
errors; the API returns a safe error instead of inventing an explanation.
