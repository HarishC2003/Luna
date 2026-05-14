import { ReactNode } from 'react'

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-6 max-w-sm">{description}</p>
      {action}
    </div>
  )
}
