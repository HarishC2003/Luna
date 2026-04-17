'use client';

import { useEffect, useState } from 'react';
import { DailyLog } from '@/types/cycle';
import { MoodBar } from '@/components/cycle/MoodBar';
import { FlowBadge } from '@/components/cycle/FlowBadge';
import { SymptomChips } from '@/components/cycle/SymptomChips';

export default function HistoryPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        
        const res = await fetch(`/api/daily-log?startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`);
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const moodScore = (mood: string | null) => {
    switch(mood) {
        case 'great': return 5;
        case 'good': return 4;
        case 'okay': return 3;
        case 'low': return 2;
        case 'terrible': return 1;
        default: return 0;
    }
  };

  const chartData = logs.filter(l => l.mood).slice(0, 7).reverse();

  return (
    <div className="space-y-8 pb-10">
      <h1 className="text-3xl font-extrabold text-[#4A1B3C]">Daily History</h1>

      {chartData.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E85D9A]/10">
            <h3 className="text-sm font-bold text-[#4A1B3C]/50 uppercase tracking-widest mb-6">Mood Trend (Last 7 Logs)</h3>
            <div className="flex justify-between items-end h-32 gap-2">
                {chartData.map(log => {
                    const h = (moodScore(log.mood!) / 5) * 100;
                    return (
                        <div key={log.id} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="w-full relative h-full flex items-end">
                                <div className="w-full rounded-t-lg bg-[#E85D9A] transition-all group-hover:bg-[#d44d88] opacity-80" style={{ height: `${h}%` }}></div>
                            </div>
                            <span className="text-[10px] font-semibold text-[#4A1B3C]/50 whitespace-nowrap">{new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-[#E85D9A]/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading history...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#4A1B3C]/70">No daily logs found in the last 30 days.</div>
        ) : (
          <div className="divide-y divide-[#E85D9A]/10">
            {logs.map(log => (
              <div key={log.id} className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4 hover:bg-[#FDF8F9] transition-colors">
                <div className="sm:w-32 flex-shrink-0 pt-1">
                  <span className="font-bold text-[#4A1B3C]">
                    {new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-4">
                      {log.mood && <div className="flex items-center gap-3"><span className="w-16 text-xs uppercase font-semibold text-[#4A1B3C]/40">Mood</span><MoodBar mood={log.mood} /></div>}
                      {log.energy && <div className="flex items-center gap-3"><span className="w-16 text-xs uppercase font-semibold text-[#4A1B3C]/40">Energy</span><div className="flex gap-1">{Array.from({length: 5}).map((_, i) => <span key={i} className={i < log.energy! ? 'text-amber-400' : 'text-gray-200'}>⚡</span>)}</div></div>}
                  </div>
                  <div className="space-y-4">
                      {log.flow && <div className="flex items-center gap-3"><span className="w-16 text-xs uppercase font-semibold text-[#4A1B3C]/40">Flow</span><FlowBadge flow={log.flow} /></div>}
                      {log.symptoms && log.symptoms.length > 0 && <div className="flex flex-col gap-2"><span className="text-xs uppercase font-semibold text-[#4A1B3C]/40 block">Symptoms</span><SymptomChips symptoms={log.symptoms} /></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
