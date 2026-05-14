'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (type: ToastType, message: string) => {
    // eslint-disable-next-line react-hooks/purity
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), 4000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="animate-slide-up bg-white rounded-xl shadow-lg border p-4 flex items-start gap-3 pointer-events-auto"
          >
            {toast.type === 'success' && <CheckCircle className="text-green-500 flex-shrink-0" size={20} />}
            {toast.type === 'error' && <XCircle className="text-red-500 flex-shrink-0" size={20} />}
            {toast.type === 'info' && <AlertCircle className="text-blue-500 flex-shrink-0" size={20} />}
            <p className="flex-1 text-sm text-gray-800">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600 active:scale-95 transition-transform">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
