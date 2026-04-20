// app/result/[resultId]/components/ComparisonList.tsx
interface Comparison {
  question: string
  optionA: string
  optionB: string
  myChoice: 'a' | 'b' | null
  opponentChoice: 'a' | 'b' | null
  match: boolean
}

interface ComparisonListProps {
  comparisons: Comparison[]
}

function ChoiceBadge({ choice }: { choice: 'a' | 'b' | null }) {
  if (!choice) return <span className="text-[#868685]">—</span>
  return (
    <span
      className={`inline-block w-6 h-6 rounded-full text-center leading-6 text-xs font-bold ${
        choice === 'a' ? 'bg-[#9fe870] text-[#163300]' : 'bg-[#163300] text-[#9fe870]'
      }`}
    >
      {choice.toUpperCase()}
    </span>
  )
}

export default function ComparisonList({ comparisons }: ComparisonListProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      <h3 className="text-lg font-semibold mb-2">答题对比</h3>
      {comparisons.map((comp, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border-2 ${
            comp.match
              ? 'border-[#9fe870] bg-[#9fe870]/5'
              : 'border-[rgba(14,15,12,0.12)]'
          }`}
        >
          <p className="text-sm font-medium mb-2">{comp.question}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <ChoiceBadge choice={comp.myChoice} />
              <span className="text-[#868685]">你的选择</span>
            </div>
            <div className="flex items-center gap-1">
              <ChoiceBadge choice={comp.opponentChoice} />
              <span className="text-[#868685]">对方</span>
            </div>
            {comp.match && (
              <span className="ml-auto text-xs text-[#054d28] font-semibold">✓ 匹配</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}