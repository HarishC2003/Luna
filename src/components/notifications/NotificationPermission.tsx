'use client'
import { useState, useEffect } from 'react'
import { Bell, X, Check } from 'lucide-react'
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  getNotificationPermissionStatus,
} from '@/lib/notifications/push-client'

export default function NotificationPermission() {
  const [status, setStatus] = useState<'idle' | 'asking' | 'granted' | 'denied' | 'unsupported'>('idle')
  const [showBanner, setShowBanner] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const permStatus = getNotificationPermissionStatus()

    if (permStatus === 'granted') {
      setStatus('granted')
      return
    }

    if (permStatus === 'denied' || permStatus === 'unsupported') {
      setStatus(permStatus)
      return
    }

    // Show banner if permission not yet asked
    const dismissed = localStorage.getItem('luna_notif_dismissed')
    if (!dismissed) {
      // Show the soft ask after 2 seconds
      setTimeout(() => setShowBanner(true), 2000)
    }
  }, [])

  const handleEnable = async () => {
    setLoading(true)
    try {
      const permission = await requestNotificationPermission()

      if (permission === 'granted') {
        const registration = await registerServiceWorker()
        if (!registration) throw new Error('Service worker failed')

        const subscription = await subscribeToPush(registration)
        if (!subscription) throw new Error('Subscription failed')

        // Save to backend
        const res = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        })

        if (res.ok) {
          setStatus('granted')
          setShowBanner(false)
        }
      } else {
        setStatus('denied')
        setShowBanner(false)
      }
    } catch (err) {
      console.error('Notification setup failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('luna_notif_dismissed', 'true')
    setShowBanner(false)
  }

  if (!showBanner || status === 'granted' || status === 'denied' || status === 'unsupported') {
    return null
  }

  return (
    <div className="animate-slide-down fixed top-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div
        className="bg-white rounded-3xl p-5 shadow-2xl relative"
        style={{ boxShadow: '0 20px 60px rgba(232,93,154,0.2)' }}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 cursor-pointer"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FBEAF0, #EEEDFE)' }}
          >
            <Bell size={22} style={{ color: '#E85D9A' }} />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="font-semibold text-gray-900 mb-1">Never miss a thing 🌸</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Get period reminders, fertile window alerts, and daily check-ins right in your browser — even when Luna is closed.
            </p>

            <div className="space-y-1.5 mb-4">
              {[
                'Period reminders 2 days before',
                'Fertile window alerts',
                'Daily check-in at 6 PM',
                'Symptom prediction alerts',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
                  <Check size={12} className="text-teal-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 cursor-pointer"
                style={{
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #E85D9A, #7F77DD)',
                }}
              >
                {loading ? 'Setting up...' : 'Enable notifications'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
