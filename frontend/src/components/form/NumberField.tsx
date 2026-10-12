import type { FieldConfig } from '../../lib/features'

type NumberFieldProps = {
  field: FieldConfig
  value: string
  error?: string
  onChange: (value: string) => void
}

export function NumberField({ field, value, error, onChange }: NumberFieldProps) {
  const describedBy = error ? `${field.name}-error` : `${field.name}-help`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.name} className="text-sm font-medium text-ink">
        {field.label}
        {field.unit ? (
          <span className="ml-1 font-normal text-muted">({field.unit})</span>
        ) : null}
      </label>
      <input
        id={field.name}
        name={field.name}
        type="number"
        inputMode="decimal"
        step={field.step ?? 'any'}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-line bg-panel px-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      <p id={`${field.name}-help`} className="text-xs leading-5 text-muted">
        {field.helper}
      </p>
      {error ? (
        <p id={`${field.name}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
