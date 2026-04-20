// app/result/[resultId]/components/ScoreDisplay.tsx
interface ScoreDisplayProps {
  score: number
  label: string
}

export default function ScoreDisplay({ score, label }: ScoreDisplayProps) {
  return (
    <div className="text-center">
      <div
        className="text-[96px] font-black leading-[0.85] mb-2"
        style={{ fontFamily: 'Inter, sans-serif', color: '#9fe870' }}
      >
        {score}%
      </div>
      <div className="text-2xl font-semibold mb-2" style={{ color: '#0e0f0c' }}>
        {label}
      </div>
      <p className="text-[#868685]">匹配度</p>
    </div>
  )
}