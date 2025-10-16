import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'Flora Distro - Premium Cannabis Distribution'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
export default async function TwitterImage() {
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
          backgroundColor: '#1a1a1a',
          position: 'relative',
        }}
      >
        {/* Background subtle gradient */}
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            right: '25%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Brand Name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 180,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '20px',
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
            }}
          >
            FLORA DISTRO
          </div>
          
          <div
            style={{
              width: '200px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              marginBottom: '30px',
            }}
          />
          
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontFamily: 'sans-serif',
            }}
          >
            Quality at every scale
          </div>
        </div>

        {/* Bottom info */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '30px',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 20,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          <div>Premium Distribution</div>
          <div style={{ color: 'rgba(255,255,255,0.2)' }}>•</div>
          <div>NC & TN</div>
          <div style={{ color: 'rgba(255,255,255,0.2)' }}>•</div>
          <div>@floradistro</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

