import type { ReactNode } from 'react'

type AlertTone = 'info' | 'warning' | 'danger' | 'neutral'

const TONE_CLASSES: Record<AlertTone, string> = {
  info: 'border-brand/20 bg-soft text-brand-dark',
  warning: 'border-amber-200 bg-warn-bg text-warn',
  danger: 'border-red-200 bg-danger-bg text-danger',
  neutral: 'border-line bg-panel text-muted',
}

type AlertProps = {
  title?: string
  tone?: AlertTone
  children: ReactNode
}

export function Alert({ title, tone = 'info', children }: AlertProps) {
  return (
    <div
      role="status"
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${TONE_CLASSES[tone]}`}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  )
}
