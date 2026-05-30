'use client';

import { DailyLog } from '@/types/cycle';
import { motion } from 'framer-motion';

interface MoodGraphProps {
  logs: DailyLog[];
}

export function MoodGraph({ logs }: MoodGraphProps) {
  if (!logs || logs.length === 0) return null;

  const moodScore = (mood: string | null) => {
    switch (mood) {
      case 'great': return 5;
      case 'good': return 4;
      case 'okay': return 3;
      case 'low': return 2;
      case 'terrible': return 1;
      default: return null;
    }
  };

  // Only consider logs that have a mood score
  const validLogs = logs.filter((l) => moodScore(l.mood) !== null);
  if (validLogs.length === 0) return null;

  const width = 800;
  const height = 200;
  const paddingX = 40;
  const paddingY = 40;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  // Calculate coordinates
  const points = validLogs.map((log, i) => {
    const score = moodScore(log.mood)!;
    // Normalize score (1 to 5) to Y coordinate
    // 5 -> top (paddingY), 1 -> bottom (height - paddingY)
    const y = paddingY + innerHeight - ((score - 1) / 4) * innerHeight;
    // Distribute X evenly
    const x = paddingX + (validLogs.length > 1 ? (i / (validLogs.length - 1)) * innerWidth : innerWidth / 2);

    return {
      x,
      y,
      score,
      label: new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'short' }),
      moodStr: log.mood
    };
  });

  // Create SVG path string
  const createSmoothPath = () => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      path += ` C ${cx},${p0.y} ${cx},${p1.y} ${p1.x},${p1.y}`;
    }

    return path;
  };

  const pathD = createSmoothPath();
  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  // Determine emoji based on mood
  const getEmoji = (mood: string | null) => {
    switch (mood) {
      case 'great': return '🤩';
      case 'good': return '🙂';
      case 'okay': return '😐';
      case 'low': return '😔';
      case 'terrible': return '😫';
      default: return '';
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-pink-200" style={{ minHeight: '260px' }}>
      <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full h-full overflow-visible min-w-[650px] sm:min-w-0">
        <defs>
          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E85D9A" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#E85D9A" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="50%" stopColor="#E85D9A" />
            <stop offset="100%" stopColor="#C026D3" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid lines */}
        {[1, 2, 3, 4, 5].map((level) => {
          const y = paddingY + innerHeight - ((level - 1) / 4) * innerHeight;
          return (
            <g key={`grid-${level}`}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#E85D9A"
                strokeOpacity="0.1"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </g>
          );
        })}

        {/* Gradient Area under the line */}
        <motion.path
          d={areaD}
          fill="url(#moodGradient)"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        />

        {/* The glowing line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* The data points and labels */}
        {points.map((p, i) => (
          <g key={`point-${i}`}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r="6"
              fill="white"
              stroke="#E85D9A"
              strokeWidth="3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}
            />
            {/* Value / Emoji */}
            <motion.text
              x={p.x}
              y={p.y - 18}
              textAnchor="middle"
              className="text-lg font-bold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.1 }}
            >
              {getEmoji(p.moodStr)}
            </motion.text>
            {/* X-axis labels */}
            <motion.text
              x={p.x}
              y={height + 10}
              textAnchor="middle"
              className="text-xs font-semibold fill-[#4A1B3C]/50 uppercase tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              {p.label}
            </motion.text>
          </g>
        ))}
      </svg>
    </div>
  );
}
