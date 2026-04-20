// app/room/[roomId]/components/OptionButton.tsx
'use client'

interface OptionButtonProps {
  label: 'A' | 'B'
  text: string
  selected: boolean
  locked: boolean
  opponentSelected: boolean
  isCorrect?: boolean
  onClick: () => void
}

export default function OptionButton({
  label,
  text,
  selected,
  locked,
  opponentSelected,
  isCorrect,
  onClick,
}: OptionButtonProps) {
  const baseStyle = 'w-full py-5 px-6 rounded-2xl border-2 text-left transition-all font-semibold text-[18px]'
  const disabledStyle = locked && !selected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

  let borderStyle = 'border-[rgba(14,15,12,0.12)]'
  if (selected && !locked) borderStyle = 'border-[#9fe870] bg-[#9fe870]/10'
  if (selected && locked) borderStyle = isCorrect ? 'border-[#9fe870] bg-[#9fe870]/20' : 'border-[#d03238] bg-[#d03238]/10'
  if (!selected && locked && opponentSelected && isCorrect) borderStyle = 'border-[#9fe870] bg-[#9fe870]/10'

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`${baseStyle} ${borderStyle} ${disabledStyle}`}
    >
      <span className={`inline-block w-8 h-8 rounded-full text-center leading-8 mr-3 text-sm ${
        selected ? 'bg-[#9fe870] text-[#163300]' : 'bg-[rgba(14,15,12,0.08)]'
      }`}>
        {label}
      </span>
      {text}
    </button>
  )
}
