'use client'
import { useState, useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface SymptomPrediction {
  symptom: string
  predictedDate: string
  confidence: number
  daysUntil: number
  preparationTip: string
}

export default function UpcomingSymptomAlerts() {
  const [predictions, setPredictions] = useState<SymptomPrediction[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/predictions/symptoms')
      .then(res => res.json())
      .then(data => setPredictions(data.predictions || []))
      .catch(err => console.error('Failed to load predictions:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleDismiss = (symptom: string) => {
    setDismissed(new Set([...dismissed, symptom]))
    // Store in localStorage so it stays dismissed
    localStorage.setItem(`dismissed_${symptom}`, new Date().toISOString().split('T')[0])
  }

  const visiblePredictions = predictions.filter(p => {
    if (dismissed.has(p.symptom)) return false
    const dismissedDate = typeof window !== 'undefined' ? localStorage.getItem(`dismissed_${p.symptom}`) : null
    return dismissedDate !== new Date().toISOString().split('T')[0]
  })

  if (loading || visiblePredictions.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {visiblePredictions.map((prediction) => (
        <div
          key={prediction.symptom}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 relative"
        >
          <button
            onClick={() => handleDismiss(prediction.symptom)}
            className="absolute top-3 right-3 text-amber-600 hover:text-amber-800"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <div className="font-medium text-amber-900 text-sm mb-1 capitalize">
                {prediction.symptom} likely{' '}
                {prediction.daysUntil === 1 ? 'tomorrow' : `in ${prediction.daysUntil} days`}
              </div>
              <div className="text-xs text-amber-700 mb-2">
                {Math.round(prediction.confidence * 100)}% confidence based on your pattern
              </div>
              <div className="text-sm text-amber-800">
                {prediction.preparationTip}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
