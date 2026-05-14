'use client';

import { useState } from 'react';
import { Prediction, CycleLog, DailyLog } from '@/types/cycle';
import { DayDrawer } from './DayDrawer';
import { CycleLogModal } from './CycleLogModal';
import { DailyFeelingsModal } from './DailyFeelingsModal';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  prediction: Prediction | null;
  cycles: CycleLog[];
  logs: DailyLog[];
  onRefresh: () => void;
}

export function CalendarGrid({ prediction, cycles, logs, onRefresh }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [isCycleModalOpen, setCycleModalOpen] = useState(false);
  const [selectedCycleData, setSelectedCycleData] = useState<CycleLog | undefined>();

  const [isDailyModalOpen, setDailyModalOpen] = useState(false);
  const [selectedDailyData, setSelectedDailyData] = useState<Partial<DailyLog> | undefined>();

  // Calendar math
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));

  const today = new Date();
  today.setHours(0,0,0,0);

  const toLocalString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const toLocalDate = (dateVal: string | Date) => {
    const dateStr = typeof dateVal === 'string' ? dateVal : String(dateVal);
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const isPeriodDay = (date: Date) => {
    return cycles.some(c => {
      const s = toLocalDate(c.period_start);
      const e = c.period_end ? toLocalDate(c.period_end) : new Date(s.getFullYear(), s.getMonth(), s.getDate() + 5);
      return date >= s && date <= e;
    });
  };

  const isPredictedPeriod = (date: Date) => {
    if (!prediction) return false;
    const s = toLocalDate(prediction.predictedStart);
    const e = toLocalDate(prediction.predictedEnd);
    return date >= s && date <= e;
  };

  const isFertile = (date: Date) => {
    if (!prediction) return false;
    const s = toLocalDate(prediction.fertileStart);
    const e = toLocalDate(prediction.fertileEnd);
    return date >= s && date <= e;
  };

  const isOvulation = (date: Date) => {
    if (!prediction || !prediction.ovulationDate) return false;
    const ov = toLocalDate(prediction.ovulationDate);
    return date.getTime() === ov.getTime();
  };

  const hasLog = (date: Date) => {
    const dStr = toLocalString(date);
    return logs.some(l => l.log_date === dStr);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEditCycle = (log: CycleLog) => {
    setSelectedCycleData(log);
    setCycleModalOpen(true);
  };

  const handleEditDaily = (date: Date, existingLog: DailyLog | null) => {
    setSelectedDailyData(existingLog || { log_date: toLocalString(date) });
    setDailyModalOpen(true);
  };

  const getDayContent = (date: Date) => {
    const isToday = date.getTime() === today.getTime();
    const isPd = isPeriodDay(date);
    const isPredPd = isPredictedPeriod(date);
    const isFert = isFertile(date);

    let bgClass = "bg-white/60 hover:bg-white";
    let borderClass = "border-transparent";
    let textClass = "text-[#4A1B3C]";

    if (isPd) {
      bgClass = "bg-rose-100 hover:bg-rose-200";
      textClass = "text-rose-900 font-bold";
    } else if (isPredPd) {
      bgClass = "bg-white hover:bg-rose-50";
      borderClass = "border-rose-300 border-dashed border-2";
    } else if (isFert) {
      bgClass = "bg-teal-50 hover:bg-teal-100";
      textClass = "text-teal-900";
    }

    if (isToday) {
      borderClass = "border-[#E85D9A] border-2 shadow-[0_0_15px_rgba(232,93,154,0.3)]";
      textClass += " font-black";
    }

    return (
      <motion.div 
        whileHover={{ scale: 1.05, zIndex: 10 }}
        whileTap={{ scale: 0.95 }}
        key={date.toString()} 
        onClick={() => handleDayClick(date)} 
        className={`h-14 sm:h-20 w-full rounded-2xl p-1.5 sm:p-2 relative cursor-pointer transition-all ${bgClass} ${borderClass}`}
      >
        <span className={`text-sm sm:text-lg ${textClass}`}>
          {date.getDate()}
        </span>
        
        {isOvulation(date) && (
          <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" title="Predicted Ovulation" />
        )}
        
        {hasLog(date) && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E85D9A] shadow-sm" title="Log exists" />
          </div>
        )}
      </motion.div>
    );
  };

  const selectedDaily = selectedDate ? logs.find(l => l.log_date === toLocalString(selectedDate)) || null : null;
  const selectedCycle = selectedDate ? cycles.find(c => {
    const s = toLocalDate(c.period_start);
    const e = c.period_end ? toLocalDate(c.period_end) : new Date(s.getFullYear(), s.getMonth(), s.getDate() + 5);
    return selectedDate >= s && selectedDate <= e;
  }) || null : null;

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-lg border border-[#E85D9A]/10 overflow-hidden">
      <div className="p-6 flex justify-between items-center bg-gradient-to-r from-[#FDF8F9] to-white border-b border-[#E85D9A]/10">
        <h3 className="text-2xl font-extrabold text-[#4A1B3C]">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2.5 rounded-xl bg-white border border-[#E85D9A]/20 shadow-sm hover:bg-pink-50 text-[#E85D9A] transition-colors active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={nextMonth} className="p-2.5 rounded-xl bg-white border border-[#E85D9A]/20 shadow-sm hover:bg-pink-50 text-[#E85D9A] transition-colors active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-gray-50/50">
        <div className="grid grid-cols-7 gap-1 sm:gap-3 mb-3 text-center text-xs sm:text-xs font-black text-[#4A1B3C]/40 uppercase tracking-widest">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          <AnimatePresence mode="popLayout">
            {days.map((date, i) => (
              date === null 
                ? <div key={`empty-${i}`} className="h-14 sm:h-20 rounded-2xl bg-black/5" /> 
                : <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.01 }}
                    key={date.toString()}
                  >
                    {getDayContent(date)}
                  </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-5 sm:p-6 bg-white border-t border-[#E85D9A]/10 flex flex-wrap gap-5 text-xs font-bold text-[#4A1B3C]/70">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-rose-200 rounded-md shadow-sm"></div> Logged Period</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 border-dashed border-2 border-rose-300 rounded-md"></div> Predicted Period</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-teal-100 rounded-md shadow-sm"></div> Fertile Window</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.8)]"></div> Ovulation</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#E85D9A] rounded-full"></div> Logged Data</div>
      </div>

      {selectedDate && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedDate(null)} />
          <DayDrawer 
            date={selectedDate} 
            isOpen={true} 
            onClose={() => setSelectedDate(null)} 
            dailyLog={selectedDaily}
            cycleLog={selectedCycle}
            onEditDaily={() => { setSelectedDate(null); handleEditDaily(selectedDate, selectedDaily); }}
            onEditCycle={handleEditCycle}
          />
        </>
      )}

      <CycleLogModal
        isOpen={isCycleModalOpen}
        onClose={() => setCycleModalOpen(false)}
        onSuccess={() => { setCycleModalOpen(false); onRefresh(); }}
        initialData={selectedCycleData}
      />

      <DailyFeelingsModal
        isOpen={isDailyModalOpen}
        onClose={() => setDailyModalOpen(false)}
        onSuccess={() => { setDailyModalOpen(false); onRefresh(); }}
        initialData={selectedDailyData}
      />
    </div>
  );
}
