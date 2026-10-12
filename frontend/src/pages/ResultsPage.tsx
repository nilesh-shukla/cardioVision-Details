import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { useAssessment } from '../context/AssessmentContext'
import { ApiError, explain, predict } from '../lib/api'
import type { ExplanationResponse, PredictionResponse } from '../types/api'

export function ResultsPage() {
  const { features } = useAssessment()
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [predictionError, setPredictionError] = useState<string | null>(null)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [consent, setConsent] = useState(false)
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null)
  const [explanationError, setExplanationError] = useState<string | null>(null)
  const [explanationLoading, setExplanationLoading] = useState(false)

  useEffect(() => {
    if (!features) {
      return
    }

    const controller = new AbortController()
    setPredictionLoading(true)
    setPredictionError(null)
    setPrediction(null)
    setExplanation(null)
    setExplanationError(null)

    predict(features, controller.signal)
      .then((result) => {
        setPrediction(result)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        const message =
          error instanceof ApiError
            ? error.detail
            : 'The prediction request failed unexpectedly.'
        setPredictionError(message)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPredictionLoading(false)
        }
      })

    return () => controller.abort()
  }, [features])

  async function handleExplain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!features || !consent) {
      setExplanationError(
        'Consent is required before submitted values are sent to the explanation service.',
      )
      return
    }

    setExplanationLoading(true)
    setExplanationError(null)
    setExplanation(null)

    try {
      const result = await explain(features, consent)
      setExplanation(result)
    } catch (error: unknown) {
      const message =
        error instanceof ApiError
          ? error.detail
          : 'The explanation request failed unexpectedly.'
      setExplanationError(message)
    } finally {
      setExplanationLoading(false)
    }
  }

  if (!features) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="font-serif text-3xl font-semibold">No assessment in memory</h1>
        <p className="text-sm leading-6 text-muted">
          Health inputs are not stored in the browser. Complete the assessment
          again to request a prediction.
        </p>
        <Link
          to="/assessment"
          className="inline-flex rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white"
        >
          Go to assessment
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Prediction results
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Model output for the submitted features
        </h1>
        <p className="text-sm leading-6 text-muted sm:text-base">
          This screen shows the backend response as returned. It is an
          educational estimate, not a diagnosis of any person&apos;s health.
        </p>
      </header>

      {predictionLoading ? (
        <Alert>Requesting a prediction from the local model…</Alert>
      ) : null}

      {predictionError ? (
        <Alert tone="danger" title="Prediction unavailable">
          {predictionError}
        </Alert>
      ) : null}

      {prediction ? (
        <section className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
          <h2 className="font-serif text-xl font-semibold">Local model prediction</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-soft p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Label
              </dt>
              <dd className="mt-1 text-lg font-semibold text-ink">{prediction.label}</dd>
            </div>
            <div className="rounded-xl bg-canvas p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Prediction class
              </dt>
              <dd className="mt-1 text-lg font-semibold text-ink">
                {prediction.prediction}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Model
              </dt>
              <dd className="mt-1 text-sm text-ink">{prediction.model}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <Alert tone="warning" title="Disclaimer">
              {prediction.disclaimer}
            </Alert>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-line bg-panel p-6 shadow-sm">
        <h2 className="font-serif text-xl font-semibold">Optional Gemini explanation</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          The explanation is generated by the backend after the local prediction.
          Submitted feature values are sent to Google Gemini only if you opt in.
          The Gemini API key never leaves the server.
        </p>

        <form onSubmit={handleExplain} className="mt-5 space-y-4">
          <label className="flex items-start gap-3 text-sm leading-6 text-ink">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-brand"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            <span>
              I consent to sending the submitted feature values to the external
              Gemini provider through the backend explanation endpoint.
            </span>
          </label>
          <button
            type="submit"
            disabled={!consent || explanationLoading || !prediction}
            className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {explanationLoading ? 'Requesting explanation…' : 'Request explanation'}
          </button>
        </form>

        {explanationError ? (
          <div className="mt-4">
            <Alert tone="danger" title="Explanation unavailable">
              {explanationError}
            </Alert>
          </div>
        ) : null}

        {explanation ? (
          <div className="mt-4 space-y-3">
            <Alert title="Explanation">{explanation.explanation}</Alert>
            <p className="text-xs text-muted">
              Explanation model field reported by the backend: {explanation.model}
            </p>
          </div>
        ) : null}
      </section>

      <Link to="/assessment" className="inline-flex text-sm font-semibold text-brand">
        Return to assessment
      </Link>
    </div>
  )
}
