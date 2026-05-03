'use client'
import { useState, useEffect, useRef } from 'react'

interface DailyLog {
  log_date: string
  mood: string | null
  energy: number | null
  flow: string | null
  symptoms: string[]
}

interface Cycle {
  id: string
  period_start: string
  period_end: string | null
  cycleLength: number
  dailyLogs: DailyLog[]
  isCurrent: boolean
}

const PHASE_COLORS = {
  menstrual: { bg: '#F472B6', label: 'Menstrual', light: '#FDE8EF' },
  follicular: { bg: '#60A5FA', label: 'Follicular', light: '#DBEAFE' },
  ovulatory: { bg: '#A78BFA', label: 'Ovulatory', light: '#EDE9FE' },
  luteal: { bg: '#FBBF24', label: 'Luteal', light: '#FEF3C7' },
}

const CYCLE_PALETTE = [
  '#E85D9A',
  '#A855F7',
  '#60A5FA',
  '#34D399',
]

export default function CycleComparisonTimeline() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'timeline' | 'overlay'>('timeline')
  const [zoomPhase, setZoomPhase] = useState<'all' | 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'>('all')
  const [hoveredDay, setHoveredDay] = useState<{ cycleIdx: number; day: number } | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/cycles/compare?cycles=4')
      .then(res => res.json())
      .then(data => {
        setCycles(data.cycles || [])
      })
      .catch(err => console.error('Failed to load cycles:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-48" />
        <div className="h-64 bg-gray-50 rounded-2xl" />
      </div>
    )
  }

  if (cycles.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#E85D9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
        <p className="text-[#4A1B3C] font-bold text-lg">Not enough cycle data yet</p>
        <p className="text-[#4A1B3C]/50 text-sm mt-1">Log at least 2 cycles to see comparisons.</p>
      </div>
    )
  }

  const maxLength = Math.max(...cycles.map(c => c.cycleLength))

  const getHoveredData = () => {
    if (!hoveredDay) return null
    const cycle = cycles[hoveredDay.cycleIdx]
    const dayIndex = hoveredDay.day
    const logDate = addDays(new Date(cycle.period_start), dayIndex).toISOString().split('T')[0]
    const log = cycle.dailyLogs.find(l => l.log_date === logDate)
    const isPeriod = cycle.period_end
      ? daysBetween(new Date(cycle.period_start), new Date(logDate)) <= daysBetween(new Date(cycle.period_start), new Date(cycle.period_end))
      : dayIndex < 5
    const phase = getPhase(dayIndex, isPeriod, cycle.cycleLength)
    return { log, dayNumber: dayIndex + 1, phase, cycle }
  }

  const hoveredData = getHoveredData()

  return (
    <div ref={containerRef}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-[#4A1B3C] tracking-tight">Cycle Timeline</h3>
          <p className="text-sm text-[#4A1B3C]/50 mt-0.5">Compare your last {cycles.length} cycles side by side</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Phase Filter */}
          <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
            {(['all', 'menstrual', 'follicular', 'ovulatory', 'luteal'] as const).map(phase => (
              <button
                key={phase}
                onClick={() => setZoomPhase(phase)}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  zoomPhase === phase
                    ? phase === 'all'
                      ? 'bg-[#4A1B3C] text-white shadow-sm'
                      : `text-white shadow-sm`
                    : 'text-[#4A1B3C]/50 hover:text-[#4A1B3C]'
                }`}
                style={zoomPhase === phase && phase !== 'all' ? { backgroundColor: PHASE_COLORS[phase].bg } : {}}
              >
                {phase === 'all' ? 'All' : phase.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-white text-[#E85D9A] shadow-sm' : 'text-[#4A1B3C]/40'}`}
              title="Timeline View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'overlay' ? 'bg-white text-[#E85D9A] shadow-sm' : 'text-[#4A1B3C]/40'}`}
              title="Overlay View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && hoveredData && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltipPos.x + 16, top: tooltipPos.y - 8 }}
        >
          <div className="bg-[#4A1B3C] text-white px-4 py-3 rounded-2xl shadow-xl text-sm min-w-[180px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold">Day {hoveredData.dayNumber}</span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: PHASE_COLORS[hoveredData.phase as keyof typeof PHASE_COLORS]?.bg || '#888', color: '#fff' }}
              >
                {hoveredData.phase}
              </span>
            </div>
            {hoveredData.log ? (
              <div className="space-y-1 text-white/80 text-xs">
                {hoveredData.log.mood && <div>Mood: <span className="text-white font-semibold capitalize">{hoveredData.log.mood}</span></div>}
                {hoveredData.log.energy && <div>Energy: <span className="text-white font-semibold">{hoveredData.log.energy}/5</span></div>}
                {hoveredData.log.flow && hoveredData.log.flow !== 'none' && <div>Flow: <span className="text-white font-semibold capitalize">{hoveredData.log.flow}</span></div>}
                {hoveredData.log.symptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hoveredData.log.symptoms.map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] capitalize">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-white/50 text-xs">No log recorded</div>
            )}
          </div>
        </div>
      )}

      {/* Timeline Visualization */}
      {viewMode === 'timeline' ? (
        <div className="space-y-3">
          {/* Day number header */}
          <div className="flex items-center gap-1 ml-[120px] sm:ml-[140px] overflow-x-auto hide-scrollbar">
            {Array.from({ length: maxLength }, (_, i) => {
              if (zoomPhase !== 'all') {
                const phase = getPhase(i, i < 5, maxLength)
                if (phase !== zoomPhase) return null
              }
              return (
                <div key={i} className="flex-shrink-0 text-center" style={{ width: '28px' }}>
                  <span className="text-[9px] font-bold text-[#4A1B3C]/30">{i + 1}</span>
                </div>
              )
            })}
          </div>

          {/* Cycles */}
          {cycles.map((cycle, cycleIndex) => (
            <div key={cycle.id} className="flex items-center gap-3 group">
              {/* Cycle Label */}
              <div className="w-[108px] sm:w-[128px] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: CYCLE_PALETTE[cycleIndex % CYCLE_PALETTE.length] }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#4A1B3C] truncate">
                      {cycle.isCurrent ? 'Current' : `Cycle ${cycles.length - cycleIndex}`}
                    </div>
                    <div className="text-[10px] text-[#4A1B3C]/40 font-medium">
                      {cycle.cycleLength}d · {new Date(cycle.period_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Day blocks as a continuous bar */}
              <div className="flex gap-[3px] overflow-x-auto hide-scrollbar flex-1 py-1">
                {Array.from({ length: cycle.cycleLength }, (_, dayIndex) => {
                  const logDate = addDays(new Date(cycle.period_start), dayIndex).toISOString().split('T')[0]
                  const log = cycle.dailyLogs.find(l => l.log_date === logDate)
                  const isPeriod = cycle.period_end
                    ? daysBetween(new Date(cycle.period_start), new Date(logDate)) <= daysBetween(new Date(cycle.period_start), new Date(cycle.period_end))
                    : dayIndex < 5
                  const phase = getPhase(dayIndex, isPeriod, cycle.cycleLength) as keyof typeof PHASE_COLORS

                  if (zoomPhase !== 'all' && phase !== zoomPhase) return null

                  const color = log ? getDayColor(log, isPeriod) : PHASE_COLORS[phase]?.light || '#F3F4F6'
                  const borderColor = log ? getDayColor(log, isPeriod) : 'transparent'
                  const hasLog = !!log
                  const isHovered = hoveredDay?.cycleIdx === cycleIndex && hoveredDay?.day === dayIndex

                  return (
                    <div
                      key={dayIndex}
                      className={`flex-shrink-0 rounded-md transition-all duration-150 cursor-pointer ${
                        isHovered ? 'scale-125 ring-2 ring-[#E85D9A] ring-offset-1 z-10' : 'hover:scale-110'
                      }`}
                      style={{
                        width: '24px',
                        height: '32px',
                        backgroundColor: color,
                        borderBottom: hasLog ? `3px solid ${borderColor}` : 'none',
                        opacity: hasLog ? 1 : 0.5,
                      }}
                      onMouseEnter={(e) => {
                        setHoveredDay({ cycleIdx: cycleIndex, day: dayIndex })
                        setTooltipPos({ x: e.clientX, y: e.clientY })
                      }}
                      onMouseMove={(e) => {
                        setTooltipPos({ x: e.clientX, y: e.clientY })
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  )
                })}
              </div>

              {/* Current badge */}
              {cycle.isCurrent && (
                <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
                  Active
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Overlay View — Energy/Mood chart-like overlay */
        <div className="relative overflow-x-auto hide-scrollbar">
          {/* Phase background bands */}
          <div className="flex h-6 mb-1 ml-0 rounded-lg overflow-hidden">
            {(() => {
              const refLength = maxLength
              const ovulationDay = Math.max(14, refLength - 14)
              const periodEnd = 5
              const phases = [
                { phase: 'menstrual' as const, start: 0, end: periodEnd },
                { phase: 'follicular' as const, start: periodEnd, end: ovulationDay - 1 },
                { phase: 'ovulatory' as const, start: ovulationDay - 1, end: ovulationDay + 2 },
                { phase: 'luteal' as const, start: ovulationDay + 2, end: refLength },
              ]
              return phases.map(p => {
                const width = ((p.end - p.start) / refLength) * 100
                return (
                  <div
                    key={p.phase}
                    className="flex items-center justify-center text-[9px] font-black uppercase tracking-widest"
                    style={{
                      width: `${width}%`,
                      backgroundColor: PHASE_COLORS[p.phase].light,
                      color: PHASE_COLORS[p.phase].bg,
                    }}
                  >
                    {width > 10 ? PHASE_COLORS[p.phase].label : ''}
                  </div>
                )
              })
            })()}
          </div>

          {/* Energy bars per cycle overlaid */}
          <div className="relative" style={{ height: `${cycles.length * 52 + 20}px`, minWidth: '100%' }}>
            {cycles.map((cycle, cycleIndex) => (
              <div
                key={cycle.id}
                className="flex items-end gap-[2px] absolute left-0"
                style={{ top: `${cycleIndex * 52}px`, height: '44px', width: '100%' }}
              >
                {Array.from({ length: cycle.cycleLength }, (_, dayIndex) => {
                  const logDate = addDays(new Date(cycle.period_start), dayIndex).toISOString().split('T')[0]
                  const log = cycle.dailyLogs.find(l => l.log_date === logDate)
                  const isPeriod = cycle.period_end
                    ? daysBetween(new Date(cycle.period_start), new Date(logDate)) <= daysBetween(new Date(cycle.period_start), new Date(cycle.period_end))
                    : dayIndex < 5
                  const phase = getPhase(dayIndex, isPeriod, cycle.cycleLength) as keyof typeof PHASE_COLORS

                  if (zoomPhase !== 'all' && phase !== zoomPhase) return null

                  const energy = log?.energy || 0
                  const barHeight = energy > 0 ? (energy / 5) * 36 + 6 : 4
                  const barColor = CYCLE_PALETTE[cycleIndex % CYCLE_PALETTE.length]
                  const isHovered = hoveredDay?.cycleIdx === cycleIndex && hoveredDay?.day === dayIndex

                  return (
                    <div
                      key={dayIndex}
                      className={`flex-1 rounded-t-md transition-all duration-150 cursor-pointer min-w-[4px] ${
                        isHovered ? 'opacity-100 ring-1 ring-[#4A1B3C]/30' : 'opacity-70 hover:opacity-90'
                      }`}
                      style={{
                        height: `${barHeight}px`,
                        backgroundColor: energy > 0 ? barColor : '#E5E7EB',
                        maxWidth: '18px',
                      }}
                      onMouseEnter={(e) => {
                        setHoveredDay({ cycleIdx: cycleIndex, day: dayIndex })
                        setTooltipPos({ x: e.clientX, y: e.clientY })
                      }}
                      onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Overlay Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            {cycles.map((cycle, idx) => (
              <div key={cycle.id} className="flex items-center gap-1.5 text-xs text-[#4A1B3C]/60">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CYCLE_PALETTE[idx % CYCLE_PALETTE.length] }} />
                <span className="font-semibold">{cycle.isCurrent ? 'Current' : `Cycle ${cycles.length - idx}`}</span>
              </div>
            ))}
            <div className="ml-auto text-[10px] text-[#4A1B3C]/40 font-medium">Bar height = energy level</div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#4A1B3C]/30 w-full mb-1">Legend</div>
        {[
          { color: '#F472B6', label: 'Period days' },
          { color: '#F87171', label: 'High symptom days' },
          { color: '#FBBF24', label: 'Low mood / energy' },
          { color: '#4ADE80', label: 'Good days' },
          { color: '#E5E7EB', label: 'No data logged' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-[#4A1B3C]/60">
            <div className="w-3 h-3 rounded-md" style={{ backgroundColor: item.color }} />
            <span className="font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Helper functions ─────────────────────────────────────────

function getPhase(dayIndex: number, isPeriod: boolean, cycleLength: number): string {
  if (isPeriod) return 'menstrual'
  const ovulationDay = Math.max(14, cycleLength - 14)
  if (dayIndex + 1 < ovulationDay - 1) return 'follicular'
  if (dayIndex + 1 >= ovulationDay - 1 && dayIndex + 1 <= ovulationDay + 1) return 'ovulatory'
  return 'luteal'
}

function getDayColor(log: DailyLog | undefined, isPeriod: boolean): string {
  if (!log) return '#E5E7EB'
  const hasSymptoms = log.symptoms && log.symptoms.length > 2
  const lowMoodOrEnergy = log.mood === 'terrible' || log.mood === 'low' || (log.energy && log.energy <= 2)
  const goodDay = log.mood === 'great' || log.mood === 'good'

  if (isPeriod) return '#F472B6'
  if (hasSymptoms) return '#F87171'
  if (lowMoodOrEnergy) return '#FBBF24'
  if (goodDay) return '#4ADE80'
  return '#D1D5DB'
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round(Math.abs((date2.getTime() - date1.getTime()) / oneDay))
}
