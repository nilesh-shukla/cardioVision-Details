import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { NumberField } from '../components/form/NumberField'
import { SelectField } from '../components/form/SelectField'
import { Alert } from '../components/ui/Alert'
import { useAssessment } from '../context/AssessmentContext'
import {
  ALL_FIELDS,
  FIELD_GROUPS,
  emptyFormValues,
  parseFeatureValue,
  payloadToFormValues,
} from '../lib/features'
import type { FeatureName, FeaturePayload } from '../types/api'

export function AssessmentPage() {
  const navigate = useNavigate()
  const { features, setFeatures } = useAssessment()
  const [values, setValues] = useState<Record<FeatureName, string>>(() =>
    features ? payloadToFormValues(features) : emptyFormValues(),
  )
  const [errors, setErrors] = useState<Partial<Record<FeatureName, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Partial<Record<FeatureName, string>> = {}
    const payload = {} as FeaturePayload

    for (const field of ALL_FIELDS) {
      const parsed = parseFeatureValue(field, values[field.name])
      if (parsed.error || parsed.value === undefined) {
        nextErrors[field.name] = parsed.error ?? `${field.label} is invalid.`
      } else {
        payload[field.name] = parsed.value
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Please complete every field with a valid value before continuing.')
      const firstInvalid = ALL_FIELDS.find((field) => nextErrors[field.name])
      if (firstInvalid) {
        document.getElementById(firstInvalid.name)?.focus()
      }
      return
    }

    setFormError(null)
    setFeatures(payload)
    navigate('/results')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Heart health assessment
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Enter the 13 model features
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted sm:text-base">
          Values are kept in memory for this session only and are not written to
          browser storage. Dropdown encodings match the training CSV.
        </p>
      </header>

      <Alert tone="warning" title="Not a diagnostic form">
        This form collects the same numeric features the model was trained on.
        Completing it does not create a medical record or a diagnosis.
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {FIELD_GROUPS.map((group) => (
          <section
            key={group.id}
            className="rounded-2xl border border-line bg-panel p-5 shadow-sm sm:p-6"
          >
            <h2 className="font-serif text-xl font-semibold">{group.title}</h2>
            <p className="mt-1 mb-5 text-sm leading-6 text-muted">
              {group.description}
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {group.fields.map((field) =>
                field.kind === 'select' ? (
                  <SelectField
                    key={field.name}
                    field={field}
                    value={values[field.name]}
                    error={errors[field.name]}
                    onChange={(value) =>
                      setValues((current) => ({ ...current, [field.name]: value }))
                    }
                  />
                ) : (
                  <NumberField
                    key={field.name}
                    field={field}
                    value={values[field.name]}
                    error={errors[field.name]}
                    onChange={(value) =>
                      setValues((current) => ({ ...current, [field.name]: value }))
                    }
                  />
                ),
              )}
            </div>
          </section>
        ))}

        {formError ? <Alert tone="danger">{formError}</Alert> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Continue to results
          </button>
          <button
            type="button"
            className="rounded-lg border border-line bg-panel px-5 py-3 text-sm font-semibold text-ink"
            onClick={() => {
              setValues(emptyFormValues())
              setErrors({})
              setFormError(null)
              setFeatures(null)
            }}
          >
            Clear form
          </button>
        </div>
      </form>
    </div>
  )
}
