'use client';

import { useState, useEffect } from 'react';
import { BADGE_DEFINITIONS, BadgeDefinition } from '@/lib/streaks/calculator';

interface BadgeWithDate extends BadgeDefinition {
  earnedAt: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  badges: BadgeWithDate[];
}

export function StreakWidget() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/streak')
      .then(res => res.json())
      .then(json => { if (!json.error) setData(json); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="w-full h-20 bg-gray-100 rounded-3xl animate-pulse" />;
  }

  if (!data) return null;

  const streak = data.currentStreak;

  return (
    <div className="w-full p-6 sm:p-8 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm">
      {/* Streak header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Flame icon */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${streak > 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gray-200'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={streak > 0 ? 'text-white' : 'text-gray-400'}>
              <path d="M12 2C12 2 4 9 4 14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14C20 9 12 2 12 2Z" fill="currentColor" opacity="0.3"/>
              <path d="M12 6C12 6 8 11 8 14C8 16.2091 9.79086 18 12 18C14.2091 18 16 16.2091 16 14C16 11 12 6 12 6Z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h3 className={`text-2xl font-extrabold ${streak > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
              {streak > 0 ? `${streak} day streak` : 'No streak yet'}
            </h3>
            <p className="text-xs font-medium text-amber-500/70">
              {streak > 0
                ? `Longest: ${data.longestStreak} days`
                : 'Start your streak — log today'}
            </p>
          </div>
        </div>
      </div>

      {/* Badge row */}
      {data.badges.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold text-amber-600/60 uppercase tracking-wider mb-3">Badges earned</p>
          <div className="flex flex-wrap gap-2.5">
            {data.badges.map(badge => (
              <button
                key={badge.key}
                onClick={() => setExpanded(expanded === badge.key ? null : badge.key)}
                className="group relative"
                title={badge.name}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border-2 transition-transform hover:scale-110 active:scale-95"
                  style={{ borderColor: badge.color, backgroundColor: badge.color + '18' }}
                >
                  {badge.emoji}
                </div>
                {/* Tooltip on tap */}
                {expanded === badge.key && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-white rounded-2xl shadow-lg border border-gray-100 z-10 text-left">
                    <p className="text-sm font-bold text-[#4A1B3C]">{badge.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{badge.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Un-earned badges hint */}
      {data.badges.length < BADGE_DEFINITIONS.length && (
        <p className="text-[11px] text-amber-400 mt-3 font-medium">
          {BADGE_DEFINITIONS.length - data.badges.length} more badges to unlock
        </p>
      )}
    </div>
  );
}
