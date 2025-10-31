import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/vendor/apps/[appId]/preview
// Returns a rendered preview of the app
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params
    const supabase = await createClient()

    // Get app details
    const { data: app, error: appError } = await supabase
      .from('vendor_apps')
      .select('*')
      .eq('id', appId)
      .single()

    if (appError || !app) {
      return new NextResponse('App not found', { status: 404 })
    }

    // TODO: Get current working code from GitHub or temp storage
    // For now, return a basic preview based on app type

    const previewHTML = generatePreviewHTML(app)

    return new NextResponse(previewHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error: any) {
    console.error('Error generating preview:', error)
    return new NextResponse('Error generating preview', { status: 500 })
  }
}

function generatePreviewHTML(app: any): string {
  // Generate a basic preview HTML based on app type
  const baseStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      background: white;
      border-radius: 24px;
      padding: 3rem;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 900;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #667eea;
      color: white;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .feature-list {
      list-style: none;
      margin-top: 2rem;
    }
    .feature-list li {
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
      color: #333;
    }
    .feature-list li:before {
      content: "✓";
      display: inline-block;
      width: 1.5rem;
      height: 1.5rem;
      background: #10b981;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 1.5rem;
      margin-right: 0.75rem;
      font-weight: bold;
    }
    .live-indicator {
      position: fixed;
      top: 1rem;
      right: 1rem;
      background: #10b981;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .live-indicator:before {
      content: "";
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `

  const appTypeTemplates: Record<string, { title: string; description: string; features: string[] }> = {
    'storefront': {
      title: 'Your Storefront',
      description: 'A beautiful customer-facing online store with products, shopping cart, and checkout.',
      features: [
        'Browse product catalog',
        'Add items to cart',
        'Secure checkout',
        'Order tracking',
        'Customer accounts'
      ]
    },
    'admin-panel': {
      title: 'Admin Dashboard',
      description: 'Internal management tool for orders, inventory, analytics, and more.',
      features: [
        'Manage orders',
        'Track inventory',
        'View analytics',
        'Manage customers',
        'Staff permissions'
      ]
    },
    'customer-portal': {
      title: 'Customer Portal',
      description: 'Self-service portal for customers to manage their orders and account.',
      features: [
        'View order history',
        'Track loyalty points',
        'Reorder favorites',
        'Submit support tickets',
        'Update profile'
      ]
    },
    'mobile': {
      title: 'Mobile App',
      description: 'Native iOS and Android app built with React Native.',
      features: [
        'Mobile shopping',
        'Push notifications',
        'Biometric authentication',
        'Camera features',
        'Offline mode'
      ]
    },
    'dashboard': {
      title: 'Analytics Dashboard',
      description: 'Data visualization and reporting tool with real-time metrics.',
      features: [
        'Sales charts',
        'KPI tracking',
        'Custom reports',
        'Data export',
        'Real-time metrics'
      ]
    },
    'custom': {
      title: 'Custom Application',
      description: 'A fully customized application built to your specifications.',
      features: [
        'Custom features',
        'Tailored design',
        'Backend integration',
        'Scalable architecture',
        'Full flexibility'
      ]
    }
  }

  const template = appTypeTemplates[app.app_type] || appTypeTemplates['custom']

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${app.name} - Preview</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="live-indicator">
    LIVE PREVIEW
  </div>

  <div class="container">
    <div class="badge">${app.app_type.replace('-', ' ')}</div>
    <h1>${app.name}</h1>
    <p>${app.description || template.description}</p>

    <ul class="feature-list">
      ${template.features.map(feature => `<li>${feature}</li>`).join('\n      ')}
    </ul>

    <p style="margin-top: 2rem; padding: 1rem; background: #f0f9ff; border-radius: 12px; color: #0369a1; font-size: 0.875rem;">
      <strong>💡 Tip:</strong> Tell the AI what you want to build or change, and watch the preview update in real-time!
    </p>
  </div>

  <script>
    // Auto-refresh when parent window signals update
    window.addEventListener('message', (event) => {
      if (event.data === 'refresh-preview') {
        location.reload();
      }
    });
  </script>
</body>
</html>`
}
