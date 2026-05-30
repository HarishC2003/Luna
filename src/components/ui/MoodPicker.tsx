'use client'
import { useState } from 'react'

const moods = [
  { value: 'terrible', emoji: '😣', label: 'Terrible', color: '#EF4444' },
  { value: 'low', emoji: '😔', label: 'Low', color: '#F97316' },
  { value: 'okay', emoji: '😐', label: 'Okay', color: '#EAB308' },
  { value: 'good', emoji: '😊', label: 'Good', color: '#22C55E' },
  { value: 'great', emoji: '🤩', label: 'Great', color: '#E85D9A' },
]

interface MoodPickerProps {
  value?: string
  onChange: (mood: string) => void
}

export default function MoodPicker({ value, onChange }: MoodPickerProps) {
  const [hovering, setHovering] = useState<string | null>(null)

  return (
    <div className="flex justify-around py-2 w-full">
      {moods.map(mood => {
        const isSelected = value === mood.value
        const isHovering = hovering === mood.value

        return (
          <button
            key={mood.value}
            type="button"
            onClick={() => onChange(mood.value)}
            onMouseEnter={() => setHovering(mood.value)}
            onMouseLeave={() => setHovering(null)}
            className="flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer outline-none"
            style={{
              transform: isSelected
                ? 'scale(1.3) translateY(-4px)'
                : isHovering
                ? 'scale(1.15)'
                : 'scale(1)',
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200"
              style={{
                background: isSelected ? `${mood.color}22` : 'transparent',
                border: isSelected ? `2px solid ${mood.color}` : '2px solid transparent',
                boxShadow: isSelected ? `0 0 16px ${mood.color}44` : 'none',
              }}
            >
              {mood.emoji}
            </div>
            <span
              className="text-xs font-medium transition-all duration-200"
              style={{ color: isSelected ? mood.color : '#9CA3AF' }}
            >
              {mood.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
