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
  menstrual: { bg: 'linear-gradient(135deg, #FFF0F4 0%, #FBEAF0 100%)', accent: '#E85D9A', text: 'text-[#72243E]', fill: '#E85D9A' },
  follicular: { bg: 'linear-gradient(135deg, #F0EDFE 0%, #E6E3FC 100%)', accent: '#7F77DD', text: 'text-[#3C3489]', fill: '#7F77DD' },
  ovulatory: { bg: 'linear-gradient(135deg, #E8F8F2 0%, #D4F1E8 100%)', accent: '#1D9E75', text: 'text-[#085041]', fill: '#1D9E75' },
  luteal: { bg: 'linear-gradient(135deg, #FEF6E7 0%, #FAEEDA 100%)', accent: '#BA7517', text: 'text-[#633806]', fill: '#BA7517' },
  unknown: { bg: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', accent: '#9CA3AF', text: 'text-gray-700', fill: '#9ca3af' },
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

export function PhaseStatusCard({ phase, daysUntilNext, dayOfCycle, avgCycleLength = 28 }: Props) {
  const [mounted, setMounted] = useState(false);
  const [displayDays, setDisplayDays] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    let start = 0;
    const end = Math.max(0, daysUntilNext);
    const duration = 800;
    const increment = end / (duration / 16);
    
    if (end === 0) {
      setDisplayDays(0);
      return;
    }

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayDays(end);
        clearInterval(timer);
      } else {
        setDisplayDays(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [daysUntilNext]);

  const theme = PHASE_THEMES[phase] || PHASE_THEMES.unknown;
  const icon = PHASE_ICONS[phase] || PHASE_ICONS.unknown;
  const subtitle = PHASE_SUBTITLES[phase] || PHASE_SUBTITLES.unknown;

  const totalDots = Math.min(avgCycleLength, 28);
  const cycleDots = Array.from({ length: totalDots }).map((_, i) => i + 1);

  return (
    <div 
      className="w-full rounded-[20px] p-[24px] pb-[20px] relative overflow-hidden transition-all duration-500 shadow-sm"
      style={{ background: theme.bg }}
    >
      {/* Subtle animated overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />

      <div className={`relative z-10 ${theme.text}`}>
        {/* Top Row */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="inline-flex items-center gap-[6px] bg-white/40 backdrop-blur-sm px-[10px] py-[4px] rounded-[100px] animate-slide-up">
              {icon}
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">{phase}</span>
            </div>
            <h2 className="text-[28px] font-bold mt-[8px] capitalize">{phase}</h2>
            <p className="text-[13px] font-medium opacity-80 truncate mt-[2px]">{subtitle}</p>
          </div>

          <div className="relative w-20 h-20 shrink-0 ml-4 flex items-center justify-center animate-scale-bounce">
            {/* Circular progress background */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={theme.fill}
                strokeWidth="6"
                strokeDasharray="283 283"
                strokeDashoffset={daysUntilNext <= 0 ? 0 : 283 - ((displayDays / 28) * 283)}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="w-[60px] h-[60px] bg-white rounded-full flex flex-col items-center justify-center shadow-sm z-10">
              <div className="text-[22px] font-bold leading-none" style={{ color: daysUntilNext <= 0 ? '#EF4444' : theme.fill }}>
                {daysUntilNext <= 0 ? '!' : displayDays}
              </div>
              <div className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: daysUntilNext <= 0 ? '#EF4444' : 'rgba(0,0,0,0.4)' }}>
                {daysUntilNext <= 0 ? 'LATE' : (phase === 'menstrual' ? 'LEFT' : 'UNTIL')}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row (Dots) */}
        <div className="mb-2">
          <div className="flex items-center gap-[4px] overflow-x-auto hide-scrollbar py-2">
            {cycleDots.map((d, i) => {
              const isPast = d < dayOfCycle;
              const isCurrent = d === dayOfCycle;
              return (
                <div 
                  key={d} 
                  className={`shrink-0 transition-all duration-300 ${
                    isCurrent 
                      ? `w-[10px] h-[10px] bg-white rounded-full border-[2px] shadow-sm` 
                      : `w-[6px] h-[6px] rounded-full`
                  }`}
                  style={{
                    backgroundColor: isCurrent ? 'white' : (isPast ? theme.fill : 'rgba(255,255,255,0.4)'),
                    borderColor: isCurrent ? theme.fill : 'transparent',
                    animation: mounted ? `fadeIn 0.3s ease-out ${i * 20}ms both` : 'none',
                  }}
                />
              );
            })}
            {avgCycleLength > 28 && <span className="text-[10px] opacity-50 ml-1">...</span>}
          </div>
          <div className="text-center text-[11px] mt-1 font-medium opacity-70">
            Day {dayOfCycle > 0 ? dayOfCycle : '?'} of {avgCycleLength}
          </div>
        </div>
      </div>
    </div>
  );
}
