// app/room/[roomId]/components/ProgressBar.tsx
interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-[#868685] mb-2">
        <span>第 {current} 题</span>
        <span>{current} / {total}</span>
      </div>
      <div className="w-full h-2 bg-[rgba(14,15,12,0.08)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${(current / total) * 100}%`,
            background: '#9fe870',
          }}
        />
      </div>
    </div>
  )
}
