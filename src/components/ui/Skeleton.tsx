export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="h-52 w-full rounded-3xl" />
      <Skeleton className="h-24 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
      <Skeleton className="h-36 w-full rounded-3xl" />
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex gap-3">
        <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
        <Skeleton className="h-20 flex-1 rounded-2xl" />
      </div>
      <div className="flex gap-3 justify-end">
        <Skeleton className="h-14 w-48 rounded-2xl" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
        <Skeleton className="h-28 flex-1 rounded-2xl" />
      </div>
    </div>
  )
}

export function HistorySkeleton() {
  return (
    <div className="p-4 space-y-3 animate-fade-in">
      <Skeleton className="h-24 w-full rounded-2xl" />
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  )
}
