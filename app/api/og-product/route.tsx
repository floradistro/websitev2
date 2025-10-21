import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productName = searchParams.get('name') || 'Product';
    const category = searchParams.get('category') || 'Products';
    const price = searchParams.get('price') || '';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#1a1a1a',
            padding: '80px',
            position: 'relative',
          }}
        >
          {/* Background gradient */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
            }}
          />

          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10 }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '0.15em',
                marginBottom: '10px',
              }}
            >
              FLORA DISTRO
            </div>
            <div
              style={{
                fontSize: 24,
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              {category}
            </div>
          </div>

          {/* Product Info */}
          <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10, maxWidth: '900px' }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 'normal',
                color: 'white',
                letterSpacing: '0.05em',
                lineHeight: 1.2,
                marginBottom: '30px',
              }}
            >
              {productName}
            </div>
            
            {price && (
              <div
                style={{
                  fontSize: 48,
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: '500',
                }}
              >
                {price}
              </div>
            )}

            {/* Divider */}
            <div
              style={{
                width: '200px',
                height: '2px',
                background: 'rgba(255,255,255,0.2)',
                marginTop: '40px',
              }}
            />
          </div>

          {/* Footer info */}
          <div
            style={{
              display: 'flex',
              gap: '30px',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 20,
              letterSpacing: '0.1em',
              zIndex: 10,
            }}
          >
            <div>In Stock</div>
            <div>•</div>
            <div>Fast Shipping</div>
            <div>•</div>
            <div>Volume Pricing</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.error(`Error generating product OG image: ${e.message}`);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}

