import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { ApiError, getHealth } from '../../lib/api'
import type { HealthResponse } from '../../types/api'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; health: HealthResponse }
  | { status: 'error'; message: string }

export function BackendStatus() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    getHealth(controller.signal)
      .then((health) => {
        setState({ status: 'ready', health })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        const message =
          error instanceof ApiError
            ? error.detail
            : 'Backend status is currently unavailable.'
        setState({ status: 'error', message })
      })

    return () => controller.abort()
  }, [])

  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-brand">
        <Activity className="h-4 w-4" aria-hidden="true" />
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Backend status
        </h2>
      </div>
      {state.status === 'loading' ? (
        <p className="text-sm text-muted">Checking the local API…</p>
      ) : null}
      {state.status === 'error' ? (
        <p className="text-sm text-danger">{state.message}</p>
      ) : null}
      {state.status === 'ready' ? (
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Service</dt>
            <dd className="font-medium">{state.health.service}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Status</dt>
            <dd className="font-medium">{state.health.status}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Model ready</dt>
            <dd className="font-medium">{state.health.model_ready ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  )
}
