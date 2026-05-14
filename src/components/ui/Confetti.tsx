'use client'
import { useEffect, useState } from 'react'

export default function Confetti({ trigger }: { trigger: boolean }) {
  const [pieces, setPieces] = useState<Array<{ id: number; color: string; left: number; delay: number }>>([])

  useEffect(() => {
    if (trigger) {
      const newPieces = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        color: ['#E85D9A', '#7F77DD', '#1D9E75', '#EF9F27', '#378ADD'][i % 5],
        left: Math.random() * 100,
        delay: Math.random() * 200,
      }))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPieces(newPieces)
      
      const timer = setTimeout(() => setPieces([]), 3000)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  if (pieces.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm opacity-0"
          style={{
            backgroundColor: piece.color,
            left: `${piece.left}%`,
            top: '-10%',
            animation: `confetti 2.5s ease-out ${piece.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  )
}
