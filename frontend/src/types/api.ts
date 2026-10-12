export const FEATURE_NAMES = [
  'age',
  'sex',
  'cp',
  'trestbps',
  'chol',
  'fbs',
  'restecg',
  'thalach',
  'exang',
  'oldpeak',
  'slope',
  'ca',
  'thal',
] as const

export type FeatureName = (typeof FEATURE_NAMES)[number]

export type FeaturePayload = Record<FeatureName, number>

export type HealthResponse = {
  status: string
  service: string
  model_ready: boolean
}

export type PredictionResponse = {
  prediction: number
  label: string
  model: string
  disclaimer: string
}

export type ExplanationResponse = {
  prediction: number
  label: string
  explanation: string
  model: string
  disclaimer: string
}

export type FastApiValidationError = {
  loc?: Array<string | number>
  msg?: string
  type?: string
}
