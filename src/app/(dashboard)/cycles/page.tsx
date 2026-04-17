'use client';

import { useEffect, useState } from 'react';
import { CycleLog } from '@/types/cycle';
import { CycleLogModal } from '@/components/cycle/CycleLogModal';
import { FlowBadge } from '@/components/cycle/FlowBadge';

export default function CyclesPage() {
  const [cycles, setCycles] = useState<CycleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<CycleLog | undefined>();

  const fetchCycles = async () => {
    try {
      const res = await fetch('/api/cycles?limit=12');
      const data = await res.json();
      setCycles(data.cycles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const openLogModal = (cycle?: CycleLog) => {
    setSelectedCycle(cycle);
    setModalOpen(true);
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
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-[#4A1B3C]">Cycle History</h1>
        <button 
          onClick={() => openLogModal()} 
          className="bg-[#E85D9A] hover:bg-[#d44d88] text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all text-sm tracking-wide"
        >
          + Log Period
        </button>
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

      <div className="bg-white rounded-3xl shadow-sm border border-[#E85D9A]/10 overflow-hidden">
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
    </div>
  );
}
