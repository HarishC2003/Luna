import React from 'react';

export function BarChart({ data, color = '#E85D9A', height = 200 }: { data: { label: string, value: number }[], color?: string, height?: number }) {
  if (!data || data.length === 0) return <div className="w-full text-center py-10 text-gray-400">No data yet</div>;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = 40;
  const padding = 20;
  const chartHeight = height - 40; // reserve bottom for labels

  return (
    <svg width="100%" height={height} className="overflow-visible">
      {/* Gridlines */}
      {[0, 0.5, 1].map(multiplier => {
        const y = chartHeight - (chartHeight * multiplier);
        return (
          <g key={multiplier}>
            <line x1="0" y1={y} x2="100%" y2={y} stroke="#f0f0f0" strokeWidth="1" />
            <text x="0" y={y - 5} fontSize="10" fill="#a0a0a0">{Math.round(maxVal * multiplier)}</text>
          </g>
        );
      })}
      
      {/* Bars */}
      <g transform="translate(30, 0)">
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * chartHeight;
          const x = i * (barWidth + padding);
          const y = chartHeight - barHeight;
          return (
            <g key={i}>
              <title>{`${d.label}: ${d.value}`}</title>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill={color} rx="4" />
              <text x={x + barWidth / 2} y={height - 10} fontSize="10" fill="#4A1B3C" textAnchor="middle" transform={`rotate(45 ${x + barWidth/2} ${height - 10})`}>
                {d.label.split('-').slice(1).join('/') || d.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
