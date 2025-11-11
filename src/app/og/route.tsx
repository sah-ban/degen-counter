import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const count = searchParams.get('count') ?? '69,420'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0b2e 50%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(163,110,253,0.4), transparent 50%), radial-gradient(circle at 80% 20%, rgba(34,211,238,0.3), transparent 50%)',
            filter: 'blur(80px)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(15,15,26,0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(163,110,253,0.3)',
            borderRadius: '32px',
            padding: '48px 64px',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 0 60px rgba(163,110,253,0.15)',
            position: 'relative',
          }}
        >
          <img
            src={`${process.env.NEXT_PUBLIC_URL}/degenlogo.png`}
            width={120}
            height={120}
            alt="DEGEN"
            style={{ filter: 'drop-shadow(0 0 30px rgba(163,110,253,0.8))' }}
          />

          <div style={{ marginTop: 32, fontSize: 56, fontWeight: 900, background: 'linear-gradient(90deg, #A36EFD, #22D3EE)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', letterSpacing: '-0.02em' }}>
            $DEGEN COUNTER
          </div>

          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Live on-chain count
          </div>

          <div style={{ marginTop: 24, fontSize: 96, fontWeight: 900, background: 'linear-gradient(135deg, #bef264, #84cc16)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', letterSpacing: '-0.03em', textShadow: '0 0 80px rgba(190,242,100,0.6)' }}>
            {count.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          </div>

          <div style={{ marginTop: 32, height: 6, width: '80%', background: 'linear-gradient(90deg, transparent, #A36EFD, #22D3EE, transparent)', borderRadius: 3 }} />
        </div>

        {/* Corner triangles — pure SVG paths */}
        <svg style={{ position: 'absolute', top: 24, left: 24, opacity: 0.8 }} width="48" height="48" viewBox="0 0 100 100">
          <path d="M0,0 L100,0 L100,100 Z" fill="#A36EFD" />
          <path d="M0,100 L100,100 L0,0 Z" fill="#A36EFD" />
        </svg>

        <svg style={{ position: 'absolute', bottom: 24, right: 24, opacity: 0.8 }} width="48" height="48" viewBox="0 0 100 100">
          <path d="M0,0 L100,0 L0,100 Z" fill="#22D3EE" />
          <path d="M100,100 L100,0 L0,100 Z" fill="#22D3EE" />
        </svg>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}