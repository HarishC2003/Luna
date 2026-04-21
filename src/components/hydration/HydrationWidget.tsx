'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CyclePhase } from '@/lib/cycle/predictor';
import { getDailyWaterGoal, getEncouragementText } from '@/lib/hydration/goal';

interface Props {
  phase: CyclePhase;
}

export function HydrationWidget({ phase }: Props) {
  const [glasses, setGlasses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);

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
    }
  }, []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    let isMounted = true;
    if (isMounted) {
      fetchToday();
    }
    return () => { isMounted = false; };
  }, [fetchToday]);

  const updateGlasses = async (newCount: number) => {
    const clamped = Math.max(0, Math.min(20, newCount));
    setGlasses(clamped);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);

    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    try {
      await fetch('/api/daily-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logDate: todayStr, waterGlasses: clamped })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // SVG progress ring
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(glasses / goal.glasses, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const encouragement = getEncouragementText(glasses, goal.glasses);

  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-3xl animate-pulse" />
    );
  }

  return (
    <div className="w-full p-6 sm:p-8 rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">💧</span>
        <h3 className="text-sm font-bold text-sky-700 uppercase tracking-wider">Hydration</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg width="136" height="136" viewBox="0 0 136 136" className="transform -rotate-90">
            {/* Background track */}
            <circle
              cx="68" cy="68" r={radius}
              stroke="#e0f2fe" strokeWidth="10" fill="none"
            />
            {/* Progress arc */}
            <circle
              cx="68" cy="68" r={radius}
              stroke={progress >= 1 ? '#22c55e' : '#0ea5e9'}
              strokeWidth="10" fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-extrabold transition-transform duration-300 ${animating ? 'scale-125' : 'scale-100'} ${progress >= 1 ? 'text-green-600' : 'text-sky-700'}`}>
              {glasses}
            </span>
            <span className="text-xs font-semibold text-sky-400">/ {goal.glasses}</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex-1 flex flex-col items-center sm:items-start gap-4 w-full">
          {/* Glass icons */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
            {Array.from({ length: Math.max(goal.glasses, glasses) }).map((_, i) => (
              <svg key={i} width="22" height="28" viewBox="0 0 22 28" className={`transition-all duration-300 ${i < glasses ? 'opacity-100' : 'opacity-25'}`}>
                <path
                  d="M3 2h16l-2 22c-.1 1.1-1 2-2.1 2H7.1C6 26 5.1 25.1 5 24L3 2z"
                  fill={i < glasses ? '#0ea5e9' : 'none'}
                  stroke={i < glasses ? '#0284c7' : '#94a3b8'}
                  strokeWidth="1.5"
                />
                <line x1="3" y1="2" x2="19" y2="2" stroke={i < glasses ? '#0284c7' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />
              </svg>
            ))}
          </div>

          {/* Encouragement */}
          <p className={`text-sm font-semibold ${progress >= 1 ? 'text-green-600' : 'text-sky-600'}`}>
            {encouragement}
          </p>

          {/* +/- buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateGlasses(glasses - 1)}
              disabled={glasses <= 0}
              className="w-10 h-10 rounded-xl bg-white border border-sky-200 text-sky-600 font-bold text-xl flex items-center justify-center hover:bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
              aria-label="Remove glass"
            >
              −
            </button>
            <button
              onClick={() => updateGlasses(glasses + 1)}
              disabled={glasses >= 20}
              className="w-10 h-10 rounded-xl bg-sky-500 text-white font-bold text-xl flex items-center justify-center hover:bg-sky-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-md"
              aria-label="Add glass"
            >
              +
            </button>
          </div>

          {/* Phase goal */}
          <p className="text-xs text-sky-400 font-medium">
            Goal: {goal.glasses} glasses today ({phase} phase) — {goal.reasoning}
          </p>
        </div>
      </div>
    </div>
  );
}
