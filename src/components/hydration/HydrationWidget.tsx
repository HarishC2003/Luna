'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CyclePhase } from '@/lib/cycle/predictor';
import { getDailyWaterGoal } from '@/lib/hydration/goal';

interface Props {
  phase: CyclePhase;
}

export function HydrationWidget({ phase }: Props) {
  const [glasses, setGlasses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const goal = getDailyWaterGoal(phase);

  const fetchToday = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      const res = await fetch(`/api/daily-log?startDate=${todayStr}&endDate=${todayStr}`);
      const json = await res.json();
      if (json.logs && json.logs.length > 0) {
        setGlasses(json.logs[0].water_glasses ?? 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setTimeout(() => setMounted(true), 100);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchToday();
  }, [fetchToday]);

  const updateGlasses = async (newCount: number) => {
    const clamped = Math.max(0, Math.min(20, newCount));
    const previousGlasses = glasses;
    setGlasses(clamped);

    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    try {
      const res = await fetch('/api/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logDate: todayStr, waterGlasses: clamped })
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Hydration update failed:', errorData);
        throw new Error('Failed to update hydration log');
      }
    } catch (e) {
      console.error(e);
      setGlasses(previousGlasses);
    }
  };

  const totalIcons = Math.max(goal.glasses, Math.min(10, glasses + 2)); // show up to 10 or goal
  
  // SVG progress ring
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(glasses / goal.glasses, 1);
  const strokeDashoffset = circumference * (1 - progress);

  if (loading) {
    return <div className="w-full h-[180px] bg-white rounded-[20px] shadow-sm animate-pulse border-[0.5px] border-[#E85D9A]/10" />;
  }

  return (
    <div className={`w-full bg-white rounded-[20px] p-[16px] shadow-[0_2px_12px_rgba(232,93,154,0.08)] border-[0.5px] border-[#E85D9A]/10 transform transition-all duration-400 opacity-0 translate-y-3 ${mounted ? '!opacity-100 !translate-y-0' : ''}`} style={{ transitionDelay: '80ms' }}>
      
      {/* Top Row */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-[6px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#378ADD">
            <path d="M12 21.5c-3.8 0-6.5-3.1-6.5-6.8 0-3.3 2.8-7 6-11.4l.5-.7.5.7c3.2 4.4 6 8.1 6 11.4 0 3.7-2.7 6.8-6.5 6.8z"/>
          </svg>
          <span className="text-[14px] font-semibold text-[#1A0A12]">Hydration</span>
        </div>
        <div className="text-[12px] text-[#9E7A8A]">
          {glasses}/{goal.glasses} glasses
        </div>
      </div>

      {/* Glass Icons Row */}
      <div className="flex items-center gap-[6px] overflow-x-auto hide-scrollbar mb-6 pb-1">
        {Array.from({ length: totalIcons }).map((_, i) => {
          const isFilled = i < glasses;
          return (
            <div 
              key={i} 
              onClick={() => updateGlasses(i + 1)}
              className="cursor-pointer shrink-0 transition-transform active:scale-90"
            >
              <svg width="22" height="28" viewBox="0 0 24 32">
                <defs>
                  <clipPath id={`fill-${i}`}>
                    <rect 
                      x="0" 
                      y={isFilled ? "0" : "32"} 
                      width="24" 
                      height="32" 
                      className="transition-all duration-300 ease-out"
                    />
                  </clipPath>
                </defs>
                <path d="M4 2L6 28c.2 2 1.5 3 3 3h6c1.5 0 2.8-1 3-3L20 2z" fill="#E6F1FB" />
                <path d="M4 2L6 28c.2 2 1.5 3 3 3h6c1.5 0 2.8-1 3-3L20 2z" fill="#378ADD" clipPath={`url(#fill-${i})`} />
                <path d="M4 2L6 28c.2 2 1.5 3 3 3h6c1.5 0 2.8-1 3-3L20 2z" fill="none" stroke="#378ADD" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Bottom Row */}
      <div className="flex justify-between items-end">
        <div className="text-[11px] text-[#9E7A8A] max-w-[50%]">
          Goal: {goal.glasses} glasses · {phase} phase
        </div>
        
        <div className="flex items-center gap-[12px]">
          <div className="flex items-center gap-[8px]">
            <button
              onClick={() => updateGlasses(glasses - 1)}
              disabled={glasses <= 0}
              className="w-[28px] h-[28px] rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold disabled:opacity-50 transition-transform active:scale-90"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button
              onClick={() => updateGlasses(glasses + 1)}
              disabled={glasses >= 20}
              className="w-[28px] h-[28px] rounded-full bg-[#378ADD] text-white flex items-center justify-center font-bold disabled:opacity-50 transition-transform active:scale-90 shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>

          <div className="relative w-[56px] h-[56px] shrink-0 ml-2">
            <svg width="56" height="56" viewBox="0 0 56 56" className="transform -rotate-90">
              <circle cx="28" cy="28" r={radius} stroke="#E6F1FB" strokeWidth="4" fill="none" />
              <circle
                cx="28" cy="28" r={radius}
                stroke={progress >= 1 ? '#22c55e' : '#378ADD'}
                strokeWidth="4" fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[14px] font-bold ${progress >= 1 ? 'text-green-600' : 'text-[#378ADD]'}`}>
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
