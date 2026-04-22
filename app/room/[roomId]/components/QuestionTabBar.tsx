'use client'

type Tab = 'all' | 'match' | 'mismatch'

interface QuestionTabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  counts: { all: number; match: number; mismatch: number }
}

export default function QuestionTabBar({ activeTab, onTabChange, counts }: QuestionTabBarProps) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: `全部 (${counts.all})` },
    { key: 'match', label: `默契 (${counts.match})` },
    { key: 'mismatch', label: `分歧 (${counts.mismatch})` },
  ]

  return (
    <div
      className="flex gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)]"
      style={{ borderTop: '1px solid var(--surface)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`
            flex-1 py-[var(--space-2)] px-[var(--space-3)]
            rounded-full text-sm font-medium
            transition-all duration-[var(--duration-base)]
          `}
          style={
            activeTab === tab.key
              ? { background: 'var(--foreground)', color: 'var(--background)' }
              : { background: 'var(--surface)', color: 'var(--gray)' }
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
