'use client'
import { useEffect, useState } from 'react'

interface Piece {
  id: number
  x: number
  color: string
  size: number
  delay: number
  duration: number
  rotation: number
}

export default function Confetti({ trigger }: { trigger: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    if (!trigger) return

    const colors = ['#E85D9A', '#7F77DD', '#1D9E75', '#EF9F27', '#378ADD', '#ED93B1']
    const newPieces: Piece[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[i % colors.length],
      size: Math.random() * 8 + 6,
      delay: Math.random() * 600,
      duration: Math.random() * 1500 + 1500,
      rotation: Math.random() * 360,
    }))

    setPieces(newPieces)
    const timer = setTimeout(() => setPieces([]), 4000)
    return () => clearTimeout(timer)
  }, [trigger])

  if (pieces.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[998] overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confettiFall ${p.duration}ms ease-in ${p.delay}ms forwards`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}
