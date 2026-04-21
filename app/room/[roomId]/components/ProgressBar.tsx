interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="w-full flex flex-col gap-[var(--space-2)]">
      <div className="flex justify-between text-sm font-medium" style={{ color: 'var(--gray)' }}>
        <span>第 {current} 题</span>
        <span>{current} / {total}</span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--surface)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${(current / total) * 100}%`,
            background: 'var(--green)',
            transition: 'width 400ms var(--ease-out-quart)',
          }}
        />
      </div>
    </div>
  )
}
