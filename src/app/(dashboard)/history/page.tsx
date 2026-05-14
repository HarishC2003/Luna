'use client';

import { useEffect, useState } from 'react';
import { DailyLog } from '@/types/cycle';
import { MoodBar } from '@/components/cycle/MoodBar';
import { MoodGraph } from '@/components/cycle/MoodGraph';
import { FlowBadge } from '@/components/cycle/FlowBadge';
import { SymptomChips } from '@/components/cycle/SymptomChips';
import { DailyFeelingsModal } from '@/components/cycle/DailyFeelingsModal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookOpen } from 'lucide-react';

export default function HistoryPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLogs(logs.filter(l => l.id !== id));
        setIsDeleting(null);
        showToast('success', 'Log deleted successfully');
      } else {
        showToast('error', 'Failed to delete log');
      }
    } catch (_e) {
      showToast('error', 'An error occurred');
    }
  };



  const chartData = logs.filter(l => l.mood).slice(0, 7).reverse();

  return (
    <div className="space-y-8 pb-10 animate-fade-in stagger-children">
      <h1 className="text-3xl font-extrabold text-[#4A1B3C]">Daily History</h1>

      {chartData.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E85D9A]/10">
            <h3 className="text-sm font-bold text-[#4A1B3C]/50 uppercase tracking-widest mb-6">Mood Trend (Last 7 Logs)</h3>
            <MoodGraph logs={chartData} />
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-[#E85D9A]/10 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="text-[#E85D9A]" size={24} />}
            title="No history yet"
            description="You haven't logged any daily feelings in the last 30 days."
          />
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
                      {log.energy && <div className="flex items-center gap-3"><span className="w-16 text-xs uppercase font-semibold text-[#4A1B3C]/40">Energy</span><div className="flex gap-1">{Array.from({length: 5}).map((_, i) => <span key={i} className={i < log.energy! ? 'text-lg active-bolt drop-shadow-sm' : 'text-lg grayscale opacity-30'}>⚡</span>)}</div></div>}
                  </div>
                  <div className="space-y-4">
                      {log.flow && <div className="flex items-center gap-3"><span className="w-16 text-xs uppercase font-semibold text-[#4A1B3C]/40">Flow</span><FlowBadge flow={log.flow} /></div>}
                      {log.symptoms && log.symptoms.length > 0 && <div className="flex flex-col gap-2"><span className="text-xs uppercase font-semibold text-[#4A1B3C]/40 block">Symptoms</span><SymptomChips symptoms={log.symptoms} /></div>}
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 justify-center sm:pl-4 sm:border-l border-[#E85D9A]/10">
                   {isDeleting === log.id ? (
                     <div className="flex flex-col gap-2 animate-scale-in">
                       <span className="text-[10px] font-bold text-red-500 uppercase text-center">Are you sure?</span>
                       <div className="flex gap-2">
                        <button onClick={() => handleDelete(log.id)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        </button>
                        <button onClick={() => setIsDeleting(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                       </div>
                     </div>
                   ) : (
                     <div className="flex sm:flex-col gap-2">
                        <button 
                          onClick={() => setEditingLog(log)}
                          className="p-2 rounded-xl text-[#E85D9A] hover:bg-[#E85D9A]/10 transition-colors"
                          title="Edit Log"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button 
                          onClick={() => setIsDeleting(log.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Log"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DailyFeelingsModal 
        isOpen={!!editingLog} 
        onClose={() => setEditingLog(null)} 
        initialData={editingLog || undefined}
        onSuccess={() => {
          setEditingLog(null);
          fetchLogs();
        }}
      />
    </div>
  );
}
