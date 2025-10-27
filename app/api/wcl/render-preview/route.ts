/**
 * WCL Preview Renderer
 * Compiles WCL and returns renderable HTML (server-side)
 */

import { NextRequest, NextResponse } from 'next/server';
import { WCLCompiler } from '@/lib/wcl/compiler';

export async function POST(request: NextRequest) {
  try {
    const { wclCode, quantumState = 'auto' } = await request.json();
    
    if (!wclCode) {
      return NextResponse.json({ error: 'No WCL code provided' }, { status: 400 });
    }

    console.log('🎨 Rendering WCL preview with real data...');

    // Compile WCL
    const compiler = new WCLCompiler();
    const compiled = compiler.compile(wclCode);

    // Extract ALL props from WCL
    const props: Record<string, string> = {};
    const propsSection = wclCode.match(/props\s*{([^}]+)}/);
    if (propsSection) {
      const propLines = propsSection[1].split('\n');
      propLines.forEach(line => {
        const match = line.match(/(\w+):\s*String\s*=\s*"([^"]+)"/);
        if (match) {
          props[match[1]] = match[2];
        }
      });
    }

    // Extract and execute data fetching
    const dataVariables: Record<string, any> = {};
    const dataSection = wclCode.match(/data\s*{([^}]+)}/);
    
    if (dataSection) {
      console.log('📦 Found data section, fetching real data...');
      const dataContent = dataSection[1];
      
      // Parse fetch calls: varName = fetch("url") @cache(5m)
      const fetchPattern = /(\w+)\s*=\s*fetch\("([^"]+)"\)/g;
      let match;
      
      while ((match = fetchPattern.exec(dataContent)) !== null) {
        const [, varName, url] = match;
        console.log(`🔍 Fetching ${varName} from ${url}`);
        
        try {
          // Make actual API call from server-side
          const apiUrl = `${request.nextUrl.origin}${url}`;
          const response = await fetch(apiUrl);
          const data = await response.json();
          
          // Handle different API response formats
          if (data.products) {
            dataVariables[varName] = data.products;
          } else if (data.testimonials) {
            dataVariables[varName] = data.testimonials;
          } else if (Array.isArray(data)) {
            dataVariables[varName] = data;
          } else {
            dataVariables[varName] = data;
          }
          
          console.log(`✅ Fetched ${dataVariables[varName]?.length || 0} items for ${varName}`);
        } catch (err) {
          console.error(`❌ Failed to fetch ${varName}:`, err);
          dataVariables[varName] = [];
        }
      }
    }

    // Extract render content (handle both quantum and simple render)
    let htmlContent = '';
    
    // Check for quantum states
    const firstVisitMatch = wclCode.match(/state\s+FirstVisit\s+when[^{]*{([\s\S]*?)(?=\n\s*state\s+\w+|}\s*}\s*}\s*})/);
    const returningMatch = wclCode.match(/state\s+Returning\s+when[^{]*{([\s\S]*?)(?=\n\s*}\s*}\s*})/);
    
    if (firstVisitMatch || returningMatch) {
      // Has quantum states
      const stateContent = quantumState === 'first-visit' || quantumState === 'auto' 
        ? firstVisitMatch?.[1] || ''
        : returningMatch?.[1] || '';
      htmlContent = stateContent;
    } else {
      // Simple render
      const renderMatch = wclCode.match(/render\s*{([\s\S]*?)}\s*}$/);
      if (renderMatch) {
        htmlContent = renderMatch[1];
      }
    }

    // Convert JSX to HTML
    htmlContent = htmlContent
      .replace(/className=/g, 'class=')
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove all comments
      .trim();
    
    // Render data variables (products.map, etc.)
    Object.keys(dataVariables).forEach(varName => {
      let items = dataVariables[varName];
      
      if (!Array.isArray(items) || items.length === 0) {
        console.log(`⚠️ No data for ${varName}, skipping render`);
        return;
      }
      
      console.log(`🎨 Rendering ${items.length} items for ${varName}`);
      
      // Handle filter operations: {varName.filter(x => x.category === "flower").map(...)}
      const filterMapPattern = new RegExp(
        `\\{${varName}\\.filter\\(\\s*(\\w+)\\s*=>\\s*\\1\\.(\\w+)\\s*===\\s*"([^"]+)"\\)\\.map\\(\\s*(\\w+)\\s*=>\\s*\\(([\\s\\S]*?)\\)\\s*\\)\\}`,
        'g'
      );
      
      htmlContent = htmlContent.replace(filterMapPattern, (match, filterVar, filterProp, filterValue, itemVar, template) => {
        console.log(`🔍 Filtering ${varName} where ${filterProp} === "${filterValue}"`);
        
        // Filter items
        const filteredItems = items.filter((item: any) => {
          const value = item[filterProp];
          return value && value.toString().toLowerCase() === filterValue.toLowerCase();
        });
        
        console.log(`✅ Filtered to ${filteredItems.length} items`);
        
        // Render filtered items
        return renderItems(filteredItems, itemVar, template);
      });
      
      // Find map expressions: {varName.map(x => ...)}
      const mapPattern = new RegExp(`\\{${varName}\\.map\\(\\s*(\\w+)\\s*=>\\s*\\(([\\s\\S]*?)\\)\\s*\\)\\}`, 'g');
      
      htmlContent = htmlContent.replace(mapPattern, (match, itemVar, template) => {
        return renderItems(items, itemVar, template);
      });
    });
    
    // Helper function to render items
    function renderItems(items: any[], itemVar: string, template: string): string {
      const renderedItems = items.map((item: any) => {
        let itemHtml = template;
        
        // Replace item.property references
        itemHtml = itemHtml.replace(new RegExp(`\\{${itemVar}\\.(\\w+)\\}`, 'g'), (_, prop) => {
          return item[prop] || '';
        });
        
        // Handle blueprint_fields.find() - e.g., {p.blueprint_fields.find(f => f.label === "THC Content")?.value}
        itemHtml = itemHtml.replace(
          new RegExp(`\\{${itemVar}\\.blueprint_fields\\.find\\(\\s*\\w+\\s*=>\\s*\\w+\\.label\\s*===\\s*"([^"]+)"\\)\\?\\.value\\}`, 'g'),
          (_, label) => {
            if (item.blueprint_fields && Array.isArray(item.blueprint_fields)) {
              const field = item.blueprint_fields.find((f: any) => f.label === label);
              return field?.value || '';
            }
            return '';
          }
        );
        
        // Handle blueprint_fields.map() - e.g., {p.blueprint_fields.map(field => ...)}
        const blueprintMapPattern = new RegExp(
          `\\{${itemVar}\\.blueprint_fields\\.map\\(\\s*(\\w+)\\s*=>\\s*\\(([\\s\\S]*?)\\)\\s*\\)\\}`,
          'g'
        );
        itemHtml = itemHtml.replace(blueprintMapPattern, (_, fieldVar, fieldTemplate) => {
          if (item.blueprint_fields && Array.isArray(item.blueprint_fields)) {
            return item.blueprint_fields.map((field: any) => {
              let fieldHtml = fieldTemplate;
              fieldHtml = fieldHtml.replace(new RegExp(`\\{${fieldVar}\\.(\\w+)\\}`, 'g'), (__, prop) => {
                return field[prop] || '';
              });
              return fieldHtml;
            }).join('\n');
          }
          return '';
        });
        
        // Replace key={item.id}
        itemHtml = itemHtml.replace(new RegExp(`key=\\{${itemVar}\\.id\\}`, 'g'), `key="${item.id}"`);
        
        // Replace src={item.prop}
        itemHtml = itemHtml.replace(new RegExp(`src=\\{${itemVar}\\.(\\w+)\\}`, 'g'), (_, prop) => {
          return `src="${item[prop] || ''}"`;
        });
        
        // Replace alt={item.prop}
        itemHtml = itemHtml.replace(new RegExp(`alt=\\{${itemVar}\\.(\\w+)\\}`, 'g'), (_, prop) => {
          return `alt="${item[prop] || ''}"`;
        });
        
        // Handle conditional rendering: {item.property && <span>...</span>}
        itemHtml = itemHtml.replace(
          new RegExp(`\\{${itemVar}\\.(\\w+)\\s*&&\\s*<([^>]+)>([^<]*)</\\2>\\}`, 'g'),
          (match, prop, tag, content) => {
            if (item[prop]) {
              return `<${tag}>${content}</${tag}>`;
            }
            return '';
          }
        );
        
        return itemHtml;
      });
      
      return renderedItems.join('\n');
    }
    
    // Replace prop references with elegant placeholders
    Object.keys(props).forEach(propName => {
      const value = props[propName];
      const placeholder = `<span style="color: rgba(255,255,255,0.15); font-style: italic;">${propName}</span>`;
      
      // If prop has value, use it; otherwise show elegant placeholder
      const regex = new RegExp(`\\{${propName}(?:\\s*\\|\\|\\s*"[^"]*")?\\}`, 'g');
      htmlContent = htmlContent.replace(regex, value || placeholder);
    });
    
    // Also handle the || "fallback" syntax
    htmlContent = htmlContent.replace(/\{(\w+)\s*\|\|\s*"([^"]+)"\}/g, (match, propName, fallback) => {
      const value = props[propName];
      if (value) return value;
      return `<span style="color: rgba(255,255,255,0.15); font-style: italic;">${fallback}</span>`;
    });

    // Generate full preview HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  animation: {
                    'glow': 'glow 2s ease-in-out infinite',
                    'float': 'float 3s ease-in-out infinite',
                    'shimmer': 'shimmer 2s linear infinite'
                  },
                  keyframes: {
                    glow: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
                    float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-20px)' } },
                    shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } }
                  }
                }
              }
            }
          </script>
          <style>
            body { margin: 0; background: #000; }
            @keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
            .animate-gradient { background-size: 200% 200%; animation: gradient 3s ease infinite; }
          </style>
        </head>
        <body>
          ${htmlContent || `<div class="min-h-screen flex items-center justify-center bg-black"><p class="text-white/40 text-sm">Preview loading...</p></div>`}
          
          <script>
            // Make clickable
            document.addEventListener('click', (e) => {
              const target = e.target;
              let elementType = 'unknown';
              
              if (target.tagName === 'H1' || target.tagName === 'H2') elementType = 'heading';
              else if (target.tagName === 'BUTTON') elementType = 'button';
              else if (target.tagName === 'P') elementType = 'text';
              
              if (window.parent !== window) {
                window.parent.postMessage({
                  type: 'ELEMENT_CLICKED',
                  payload: { elementType, tagName: target.tagName }
                }, '*');
              }
              
              e.preventDefault();
            }, true);
            
            // Hover effect
            const style = document.createElement('style');
            style.textContent = '*:hover { outline: 2px solid rgba(168, 85, 247, 0.4) !important; outline-offset: 2px; cursor: pointer; }';
            document.head.appendChild(style);
          </script>
        </body>
      </html>
    `;

    return NextResponse.json({ success: true, html });

  } catch (error: any) {
    console.error('Preview render error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

