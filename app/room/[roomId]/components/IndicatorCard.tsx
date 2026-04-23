'use client'

interface IndicatorCardProps {
  label: string
  value: string | number
  description?: string
}

export default function IndicatorCard({ label, value, description }: IndicatorCardProps) {
  return (
    <div
      className="flex-1 min-w-0 py-[var(--space-4)] px-[var(--space-5)] rounded-2xl text-center"
      style={{
        background: 'oklch(86% 0.08 122 / 0.12)',
        border: '2px solid oklch(86% 0.12 122 / 0.25)',
      }}
    >
      <div
        className="text-[clamp(24px,5vw,32px)] font-black leading-none mb-[var(--space-1)] tracking-tight"
        style={{ color: 'var(--green)' }}
      >
        {value}
      </div>
      <div
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--gray)' }}
      >
        {label}
      </div>
      {description && (
        <div
          className="text-[10px] mt-[2px]"
          style={{ color: 'var(--gray)', opacity: 0.8 }}
        >
          {description}
        </div>
      )}
    </div>
  )
}
