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
          <div className="space-y-6 p-4 sm:p-6 bg-gray-50/50">
            {logs.map(log => {
              const d = new Date(log.log_date);
              const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
              const day = d.toLocaleDateString(undefined, { day: 'numeric' });
              const monthYear = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

              return (
                <div 
                  key={log.id} 
                  className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(74,27,60,0.02)] border border-[#E85D9A]/15 hover:border-[#E85D9A]/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(232,93,154,0.06)] flex flex-col gap-4 relative group"
                >
                  <div className="flex flex-col sm:flex-row gap-5 items-stretch w-full">
                    {/* Date Block */}
                    <div className="flex sm:flex-col items-baseline sm:items-center justify-between sm:justify-center gap-0.5 pb-4 sm:pb-0 sm:border-r border-[#E85D9A]/15 sm:pr-6 sm:w-28 flex-shrink-0">
                      <span className="text-xs font-bold text-[#E85D9A] uppercase tracking-widest">{weekday}</span>
                      <span className="text-4xl font-black text-[#4A1B3C] leading-none my-1">{day}</span>
                      <span className="text-[11px] font-bold text-[#4A1B3C]/50">{monthYear}</span>
                    </div>

                    {/* Metrics Grid */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                      {/* Mood */}
                      {log.mood && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1B3C]/40 block">Mood</span>
                          <MoodBar mood={log.mood} />
                        </div>
                      )}

                      {/* Energy */}
                      {log.energy !== undefined && log.energy !== null && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1B3C]/40 block">Energy</span>
                          <div className="flex gap-1 items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span 
                                key={i} 
                                className={`text-base transition-all duration-300 ${
                                  i < log.energy! ? 'text-amber-400 drop-shadow-[0_2px_4px_rgba(251,191,36,0.3)]' : 'grayscale opacity-25'
                                }`}
                              >
                                ⚡
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sleep Quality */}
                      {log.sleep_quality !== undefined && log.sleep_quality !== null && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1B3C]/40 block">Sleep Quality</span>
                          <div className="flex gap-1 items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span 
                                key={i} 
                                className={`text-base transition-all duration-300 ${
                                  i < log.sleep_quality! ? 'text-indigo-500 drop-shadow-[0_2px_4px_rgba(99,102,241,0.3)]' : 'grayscale opacity-25'
                                }`}
                              >
                                🌙
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stress Level */}
                      {log.stress_level !== undefined && log.stress_level !== null && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1B3C]/40 block">Stress Level</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            log.stress_level === 0 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : log.stress_level <= 2 
                                ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                : log.stress_level <= 4 
                                  ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                  : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {log.stress_level === 0 ? '🍃 No Stress' : `Level ${log.stress_level}`}
                          </span>
                        </div>
                      )}

                      {/* Hydration */}
                      {log.water_glasses !== undefined && log.water_glasses !== null && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1B3C]/40 block">Hydration</span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                            💧 {log.water_glasses} {log.water_glasses === 1 ? 'glass' : 'glasses'}
                          </span>
                        </div>
                      )}

                      {/* Exercise */}
                      {log.exercise && log.exercise_type && log.exercise_type !== 'none' && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1B3C]/40 block">Exercise</span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100 capitalize">
                            🏃‍♀️ {log.exercise_type}
                          </span>
                        </div>
                      )}

                      {/* Flow */}
                      {log.flow && log.flow !== 'none' && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1B3C]/40 block">Flow</span>
                          <FlowBadge flow={log.flow} />
                        </div>
                      )}

                      {/* Symptoms */}
                      {log.symptoms && log.symptoms.length > 0 && (
                        <div className="space-y-1 col-span-2 md:col-span-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1B3C]/40 block mb-1">Symptoms</span>
                          <SymptomChips symptoms={log.symptoms} />
                        </div>
                      )}
                    </div>

                    {/* Actions Side */}
                    <div className="flex sm:flex-col gap-2 justify-center sm:pl-4 sm:border-l border-[#E85D9A]/15 sm:w-16 flex-shrink-0">
                      {isDeleting === log.id ? (
                        <div className="flex flex-col gap-1.5 items-center justify-center animate-scale-in">
                          <span className="text-[9px] font-black text-red-500 uppercase">Confirm?</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => handleDelete(log.id)} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-colors shadow-sm">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                            </button>
                            <button onClick={() => setIsDeleting(null)} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 active:scale-95 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex sm:flex-col gap-1.5 justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            onClick={() => setEditingLog(log)}
                            className="p-2 rounded-xl text-[#E85D9A] hover:bg-[#E85D9A]/10 active:scale-95 transition-all"
                            title="Edit Log"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                          </button>
                          <button 
                            onClick={() => setIsDeleting(log.id)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all"
                            title="Delete Log"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Journal Notes at bottom if present */}
                  {log.notes && (
                    <div className="w-full border-t border-[#E85D9A]/10 pt-3 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1B3C]/40">Journal Note</span>
                      <div className="p-3 bg-[#FDF8F9]/60 rounded-2xl border-l-4 border-[#E85D9A] text-sm text-[#4A1B3C] italic relative">
                        <span className="absolute top-1 left-2 text-3xl text-[#E85D9A]/10 font-serif leading-none">“</span>
                        <p className="pl-4 pr-2 font-medium leading-relaxed">{log.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
