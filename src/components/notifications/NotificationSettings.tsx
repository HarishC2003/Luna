'use client'
import { useState, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getNotificationPermissionStatus,
} from '@/lib/notifications/push-client'

export default function NotificationSettings() {
  const [permStatus, setPermStatus] = useState<string>('idle')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPermStatus(getNotificationPermissionStatus())
  }, [])

  const handleEnable = async () => {
    setLoading(true)
    try {
      const permission = await requestNotificationPermission()
      if (permission === 'granted') {
        const reg = await registerServiceWorker()
        if (reg) {
          const sub = await subscribeToPush(reg)
          if (sub) {
            await fetch('/api/notifications/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sub),
            })
          }
        }
        setPermStatus('granted')
      } else {
        setPermStatus('denied')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    try {
      const reg = await registerServiceWorker()
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/notifications/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await unsubscribeFromPush(reg)
        }
      }
      setPermStatus('default')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'gradient(135deg, #FBEAF0, #EEEDFE)', backgroundColor: '#FBEAF0' }}>
          <Bell size={18} style={{ color: '#E85D9A' }} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Browser notifications</h3>
          <p className="text-xs text-gray-500">Get reminders directly in Chrome</p>
        </div>
        <div className="ml-auto">
          {permStatus === 'granted' ? (
            <span className="flex items-center gap-1 text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded-full">
              <Check size={12} /> On
            </span>
          ) : (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Off</span>
          )}
        </div>
      </div>

      {permStatus === 'denied' ? (
        <div className="bg-amber-50 rounded-2xl p-3 text-sm text-amber-800">
          Notifications are blocked. Go to Chrome Settings → Site Settings → Notifications to enable.
        </div>
      ) : permStatus === 'granted' ? (
        <button
          onClick={handleDisable}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95 cursor-pointer"
        >
          {loading ? 'Disabling...' : 'Turn off notifications'}
        </button>
      ) : (
        <button
          onClick={handleEnable}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 cursor-pointer"
          style={{ background: loading ? '#ccc' : 'linear-gradient(135deg, #E85D9A, #7F77DD)' }}
        >
          {loading ? 'Setting up...' : 'Turn on notifications'}
        </button>
      )}
    </div>
  )
}
