import type { FeatureName, FeaturePayload } from '../types/api'

export type SelectOption = {
  value: number
  label: string
}

export type FieldKind = 'number' | 'select'

export type FieldConfig = {
  name: FeatureName
  label: string
  helper: string
  kind: FieldKind
  step?: string
  unit?: string
  options?: SelectOption[]
}

export type FieldGroup = {
  id: string
  title: string
  description: string
  fields: FieldConfig[]
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    id: 'demographics',
    title: 'Demographics',
    description: 'Age and the sex encoding used in the training dataset.',
    fields: [
      {
        name: 'age',
        label: 'Age',
        helper: 'Age in years, sent as a finite number.',
        kind: 'number',
        step: '1',
        unit: 'years',
      },
      {
        name: 'sex',
        label: 'Sex',
        helper: 'Encoded values from the training CSV (UCI Cleveland mapping).',
        kind: 'select',
        options: [
          { value: 0, label: 'Female (0)' },
          { value: 1, label: 'Male (1)' },
        ],
      },
    ],
  },
  {
    id: 'vitals',
    title: 'Clinical measurements',
    description: 'Resting measurements and fasting blood sugar used by the model.',
    fields: [
      {
        name: 'trestbps',
        label: 'Resting blood pressure',
        helper: 'Resting blood pressure on admission.',
        kind: 'number',
        step: '1',
        unit: 'mm Hg',
      },
      {
        name: 'chol',
        label: 'Serum cholesterol',
        helper: 'Serum cholesterol measurement.',
        kind: 'number',
        step: '1',
        unit: 'mg/dl',
      },
      {
        name: 'fbs',
        label: 'Fasting blood sugar > 120 mg/dl',
        helper: 'Binary encoding from the training CSV.',
        kind: 'select',
        options: [
          { value: 0, label: 'False (0)' },
          { value: 1, label: 'True (1)' },
        ],
      },
      {
        name: 'thalach',
        label: 'Maximum heart rate achieved',
        helper: 'Maximum heart rate achieved during the recorded test.',
        kind: 'number',
        step: '1',
        unit: 'bpm',
      },
    ],
  },
  {
    id: 'pain',
    title: 'Chest pain and angina',
    description:
      'Chest-pain type uses the recoded 0–3 values present in the training CSV, not the original UCI 1–4 numbering.',
    fields: [
      {
        name: 'cp',
        label: 'Chest pain type',
        helper: 'Verified against processed Cleveland records aligned to heart.csv.',
        kind: 'select',
        options: [
          { value: 0, label: 'Asymptomatic (0)' },
          { value: 1, label: 'Atypical angina (1)' },
          { value: 2, label: 'Non-anginal pain (2)' },
          { value: 3, label: 'Typical angina (3)' },
        ],
      },
      {
        name: 'exang',
        label: 'Exercise-induced angina',
        helper: 'Whether exercise induced angina in the recorded test.',
        kind: 'select',
        options: [
          { value: 0, label: 'No (0)' },
          { value: 1, label: 'Yes (1)' },
        ],
      },
    ],
  },
  {
    id: 'ecg',
    title: 'ECG and ST segment',
    description: 'Resting ECG class, ST depression, and peak-exercise ST slope.',
    fields: [
      {
        name: 'restecg',
        label: 'Resting ECG results',
        helper: 'CSV recoding of the original Cleveland restecg values.',
        kind: 'select',
        options: [
          { value: 0, label: 'Left ventricular hypertrophy (0)' },
          { value: 1, label: 'Normal (1)' },
          { value: 2, label: 'ST-T wave abnormality (2)' },
        ],
      },
      {
        name: 'oldpeak',
        label: 'ST depression (oldpeak)',
        helper: 'ST depression induced by exercise relative to rest.',
        kind: 'number',
        step: '0.1',
      },
      {
        name: 'slope',
        label: 'Peak exercise ST slope',
        helper: 'CSV recoding of the original Cleveland slope values.',
        kind: 'select',
        options: [
          { value: 0, label: 'Downsloping (0)' },
          { value: 1, label: 'Flat (1)' },
          { value: 2, label: 'Upsloping (2)' },
        ],
      },
    ],
  },
  {
    id: 'vessels',
    title: 'Fluoroscopy and thalassemia',
    description:
      'These encodings include source-data missing values that were recoded in the training CSV.',
    fields: [
      {
        name: 'ca',
        label: 'Major vessels colored by fluoroscopy',
        helper:
          '0–3 match the original count. Value 4 is present in the training set as a recoded missing value.',
        kind: 'select',
        options: [
          { value: 0, label: '0 vessels' },
          { value: 1, label: '1 vessel' },
          { value: 2, label: '2 vessels' },
          { value: 3, label: '3 vessels' },
          { value: 4, label: '4 (recoded missing in source data)' },
        ],
      },
      {
        name: 'thal',
        label: 'Thalassemia',
        helper:
          'CSV recoding of original Cleveland thal values. 0 is a recoded missing value.',
        kind: 'select',
        options: [
          { value: 0, label: 'Unknown / missing in source (0)' },
          { value: 1, label: 'Fixed defect (1)' },
          { value: 2, label: 'Normal (2)' },
          { value: 3, label: 'Reversible defect (3)' },
        ],
      },
    ],
  },
]

export const ALL_FIELDS: FieldConfig[] = FIELD_GROUPS.flatMap((group) => group.fields)

export function emptyFormValues(): Record<FeatureName, string> {
  return {
    age: '',
    sex: '',
    cp: '',
    trestbps: '',
    chol: '',
    fbs: '',
    restecg: '',
    thalach: '',
    exang: '',
    oldpeak: '',
    slope: '',
    ca: '',
    thal: '',
  }
}

export function payloadToFormValues(
  payload: FeaturePayload,
): Record<FeatureName, string> {
  return {
    age: String(payload.age),
    sex: String(payload.sex),
    cp: String(payload.cp),
    trestbps: String(payload.trestbps),
    chol: String(payload.chol),
    fbs: String(payload.fbs),
    restecg: String(payload.restecg),
    thalach: String(payload.thalach),
    exang: String(payload.exang),
    oldpeak: String(payload.oldpeak),
    slope: String(payload.slope),
    ca: String(payload.ca),
    thal: String(payload.thal),
  }
}

export function parseFeatureValue(
  field: FieldConfig,
  raw: string,
): { value?: number; error?: string } {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return { error: `${field.label} is required.` }
  }

  const value = Number(trimmed)
  if (!Number.isFinite(value)) {
    return { error: `${field.label} must be a finite number.` }
  }

  if (field.kind === 'select') {
    const allowed = field.options?.some((option) => option.value === value)
    if (!allowed) {
      return { error: `${field.label} must use a listed encoding.` }
    }
  }

  return { value }
}
