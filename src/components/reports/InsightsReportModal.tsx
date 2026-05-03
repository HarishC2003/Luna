'use client'
import { Sparkles, TrendingUp, Lightbulb, X } from 'lucide-react'

interface ReportData {
  cycleNumber: number
  cycleLength: number
  periodLength: number
  avgMood: number
  avgEnergy: number
  topSymptoms: string[]
  moodTrend: string
  energyTrend: string
  patternsDiscovered: string[]
  recommendations: string[]
}

export default function InsightsReportModal({ 
  report, 
  onClose 
}: { 
  report: ReportData
  onClose: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles size={24} />
            <h2 className="text-2xl font-bold">Your Luna Insights Report</h2>
          </div>
          <p className="text-white/90 text-sm">Cycle #{report.cycleNumber} Summary</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Cycle Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-[#4A1B3C]">
              <TrendingUp size={20} className="text-purple-600" />
              Cycle Overview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">Cycle Length</div>
                <div className="text-2xl font-bold text-purple-900">{report.cycleLength} days</div>
              </div>
              <div className="bg-pink-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">Period Length</div>
                <div className="text-2xl font-bold text-pink-900">{report.periodLength} days</div>
              </div>
              <div className="bg-teal-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">Average Mood</div>
                <div className="text-2xl font-bold text-teal-900">
                  {report.avgMood.toFixed(1)}/5
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="text-sm text-gray-600">Average Energy</div>
                <div className="text-2xl font-bold text-amber-900">
                  {report.avgEnergy.toFixed(1)}/5
                </div>
              </div>
            </div>
          </div>

          {/* Top Symptoms */}
          {report.topSymptoms.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-[#4A1B3C]">Most Common Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {report.topSymptoms.map((symptom, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-red-50 text-red-800 rounded-full text-sm border border-red-200 capitalize"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Patterns Discovered */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-[#4A1B3C]">
              <Sparkles size={20} className="text-purple-600" />
              Patterns We Noticed
            </h3>
            <ul className="space-y-3">
              {report.patternsDiscovered.map((pattern, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-800">{pattern}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-[#4A1B3C]">
              <Lightbulb size={20} className="text-amber-600" />
              Recommendations for Next Cycle
            </h3>
            <ul className="space-y-3">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-amber-600 font-bold">✓</span>
                  <span className="text-gray-800">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center pt-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
