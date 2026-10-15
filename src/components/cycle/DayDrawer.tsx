'use client';

import { useEffect } from 'react';
import { DailyLog, CycleLog } from '@/types/cycle';
import { MoodBar } from './MoodBar';
import { FlowBadge } from './FlowBadge';
import { SymptomChips } from './SymptomChips';
import { Calendar as CalendarIcon, Heart, Droplets, X, Edit3, Plus, Moon, Zap } from 'lucide-react';

interface Props {
  date: Date;
  isOpen: boolean;
  onClose: () => void;
  dailyLog: DailyLog | null;
  cycleLog: CycleLog | null;
  onEditDaily: () => void;
  onEditCycle: (log: CycleLog) => void;
}

const ENERGY_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Very High',
};

const SLEEP_LABELS: Record<number, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

export function DayDrawer({ date, isOpen, onClose, dailyLog, cycleLog, onEditDaily, onEditCycle }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const isToday = new Date().toDateString() === date.toDateString();

  const hasFeelings = Boolean(
    dailyLog && (
      dailyLog.mood ||
      (dailyLog.energy !== undefined && dailyLog.energy !== null) ||
      (dailyLog.sleep_quality !== undefined && dailyLog.sleep_quality !== null) ||
      (dailyLog.stress_level !== undefined && dailyLog.stress_level !== null) ||
      dailyLog.exercise ||
      (dailyLog.symptoms && dailyLog.symptoms.length > 0) ||
      (dailyLog.notes && dailyLog.notes.trim().length > 0) ||
      (dailyLog.flow && dailyLog.flow !== 'none')
    )
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-md transition-all animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-[28px] shadow-[0_25px_60px_rgba(74,27,60,0.18)] border border-[#E85D9A]/15 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#FFF5F8] via-[#FDF8F9] to-white border-b border-[#E85D9A]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E85D9A]/10 text-[#E85D9A] flex items-center justify-center shadow-inner">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#4A1B3C]">
                  {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </h2>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E85D9A] text-white">
                    Today
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9E7A8A]">
                {date.toLocaleDateString(undefined, { year: 'numeric' })}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-100 flex items-center justify-center text-[#4A1B3C] shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          
          {/* Section 1: Period Tracking */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#4A1B3C] uppercase tracking-wider flex items-center gap-1.5">
                <Droplets size={14} className="text-rose-500" /> Period Tracking
              </span>
              {cycleLog && (
                <button 
                  onClick={() => onEditCycle(cycleLog)} 
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  <Edit3 size={12} /> Edit Period
                </button>
              )}
            </div>

            {cycleLog ? (
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs text-rose-700/80 font-medium block">Duration</span>
                    <span className="text-sm font-bold text-rose-900">
                      {new Date(cycleLog.period_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {cycleLog.period_end ? ` – ${new Date(cycleLog.period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ' (Ongoing)'}
                    </span>
                  </div>
                  {cycleLog.avg_flow && <FlowBadge flow={cycleLog.avg_flow} />}
                </div>
              </div>
            ) : (
              <div 
                onClick={() => onEditCycle({ period_start: date.toISOString().split('T')[0] } as CycleLog)}
                className="p-4 rounded-2xl bg-white border border-rose-200/70 hover:border-rose-400 hover:bg-rose-50/40 transition-all cursor-pointer shadow-sm active:scale-[0.99] group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    🩸
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#4A1B3C] group-hover:text-rose-600 transition-colors">Log Period Start</h4>
                    <p className="text-xs text-[#9E7A8A]">Did your period begin on this date?</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 group-hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors">
                  <Plus size={14} /> Log Period
                </span>
              </div>
            )}
          </section>

          {/* Section 2: Daily Feelings & Health */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#4A1B3C] uppercase tracking-wider flex items-center gap-1.5">
                <Heart size={14} className="text-[#E85D9A]" /> Daily Feelings & Health
              </span>
              {hasFeelings && (
                <button 
                  onClick={onEditDaily} 
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#E85D9A] hover:text-[#C0487C] hover:underline cursor-pointer"
                >
                  <Edit3 size={12} /> Edit Feelings
                </button>
              )}
            </div>

            {hasFeelings ? (
              <div className="space-y-3.5">
                {/* Mood & Flow row */}
                {(dailyLog?.mood || (dailyLog?.flow && dailyLog.flow !== 'none')) && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {dailyLog?.mood && (
                      <div className="px-3 py-1.5 rounded-xl bg-white border border-pink-100 shadow-sm flex items-center gap-2">
                        <MoodBar mood={dailyLog.mood} />
                      </div>
                    )}
                    {dailyLog?.flow && dailyLog.flow !== 'none' && (
                      <FlowBadge flow={dailyLog.flow} />
                    )}
                  </div>
                )}

                {/* Energy & Sleep Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {dailyLog?.energy ? (
                    <div className="p-3 rounded-xl bg-[#FEF6E7] border border-amber-200/60">
                      <span className="text-[10px] font-bold text-[#BA7517] uppercase flex items-center gap-1 mb-1">
                        <Zap size={12} /> Energy
                      </span>
                      <span className="text-xs font-extrabold text-[#784206] block">
                        {dailyLog.energy}/5 · {ENERGY_LABELS[dailyLog.energy] || 'Rated'}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-400">
                      <span className="text-[10px] font-bold uppercase flex items-center gap-1 mb-1">
                        <Zap size={12} /> Energy
                      </span>
                      <span className="text-xs font-medium italic">Not logged</span>
                    </div>
                  )}

                  {dailyLog?.sleep_quality ? (
                    <div className="p-3 rounded-xl bg-[#EEF2FF] border border-indigo-200/60">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase flex items-center gap-1 mb-1">
                        <Moon size={12} /> Sleep Quality
                      </span>
                      <span className="text-xs font-extrabold text-indigo-900 block">
                        {dailyLog.sleep_quality}/5 · {SLEEP_LABELS[dailyLog.sleep_quality] || 'Rated'}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-400">
                      <span className="text-[10px] font-bold uppercase flex items-center gap-1 mb-1">
                        <Moon size={12} /> Sleep
                      </span>
                      <span className="text-xs font-medium italic">Not logged</span>
                    </div>
                  )}
                </div>

                {/* Stress & Exercise pills */}
                {((dailyLog?.stress_level !== undefined && dailyLog.stress_level !== null) || dailyLog?.exercise) && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {dailyLog?.stress_level !== undefined && dailyLog.stress_level !== null && (
                      <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 font-semibold flex items-center gap-1.5">
                        🧘 Stress: {dailyLog.stress_level === 0 ? 'None' : `${dailyLog.stress_level}/5`}
                      </span>
                    )}
                    {dailyLog?.exercise && (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold flex items-center gap-1.5">
                        🏃 Exercise: {dailyLog.exercise_type || 'Active'}
                      </span>
                    )}
                  </div>
                )}

                {/* Symptoms */}
                {dailyLog?.symptoms && dailyLog.symptoms.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E85D9A]/15 shadow-sm">
                    <span className="text-[11px] font-bold text-[#4A1B3C]/70 uppercase block mb-2">
                      Symptoms Experienced
                    </span>
                    <SymptomChips symptoms={dailyLog.symptoms} />
                  </div>
                )}

                {/* Journal Notes */}
                {dailyLog?.notes && dailyLog.notes.trim().length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#FFF9FB] border border-[#E85D9A]/15 shadow-sm">
                    <span className="text-[11px] font-bold text-[#4A1B3C]/70 uppercase block mb-1">
                      Journal Notes
                    </span>
                    <p className="text-xs text-[#4A1B3C] italic leading-relaxed">
                      &quot;{dailyLog.notes}&quot;
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div 
                onClick={onEditDaily}
                className="p-6 rounded-2xl bg-gradient-to-br from-pink-50/50 via-white to-purple-50/30 border border-pink-100 hover:border-[#E85D9A]/40 transition-all cursor-pointer shadow-sm hover:shadow-md text-center group active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-2xl bg-pink-100/70 text-[#E85D9A] flex items-center justify-center mx-auto mb-2.5 text-2xl group-hover:scale-110 transition-transform">
                  🌸
                </div>
                <h4 className="text-sm font-bold text-[#4A1B3C] mb-1 group-hover:text-[#E85D9A] transition-colors">
                  No Feelings Logged Yet
                </h4>
                <p className="text-xs text-[#9E7A8A] max-w-xs mx-auto mb-4">
                  Log your mood, energy levels, sleep quality, symptoms, and thoughts for this day.
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEditDaily(); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#E85D9A] to-[#C0487C] text-white text-xs font-bold shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Log Feelings for This Day
                </button>
              </div>
            )}
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-gray-100 bg-[#FDF8F9]/50 flex items-center justify-between">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          <div className="flex gap-2">
            {!hasFeelings && (
              <button
                type="button"
                onClick={onEditDaily}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#E85D9A] bg-[#FFF0F4] hover:bg-[#FFE5EC] border border-[#E85D9A]/20 transition-all active:scale-95 cursor-pointer"
              >
                Log Feelings
              </button>
            )}
            {!cycleLog && (
              <button
                type="button"
                onClick={() => onEditCycle({ period_start: date.toISOString().split('T')[0] } as CycleLog)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95 cursor-pointer"
              >
                Log Period
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
