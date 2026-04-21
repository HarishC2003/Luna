'use client';

import { useEffect, useState } from 'react';

const PHASES = [
  { name: 'Period', days: 'Days 1-5', color: '#E85D9A', dash: '0, 15, 60, 100' }, // roughly 15% (menstrual)
  { name: 'Rising energy', days: 'Days 6-13', color: '#8b5cf6', dash: '75, 23, 100, 100' }, // roughly 23% (follicular)
  { name: 'Peak', days: 'Days 14-16', color: '#14b8a6', dash: '185, 10, 100, 100' }, // roughly 10% (ovulatory)
  { name: 'Wind down', days: 'Days 17-28', color: '#f59e0b', dash: '220, 52, 100, 100' }, // roughly 52% (luteal)
];

export function PhaseRing() {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhaseIndex((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const activePhase = PHASES[activePhaseIndex];

  return (
    <div className="relative flex items-center justify-center w-[220px] h-[220px] md:w-[280px] md:h-[280px] mx-auto">
      {/* Background track */}
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="4" />
        
        {/* Phase Arcs */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="#E85D9A" strokeWidth="4" 
          strokeDasharray="18 100" strokeDashoffset="0" 
          className={`transition-opacity duration-500 ${activePhaseIndex === 0 ? 'opacity-100 drop-shadow-[0_0_8px_rgba(232,93,154,0.6)]' : 'opacity-40'}`} 
        />
        <circle cx="50" cy="50" r="45" fill="none" stroke="#8b5cf6" strokeWidth="4" 
          strokeDasharray="25 100" strokeDashoffset="-20" 
          className={`transition-opacity duration-500 ${activePhaseIndex === 1 ? 'opacity-100 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]' : 'opacity-40'}`} 
        />
        <circle cx="50" cy="50" r="45" fill="none" stroke="#14b8a6" strokeWidth="4" 
          strokeDasharray="10 100" strokeDashoffset="-47" 
          className={`transition-opacity duration-500 ${activePhaseIndex === 2 ? 'opacity-100 drop-shadow-[0_0_8px_rgba(20,184,166,0.6)]' : 'opacity-40'}`} 
        />
        <circle cx="50" cy="50" r="45" fill="none" stroke="#f59e0b" strokeWidth="4" 
          strokeDasharray="40 100" strokeDashoffset="-59" 
          className={`transition-opacity duration-500 ${activePhaseIndex === 3 ? 'opacity-100 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'opacity-40'}`} 
        />
        
        {/* Orbiting Dot */}
        <g className="origin-center animate-[spin_8s_linear_infinite] motion-reduce:animate-none">
          <circle cx="95" cy="50" r="6" fill="#4A1B3C" className="drop-shadow-md" />
          <circle cx="95" cy="50" r="2" fill="#fff" />
        </g>
      </svg>

      {/* Center Text */}
      <div className="absolute text-center flex flex-col items-center justify-center p-4">
        <span 
          className="text-xs font-semibold uppercase tracking-widest transition-colors duration-500"
          style={{ color: activePhase.color }}
        >
          {activePhase.name}
        </span>
        <span className="text-[10px] text-gray-400 mt-1">{activePhase.days}</span>
      </div>
    </div>
  );
}
