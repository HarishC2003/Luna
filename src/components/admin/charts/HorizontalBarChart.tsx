import React from 'react';

export function HorizontalBarChart({ data }: { data: { label: string, value: number, percentage: number }[] }) {
  if (!data || data.length === 0) return <div className="w-full text-center py-10 text-gray-400">No data yet</div>;

  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col">
          <div className="flex justify-between text-sm font-semibold text-[#4A1B3C] mb-1">
            <span className="capitalize">{d.label.replace(/_/g, ' ')}</span>
            <span>{d.percentage}% ({d.value})</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#E85D9A] rounded-full" 
              style={{ width: `${d.percentage}%` }}
              title={`${d.value}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
