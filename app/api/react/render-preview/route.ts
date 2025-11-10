/**
 * React Preview Renderer
 * Returns HTML with embedded React component code
 */

import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
export async function POST(request: NextRequest) {
  try {
    const { code, props = {} } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    // Strip export statements and wrap code
    const cleanCode = code.replace(/export\s+default\s+/g, "").trim();

    // Generate full preview HTML with React code embedded
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; background: #000; min-height: 100vh; }
            #root { min-height: 100vh; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          
          <script type="text/babel">
            const { useState, useEffect, useCallback, useRef } = React;
            
            // Component props
            const componentProps = ${JSON.stringify(props)};
            
            // User's component code (export removed)
            ${cleanCode}
            
            // Render the component
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(Component, componentProps));
          </script>
          
          <script>
            // Hover effect
            const style = document.createElement('style');
            style.textContent = '*:hover { outline: 2px solid rgba(168, 85, 247, 0.4) !important; outline-offset: 2px; cursor: pointer; }';
            document.head.appendChild(style);
            
            // Click handler
            document.addEventListener('click', (e) => {
              const target = e.target;
              if (window.parent !== window) {
                window.parent.postMessage({
                  type: 'ELEMENT_CLICKED',
                  payload: { 
                    tagName: target.tagName,
                    className: target.className,
                    textContent: target.textContent?.substring(0, 100)
                  }
                }, '*');
              }
              e.preventDefault();
            }, true);
          </script>
        </body>
      </html>
    `;

    return NextResponse.json({ success: true, html: fullHtml });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Preview render error:", error);
    }
    return NextResponse.json(
      {
        error: error.message,
        details: error.stack,
      },
      { status: 500 },
    );
  }
}
