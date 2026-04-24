import { CyclePhase } from '@/lib/cycle/predictor';
import { useEffect, useState } from 'react';

interface Props {
  phase: CyclePhase;
  daysUntilNext: number;
  dayOfCycle: number;
  avgCycleLength: number;
  avgPeriodLength: number;
}

const PHASE_THEMES = {
  menstrual: { bg: 'bg-[#FFF0F4]', accent: 'bg-[#E85D9A]', text: 'text-[#72243E]', fill: '#E85D9A' },
  follicular: { bg: 'bg-[#F0EDFE]', accent: 'bg-[#7F77DD]', text: 'text-[#3C3489]', fill: '#7F77DD' },
  ovulatory: { bg: 'bg-[#E8F8F2]', accent: 'bg-[#1D9E75]', text: 'text-[#085041]', fill: '#1D9E75' },
  luteal: { bg: 'bg-[#FEF6E7]', accent: 'bg-[#BA7517]', text: 'text-[#633806]', fill: '#BA7517' },
  unknown: { bg: 'bg-gray-100', accent: 'bg-gray-400', text: 'text-gray-700', fill: '#9ca3af' },
};

const PHASE_ICONS = {
  menstrual: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  follicular: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/></svg>,
  ovulatory: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>,
  luteal: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  unknown: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>,
};

const PHASE_SUBTITLES = {
  menstrual: "Your period is here. Rest up.",
  follicular: "Energy is building. Great time for new tasks.",
  ovulatory: "You're at your peak. Go get 'em.",
  luteal: "Winding down. Cravings are normal.",
  unknown: "Log your period to see your phase.",
};

export function PhaseStatusCard({ phase, daysUntilNext, dayOfCycle, avgCycleLength = 28, avgPeriodLength = 5 }: Props) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const theme = PHASE_THEMES[phase] || PHASE_THEMES.unknown;
  const icon = PHASE_ICONS[phase] || PHASE_ICONS.unknown;
  const subtitle = PHASE_SUBTITLES[phase] || PHASE_SUBTITLES.unknown;

  const totalDots = Math.min(avgCycleLength, 28);
  const cycleDots = Array.from({ length: totalDots }).map((_, i) => i + 1);

  // For timeline
  const periodP = (avgPeriodLength / avgCycleLength) * 100;
  const follicularP = ((14 - avgPeriodLength) / avgCycleLength) * 100; // Roughly 14 days before ovulation
  const ovulatoryP = (3 / avgCycleLength) * 100; // 3 days
  const lutealP = 100 - (periodP + follicularP + ovulatoryP);

  const getTimelineSegmentClass = (segmentPhase: CyclePhase) => {
    if (phase === segmentPhase) return `${theme.accent} h-[6px] rounded-full`;
    // simplistic past/future determination based on ordered phases
    const order = { menstrual: 1, follicular: 2, ovulatory: 3, luteal: 4, unknown: 0 };
    if (order[segmentPhase] < order[phase]) return `${theme.accent} opacity-40 h-[4px] rounded-full`;
    return `bg-gray-300 opacity-20 h-[4px] rounded-full`;
  };

  return (
    <div className={`w-full rounded-[20px] p-[20px] pb-[16px] ${theme.bg} ${theme.text} transform transition-all duration-400 opacity-0 translate-y-3 ${mounted ? '!opacity-100 !translate-y-0' : ''}`}>
      {/* Top Row */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-[6px] bg-white/40 px-[10px] py-[4px] rounded-[100px]">
            {icon}
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">{phase}</span>
          </div>
          <h2 className="text-[24px] font-bold mt-[8px] capitalize">{phase}</h2>
          <p className="text-[13px] font-normal opacity-70 truncate mt-[2px]">{subtitle}</p>
        </div>

        <div className="w-[72px] h-[72px] bg-white rounded-full flex flex-col items-center justify-center shrink-0 ml-4 shadow-sm">
          <div className={`text-[28px] font-bold leading-none ${daysUntilNext <= 0 ? 'text-red-500' : `text-[${theme.fill}]`}`}>
            {daysUntilNext <= 0 ? '!' : daysUntilNext}
          </div>
          <div className={`text-[9px] font-semibold uppercase tracking-wider mt-1 ${daysUntilNext <= 0 ? 'text-red-500' : 'opacity-70'}`}>
            {daysUntilNext <= 0 ? 'LATE' : (phase === 'menstrual' ? 'DAYS LEFT' : 'DAYS UNTIL')}
          </div>
        </div>
      </div>

      {/* Middle Row (Dots) */}
      <div className="mb-6">
        <div className="flex items-center gap-[4px] overflow-x-auto hide-scrollbar py-2">
          {cycleDots.map((d, i) => {
            const isPast = d < dayOfCycle;
            const isCurrent = d === dayOfCycle;
            return (
              <div 
                key={d} 
                className={`shrink-0 transition-all duration-300 ${
                  isCurrent 
                    ? `w-[10px] h-[10px] bg-white rounded-full border-[2px] border-[${theme.fill}]` 
                    : `w-[6px] h-[6px] rounded-full ${isPast ? theme.accent : `${theme.accent} opacity-20`}`
                }`}
                style={{
                  transitionDelay: mounted ? `${i * 20}ms` : '0ms',
                  transform: mounted ? 'scale(1)' : 'scale(0.5)',
                  opacity: mounted ? 1 : 0
                }}
              />
            );
          })}
          {avgCycleLength > 28 && <span className="text-[10px] opacity-50 ml-1">...</span>}
        </div>
        <div className="text-center text-[11px] text-[#9E7A8A] mt-2 font-medium">
          Day {dayOfCycle > 0 ? dayOfCycle : '?'} of {avgCycleLength}
        </div>
      </div>

      {/* Bottom Row (Timeline) */}
      <div className="w-full">
        <div className="flex items-center gap-[4px] h-[6px]">
          <div className={getTimelineSegmentClass('menstrual')} style={{ width: `${Math.max(5, periodP)}%` }} />
          <div className={getTimelineSegmentClass('follicular')} style={{ width: `${Math.max(10, follicularP)}%` }} />
          <div className={getTimelineSegmentClass('ovulatory')} style={{ width: `${Math.max(5, ovulatoryP)}%` }} />
          <div className={getTimelineSegmentClass('luteal')} style={{ width: `${Math.max(10, lutealP)}%` }} />
        </div>
        <div className="flex justify-between items-center text-[10px] text-[#9E7A8A] mt-2 font-medium">
          <span>Day 1</span>
          <span>Ovulation ~Day {Math.round(avgCycleLength - 14)}</span>
          <span>Day {avgCycleLength}</span>
        </div>
      </div>
    </div>
  );
}
