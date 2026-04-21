'use client';

import { useState, useEffect } from 'react';
import { getBadgeDefinition } from '@/lib/streaks/calculator';

interface Props {
  badgeKeys: string[];
  onDismiss: () => void;
}

export function MilestoneCelebration({ badgeKeys, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);
  const [confetti, setConfetti] = useState<Array<{ left: number; delay: number }>>([]);

  useEffect(() => {
    setConfetti(Array.from({ length: 30 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
    })));

    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible || badgeKeys.length === 0) return null;

  const badge = getBadgeDefinition(badgeKeys[0]);
  if (!badge) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4A1B3C]/50 backdrop-blur-sm animate-fade-in"
      onClick={() => { setVisible(false); onDismiss(); }}
    >
      {/* Confetti — 30 falling rects, respects prefers-reduced-motion */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none motion-safe-confetti">
        {confetti.map((piece, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              backgroundColor: ['#E85D9A', '#f59e0b', '#22c55e', '#8b5cf6', '#0ea5e9', '#ef4444'][i % 6],
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="relative z-10 bg-white rounded-3xl p-8 sm:p-10 shadow-2xl text-center max-w-sm mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-md"
          style={{ backgroundColor: badge.color + '20', borderColor: badge.color, borderWidth: 3 }}
        >
          {badge.emoji}
        </div>
        <h2 className="text-2xl font-extrabold text-[#4A1B3C] mb-1">Badge Earned!</h2>
        <h3 className="text-lg font-bold" style={{ color: badge.color }}>{badge.name}</h3>
        <p className="text-sm text-gray-500 mt-2 mb-6">{badge.description}</p>
        <button
          onClick={() => { setVisible(false); onDismiss(); }}
          className="px-8 py-3 bg-[#E85D9A] hover:bg-[#d44d88] text-white font-bold rounded-full shadow-lg transition-all active:scale-95"
        >
          Keep it up!
        </button>
      </div>

      <style jsx>{`
        .confetti-piece {
          position: absolute;
          top: -10px;
          width: 8px;
          height: 12px;
          border-radius: 2px;
          opacity: 0.85;
        }

        @media (prefers-reduced-motion: no-preference) {
          .confetti-piece {
            animation: confetti-fall 2.5s ease-in forwards;
          }
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .confetti-piece {
            display: none;
          }
          .animate-scale-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
