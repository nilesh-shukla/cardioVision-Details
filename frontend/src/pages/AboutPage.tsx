export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          About
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Methodology, limitations, and privacy
        </h1>
      </header>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold">What this prototype does</h2>
        <p className="text-sm leading-7 text-muted sm:text-base">
          CardioVision AI is a student project that serves a locally trained
          scikit-learn pipeline through FastAPI. The frontend collects exactly
          these 13 features: age, sex, cp, trestbps, chol, fbs, restecg,
          thalach, exang, oldpeak, slope, ca, and thal. The backend returns a
          class, a label, the selected model name, and an educational
          disclaimer.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold">Dataset and encodings</h2>
        <p className="text-sm leading-7 text-muted sm:text-base">
          Training uses the 303-row file{' '}
          <code className="rounded bg-soft px-1.5 py-0.5 text-sm">
            HeartDisease PredictionML/heart.csv
          </code>
          , derived from the Cleveland heart-disease records. Categorical
          dropdowns use the recoded values present in that CSV, verified against
          <code className="ml-1 rounded bg-soft px-1.5 py-0.5 text-sm">
            processed.cleveland.data
          </code>
          . Target labels from the backend metadata are{' '}
          <strong className="font-medium text-ink">0: no disease</strong> and{' '}
          <strong className="font-medium text-ink">1: disease</strong>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold">How explanations work</h2>
        <p className="text-sm leading-7 text-muted sm:text-base">
          Optional plain-language explanations are produced by Google Gemini on
          the server. The browser never receives or stores a Gemini API key and
          never calls Gemini directly. The explanation endpoint is used only
          after an explicit consent checkbox, which starts unchecked. If Gemini
          is unconfigured or unavailable, the backend returns an error instead
          of inventing text.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold">Privacy</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted sm:text-base">
          <li>Health inputs are not written to localStorage by this application.</li>
          <li>There is no login, account, or prediction history in this prototype.</li>
          <li>
            Do not enter names, emails, or other personal identifiers in the
            assessment.
          </li>
          <li>
            With consent, only the 13 model features plus the consent flag are
            sent to <code className="rounded bg-soft px-1.5 py-0.5">POST /explain</code>.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-semibold">Limitations</h2>
        <p className="text-sm leading-7 text-muted sm:text-base">
          The model is an educational prototype. Its test metrics, when generated
          during training, do not establish clinical effectiveness. The dataset
          is small and may not represent a broader population. Predictions and
          explanations must not be used to make treatment or medication
          decisions. Consult a qualified healthcare professional for medical
          advice.
        </p>
      </section>
    </div>
  )
}
