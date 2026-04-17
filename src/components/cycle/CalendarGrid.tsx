'use client';

import { useState } from 'react';
import { Prediction, CycleLog, DailyLog } from '@/types/cycle';
import { DayDrawer } from './DayDrawer';
import { DailyLogModal } from './DailyLogModal';
import { CycleLogModal } from './CycleLogModal';

interface Props {
  prediction: Prediction | null;
  cycles: CycleLog[];
  logs: DailyLog[];
  onRefresh: () => void;
}

export function CalendarGrid({ prediction, cycles, logs, onRefresh }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [isDailyModelOpen, setDailyModelOpen] = useState(false);
  const [selectedDailyData, setSelectedDailyData] = useState<DailyLog | undefined>();
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  const [isCycleModalOpen, setCycleModalOpen] = useState(false);
  const [selectedCycleData, setSelectedCycleData] = useState<CycleLog | undefined>();

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

  const isPeriodDay = (date: Date) => {
    return cycles.some(c => {
      const s = new Date(c.period_start);
      // default 5 days if ended not logged
      const e = c.period_end ? new Date(c.period_end) : new Date(s.getTime() + (5 * 24 * 3600 * 1000));
      return date >= s && date <= e;
    });
  };

  const isPredictedPeriod = (date: Date) => {
    if (!prediction) return false;
    const s = new Date(prediction.predictedStart);
    const e = new Date(prediction.predictedEnd);
    return date >= s && date <= e;
  };

  const isFertile = (date: Date) => {
    if (!prediction) return false;
    const s = new Date(prediction.fertileStart);
    const e = new Date(prediction.fertileEnd);
    return date >= s && date <= e;
  };

  const isOvulation = (date: Date) => {
    if (!prediction) return false;
    return date.getTime() === new Date(prediction.ovulationDate).getTime();
  };

  const hasLog = (date: Date) => {
    const dStr = date.toISOString().split('T')[0];
    return logs.some(l => l.log_date === dStr);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEditDaily = (dateStr: string, log?: DailyLog) => {
    setSelectedDateStr(dateStr);
    setSelectedDailyData(log);
    setDailyModelOpen(true);
  };

  const handleEditCycle = (log: CycleLog) => {
    setSelectedCycleData(log);
    setCycleModalOpen(true);
  };

  const getDayContent = (date: Date) => {
    let classes = "h-14 sm:h-20 w-full border border-gray-100 p-1 sm:p-2 relative group cursor-pointer transition-colors ";
    const dTime = date.getTime();

    if (dTime === today.getTime()) {
      classes += " ring-2 ring-[#E85D9A] ring-inset ";
    }

    if (isPeriodDay(date)) {
      classes += " bg-rose-200 hover:bg-rose-300 ";
    } else if (isPredictedPeriod(date)) {
      classes += " bg-white border-dashed border-2 border-rose-300 hover:bg-rose-50 ";
    } else if (isFertile(date)) {
      classes += " bg-teal-50 hover:bg-teal-100 ";
    } else {
      classes += " bg-white hover:bg-gray-50 ";
    }

    return (
      <div key={date.toString()} onClick={() => handleDayClick(date)} className={classes}>
        <span className={`text-sm sm:text-base font-medium ${isPeriodDay(date) ? 'text-rose-900' : 'text-[#4A1B3C]'}`}>
          {date.getDate()}
        </span>
        
        {isOvulation(date) && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500" title="Predicted Ovulation" />
        )}
        
        {hasLog(date) && (
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-[#4A1B3C]" title="Log exists" />
        )}
      </div>
    );
  };

  const selectedDaily = selectedDate ? logs.find(l => l.log_date === selectedDate.toISOString().split('T')[0]) || null : null;
  const selectedCycle = selectedDate ? cycles.find(c => c.period_start === selectedDate.toISOString().split('T')[0]) || null : null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#E85D9A]/10 overflow-hidden">
      <div className="p-6 flex justify-between items-center bg-[#FDF8F9] border-b border-[#E85D9A]/10">
        <h3 className="text-xl font-bold text-[#4A1B3C]">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 rounded-xl bg-white border shadow-sm hover:bg-gray-50">&larr;</button>
          <button onClick={nextMonth} className="p-2 rounded-xl bg-white border shadow-sm hover:bg-gray-50">&rarr;</button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs sm:text-sm font-semibold text-[#4A1B3C]/50 uppercase tracking-widest">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((date, i) => (
            date === null ? <div key={`empty-${i}`} className="h-14 sm:h-20" /> : getDayContent(date)
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-gray-50 border-t flex flex-wrap gap-4 text-xs font-medium text-[#4A1B3C]/70">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-200 rounded-sm"></div> Logged Period</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 border-dashed border border-rose-300 rounded-sm"></div> Predicted Period</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-teal-50 rounded-sm"></div> Fertile Window</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-teal-500 rounded-full"></div> Ovulation</div>
      </div>

      {selectedDate && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedDate(null)} />
          <DayDrawer 
            date={selectedDate} 
            isOpen={true} 
            onClose={() => setSelectedDate(null)} 
            dailyLog={selectedDaily}
            cycleLog={selectedCycle}
            onEditDaily={handleEditDaily}
            onEditCycle={handleEditCycle}
          />
        </>
      )}

      <DailyLogModal 
        isOpen={isDailyModelOpen} 
        onClose={() => setDailyModelOpen(false)} 
        onSuccess={() => { setDailyModelOpen(false); onRefresh(); }}
        selectedDate={selectedDateStr}
        initialData={selectedDailyData}
      />

      <CycleLogModal
        isOpen={isCycleModalOpen}
        onClose={() => setCycleModalOpen(false)}
        onSuccess={() => { setCycleModalOpen(false); onRefresh(); }}
        initialData={selectedCycleData}
      />
    </div>
  );
}
