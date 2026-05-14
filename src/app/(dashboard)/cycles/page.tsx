'use client';

import { useEffect, useState, useCallback } from 'react';
import { CycleLog } from '@/types/cycle';
import { CycleLogModal } from '@/components/cycle/CycleLogModal';
import { FlowBadge } from '@/components/cycle/FlowBadge';
import CycleComparisonTimeline from '@/components/cycles/CycleComparisonTimeline';
import InsightsReportModal from '@/components/reports/InsightsReportModal';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';

interface InsightsReportData {
  cycleNumber: number;
  cycleLength: number;
  periodLength: number;
  avgMood: number;
  avgEnergy: number;
  topSymptoms: string[];
  moodTrend: string;
  energyTrend: string;
  patternsDiscovered: string[];
  recommendations: string[];
}

export default function CyclesPage() {
  const { showToast } = useToast();
  const [cycles, setCycles] = useState<CycleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<CycleLog | undefined>();

  // AI Insights Report state
  const [showInsightsReport, setShowInsightsReport] = useState(false);
  const [insightsReport, setInsightsReport] = useState<InsightsReportData | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const fetchCycles = useCallback(async () => {
    try {
      const res = await fetch('/api/cycles?limit=12');
      const data = await res.json();
      setCycles(data.cycles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on mount is a standard pattern
    fetchCycles();
  }, [fetchCycles]);

  const openLogModal = (cycle?: CycleLog) => {
    setSelectedCycle(cycle);
    setModalOpen(true);
  };

  const handleGenerateInsightsReport = async () => {
    setGeneratingInsights(true);
    try {
      const res = await fetch('/api/reports/insights', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setInsightsReport(data.report);
        setShowInsightsReport(true);
      } else {
        showToast('error', data.error || 'Failed to generate report');
      }
    } catch (_err) {
      showToast('error', 'Failed to generate report');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const completedCycles = cycles.filter(c => c.cycle_length);
  const avgCycle = completedCycles.length ? Math.round(completedCycles.reduce((a,b) => a + b.cycle_length!, 0) / completedCycles.length) : 0;
  
  // calculate average period length
  const periodsWithEnd = cycles.filter(c => c.period_end);
  const avgPeriod = periodsWithEnd.length ? Math.round(periodsWithEnd.reduce((a,b) => {
      const ms = new Date(b.period_end!).getTime() - new Date(b.period_start).getTime();
      return a + (ms / (1000*3600*24));
  }, 0) / periodsWithEnd.length) : 0;

  const longest = completedCycles.length ? Math.max(...completedCycles.map(c => c.cycle_length!)) : 0;
  const shortest = completedCycles.length ? Math.min(...completedCycles.map(c => c.cycle_length!)) : 0;

  return (
    <div className="space-y-8 pb-10 animate-fade-in stagger-children">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-[#4A1B3C]">Cycle History</h1>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary"
            onClick={handleGenerateInsightsReport}
            loading={generatingInsights}
            icon={<Sparkles size={16} />}
          >
            AI Insights
          </Button>
          <Button 
            variant="primary"
            onClick={() => openLogModal()}
          >
            + Log Period
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Avg Cycle Length', val: avgCycle ? `${avgCycle} Days` : '-' },
          { label: 'Avg Period Length', val: avgPeriod ? `${avgPeriod} Days` : '-' },
          { label: 'Longest Cycle', val: longest ? `${longest} Days` : '-' },
          { label: 'Shortest Cycle', val: shortest ? `${shortest} Days` : '-' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-[#E85D9A]/10 shadow-sm flex flex-col justify-center text-center">
            <span className="text-[#E85D9A] font-extrabold text-2xl">{stat.val}</span>
            <span className="text-xs font-semibold text-[#4A1B3C]/60 uppercase tracking-widest mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Cycle Comparison Timeline */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#E85D9A]/10 p-6">
        <CycleComparisonTimeline />
      </div>

      {/* Cycle History List */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#E85D9A]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E85D9A]/10">
          <h2 className="text-lg font-extrabold text-[#4A1B3C]">All Cycles</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading history...</div>
        ) : cycles.length === 0 ? (
          <div className="p-12 text-center text-[#4A1B3C]/70">No periods logged yet.</div>
        ) : (
          <div className="divide-y divide-[#E85D9A]/10">
            {cycles.map(cycle => (
              <div key={cycle.id} className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-[#FDF8F9] transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-[#4A1B3C] text-lg">
                    {new Date(cycle.period_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span className="text-[#4A1B3C]/40 mx-2">→</span>
                    {cycle.period_end ? new Date(cycle.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : <span className="text-[#E85D9A] italic">Ongoing</span>}
                  </span>
                  {cycle.cycle_length && (
                    <span className="text-sm font-medium text-[#4A1B3C]/60 mt-1">{cycle.cycle_length} Days</span>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {cycle.avg_flow && <FlowBadge flow={cycle.avg_flow} />}
                  <button onClick={() => openLogModal(cycle)} className="p-2 sm:px-4 sm:py-2 text-[#E85D9A] bg-rose-50 hover:bg-rose-100 rounded-lg text-sm font-semibold transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CycleLogModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={() => { setModalOpen(false); fetchCycles(); }} 
        initialData={selectedCycle} 
      />

      {showInsightsReport && insightsReport && (
        <InsightsReportModal
          report={insightsReport}
          onClose={() => setShowInsightsReport(false)}
        />
      )}
    </div>
  );
}
