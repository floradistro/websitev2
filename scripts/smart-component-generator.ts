#!/usr/bin/env ts-node

/**
 * Smart Component Generator
 * Automates creation of new smart components with full setup
 * 
 * Usage: npm run generate:smart-component ComponentName
 */

import * as fs from 'fs';
import * as path from 'path';

interface ComponentConfig {
  name: string; // e.g., "SmartNewsletter"
  displayName: string; // e.g., "Smart Newsletter"
  description: string;
  category: 'smart' | 'atomic' | 'composite';
  fetchesData: boolean;
  props: PropDefinition[];
}

interface PropDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: any;
  description?: string;
}

function generateComponentTemplate(config: ComponentConfig): string {
  const propsInterface = config.props.length > 0 
    ? `export interface ${config.name}Props {
  vendorId?: string;
  vendorSlug?: string;
  vendorName?: string;
${config.props.map(prop => `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};`).join('\n')}
  className?: string;
}`
    : `export interface ${config.name}Props {
  vendorId?: string;
  className?: string;
}`;

  const defaultProps = config.props
    .filter(p => p.default !== undefined)
    .map(p => `  ${p.name} = ${JSON.stringify(p.default)},`)
    .join('\n');

  return `"use client";

/**
 * ${config.displayName}
 * ${config.description}
 * 
 * @component Smart Component
 * @category ${config.category}
 * @fetchesData ${config.fetchesData}
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { fadeInUp } from '@/lib/animations';

${propsInterface}

export function ${config.name}({
  vendorId,
${defaultProps}
  className = '',
}: ${config.name}Props) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

${config.fetchesData ? `  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!vendorId) return;
      
      try {
        // TODO: Implement data fetching
        const response = await fetch(\`/api/vendors/\${vendorId}/YOUR_ENDPOINT\`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [vendorId]);

  if (loading) {
    return (
      <div className={\`py-16 sm:py-20 px-4 sm:px-6 \${className}\`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded-2xl w-64 mx-auto mb-4" />
            <div className="h-4 bg-white/5 rounded-xl w-96 mx-auto" />
          </div>
        </div>
      </div>
    );
  }
` : ''}
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={\`py-16 sm:py-20 px-4 sm:px-6 \${className}\`}
    >
      <div className="max-w-7xl mx-auto">
        {/* TODO: Implement component UI */}
        <h2 
          className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-8"
          style={{ fontWeight: 900 }}
        >
          ${config.displayName}
        </h2>
        <p className="text-white/60">Component placeholder - implement your UI here</p>
      </div>
    </motion.div>
  );
}
`;
}

function generatePropsSchema(props: PropDefinition[]): object {
  const schema: any = {};
  
  props.forEach(prop => {
    schema[prop.name] = {
      type: prop.type,
      required: prop.required,
      ...(prop.default !== undefined && { default: prop.default }),
      ...(prop.description && { description: prop.description })
    };
  });
  
  return schema;
}

function generateSQLRegistration(config: ComponentConfig): string {
  const propsSchema = generatePropsSchema(config.props);
  const componentKey = config.name
    .replace(/^Smart/, '')
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .substring(1);
  
  return `-- Register ${config.name} in component_templates
INSERT INTO component_templates (
  component_key,
  name,
  category,
  description,
  props_schema,
  fetches_real_data,
  tags
)
VALUES (
  'smart_${componentKey}',
  '${config.displayName}',
  '${config.category}',
  '${config.description}',
  '${JSON.stringify(propsSchema, null, 2)}'::jsonb,
  ${config.fetchesData},
  '["smart", "${componentKey}"]'::jsonb
)
ON CONFLICT (component_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  props_schema = EXCLUDED.props_schema
RETURNING component_key, name;`;
}

function updateIndexFile(componentName: string): void {
  const indexPath = path.join(process.cwd(), 'components/component-registry/smart/index.ts');
  let content = fs.readFileSync(indexPath, 'utf-8');
  
  const exportLine = `export { ${componentName} } from './${componentName}';`;
  
  if (!content.includes(exportLine)) {
    content += `\n${exportLine}`;
    fs.writeFileSync(indexPath, content);
    console.log(`✅ Updated index.ts with ${componentName}`);
  }
}

function updateRendererFile(componentName: string): void {
  const rendererPath = path.join(process.cwd(), 'lib/component-registry/renderer.tsx');
  let content = fs.readFileSync(rendererPath, 'utf-8');
  
  const componentKey = componentName
    .replace(/^Smart/, '')
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .substring(1);
  
  const mapEntry = `  'smart_${componentKey}': Smart.${componentName},`;
  
  if (!content.includes(mapEntry)) {
    // Find the Smart section in COMPONENT_MAP
    const smartSectionRegex = /(\/\/ Smart[\s\S]*?)(\n  \/\/|};)/;
    content = content.replace(smartSectionRegex, `$1\n${mapEntry}$2`);
    fs.writeFileSync(rendererPath, content);
    console.log(`✅ Updated renderer.tsx with ${componentName}`);
  }
}

async function generateComponent(config: ComponentConfig) {
  const componentsDir = path.join(process.cwd(), 'components/component-registry/smart');
  const componentPath = path.join(componentsDir, `${config.name}.tsx`);
  
  // 1. Generate component file
  if (fs.existsSync(componentPath)) {
    console.log(`⚠️  Component ${config.name} already exists!`);
    return;
  }
  
  const componentCode = generateComponentTemplate(config);
  fs.writeFileSync(componentPath, componentCode);
  console.log(`✅ Created ${config.name}.tsx`);
  
  // 2. Update index.ts
  updateIndexFile(config.name);
  
  // 3. Update renderer.tsx
  updateRendererFile(config.name);
  
  // 4. Generate SQL registration
  const sql = generateSQLRegistration(config);
  const sqlPath = path.join(process.cwd(), 'scripts/sql', `register-${config.name}.sql`);
  fs.mkdirSync(path.dirname(sqlPath), { recursive: true });
  fs.writeFileSync(sqlPath, sql);
  console.log(`✅ Generated SQL registration at scripts/sql/register-${config.name}.sql`);
  
  console.log(`\n🎉 Component ${config.name} generated successfully!`);
  console.log(`\nNext steps:`);
  console.log(`1. Edit the component: components/component-registry/smart/${config.name}.tsx`);
  console.log(`2. Register in database: npm run db:register ${config.name}`);
  console.log(`3. Add to a page section in Supabase vendor_component_instances\n`);
}

// Example usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🚀 Smart Component Generator

Usage: npm run generate:smart-component

This will prompt you for component details and generate:
- Component file with TypeScript
- Props interface
- Database registration SQL
- Auto-update index.ts and renderer.tsx

Example component names:
- SmartNewsletter
- SmartPricing
- SmartTeam
- SmartGallery
    `);
    process.exit(0);
  }

  // Example configuration
  const exampleConfig: ComponentConfig = {
    name: 'SmartNewsletter',
    displayName: 'Smart Newsletter',
    description: 'Email newsletter signup with validation and API integration',
    category: 'smart',
    fetchesData: false,
    props: [
      {
        name: 'headline',
        type: 'string',
        required: false,
        default: 'STAY UPDATED',
        description: 'Newsletter headline'
      },
      {
        name: 'subheadline',
        type: 'string',
        required: false,
        default: 'Get exclusive deals and product drops',
        description: 'Newsletter subheadline'
      },
      {
        name: 'buttonText',
        type: 'string',
        required: false,
        default: 'SUBSCRIBE',
        description: 'Submit button text'
      }
    ]
  };

  generateComponent(exampleConfig);
}

export { generateComponent, ComponentConfig, PropDefinition };

