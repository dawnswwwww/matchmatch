'use client'

interface QuestionCardProps {
  index: number
  question: string
  optionA: string
  optionB: string
  myChoice: 'a' | 'b' | null
  opponentChoice: 'a' | 'b' | null
  match: boolean
}

function OptionBadge({ choice }: { choice: 'a' | 'b' | null }) {
  if (!choice) return null
  const isA = choice === 'a'
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-1"
      style={isA ? { background: 'var(--green)', color: 'var(--green-dark)' } : { background: 'var(--foreground)', color: 'var(--background)' }}
    >
      {choice.toUpperCase()}
    </span>
  )
}

export default function QuestionCard({ index, question, optionA, optionB, myChoice, opponentChoice, match }: QuestionCardProps) {
  return (
    <div
      className="flex-shrink-0 w-full snap-center px-[var(--space-6)] py-[var(--space-4)]"
    >
      <div
        className={`
          p-[var(--space-5)] rounded-[var(--radius-lg)] border-2
          ${match ? 'border-[var(--green)]' : 'border-[var(--surface)]'}
        `}
        style={{
          background: match ? 'oklch(86% 0.08 122 / 0.06)' : 'var(--surface)',
        }}
      >
        {/* 题目编号和匹配状态 */}
        <div className="flex items-center justify-between mb-[var(--space-4)]">
          <span className="text-sm font-semibold" style={{ color: 'var(--gray)' }}>
            第 {index + 1} 题
          </span>
          {match ? (
            <span className="text-xs font-semibold" style={{ color: 'var(--green-dark)' }}>
              ✓ 默契
            </span>
          ) : (
            <span className="text-xs" style={{ color: 'var(--gray)' }}>
              ✗ 分歧
            </span>
          )}
        </div>

        {/* 题目文本 */}
        <p className="text-base font-medium mb-[var(--space-5)] leading-snug" style={{ color: 'var(--foreground)' }}>
          {question}
        </p>

        {/* 选项区域 */}
        <div className="flex items-center gap-[var(--space-4)]">
          {/* 选项 A */}
          <div className="flex-1">
            <div
              className={`
                p-[var(--space-3)] rounded-[var(--radius-md)] border-2
                ${myChoice === 'a' || opponentChoice === 'a' ? 'border-[var(--green)]' : 'border-transparent'}
              `}
              style={{ background: myChoice === 'a' ? 'oklch(86% 0.08 122 / 0.15)' : 'var(--background)' }}
            >
              <div className="flex items-center mb-[var(--space-1)]">
                <OptionBadge choice={myChoice === 'a' ? 'a' : null} />
                <span className="text-xs" style={{ color: 'var(--gray)' }}>你的</span>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                A: {optionA}
              </p>
              {opponentChoice === 'a' && myChoice === 'a' && (
                <p className="text-xs mt-[2px]" style={{ color: 'var(--gray)' }}>
                  对方也选 A
                </p>
              )}
              {opponentChoice === 'a' && myChoice !== 'a' && (
                <p className="text-xs mt-[2px]" style={{ color: 'var(--gray)' }}>
                  对方选 A
                </p>
              )}
            </div>
          </div>

          {/* VS */}
          <div className="text-sm font-bold" style={{ color: 'var(--gray)' }}>vs</div>

          {/* 选项 B */}
          <div className="flex-1">
            <div
              className={`
                p-[var(--space-3)] rounded-[var(--radius-md)] border-2
                ${myChoice === 'b' || opponentChoice === 'b' ? 'border-[var(--foreground)]' : 'border-transparent'}
              `}
              style={{ background: myChoice === 'b' ? 'oklch(0 0 0 / 0.06)' : 'var(--background)' }}
            >
              <div className="flex items-center mb-[var(--space-1)]">
                <OptionBadge choice={myChoice === 'b' ? 'b' : null} />
                <span className="text-xs" style={{ color: 'var(--gray)' }}>你的</span>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                B: {optionB}
              </p>
              {opponentChoice === 'b' && myChoice === 'b' && (
                <p className="text-xs mt-[2px]" style={{ color: 'var(--gray)' }}>
                  对方也选 B
                </p>
              )}
              {opponentChoice === 'b' && myChoice !== 'b' && (
                <p className="text-xs mt-[2px]" style={{ color: 'var(--gray)' }}>
                  对方选 B
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}