import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/vendor/apps/[appId]/preview - Serve live preview HTML
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params
    const supabase = await createClient()

    // Get app files
    const { data: files, error } = await supabase
      .from('app_files')
      .select('filepath, content')
      .eq('app_id', appId)

    if (error || !files) {
      return new NextResponse('App not found', { status: 404 })
    }

    // Find the main page
    const mainPage = files.find(f => f.filepath === 'app/page.tsx')
    const layout = files.find(f => f.filepath === 'app/layout.tsx')

    if (!mainPage) {
      return new NextResponse('No page.tsx found', { status: 404 })
    }

    // Extract the component code
    const pageCode = mainPage.content

    // Create a simple HTML preview
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    ${pageCode.replace(/'use client'/, '').replace(/export default/, 'const Component =')}

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<Component />);
  </script>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error: any) {
    console.error('Preview error:', error)
    return new NextResponse(`Error: ${error.message}`, { status: 500 })
  }
}
