import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
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
          {/* Background gradients */}
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '25%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '25%',
              right: '25%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            {/* Logo Text */}
            <div
              style={{
                fontSize: 140,
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '0.15em',
                fontFamily: 'system-ui',
                marginBottom: '20px',
              }}
            >
              FLORA DISTRO
            </div>
            
            {/* Divider */}
            <div
              style={{
                width: '300px',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                marginBottom: '40px',
              }}
            />
            
            {/* Tagline */}
            <div
              style={{
                fontSize: 36,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}
            >
              Quality at every scale
            </div>
          </div>

          {/* Bottom Info */}
          <div
            style={{
              position: 'absolute',
              bottom: '50px',
              display: 'flex',
              gap: '40px',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 24,
              letterSpacing: '0.15em',
            }}
          >
            <div>Premium Distribution</div>
            <div style={{ color: 'rgba(255,255,255,0.2)' }}>•</div>
            <div>NC & TN</div>
            <div style={{ color: 'rgba(255,255,255,0.2)' }}>•</div>
            <div>Fast Shipping</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.log(`Error generating OG image: ${e.message}`);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}

