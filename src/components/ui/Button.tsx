'use client'
import { ButtonHTMLAttributes, ReactNode, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  onClick,
  ...props
}: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || props.disabled) return

    // Spring bounce animation
    if (btnRef.current) {
      btnRef.current.style.animation = 'none'
      void btnRef.current.offsetHeight
      btnRef.current.style.animation = 'springBounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }

    // Ripple effect
    const btn = btnRef.current
    if (btn) {
      const ripple = document.createElement('span')
      const rect = btn.getBoundingClientRect()
      const sizeVal = Math.max(rect.width, rect.height)
      ripple.style.cssText = `
        position: absolute;
        width: ${sizeVal}px;
        height: ${sizeVal}px;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
        left: ${e.clientX - rect.left - sizeVal / 2}px;
        top: ${e.clientY - rect.top - sizeVal / 2}px;
        animation: ripple 0.6s ease-out forwards;
        pointer-events: none;
      `
      btn.style.position = 'relative'
      btn.style.overflow = 'hidden'
      btn.appendChild(ripple)
      setTimeout(() => ripple.remove(), 600)
    }

    onClick?.(e)
  }

  const base = `inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''}`

  const variants = {
    primary: 'bg-gradient-to-r from-[#E85D9A] to-[#7F77DD] text-white shadow-md shadow-pink-200 hover:shadow-lg hover:shadow-pink-300 hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-white text-gray-800 border border-gray-200 hover:border-gray-300 hover:shadow-md active:shadow-none',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-200 hover:shadow-lg hover:-translate-y-0.5',
    success: 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-md shadow-teal-200 hover:shadow-lg hover:-translate-y-0.5',
  }

  const sizes = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-sm',
    lg: 'px-6 py-3.5 text-base',
  }

  return (
    <button
      ref={btnRef}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={handleClick}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
