import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const score = parseInt(searchParams.get('score') || '0', 10)
  const label = searchParams.get('label') || '匹配度'

  const labelText =
    score >= 96
      ? '离谱级默契'
      : score >= 81
      ? '默契达人'
      : score >= 61
      ? '有点东西的默契'
      : score >= 41
      ? '普通朋友水平'
      : score >= 21
      ? '有点熟，但不多'
      : '完全不在一个频道'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, oklch(86% 0.08 122 / 0.15) 0%, transparent 70%)',
          }}
        />

        {/* Score */}
        <div
          style={{
            fontSize: '160px',
            fontWeight: 900,
            color: '#9fe870',
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}
        >
          {score}%
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#0e0f0c',
            marginTop: '16px',
          }}
        >
          {labelText}
        </div>

        {/* Brand */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            fontSize: '32px',
            fontWeight: 900,
            color: '#868685',
            letterSpacing: '-0.02em',
          }}
        >
          MatchMatch
        </div>

        {/* Decorative lime pill bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            background: '#9fe870',
            color: '#163300',
            padding: '8px 24px',
            borderRadius: '9999px',
            fontSize: '20px',
            fontWeight: 600,
          }}
        >
          测一测
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
