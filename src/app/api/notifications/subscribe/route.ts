import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/notifications/push-server'
import { z } from 'zod'

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validated = subscriptionSchema.safeParse(body)
    if (!validated.success) {
      return Response.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: validated.data.endpoint,
        p256dh: validated.data.keys.p256dh,
        auth: validated.data.keys.auth,
        active: true,
        created_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' })

    if (error) {
      console.error('Database subscription upsert error:', error)
      return Response.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    // Send welcome notification immediately
    await sendPushToUser(user.id, {
      title: 'Luna notifications are ON 🌸',
      body: "You'll get period reminders, fertile window alerts, and daily check-ins.",
      url: '/dashboard',
      tag: 'welcome',
    })

    return Response.json({ message: 'Subscribed successfully' })
  } catch (error) {
    console.error('Subscribe error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { endpoint } = await request.json()
    const adminSupabase = createAdminClient()

    await adminSupabase
      .from('push_subscriptions')
      .update({ active: false })
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    return Response.json({ message: 'Unsubscribed' })
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
