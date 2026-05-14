'use client'
import { Sparkles, TrendingUp, Lightbulb } from 'lucide-react'

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

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function InsightsReportModal({ 
  report, 
  onClose 
}: { 
  report: ReportData
  onClose: () => void 
}) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Your Luna Insights Report">
      <div className="mb-6 -mt-2 flex items-center gap-2">
        <Sparkles size={16} className="text-[#E85D9A]" />
        <p className="text-sm font-medium text-gray-500">Cycle #{report.cycleNumber} Summary</p>
      </div>

      <div className="space-y-6">
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
          <Button variant="primary" onClick={onClose} size="lg">
            Close Report
          </Button>
        </div>
      </div>
    </Modal>
  )
}
