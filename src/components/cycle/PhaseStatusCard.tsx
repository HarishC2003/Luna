'use client'
import { useEffect, useState, useRef } from 'react'

const phaseConfig = {
  menstrual: {
    bg: 'linear-gradient(135deg, #FFF0F4 0%, #FFE4EE 100%)',
    accent: '#E85D9A',
    text: '#72243E',
    icon: '🌸',
  },
  follicular: {
    bg: 'linear-gradient(135deg, #F0EDFE 0%, #E6E3FC 100%)',
    accent: '#7F77DD',
    text: '#3C3489',
    icon: '🌱',
  },
  ovulatory: {
    bg: 'linear-gradient(135deg, #E8F8F2 0%, #D4F1E8 100%)',
    accent: '#1D9E75',
    text: '#085041',
    icon: '☀️',
  },
  luteal: {
    bg: 'linear-gradient(135deg, #FEF6E7 0%, #FAEEDA 100%)',
    accent: '#BA7517',
    text: '#633806',
    icon: '🌙',
  },
  unknown: {
    bg: 'linear-gradient(135deg, #F1EFE8 0%, #E8E6DE 100%)',
    accent: '#888780',
    text: '#444441',
    icon: '💫',
  },
}

interface PhaseCardProps {
  phase: string
  dayOfCycle: number
  avgCycleLength: number
  daysUntilNextPeriod: number
  isLate: boolean
}

export function PhaseStatusCard({
  phase,
  dayOfCycle,
  avgCycleLength,
  daysUntilNextPeriod,
  isLate,
}: PhaseCardProps) {
  const config = phaseConfig[phase as keyof typeof phaseConfig] || phaseConfig.unknown
  const [displayDay, setDisplayDay] = useState(0)
  const [displayDays, setDisplayDays] = useState(0)
  const hasAnimated = useRef(false)

  // Count-up animation
  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const animateCount = (target: number, setter: (v: number) => void) => {
      let current = 0
      const step = Math.ceil(target / 20)
      const interval = setInterval(() => {
        current = Math.min(current + step, target)
        setter(current)
        if (current >= target) clearInterval(interval)
      }, 40)
    }

    animateCount(dayOfCycle, setDisplayDay)
    animateCount(Math.abs(daysUntilNextPeriod), setDisplayDays)
  }, [dayOfCycle, daysUntilNextPeriod])

  // Progress for circular indicator
  const progress = Math.min(dayOfCycle / avgCycleLength, 1)
  const circumference = 2 * Math.PI * 38
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div
      className="rounded-3xl p-6 relative overflow-hidden animate-slide-up"
      style={{ background: config.bg }}
    >
      {/* Glass overlay shimmer */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)',
        }}
      />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
              style={{
                background: `${config.accent}22`,
                color: config.accent,
                border: `1px solid ${config.accent}44`,
              }}
            >
              <span>{config.icon}</span>
              <span>{phase.toUpperCase()}</span>
            </div>
            <h2 className="text-3xl font-bold capitalize" style={{ color: config.text }}>
              {phase}
            </h2>
            <p className="text-sm mt-1 opacity-70" style={{ color: config.text }}>
              {isLate ? "Your period may be late" : "Your cycle is on track"}
            </p>
          </div>

          {/* Circular progress */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="38" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.4)" strokeWidth="6" />
              <circle
                cx="44" cy="44" r="38"
                fill="none"
                stroke={config.accent}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold" style={{ color: config.text }}>{displayDay}</span>
              <span className="text-[9px] font-medium opacity-70" style={{ color: config.text }}>DAY</span>
            </div>
          </div>
        </div>

        {/* Day dots */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {Array.from({ length: Math.min(avgCycleLength, 32) }).map((_, i) => {
            const isToday = i === dayOfCycle - 1
            const isPast = i < dayOfCycle - 1
            return (
              <div
                key={i}
                className="flex-shrink-0 rounded-full transition-all duration-300"
                style={{
                  width: isToday ? 10 : 7,
                  height: isToday ? 10 : 7,
                  background: isPast || isToday ? config.accent : `${config.accent}33`,
                  animation: `fadeIn 0.3s ease-out ${i * 15}ms both`,
                  boxShadow: isToday ? `0 0 8px ${config.accent}88` : 'none',
                }}
              />
            )
          })}
        </div>

        {/* Timeline segments */}
        <div className="mb-2">
          <div className="flex rounded-full overflow-hidden h-2">
            {[
              { phase: 'menstrual', days: 5, color: '#E85D9A' },
              { phase: 'follicular', days: 9, color: '#7F77DD' },
              { phase: 'ovulatory', days: 3, color: '#1D9E75' },
              { phase: 'luteal', days: avgCycleLength - 17, color: '#BA7517' },
            ].map(seg => {
              const isCurrentPhase = phase === seg.phase
              return (
                <div
                  key={seg.phase}
                  style={{
                    flex: seg.days,
                    background: isCurrentPhase ? seg.color : `${seg.color}44`,
                    transition: 'all 0.3s ease',
                  }}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] opacity-60" style={{ color: config.text }}>Day 1</span>
            <span className="text-[10px] opacity-60" style={{ color: config.text }}>
              {isLate
                ? `${displayDays}d late`
                : daysUntilNextPeriod <= 3
                ? `Period in ${displayDays}d`
                : `Day ${avgCycleLength}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhaseStatusCard
