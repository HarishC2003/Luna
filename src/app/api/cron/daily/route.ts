import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/notifications/push-server'
import { computePrediction } from '@/lib/cycle/predictor'

export async function GET(request: Request): Promise<Response> {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const results = {
    periodReminders: 0,
    fertileAlerts: 0,
    checkinReminders: 0,
    streakAtRisk: 0,
    hydrationReminders: 0,
    weeklyInsights: 0,
  }

  try {
    // Get all users with active push subscriptions
    const { data: subscriptions } = await adminSupabase
      .from('push_subscriptions')
      .select('user_id')
      .eq('active', true)

    const userIds = [...new Set(subscriptions?.map(s => s.user_id) || [])]

    for (const userId of userIds) {
      // Fetch user onboarding and recent cycle logs to compute accurate prediction
      const [onboardRes, recentCyclesRes] = await Promise.all([
        adminSupabase.from('onboarding_data').select('*').eq('user_id', userId).single(),
        adminSupabase.from('cycle_logs').select('*').eq('user_id', userId).order('period_start', { ascending: false }).limit(6)
      ])

      const onboard = onboardRes.data
      const recentCycles = recentCyclesRes.data || []
      if (!onboard) continue

      const mappedCycles = recentCycles.map((c: any) => ({
        periodStart: new Date(c.period_start),
        periodEnd: c.period_end ? new Date(c.period_end) : undefined,
        cycleLength: c.cycle_length || undefined
      }))

      const prediction = computePrediction(mappedCycles, {
        avgCycleLength: onboard.avg_cycle_length,
        avgPeriodLength: onboard.avg_period_length,
        lastPeriodStart: recentCycles.length > 0 
          ? new Date(recentCycles[0].period_start) 
          : (onboard.last_period_start ? new Date(onboard.last_period_start) : undefined)
      })

      const daysUntil = prediction.daysUntilNextPeriod
      const currentPhase = prediction.currentPhase
      const hour = new Date().getHours()

      // 1. Period reminder — 2 days before
      if (daysUntil === 2) {
        await sendPushToUser(userId, {
          title: 'Period arriving in 2 days 🌸',
          body: 'Stock up on supplies and prepare your comfort kit.',
          url: '/dashboard',
          tag: 'period-reminder',
          actions: [{ action: 'log-now', title: 'Log symptoms' }],
        })
        results.periodReminders++
      }

      // 2. Fertile window alert
      if (prediction.fertileStart) {
        const fertileStart = new Date(prediction.fertileStart)
        const daysToFertile = Math.ceil(
          (fertileStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        if (daysToFertile === 1) {
          await sendPushToUser(userId, {
            title: 'Fertile window starts tomorrow ✨',
            body: 'Your most fertile days begin tomorrow.',
            url: '/cycles',
            tag: 'fertile-window',
          })
          results.fertileAlerts++
        }
      }

      // 3. Daily check-in reminder at 6 PM (relative to server/UTC time)
      if (hour === 18) {
        const today = new Date().toISOString().split('T')[0]
        const { data: todayLog } = await adminSupabase
          .from('daily_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('log_date', today)
          .single()

        if (!todayLog) {
          const phaseMessages = {
            menstrual: "How are you feeling today? We know this can be tough. 💗",
            follicular: "How's your energy today? You might be feeling it rise! 🌱",
            ovulatory: "How's your mood? You're probably feeling great! ☀️",
            luteal: "How are you doing today? Your feelings are valid. 🌙",
            unknown: "How are you feeling today?",
          }

          await sendPushToUser(userId, {
            title: "Daily check-in time 🌙",
            body: phaseMessages[currentPhase as keyof typeof phaseMessages] || "How are you feeling today?",
            url: '/dashboard',
            tag: 'daily-checkin',
            actions: [{ action: 'log-now', title: 'Log now' }],
          })
          results.checkinReminders++
        }
      }

      // 4. Streak at risk — 9 PM (relative to server/UTC time)
      if (hour === 21) {
        const today = new Date().toISOString().split('T')[0]
        const { data: todayLog } = await adminSupabase
          .from('daily_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('log_date', today)
          .single()

        const { data: streakData } = await adminSupabase
          .from('user_badges')
          .select('badge_key')
          .eq('user_id', userId)
          .like('badge_key', 'streak_%')

        const hasStreak = streakData && streakData.length > 0

        if (!todayLog && hasStreak) {
          await sendPushToUser(userId, {
            title: "Don't break your streak! 🔥",
            body: "You haven't logged today. 1 minute is all it takes.",
            url: '/dashboard',
            tag: 'streak-risk',
            actions: [{ action: 'log-now', title: 'Log now' }],
          })
          results.streakAtRisk++
        }
      }

      // 5. Hydration reminder — 2 PM (relative to server/UTC time)
      if (hour === 14) {
        const today = new Date().toISOString().split('T')[0]
        const { data: todayLog } = await adminSupabase
          .from('daily_logs')
          .select('water_glasses')
          .eq('user_id', userId)
          .eq('log_date', today)
          .single()

        const glassesGoal = currentPhase === 'luteal' ? 10 : 9
        const currentGlasses = todayLog?.water_glasses || 0

        if (currentGlasses < glassesGoal / 2) {
          await sendPushToUser(userId, {
            title: "Hydration check 💧",
            body: `You've had ${currentGlasses} glasses. Goal is ${glassesGoal} today.`,
            url: '/dashboard',
            tag: 'hydration',
          })
          results.hydrationReminders++
        }
      }

      // 6. Weekly insights — Monday mornings (relative to server/UTC time)
      const dayOfWeek = new Date().getDay()
      if (dayOfWeek === 1 && hour === 9) {
        await sendPushToUser(userId, {
          title: "Your weekly Luna insights 📊",
          body: "See your patterns, mood trends, and what to expect this week.",
          url: '/profile',
          tag: 'weekly-insights',
          actions: [{ action: 'view-chat', title: 'Ask Luna' }],
        })
        results.weeklyInsights++
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
