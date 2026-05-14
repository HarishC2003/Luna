'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
  menstrual: { bg: '#F472B6', label: 'Menstrual', light: '#FDE8EF', grad: 'from-[#F472B6] to-[#E85D9A]' },
  follicular: { bg: '#60A5FA', label: 'Follicular', light: '#DBEAFE', grad: 'from-[#60A5FA] to-[#3B82F6]' },
  ovulatory: { bg: '#A78BFA', label: 'Ovulatory', light: '#EDE9FE', grad: 'from-[#A78BFA] to-[#8B5CF6]' },
  luteal: { bg: '#FBBF24', label: 'Luteal', light: '#FEF3C7', grad: 'from-[#FBBF24] to-[#F59E0B]' },
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
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200/50 rounded-xl w-64" />
        <div className="h-80 bg-gray-100/50 rounded-3xl" />
      </div>
    )
  }

  if (cycles.length === 0) {
    return (
      <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-[#E85D9A]/10 shadow-sm">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <svg className="w-10 h-10 text-[#E85D9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
        <p className="text-[#4A1B3C] font-extrabold text-xl">Gathering your natural rhythm</p>
        <p className="text-[#4A1B3C]/50 text-sm mt-2 max-w-sm mx-auto">Log at least 2 complete cycles to unlock beautiful side-by-side comparisons.</p>
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-[#E85D9A]/10 pb-6">
        <div>
          <h3 className="text-[22px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#4A1B3C] via-[#E85D9A] to-[#7F77DD] tracking-tight">Cycle Timeline</h3>
          <p className="text-[13px] font-medium text-[#4A1B3C]/50 mt-1">Compare your last {cycles.length} cycles side by side</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Phase Filter */}
          <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-[#E85D9A]/10 shadow-sm">
            {(['all', 'menstrual', 'follicular', 'ovulatory', 'luteal'] as const).map(phase => (
              <button
                key={phase}
                onClick={() => setZoomPhase(phase)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  zoomPhase === phase
                    ? phase === 'all'
                      ? 'bg-gradient-to-r from-[#4A1B3C] to-[#E85D9A] text-white shadow-md'
                      : `text-white shadow-md bg-gradient-to-r ${PHASE_COLORS[phase].grad}`
                    : 'text-[#4A1B3C]/50 hover:text-[#4A1B3C] hover:bg-gray-50'
                }`}
              >
                {phase === 'all' ? 'All' : phase.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-[#E85D9A]/10 shadow-sm">
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-[#E85D9A] shadow-inner' : 'text-[#4A1B3C]/40 hover:bg-gray-50'}`}
              title="Timeline View"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'overlay' ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-[#E85D9A] shadow-inner' : 'text-[#4A1B3C]/40 hover:bg-gray-50'}`}
              title="Overlay View"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Premium Tooltip */}
      <AnimatePresence>
        {hoveredDay && hoveredData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed z-50 pointer-events-none"
            style={{ left: tooltipPos.x + 16, top: tooltipPos.y - 16 }}
          >
            <div className="bg-white/80 backdrop-blur-xl border border-white p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(232,93,154,0.3)] min-w-[200px]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E85D9A]/10">
                <span className="font-extrabold text-[#4A1B3C] text-lg">Day {hoveredData.dayNumber}</span>
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm text-white"
                  style={{ backgroundImage: `linear-gradient(to right, ${PHASE_COLORS[hoveredData.phase as keyof typeof PHASE_COLORS]?.bg || '#888'}, ${PHASE_COLORS[hoveredData.phase as keyof typeof PHASE_COLORS]?.bg || '#888'})` }}
                >
                  {hoveredData.phase}
                </span>
              </div>
              {hoveredData.log ? (
                <div className="space-y-2 text-[#4A1B3C] text-sm">
                  {hoveredData.log.mood && <div className="flex justify-between items-center"><span className="text-[#9E7A8A] font-semibold text-xs uppercase">Mood</span> <span className="font-bold capitalize bg-pink-50 px-2 py-0.5 rounded-lg">{hoveredData.log.mood}</span></div>}
                  {hoveredData.log.energy && <div className="flex justify-between items-center"><span className="text-[#9E7A8A] font-semibold text-xs uppercase">Energy</span> <span className="font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg">{hoveredData.log.energy}/5</span></div>}
                  {hoveredData.log.flow && hoveredData.log.flow !== 'none' && <div className="flex justify-between items-center"><span className="text-[#9E7A8A] font-semibold text-xs uppercase">Flow</span> <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg capitalize">{hoveredData.log.flow}</span></div>}
                  {hoveredData.log.symptoms?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[#9E7A8A] font-semibold text-[10px] uppercase block mb-1">Symptoms</span>
                      <div className="flex flex-wrap gap-1.5">
                        {hoveredData.log.symptoms.map((s, i) => (
                          <span key={i} className="px-2 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-[#4A1B3C] font-semibold border border-[#E85D9A]/10 rounded-md text-[10px] capitalize shadow-sm">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[#9E7A8A] text-xs font-medium italic py-2 text-center">No logs recorded for this day</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Visualization */}
      <AnimatePresence mode="wait">
        {viewMode === 'timeline' ? (
          <motion.div 
            key="timeline"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Day number header */}
            <div className="flex items-center gap-[4px] ml-[110px] sm:ml-[140px] overflow-x-auto hide-scrollbar pb-2">
              {Array.from({ length: maxLength }, (_, i) => {
                if (zoomPhase !== 'all') {
                  const phase = getPhase(i, i < 5, maxLength)
                  if (phase !== zoomPhase) return null
                }
                return (
                  <div key={i} className="flex-shrink-0 text-center" style={{ width: '26px' }}>
                    <span className="text-[10px] font-black text-[#4A1B3C]/30">{i + 1}</span>
                  </div>
                )
              })}
            </div>

            {/* Cycles */}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
              {cycles.map((cycle, cycleIndex) => (
                <div key={cycle.id} className="flex items-center gap-4 group">
                  {/* Cycle Label */}
                  <div className="w-[100px] sm:w-[124px] flex-shrink-0">
                    <div className="flex items-center gap-3 p-2 rounded-xl group-hover:bg-pink-50/50 transition-colors">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-md ring-2 ring-white"
                        style={{ backgroundColor: CYCLE_PALETTE[cycleIndex % CYCLE_PALETTE.length] }}
                      />
                      <div className="min-w-0">
                        <div className="text-[13px] font-extrabold text-[#1A0A12] truncate">
                          {cycle.isCurrent ? 'Current' : `Cycle ${cycles.length - cycleIndex}`}
                        </div>
                        <div className="text-[10px] text-[#9E7A8A] font-semibold mt-0.5">
                          {cycle.cycleLength}d · {new Date(cycle.period_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Day blocks as a continuous bar */}
                  <div className="flex gap-[4px] overflow-x-auto hide-scrollbar flex-1 py-2 pl-1">
                    {Array.from({ length: cycle.cycleLength }, (_, dayIndex) => {
                      const logDate = addDays(new Date(cycle.period_start), dayIndex).toISOString().split('T')[0]
                      const log = cycle.dailyLogs.find(l => l.log_date === logDate)
                      const isPeriod = cycle.period_end
                        ? daysBetween(new Date(cycle.period_start), new Date(logDate)) <= daysBetween(new Date(cycle.period_start), new Date(cycle.period_end))
                        : dayIndex < 5
                      const phase = getPhase(dayIndex, isPeriod, cycle.cycleLength) as keyof typeof PHASE_COLORS

                      if (zoomPhase !== 'all' && phase !== zoomPhase) return null

                      const color = log ? getDayColor(log, isPeriod) : PHASE_COLORS[phase]?.light || '#F3F4F6'
                      const hasLog = !!log
                      const isHovered = hoveredDay?.cycleIdx === cycleIndex && hoveredDay?.day === dayIndex

                      return (
                        <motion.div
                          variants={itemVariants}
                          key={dayIndex}
                          className={`flex-shrink-0 rounded-lg transition-all duration-300 cursor-pointer relative overflow-hidden ${
                            isHovered ? 'scale-125 z-10 shadow-lg' : 'hover:scale-110 shadow-sm'
                          }`}
                          style={{
                            width: '26px',
                            height: '36px',
                            backgroundColor: color,
                            opacity: hasLog ? 1 : 0.4,
                            boxShadow: hasLog ? `0 4px 10px -2px ${color}80` : 'none'
                          }}
                          onMouseEnter={(e) => {
                            setHoveredDay({ cycleIdx: cycleIndex, day: dayIndex })
                            setTooltipPos({ x: e.clientX, y: e.clientY })
                          }}
                          onMouseMove={(e) => {
                            setTooltipPos({ x: e.clientX, y: e.clientY })
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                        >
                          {/* Inner gradient sheen */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                          {hasLog && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10" />}
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Current badge */}
                  {cycle.isCurrent && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[9px] font-black text-purple-600 bg-purple-100/80 px-2.5 py-1 rounded-md uppercase tracking-widest flex-shrink-0 shadow-sm border border-purple-200"
                    >
                      Active
                    </motion.span>
                  )}
                </div>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          /* Overlay View — Energy/Mood chart-like overlay */
          <motion.div 
            key="overlay"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative overflow-x-auto hide-scrollbar bg-white/50 p-6 rounded-[2rem] border border-[#E85D9A]/10 shadow-sm"
          >
            {/* Phase background bands */}
            <div className="flex h-8 mb-4 ml-0 rounded-xl overflow-hidden shadow-inner">
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
                      className="flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all"
                      style={{
                        width: `${width}%`,
                        backgroundImage: `linear-gradient(to right, ${PHASE_COLORS[p.phase].light}, ${PHASE_COLORS[p.phase].light})`,
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
            <div className="relative" style={{ height: `${cycles.length * 60 + 20}px`, minWidth: '100%' }}>
              {cycles.map((cycle, cycleIndex) => (
                <div
                  key={cycle.id}
                  className="flex items-end gap-[4px] absolute left-0"
                  style={{ top: `${cycleIndex * 60}px`, height: '50px', width: '100%' }}
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
                    const barHeight = energy > 0 ? (energy / 5) * 44 + 6 : 6
                    const barColor = CYCLE_PALETTE[cycleIndex % CYCLE_PALETTE.length]
                    const isHovered = hoveredDay?.cycleIdx === cycleIndex && hoveredDay?.day === dayIndex

                    return (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}px` }}
                        transition={{ duration: 0.8, type: 'spring', bounce: 0.4, delay: dayIndex * 0.02 }}
                        key={dayIndex}
                        className={`flex-1 rounded-t-lg transition-all duration-300 cursor-pointer min-w-[6px] ${
                          isHovered ? 'opacity-100 ring-2 ring-[#4A1B3C]/30 shadow-lg' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: energy > 0 ? barColor : '#F3F4F6',
                          maxWidth: '22px',
                          backgroundImage: energy > 0 ? `linear-gradient(to top, ${barColor}99, ${barColor})` : 'none',
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
            <div className="flex flex-wrap items-center gap-5 mt-6 pt-4 border-t border-[#E85D9A]/10">
              {cycles.map((cycle, idx) => (
                <div key={cycle.id} className="flex items-center gap-2 text-xs text-[#1A0A12]">
                  <div className="w-3.5 h-3.5 rounded-md shadow-sm" style={{ backgroundColor: CYCLE_PALETTE[idx % CYCLE_PALETTE.length] }} />
                  <span className="font-extrabold">{cycle.isCurrent ? 'Current' : `Cycle ${cycles.length - idx}`}</span>
                </div>
              ))}
              <div className="ml-auto text-[10px] text-[#9E7A8A] font-bold uppercase tracking-widest bg-pink-50 px-3 py-1 rounded-full">Bar height = Energy level</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10 pt-6 border-t border-[#E85D9A]/10 flex flex-wrap gap-x-8 gap-y-4 bg-white/40 rounded-2xl p-4 backdrop-blur-sm shadow-sm"
      >
        <div className="text-[11px] font-black uppercase tracking-widest text-[#E85D9A] w-full mb-1">Color Legend</div>
        {[
          { color: '#F472B6', label: 'Period days' },
          { color: '#F87171', label: 'High symptom days' },
          { color: '#FBBF24', label: 'Low mood / energy' },
          { color: '#4ADE80', label: 'Good days' },
          { color: '#E5E7EB', label: 'No data logged' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2.5 text-[13px] text-[#4A1B3C]/80 font-medium hover:scale-105 transition-transform cursor-default">
            <div className="w-4 h-4 rounded-md shadow-[0_2px_5px_rgba(0,0,0,0.1)] border border-black/5" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </motion.div>
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
