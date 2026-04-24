'use client';

import { useState, useEffect } from 'react';
import { BadgeDefinition } from '@/lib/streaks/calculator';
import type { DailyLog } from '@/types/cycle';

interface BadgeWithDate extends BadgeDefinition {
  earnedAt: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  badges: BadgeWithDate[];
}

export function StreakWidget({ allLogs = [] }: { allLogs?: DailyLog[] }) {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetch('/api/streak')
      .then(res => res.json())
      .then(json => { if (!json.error) setData(json); })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setTimeout(() => setMounted(true), 100);
      });
  }, []);

  if (loading) {
    return <div className="w-full h-[120px] bg-white rounded-[20px] shadow-sm animate-pulse border-[0.5px] border-[#E85D9A]/10" />;
  }

  if (!data) return null;

  const streak = data.currentStreak;

  // Calculate last 7 days log status
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    
    // Find if log exists for this date
    const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const isLogged = allLogs.some(log => log.log_date === dStr);
    
    return {
      date: d,
      initial: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      isLogged,
      isToday: i === 6
    };
  });

  return (
    <div className={`w-full bg-white rounded-[20px] p-[16px] shadow-[0_2px_12px_rgba(232,93,154,0.08)] border-[0.5px] border-[#E85D9A]/10 transform transition-all duration-400 opacity-0 translate-y-3 ${mounted ? '!opacity-100 !translate-y-0' : ''}`} style={{ transitionDelay: '160ms' }}>
      {/* Top Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-[6px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B">
            <path d="M12 2C12 2 4 9 4 14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14C20 9 12 2 12 2Z" fill="currentColor" opacity="0.3"/>
            <path d="M12 6C12 6 8 11 8 14C8 16.2091 9.79086 18 12 18C14.2091 18 16 16.2091 16 14C16 11 12 6 12 6Z" fill="currentColor"/>
          </svg>
          <span className="text-[14px] font-semibold text-[#1A0A12]">Logging streak</span>
        </div>
        <span className="text-[13px] font-semibold text-[#F59E0B]">{streak} day streak</span>
      </div>

      {/* Middle Row (7 days) */}
      <div className="flex items-end justify-center gap-[6px] mb-4">
        {last7Days.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-[4px]">
            <div className={`relative flex items-center justify-center ${day.isToday ? 'w-[28px] h-[28px]' : 'w-[24px] h-[24px]'}`}>
              {day.isToday && day.isLogged && (
                <div className="absolute inset-0 rounded-full bg-[#E85D9A] animate-ping opacity-20" />
              )}
              <div 
                className={`w-full h-full rounded-full border-[1.5px] ${
                  day.isLogged 
                    ? 'bg-[#E85D9A] border-[#E85D9A]' 
                    : 'bg-transparent border-[#9E7A8A]/30'
                }`}
              />
            </div>
            <span className="text-[9px] font-medium text-[#9E7A8A] uppercase">{day.initial}</span>
          </div>
        ))}
      </div>

      {/* Bottom Row (Badges) */}
      {data.badges.length > 0 && (
        <div className="flex items-center gap-[8px] overflow-x-auto hide-scrollbar pt-2 border-t border-[#F0E8EC]">
          {data.badges.map(badge => (
            <div key={badge.key} className="shrink-0 flex items-center gap-[4px] bg-[#FEF3C7] px-[8px] py-[4px] rounded-[100px]">
              <span className="text-[12px]">{badge.emoji}</span>
              <span className="text-[11px] font-semibold text-[#B45309] truncate max-w-[80px]">{badge.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
