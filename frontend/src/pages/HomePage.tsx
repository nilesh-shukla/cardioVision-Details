import { ArrowRight, HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BackendStatus } from '../components/status/BackendStatus'

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-start">
        <div className="animate-[fadeIn_400ms_ease-out]">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Educational prototype
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            A calm interface for exploring a heart-disease model
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            CardioVision AI collects the 13 features used by a local
            scikit-learn pipeline and shows the backend prediction. It does not
            diagnose disease, store health inputs by default, or call Gemini
            from the browser.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/assessment"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Start assessment
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent/40"
            >
              Methodology and privacy
            </Link>
          </div>
        </div>
        <BackendStatus />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <HeartPulse className="mb-3 h-5 w-5 text-brand" aria-hidden="true" />
          <h2 className="font-serif text-lg font-semibold">Local prediction</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            The trained pipeline runs on the FastAPI backend. The interface
            displays the returned class, label, model name, and disclaimer.
          </p>
        </article>
        <article className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <Stethoscope className="mb-3 h-5 w-5 text-brand" aria-hidden="true" />
          <h2 className="font-serif text-lg font-semibold">Separate explanation</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            A Gemini explanation is optional and requested only after explicit
            consent. The prediction still stands if the explanation service is
            unavailable.
          </p>
        </article>
        <article className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <ShieldCheck className="mb-3 h-5 w-5 text-brand" aria-hidden="true" />
          <h2 className="font-serif text-lg font-semibold">Educational use</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This prototype is for learning how a small tabular model is served.
            It is not a substitute for a qualified healthcare professional.
          </p>
        </article>
      </section>
    </div>
  )
}
