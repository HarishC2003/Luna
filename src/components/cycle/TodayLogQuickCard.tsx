'use client';

import { DailyLog } from '@/types/cycle';

interface Props {
  todayLog: DailyLog | null;
  onOpenLog: () => void;
}

export function TodayLogQuickCard({ todayLog, onOpenLog }: Props) {
  if (!todayLog) {
    return (
      <div 
        onClick={onOpenLog}
        className="w-full bg-white rounded-[20px] p-[16px] shadow-[0_2px_12px_rgba(232,93,154,0.08)] border-[0.5px] border-[#E85D9A]/10 flex items-center justify-between cursor-pointer transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-[12px]">
          <div className="text-[#E85D9A]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-[#1A0A12]">Log today</h3>
            <p className="text-[12px] text-[#9E7A8A]">Track mood, symptoms & flow</p>
          </div>
        </div>
        <button className="w-[32px] h-[32px] rounded-full bg-[#E85D9A] text-white flex items-center justify-center pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    );
  }

  // Helper to format mood
  const getMoodEmoji = (mood?: string | null) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😔';
      case 'anxious': return '😰';
      case 'angry': return '😠';
      case 'calm': return '😌';
      case 'tired': return '😴';
      default: return '😐';
    }
  };

  const getFlowLevel = (flow?: string | null) => {
    switch (flow) {
      case 'light': return 'Light flow';
      case 'medium': return 'Medium flow';
      case 'heavy': return 'Heavy flow';
      default: return 'No flow';
    }
  };

  return (
    <div 
      onClick={onOpenLog}
      className="w-full bg-white rounded-[20px] p-[16px] shadow-[0_2px_12px_rgba(232,93,154,0.08)] border-[0.5px] border-[#E85D9A]/10 relative cursor-pointer transition-transform active:scale-[0.98]"
    >
      <div className="flex gap-[8px] flex-wrap pr-[40px]">
        {todayLog.mood && (
          <div className="px-[12px] py-[6px] rounded-[100px] bg-[#FFF0F4] text-[#72243E] text-[12px] font-medium flex items-center gap-[4px]">
            <span>{getMoodEmoji(todayLog.mood)}</span>
            <span className="capitalize">{todayLog.mood}</span>
          </div>
        )}
        {todayLog.energy && (
          <div className="px-[12px] py-[6px] rounded-[100px] bg-[#FEF6E7] text-[#BA7517] text-[12px] font-medium flex items-center gap-[4px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>{todayLog.energy}/5 Energy</span>
          </div>
        )}
        {todayLog.flow && todayLog.flow !== 'none' && (
          <div className="px-[12px] py-[6px] rounded-[100px] bg-[#E8F8F2] text-[#085041] text-[12px] font-medium flex items-center gap-[4px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
            <span>{getFlowLevel(todayLog.flow)}</span>
          </div>
        )}
      </div>
      <div className="absolute bottom-[16px] right-[16px] text-[12px] text-[#9E7A8A]">
        Edit
      </div>
    </div>
  );
}
