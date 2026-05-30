'use client'
import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

const ToastCtx = createContext<{
  toast: (type: ToastType, title: string, message?: string) => void
} | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
  }, [])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  const icons = {
    success: <CheckCircle2 size={18} className="text-teal-600 flex-shrink-0" />,
    error: <XCircle size={18} className="text-red-500 flex-shrink-0" />,
    info: <Info size={18} className="text-blue-500 flex-shrink-0" />,
    warning: <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />,
  }

  const borders = {
    success: 'border-l-4 border-l-teal-500',
    error: 'border-l-4 border-l-red-500',
    info: 'border-l-4 border-l-blue-500',
    warning: 'border-l-4 border-l-amber-500',
  }

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 max-w-xs w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`animate-slide-down bg-white rounded-2xl shadow-xl p-4 flex items-start gap-3 ${borders[t.type]}`}
          >
            {icons[t.type]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{t.title}</p>
              {t.message && <p className="text-xs text-gray-500 mt-0.5">{t.message}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

type ToastFunction = (type: ToastType, title: string, message?: string) => void;

interface ToastHookResult extends ToastFunction {
  toast: ToastFunction;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const useToast = (): ToastHookResult => {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')

  const callable = ((type: ToastType, title: string, message?: string) => {
    ctx.toast(type, title, message)
  }) as ToastHookResult;

  callable.toast = ctx.toast;
  callable.showToast = (type: 'success' | 'error' | 'info', message: string) => {
    ctx.toast(type as ToastType, message);
  };

  return callable;
}
