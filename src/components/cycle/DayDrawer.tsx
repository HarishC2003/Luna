'use client';

import { DailyLog, CycleLog } from '@/types/cycle';
import { MoodBar } from './MoodBar';
import { FlowBadge } from './FlowBadge';
import { SymptomChips } from './SymptomChips';

interface Props {
  date: Date;
  isOpen: boolean;
  onClose: () => void;
  dailyLog: DailyLog | null;
  cycleLog: CycleLog | null;
  onEditDaily: (date: string, log?: DailyLog) => void;
  onEditCycle: (log: CycleLog) => void;
}

export function DayDrawer({ date, isOpen, onClose, dailyLog, cycleLog, onEditDaily, onEditCycle }: Props) {
  if (!isOpen) return null;
  const dateStr = date.toISOString().split('T')[0];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] bg-white shadow-[-10px_0_30px_rgba(74,27,60,0.1)] flex flex-col transform transition-transform animate-slide-in">
      <div className="px-6 py-5 border-b border-[#E85D9A]/10 flex justify-between items-center bg-[#FDF8F9]">
        <h2 className="text-xl font-bold text-[#4A1B3C]">
          {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-[#E85D9A]/10 rounded-full text-[#4A1B3C] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Cycle Section */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-sm font-semibold text-[#4A1B3C] uppercase tracking-wider">Period Tracking</h3>
            {cycleLog && (
              <button onClick={() => onEditCycle(cycleLog)} className="text-xs font-semibold text-[#E85D9A] hover:underline">Edit</button>
            )}
          </div>
          
          {cycleLog ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <div className="flex justify-between mb-2">
                <span className="text-[#4A1B3C]">Started</span>
                <span className="font-semibold text-[#4A1B3C]">{new Date(cycleLog.period_start).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-[#4A1B3C]">Ended</span>
                <span className="font-semibold text-[#4A1B3C]">{cycleLog.period_end ? new Date(cycleLog.period_end).toLocaleDateString() : 'Ongoing'}</span>
              </div>
              {cycleLog.avg_flow && (
                <div className="flex justify-between">
                  <span className="text-[#4A1B3C]">Avg Flow</span>
                  <FlowBadge flow={cycleLog.avg_flow} />
                </div>
              )}
            </div>
          ) : (
             <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <p className="text-sm text-[#4A1B3C]/70 mb-3">No period started on this date.</p>
             </div>
          )}
        </section>

        {/* Daily Section */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-sm font-semibold text-[#4A1B3C] uppercase tracking-wider">Daily Log</h3>
            <button onClick={() => onEditDaily(dateStr, dailyLog || undefined)} className="text-xs font-semibold text-[#E85D9A] hover:underline">
              {dailyLog ? 'Edit' : 'Add Log'}
            </button>
          </div>

          {dailyLog ? (
            <div className="space-y-4">
              {dailyLog.mood && <div className="p-4 rounded-xl bg-[#FDF8F9]"><span className="text-xs opacity-50 uppercase block mb-1">Mood</span><MoodBar mood={dailyLog.mood} /></div>}
              {dailyLog.flow && <div className="p-4 rounded-xl bg-[#FDF8F9]"><span className="text-xs opacity-50 uppercase block mb-1">Flow</span><FlowBadge flow={dailyLog.flow} /></div>}
              {dailyLog.energy && <div className="p-4 rounded-xl bg-[#FDF8F9]"><span className="text-xs opacity-50 uppercase block mb-1">Energy</span><div className="flex gap-1">{Array.from({length: 5}).map((_, i) => <span key={i} className={i < dailyLog.energy! ? 'text-amber-400' : 'text-gray-200'}>⚡</span>)}</div></div>}
              {dailyLog.symptoms && dailyLog.symptoms.length > 0 && <div className="p-4 rounded-xl bg-[#FDF8F9]"><span className="text-xs opacity-50 uppercase block mb-2">Symptoms</span><SymptomChips symptoms={dailyLog.symptoms} /></div>}
              {dailyLog.notes && <div className="p-4 rounded-xl bg-[#FDF8F9]"><span className="text-xs opacity-50 uppercase block mb-1">Notes</span><p className="text-sm text-[#4A1B3C] italic">"{dailyLog.notes}"</p></div>}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#FDF8F9] border border-[#E85D9A]/20 text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-[#E85D9A]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
              </div>
              <p className="text-sm text-[#4A1B3C]/70">No data logged for today.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
