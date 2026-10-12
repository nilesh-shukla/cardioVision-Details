import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { FeaturePayload } from '../types/api'

type AssessmentContextValue = {
  features: FeaturePayload | null
  setFeatures: (features: FeaturePayload | null) => void
}

const AssessmentContext = createContext<AssessmentContextValue | undefined>(
  undefined,
)

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<FeaturePayload | null>(null)
  const value = useMemo(() => ({ features, setFeatures }), [features])

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  )
}

export function useAssessment() {
  const context = useContext(AssessmentContext)
  if (!context) {
    throw new Error('useAssessment must be used within AssessmentProvider.')
  }
  return context
}
