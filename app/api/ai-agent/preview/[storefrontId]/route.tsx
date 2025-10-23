import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * Generate live preview HTML that executes AI-generated code
 * GET /api/ai-agent/preview/[storefrontId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storefrontId: string }> }
) {
  try {
    const { storefrontId } = await params;
    
    const supabase = getServiceSupabase();
    
    // Get storefront
    const { data: storefront } = await supabase
      .from('vendor_storefronts')
      .select('vendor_id')
      .eq('id', storefrontId)
      .single();
    
    if (!storefront) {
      return new NextResponse('<h1>Storefront not found</h1>', { 
        headers: { 'Content-Type': 'text/html' } 
      });
    }
    
    // Get all AI-generated files
    const { data: fileRecords } = await supabase
      .from('storefront_files')
      .select('file_path, file_content, version')
      .eq('storefront_id', storefrontId)
      .order('created_at', { ascending: false });
    
    // Get latest version of each file
    const files: Record<string, string> = {};
    const seen = new Set();
    
    for (const file of fileRecords || []) {
      if (!seen.has(file.file_path)) {
        files[file.file_path] = file.file_content;
        seen.add(file.file_path);
      }
    }
    
    // Get vendor data
    const { data: vendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', storefront.vendor_id)
      .single();
    
    // Get products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', storefront.vendor_id)
      .eq('status', 'published')
      .limit(20);
    
    // Build preview HTML
    const html = buildPreviewHTML(files, vendor, products || []);
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error: any) {
    console.error('❌ Preview error:', error);
    return new NextResponse(`<h1>Error: ${error.message}</h1>`, {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    });
  }
}

function buildPreviewHTML(
  files: Record<string, string>,
  vendor: any,
  products: any[]
): string {
  // If no files yet, show placeholder
  if (Object.keys(files).length === 0) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
  <div class="text-center">
    <div class="text-6xl mb-4">🤖</div>
    <h1 class="text-3xl font-bold text-gray-800 mb-2">No Code Generated Yet</h1>
    <p class="text-gray-600">Start chatting with the AI to build your storefront!</p>
  </div>
</body>
</html>`;
  }
  
  // Extract CSS
  const css = files['app/globals.css'] || files['styles/globals.css'] || '';
  
  // Build HTML that renders AI code
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${vendor.store_name} - AI Generated</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <style>
    ${css}
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  
  <script type="module">
    // Vendor data
    const vendor = ${JSON.stringify(vendor)};
    const products = ${JSON.stringify(products)};
    
    // Helper to create elements
    function h(tag, props, ...children) {
      const el = document.createElement(tag);
      
      if (props) {
        Object.entries(props).forEach(([key, value]) => {
          if (key === 'className') {
            el.className = value;
          } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
          } else if (key.startsWith('on')) {
            el.addEventListener(key.substring(2).toLowerCase(), value);
          } else {
            el.setAttribute(key, value);
          }
        });
      }
      
      children.flat().forEach(child => {
        if (typeof child === 'string') {
          el.appendChild(document.createTextNode(child));
        } else if (child) {
          el.appendChild(child);
        }
      });
      
      return el;
    }
    
    // Render the storefront
    function render() {
      const app = document.getElementById('app');
      
      // Header
      const header = h('header', { className: 'border-b border-gray-200 py-6 bg-white' },
        h('div', { className: 'container mx-auto px-4 flex items-center justify-between' },
          vendor.logo_url
            ? h('img', { src: vendor.logo_url, alt: vendor.store_name, className: 'h-12' })
            : h('h1', { className: 'text-3xl font-bold' }, vendor.store_name),
          h('nav', { className: 'flex gap-8' },
            h('a', { href: '#', className: 'hover:opacity-70 transition uppercase text-sm tracking-wider' }, 'Shop'),
            h('a', { href: '#', className: 'hover:opacity-70 transition uppercase text-sm tracking-wider' }, 'About'),
            h('a', { href: '#', className: 'hover:opacity-70 transition uppercase text-sm tracking-wider' }, 'Contact')
          )
        )
      );
      
      // Hero
      const hero = h('div', { className: 'py-20 text-center', style: { background: 'linear-gradient(to bottom right, #7c3aed, #1a1a1a)' } },
        h('div', { className: 'container mx-auto px-4' },
          h('h2', { className: 'text-7xl font-bold text-white mb-4' }, vendor.store_name),
          h('p', { className: 'text-2xl text-white/80' }, vendor.store_tagline || 'Premium Cannabis Products')
        )
      );
      
      // Products
      const productsSection = h('div', { className: 'container mx-auto px-4 py-16' },
        h('h3', { className: 'text-3xl font-light mb-12 uppercase tracking-wider' }, 'Featured Products'),
        h('div', { className: 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8' },
          ...products.map(product => 
            h('div', { className: 'group cursor-pointer' },
              h('div', { className: 'aspect-square bg-gray-100 mb-4 overflow-hidden rounded' },
                product.featured_image
                  ? h('img', { 
                      src: product.featured_image, 
                      alt: product.name,
                      className: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                    })
                  : h('div', { className: 'w-full h-full flex items-center justify-center text-gray-400' }, 'No image')
              ),
              h('h4', { className: 'font-medium mb-2' }, product.name),
              h('p', { className: 'text-xl font-bold' }, 
                '$' + ((product.price || product.regular_price || 0).toFixed(2))
              )
            )
          )
        )
      );
      
      // Footer
      const footer = h('footer', { className: 'border-t border-gray-200 py-8 mt-20 bg-gray-50' },
        h('div', { className: 'container mx-auto px-4 text-center text-gray-600 text-sm' },
          '© 2025 ' + vendor.store_name + '. All rights reserved.'
        )
      );
      
      // Assemble page
      app.appendChild(header);
      app.appendChild(hero);
      app.appendChild(productsSection);
      app.appendChild(footer);
    }
    
    // Render on load
    render();
  </script>
</body>
</html>`;
}
