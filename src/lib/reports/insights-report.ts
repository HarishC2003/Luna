import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ReportData {
  cycleNumber: number
  cycleLength: number
  periodLength: number
  avgMood: number
  avgEnergy: number
  topSymptoms: string[]
  moodTrend: 'improving' | 'stable' | 'declining'
  energyTrend: 'improving' | 'stable' | 'declining'
  patternsDiscovered: string[]
  recommendations: string[]
}

export async function generateInsightsReport(userId: string): Promise<ReportData> {
  const adminSupabase = createAdminClient()

  // 1. Get the most recent completed cycle
  const { data: cycles } = await adminSupabase
    .from('cycle_logs')
    .select('*')
    .eq('user_id', userId)
    .order('period_start', { ascending: false })
    .limit(2)

  if (!cycles || cycles.length < 2) {
    throw new Error('Not enough cycle data to generate report')
  }

  const lastCycle = cycles[1] // The completed one
  const currentCycle = cycles[0]

  const cycleStart = new Date(lastCycle.period_start)
  const cycleEnd = new Date(currentCycle.period_start)
  const cycleLength = daysBetween(cycleStart, cycleEnd)
  const periodLength = lastCycle.period_end
    ? daysBetween(cycleStart, new Date(lastCycle.period_end)) + 1
    : 5

  // 2. Get daily logs for this cycle
  const { data: rawDailyLogs } = await adminSupabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', lastCycle.period_start)
    .lt('log_date', currentCycle.period_start)
    .order('log_date', { ascending: true })

  const dailyLogs = rawDailyLogs || []

  // 3. Calculate averages
  const moods = dailyLogs.filter(log => log.mood).map(log => moodToScore(log.mood))
  const energies = dailyLogs.filter(log => log.energy).map(log => log.energy)

  const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 3
  const avgEnergy = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : 3

  // 4. Find top symptoms
  const symptomCounts: Record<string, number> = {}
  for (const log of dailyLogs) {
    if (log.symptoms) {
      for (const symptom of log.symptoms) {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1
      }
    }
  }
  const topSymptoms = Object.entries(symptomCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([symptom]) => symptom)

  // 5. Detect trends (compare to previous cycles if available)
  const moodTrend = 'stable' // Simplified for now
  const energyTrend = 'stable'

  // 6. Use Gemini to find patterns and generate recommendations
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are a menstrual health insights AI. Analyze this cycle data and provide:
1. 2-3 specific patterns you notice (e.g., "Energy was lowest on days 18-22" or "Mood improved significantly during the follicular phase")
2. 3 actionable recommendations based on the data

Cycle data:
- Cycle length: ${cycleLength} days
- Period length: ${periodLength} days
- Average mood: ${avgMood.toFixed(1)}/5
- Average energy: ${avgEnergy.toFixed(1)}/5
- Top symptoms: ${topSymptoms.join(', ')}
- Daily logs summary: ${dailyLogs.length} days logged out of ${cycleLength}

Format your response exactly as JSON without any markdown formatting around it:
{
  "patterns": ["pattern 1", "pattern 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Make it personal, specific, and actionable. Reference actual days and symptoms.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json|```/gi, '').trim()
    const aiResponse = JSON.parse(cleaned)
    
    return {
      cycleNumber: cycles.length,
      cycleLength,
      periodLength,
      avgMood,
      avgEnergy,
      topSymptoms,
      moodTrend,
      energyTrend,
      patternsDiscovered: aiResponse.patterns || [],
      recommendations: aiResponse.recommendations || [],
    }
  } catch (error) {
    console.error('Gemini generation failed, returning safe defaults.', error)
    return {
      cycleNumber: cycles.length,
      cycleLength,
      periodLength,
      avgMood,
      avgEnergy,
      topSymptoms,
      moodTrend,
      energyTrend,
      patternsDiscovered: [
        `Logged ${dailyLogs.length} days this cycle.`
      ],
      recommendations: [
        "Continue logging daily to discover deeper insights."
      ],
    }
  }
}

function moodToScore(mood: string): number {
  const map: Record<string, number> = { terrible: 1, low: 2, okay: 3, good: 4, great: 5 }
  return map[mood.toLowerCase()] || 3
}

function daysBetween(date1: Date, date2: Date): number {
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24))
}
