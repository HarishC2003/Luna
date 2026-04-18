import React from 'react';

export function LineChart({ data, color = '#E85D9A', height = 200 }: { data: { label: string, value: number }[], color?: string, height?: number }) {
  if (!data || data.length === 0) return <div className="w-full text-center py-10 text-gray-400">No data yet</div>;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const chartHeight = height - 40;
  
  // Need to know width to distribute points. Let's assume a viewBox of 1000 for relative scaling
  const width = 800;
  const paddingX = width / Math.max(data.length, 2);

  const points = data.map((d, i) => {
    const x = i * paddingX + 50;
    const y = chartHeight - ((d.value / maxVal) * chartHeight);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" style={{ maxHeight: height }}>
      {/* Gridlines */}
      {[0, 0.5, 1].map(multiplier => {
        const y = chartHeight - (chartHeight * multiplier);
        return (
          <g key={multiplier}>
            <line x1="0" y1={y} x2={width} y2={y} stroke="#f0f0f0" strokeWidth="1" />
            <text x="0" y={y - 5} fontSize="14" fill="#a0a0a0">{Math.round(maxVal * multiplier)}</text>
          </g>
        );
      })}
      
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" />
      
      {data.map((d, i) => {
          const x = i * paddingX + 50;
          const y = chartHeight - ((d.value / maxVal) * chartHeight);
          return (
            <g key={i}>
              <title>{`${d.label}: ${d.value}`}</title>
              <circle cx={x} cy={y} r="6" fill="#white" stroke={color} strokeWidth="3" />
              <text x={x} y={height - 10} fontSize="12" fill="#4A1B3C" textAnchor="middle">
                {d.label.split('-').slice(1).join('/') || d.label}
              </text>
            </g>
          );
      })}
    </svg>
  );
}
