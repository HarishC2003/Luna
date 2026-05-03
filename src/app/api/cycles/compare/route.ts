import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { daysBetween } from '@/lib/utils/date'

export async function GET(request: Request): Promise<Response> {
  try {
    // 1. Authenticate
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get query params
    const { searchParams } = new URL(request.url)
    const cycleCount = parseInt(searchParams.get('cycles') || '3')
    const validatedCount = Math.min(Math.max(cycleCount, 1), 6) // 1-6 cycles

    // 3. Fetch cycle logs
    const adminSupabase = createAdminClient()
    const { data: cycles, error: cyclesError } = await adminSupabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('period_start', { ascending: false })
      .limit(validatedCount + 1) // +1 for current cycle

    if (cyclesError || !cycles || cycles.length === 0) {
      return Response.json({ cycles: [], dailyLogs: [] })
    }

    // 4. Get date range for all cycles
    const earliestDate = cycles[cycles.length - 1].period_start
    const latestDate = new Date().toISOString().split('T')[0]

    // 5. Fetch all daily logs for this date range
    const { data: dailyLogs, error: logsError } = await adminSupabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('log_date', earliestDate)
      .lte('log_date', latestDate)
      .order('log_date', { ascending: true })

    if (logsError) {
      return Response.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    // 6. For each cycle, compute its length and attach relevant daily logs
    const enrichedCycles = cycles.map((cycle, index) => {
      const nextCycle = cycles[index - 1]
      const cycleEnd = nextCycle?.period_start || latestDate
      const cycleLengthDays = daysBetween(
        new Date(cycle.period_start),
        new Date(cycleEnd)
      )

      const cycleDailyLogs = dailyLogs?.filter(log => {
        const logDate = new Date(log.log_date)
        const start = new Date(cycle.period_start)
        const end = new Date(cycleEnd)
        return logDate >= start && logDate <= end
      }) || []

      return {
        ...cycle,
        cycleLength: cycleLengthDays,
        dailyLogs: cycleDailyLogs,
        isCurrent: index === 0,
      }
    })

    return Response.json({ cycles: enrichedCycles })
  } catch (error) {
    console.error('Cycle compare error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
