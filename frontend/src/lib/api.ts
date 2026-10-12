import type {
  ExplanationResponse,
  FastApiValidationError,
  FeaturePayload,
  HealthResponse,
  PredictionResponse,
} from '../types/api'
import { FEATURE_NAMES } from '../types/api'

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000'
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

if (!configuredApiBaseUrl && import.meta.env.PROD) {
  throw new Error(
    'VITE_API_BASE_URL must be set when building the frontend for production.',
  )
}

export const API_BASE_URL = (
  configuredApiBaseUrl ?? DEFAULT_API_BASE_URL
).replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

function endpoint(path: string): string {
  return `${API_BASE_URL}${path}`
}

function formatDetail(payload: unknown): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item: FastApiValidationError) => {
          const location = Array.isArray(item.loc)
            ? item.loc.filter((part) => part !== 'body').join('.')
            : ''
          const message = item.msg ?? 'Invalid value'
          return location ? `${location}: ${message}` : message
        })
        .filter(Boolean)
      if (messages.length > 0) {
        return messages.join(' ')
      }
    }
  }

  return 'The server returned an unexpected response.'
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new ApiError(
      response.status,
      'The server returned a response that was not valid JSON.',
    )
  }
}

async function requestJson(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(endpoint(path), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(
      0,
      `Could not reach the backend at ${API_BASE_URL}. Confirm the API is running.`,
    )
  }

  const payload = await readJson(response)
  if (!response.ok) {
    throw new ApiError(response.status, formatDetail(payload))
  }
  return payload
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string') {
    throw new ApiError(0, `Response field "${key}" was missing or not a string.`)
  }
  return value
}

function requireNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ApiError(0, `Response field "${key}" was missing or not a number.`)
  }
  return value
}

function parsePredictionFields(payload: unknown): {
  prediction: number
  label: string
  model: string
  disclaimer: string
} {
  if (!isRecord(payload)) {
    throw new ApiError(0, 'The server returned an unexpected response.')
  }
  return {
    prediction: requireNumber(payload, 'prediction'),
    label: requireString(payload, 'label'),
    model: requireString(payload, 'model'),
    disclaimer: requireString(payload, 'disclaimer'),
  }
}

export function toFeaturePayload(
  values: FeaturePayload,
): FeaturePayload {
  const payload = {} as FeaturePayload
  for (const name of FEATURE_NAMES) {
    payload[name] = values[name]
  }
  return payload
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const payload = await requestJson('/health', { method: 'GET', signal })
  if (!isRecord(payload)) {
    throw new ApiError(0, 'The health endpoint returned an unexpected response.')
  }
  if (typeof payload.status !== 'string' || typeof payload.service !== 'string') {
    throw new ApiError(0, 'The health endpoint returned an unexpected response.')
  }
  if (typeof payload.model_ready !== 'boolean') {
    throw new ApiError(0, 'The health endpoint returned an unexpected response.')
  }
  return {
    status: payload.status,
    service: payload.service,
    model_ready: payload.model_ready,
  }
}

export async function predict(
  features: FeaturePayload,
  signal?: AbortSignal,
): Promise<PredictionResponse> {
  const payload = await requestJson('/predict', {
    method: 'POST',
    body: JSON.stringify(toFeaturePayload(features)),
    signal,
  })
  return parsePredictionFields(payload)
}

export async function explain(
  features: FeaturePayload,
  consentToExternalProcessing: boolean,
  signal?: AbortSignal,
): Promise<ExplanationResponse> {
  if (!consentToExternalProcessing) {
    throw new ApiError(
      0,
      'Consent is required before requesting an explanation.',
    )
  }

  const payload = await requestJson('/explain', {
    method: 'POST',
    body: JSON.stringify({
      ...toFeaturePayload(features),
      consent_to_external_processing: consentToExternalProcessing,
    }),
    signal,
  })
  const parsed = parsePredictionFields(payload)
  if (!isRecord(payload)) {
    throw new ApiError(0, 'The explanation endpoint returned an unexpected response.')
  }
  return {
    ...parsed,
    explanation: requireString(payload, 'explanation'),
  }
}
