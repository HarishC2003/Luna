'use client'

import { useState, useEffect } from 'react'
import { Heart, Calendar, TrendingUp, Lightbulb } from 'lucide-react'

interface PartnerInsights {
  displayName: string
  currentPhase: string
  phaseDescription: string
  dayOfCycle: number
  daysUntilNextPeriod: number
  generalMoodTrend: string
  generalEnergyTrend: string
  supportTips: string[]
  whatToExpect: string
  dosDonts: {
    dos: string[]
    donts: string[]
  }
}

export default function PartnerInsightsPage({ params }: { params: Promise<{ token: string }> }) {
  const [insights, setInsights] = useState<PartnerInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ token }) => {
      fetch(`/api/partner/insights/${token}`)
        .then(res => {
          if (!res.ok) throw new Error('Invalid link')
          return res.json()
        })
        .then(setInsights)
        .catch(() => setError('This link is invalid or has been disabled.'))
        .finally(() => setLoading(false))
    })
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading insights...</p>
        </div>
      </div>
    )
  }

  if (error || !insights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-xl border border-pink-100">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-[#4A1B3C] mb-2">Link Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8 bg-white/50 p-8 rounded-3xl backdrop-blur-sm border border-white shadow-sm">
          <div className="text-5xl mb-3 flex justify-center"><Heart className="text-[#E85D9A] w-12 h-12 fill-[#E85D9A]" /></div>
          <h1 className="text-3xl font-extrabold text-[#4A1B3C] mb-2">
            Luna Insights for {insights.displayName}&apos;s Partner
          </h1>
          <p className="text-gray-600 font-medium">How to be supportive right now</p>
        </div>

        {/* Current Phase Card */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-pink-100">
          <div className="flex items-center gap-3 mb-6 border-b border-pink-50 pb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="text-purple-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-[#4A1B3C]">Right Now</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Phase</div>
                <div className="text-2xl font-black text-purple-600 capitalize">{insights.currentPhase}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Day of Cycle</div>
                <div className="text-lg font-bold text-gray-800">Day {insights.dayOfCycle}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">What This Means</div>
                <p className="text-gray-700 font-medium leading-relaxed">{insights.phaseDescription}</p>
              </div>
              {insights.daysUntilNextPeriod > 0 && (
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Next Period</div>
                  <div className="text-lg font-bold text-rose-500">
                    {insights.daysUntilNextPeriod === 1
                      ? 'Predicted tomorrow'
                      : `Predicted in ${insights.daysUntilNextPeriod} days`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mood & Energy Trend */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-teal-100">
          <div className="flex items-center gap-3 mb-6 border-b border-teal-50 pb-4">
            <div className="p-3 bg-teal-100 rounded-xl">
              <TrendingUp className="text-teal-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-[#4A1B3C]">Recent Trends</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-teal-50 p-4 rounded-2xl">
              <div className="text-xs font-bold text-teal-600/70 uppercase tracking-wider mb-1">General Mood</div>
              <div className="text-xl font-black text-teal-800 capitalize">{insights.generalMoodTrend}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl">
              <div className="text-xs font-bold text-blue-600/70 uppercase tracking-wider mb-1">Energy Level</div>
              <div className="text-xl font-black text-blue-800 capitalize">{insights.generalEnergyTrend}</div>
            </div>
          </div>
        </div>

        {/* Support Tips */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-amber-100">
          <div className="flex items-center gap-3 mb-6 border-b border-amber-50 pb-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Lightbulb className="text-amber-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-[#4A1B3C]">How to Support Her</h2>
          </div>
          
          <div className="mb-6 bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <div className="text-sm font-bold text-amber-800 mb-2">What to expect right now:</div>
            <p className="text-amber-900">{insights.whatToExpect}</p>
          </div>

          <ul className="space-y-4">
            {insights.supportTips.map((tip: string, index: number) => (
              <li key={index} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm mt-0.5">{index + 1}</span>
                <span className="text-gray-700 font-medium leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Do's and Don'ts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10" />
            <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">✓</span> Do
            </h3>
            <ul className="space-y-3">
              {insights.dosDonts.dos.map((item: string, index: number) => (
                <li key={index} className="text-emerald-900 font-medium flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-md border border-rose-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-10" />
            <h3 className="text-xl font-bold text-rose-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">✗</span> Don&apos;t
            </h3>
            <ul className="space-y-3">
              {insights.dosDonts.donts.map((item: string, index: number) => (
                <li key={index} className="text-rose-900 font-medium flex items-start gap-2">
                  <span className="text-rose-500 mt-1">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm font-medium text-gray-500 pt-8 pb-4">
          <p>This view respects {insights.displayName}&apos;s privacy.</p>
          <p>You see helpful insights — not her raw health data or personal notes.</p>
        </div>
      </div>
    </div>
  )
}
