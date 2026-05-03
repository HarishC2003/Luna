import { createAdminClient } from '@/lib/supabase/admin'
import { computePrediction } from '@/lib/cycle/predictor'

export interface SymptomPattern {
  symptom: string
  typicalDayOfCycle: number
  confidence: number
  occurrences: number
  lastOccurred: string
}

export interface SymptomPrediction {
  symptom: string
  predictedDate: string
  confidence: number
  daysUntil: number
  preparationTip: string
}

export async function detectSymptomPatterns(userId: string): Promise<SymptomPattern[]> {
  const adminSupabase = createAdminClient()

  // Fetch last 6 cycles
  const { data: cycles } = await adminSupabase
    .from('cycle_logs')
    .select('id, period_start, period_end')
    .eq('user_id', userId)
    .order('period_start', { ascending: false })
    .limit(6)

  if (!cycles || cycles.length < 3) {
    return [] // Need at least 3 cycles for pattern detection
  }

  // Fetch all daily logs for these cycles
  const earliestDate = cycles[cycles.length - 1].period_start
  const { data: dailyLogs } = await adminSupabase
    .from('daily_logs')
    .select('log_date, symptoms')
    .eq('user_id', userId)
    .gte('log_date', earliestDate)

  if (!dailyLogs || dailyLogs.length === 0) return []

  // Group symptoms by which day of cycle they occurred
  const symptomOccurrences: Record<string, number[]> = {}

  for (const log of dailyLogs) {
    if (!log.symptoms || log.symptoms.length === 0) continue

    // Find which cycle this log belongs to
    const cycle = cycles.find(c => {
      const logDate = new Date(log.log_date)
      const cycleStart = new Date(c.period_start)
      const nextCycle = cycles.find(nc => new Date(nc.period_start) > cycleStart)
      const cycleEnd = nextCycle ? new Date(nextCycle.period_start) : new Date()
      return logDate >= cycleStart && logDate < cycleEnd
    })

    if (!cycle) continue

    const dayOfCycle = daysBetween(new Date(cycle.period_start), new Date(log.log_date)) + 1

    for (const symptom of log.symptoms) {
      if (!symptomOccurrences[symptom]) {
        symptomOccurrences[symptom] = []
      }
      symptomOccurrences[symptom].push(dayOfCycle)
    }
  }

  // Find patterns: symptoms that occur on similar days across cycles
  const patterns: SymptomPattern[] = []

  for (const [symptom, days] of Object.entries(symptomOccurrences)) {
    if (days.length < 3) continue // Need at least 3 occurrences

    const avgDay = Math.round(days.reduce((a, b) => a + b, 0) / days.length)
    const stdDev = Math.sqrt(
      days.reduce((sum, day) => sum + Math.pow(day - avgDay, 2), 0) / days.length
    )

    // Pattern is "reliable" if standard deviation is low (symptoms occur on similar days)
    const isReliablePattern = stdDev <= 3

    if (isReliablePattern) {
      patterns.push({
        symptom,
        typicalDayOfCycle: avgDay,
        confidence: Math.min(0.95, 1 - stdDev / 10), // Lower stdDev = higher confidence
        occurrences: days.length,
        lastOccurred: dailyLogs
          .filter(log => log.symptoms?.includes(symptom))
          .sort((a, b) => b.log_date.localeCompare(a.log_date))[0]?.log_date || '',
      })
    }
  }

  return patterns.sort((a, b) => b.confidence - a.confidence)
}

export async function predictUpcomingSymptoms(
  userId: string
): Promise<SymptomPrediction[]> {
  const patterns = await detectSymptomPatterns(userId)
  const prediction = await getCurrentPrediction(userId)

  if (!patterns.length || !prediction) return []

  const today = new Date()
  const predictions: SymptomPrediction[] = []

  for (const pattern of patterns) {
    const predictedDayOfCycle = pattern.typicalDayOfCycle
    const currentDay = prediction.dayOfCycle

    // Calculate when this symptom is expected
    let daysUntil: number
    if (predictedDayOfCycle > currentDay) {
      // Symptom expected later this cycle
      daysUntil = predictedDayOfCycle - currentDay
    } else {
      // Symptom expected next cycle
      const daysUntilNextCycle = prediction.daysUntilNextPeriod || 30
      daysUntil = daysUntilNextCycle + predictedDayOfCycle
    }

    // Only predict symptoms coming in the next 7 days
    if (daysUntil > 0 && daysUntil <= 7) {
      const predictedDate = new Date(today)
      predictedDate.setDate(today.getDate() + daysUntil)

      predictions.push({
        symptom: pattern.symptom,
        predictedDate: predictedDate.toISOString().split('T')[0],
        confidence: pattern.confidence,
        daysUntil,
        preparationTip: getPreparationTip(pattern.symptom, daysUntil),
      })
    }
  }

  return predictions.sort((a, b) => a.daysUntil - b.daysUntil)
}

function getPreparationTip(symptom: string, daysUntil: number): string {
  const tips: Record<string, string> = {
    cramps: 'Have ibuprofen or your preferred pain relief ready. A heating pad can help too.',
    headache: 'Stay hydrated and get enough sleep. Keep pain relief on hand.',
    bloating: 'Reduce salt intake and drink plenty of water. Avoid tight clothing.',
    'breast tenderness': 'Wear a supportive bra. Avoid caffeine if it makes it worse.',
    fatigue: 'Plan lighter activities. Give yourself permission to rest more.',
    'mood swings': 'Practice self-care. Let trusted people know you might need extra support.',
    acne: 'Stick to your skincare routine. Avoid touching your face.',
    insomnia: 'Avoid screens before bed. Try calming tea or meditation.',
    nausea: 'Eat small, frequent meals. Ginger tea can help.',
    'back pain': 'Gentle stretching or a warm bath can provide relief.',
  }

  const baseTip = tips[symptom.toLowerCase()] || 'Prepare accordingly.'
  const timing = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`
  return `${baseTip} Expected ${timing}.`
}

function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round((date2.getTime() - date1.getTime()) / oneDay)
}

async function getCurrentPrediction(userId: string) {
  const adminSupabase = createAdminClient()
  
  const [recentCyclesRes, onboardRes] = await Promise.all([
    adminSupabase.from('cycle_logs').select('*').eq('user_id', userId).order('period_start', { ascending: false }).limit(6),
    adminSupabase.from('onboarding_data').select('*').eq('user_id', userId).single()
  ])
  
  if (!onboardRes.data) return null;
  
  const mappedCycles = (recentCyclesRes.data || []).map((c: { period_start: string; period_end?: string; cycle_length?: number }) => ({
    periodStart: new Date(c.period_start),
    periodEnd: c.period_end ? new Date(c.period_end) : undefined,
    cycleLength: c.cycle_length || undefined
  }));
  
  return computePrediction(mappedCycles, {
    avgCycleLength: onboardRes.data.avg_cycle_length,
    avgPeriodLength: onboardRes.data.avg_period_length,
    lastPeriodStart: recentCyclesRes.data && recentCyclesRes.data.length > 0 ? new Date(recentCyclesRes.data[0].period_start) : (onboardRes.data.last_period_start ? new Date(onboardRes.data.last_period_start) : undefined)
  });
}
