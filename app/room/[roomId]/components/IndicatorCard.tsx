'use client'

interface IndicatorCardProps {
  label: string
  value: string | number
  description?: string
}

export default function IndicatorCard({ label, value, description }: IndicatorCardProps) {
  return (
    <div
      className="flex-1 min-w-0 p-[var(--space-3)] rounded-2xl text-center"
      style={{ background: 'var(--surface)' }}
    >
      <div
        className="text-[clamp(20px,4vw,28px)] font-black leading-none mb-[var(--space-1)]"
        style={{ color: 'var(--green)' }}
      >
        {value}
      </div>
      <div
        className="text-xs font-semibold mb-[2px]"
        style={{ color: 'var(--foreground)' }}
      >
        {label}
      </div>
      {description && (
        <div
          className="text-[10px]"
          style={{ color: 'var(--gray)' }}
        >
          {description}
        </div>
      )}
    </div>
  )
}
