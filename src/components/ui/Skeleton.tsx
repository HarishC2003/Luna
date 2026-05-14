export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
      style={{ 
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  )
}
