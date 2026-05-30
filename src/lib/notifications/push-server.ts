import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

let isVapidInitialized = false

function initVapid() {
  if (isVapidInitialized) return
  const email = process.env.VAPID_EMAIL
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!email || !publicKey || !privateKey) {
    console.warn('VAPID environment variables are missing. Push notifications might not work.')
    return
  }

  try {
    webpush.setVapidDetails(email, publicKey, privateKey)
    isVapidInitialized = true
  } catch (err) {
    console.error('Failed to set VAPID details:', err)
  }
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  actions?: { action: string; title: string }[]
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  initVapid()
  const adminSupabase = createAdminClient()

  const { data: subscriptions } = await adminSupabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)
    .eq('active', true)

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }

    try {
      await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
      sent++
    } catch (error) {
      failed++
      const err = error as { statusCode?: number }
      if (err && (err.statusCode === 404 || err.statusCode === 410)) {
        // Subscription is expired or invalid — deactivate it
        await adminSupabase
          .from('push_subscriptions')
          .update({ active: false })
          .eq('endpoint', sub.endpoint)
      }
      console.error('Push send failed:', error)
    }
  }

  return { sent, failed }
}

export async function sendPushToAll(payload: PushPayload): Promise<void> {
  const adminSupabase = createAdminClient()

  const { data: subscriptions } = await adminSupabase
    .from('push_subscriptions')
    .select('user_id')
    .eq('active', true)

  const userIds = [...new Set(subscriptions?.map(s => s.user_id) || [])]

  await Promise.allSettled(
    userIds.map(userId => sendPushToUser(userId, payload))
  )
}
