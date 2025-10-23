import * as fs from 'fs/promises';
import * as path from 'path';
import Handlebars from 'handlebars';
import { StoreRequirements } from '../nlp/schemas';

/**
 * Code Generation Engine - Generates Next.js storefront code from specifications
 */

export class StorefrontGenerator {
  private templatesDir: string;
  private outputDir: string;

  constructor(templatesDir: string, outputDir: string) {
    this.templatesDir = templatesDir;
    this.outputDir = outputDir;
  }

  /**
   * Generate complete storefront from requirements
   */
  async generateStorefront(
    vendorId: string,
    vendorSlug: string,
    requirements: StoreRequirements
  ): Promise<{
    outputPath: string;
    files: string[];
  }> {
    console.log(`🔵 Generating storefront for vendor: ${vendorSlug}`);

    const projectPath = path.join(this.outputDir, `storefront-${vendorSlug}`);

    // 1. Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // 2. Select base template
    const templatePath = path.join(this.templatesDir, requirements.theme.style);

    // 3. Copy template files
    await this.copyTemplate(templatePath, projectPath);

    // 4. Apply customizations
    await this.applyCustomizations(projectPath, vendorId, requirements);

    // 5. Generate config files
    await this.generateConfigFiles(projectPath, vendorId, vendorSlug, requirements);

    // 6. Get list of generated files
    const files = await this.getFileList(projectPath);

    console.log(`✅ Generated ${files.length} files for ${vendorSlug}`);

    return {
      outputPath: projectPath,
      files,
    };
  }

  /**
   * Copy template directory recursively
   */
  private async copyTemplate(src: string, dest: string): Promise<void> {
    const entries = await fs.readdir(src, { withFileTypes: true });

    await fs.mkdir(dest, { recursive: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyTemplate(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Apply customizations to template files
   */
  private async applyCustomizations(
    projectPath: string,
    vendorId: string,
    requirements: StoreRequirements
  ): Promise<void> {
    // Customize globals.css with brand colors
    const cssPath = path.join(projectPath, 'app', 'globals.css');
    let css = await fs.readFile(cssPath, 'utf-8');

    css = css.replace(/--primary: .+;/, `--primary: ${requirements.theme.colors.primary};`);
    css = css.replace(/--secondary: .+;/, `--secondary: ${requirements.theme.colors.secondary};`);
    css = css.replace(/--accent: .+;/, `--accent: ${requirements.theme.colors.accent};`);
    css = css.replace(/--background: .+;/, `--background: ${requirements.theme.colors.background};`);
    css = css.replace(/--text: .+;/, `--text: ${requirements.theme.colors.text};`);

    // Add Google Fonts import
    const fontImport = `@import url('https://fonts.googleapis.com/css2?family=${requirements.theme.typography.headingFont.replace(' ', '+')}:wght@300;400;500;600;700&family=${requirements.theme.typography.bodyFont.replace(' ', '+')}:wght@300;400;500;600&display=swap');\n\n`;
    css = fontImport + css;

    await fs.writeFile(cssPath, css);

    // Update layout.tsx with vendor ID
    const layoutPath = path.join(projectPath, 'app', 'layout.tsx');
    let layout = await fs.readFile(layoutPath, 'utf-8');
    layout = layout.replace('VENDOR_ID_PLACEHOLDER', vendorId);
    await fs.writeFile(layoutPath, layout);
  }

  /**
   * Generate configuration files
   */
  private async generateConfigFiles(
    projectPath: string,
    vendorId: string,
    vendorSlug: string,
    requirements: StoreRequirements
  ): Promise<void> {
    // package.json
    const packageJson = {
      name: `storefront-${vendorSlug}`,
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        '@supabase/supabase-js': '^2.39.0',
      },
      devDependencies: {
        '@types/node': '^20',
        '@types/react': '^18',
        '@types/react-dom': '^18',
        typescript: '^5',
        eslint: '^8',
        'eslint-config-next': '^14',
        tailwindcss: '^3',
        postcss: '^8',
        autoprefixer: '^10',
      },
    };

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // .env.local
    const envLocal = `# Yacht Club Platform
NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
NEXT_PUBLIC_VENDOR_ID=${vendorId}
NEXT_PUBLIC_VENDOR_SLUG=${vendorSlug}
`;

    await fs.writeFile(path.join(projectPath, '.env.local'), envLocal);

    // next.config.ts
    const nextConfig = `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
`;

    await fs.writeFile(path.join(projectPath, 'next.config.ts'), nextConfig);

    // vercel.json
    const vercelJson = {
      buildCommand: 'npm run build',
      devCommand: 'npm run dev',
      installCommand: 'npm install',
      framework: 'nextjs',
      env: {
        NEXT_PUBLIC_VENDOR_ID: vendorId,
      },
    };

    await fs.writeFile(
      path.join(projectPath, 'vercel.json'),
      JSON.stringify(vercelJson, null, 2)
    );

    // Store requirements for future reference
    await fs.writeFile(
      path.join(projectPath, 'storefront.config.json'),
      JSON.stringify(requirements, null, 2)
    );
  }

  /**
   * Get list of all generated files
   */
  private async getFileList(dir: string, fileList: string[] = []): Promise<string[]> {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        if (!['node_modules', '.next', '.git'].includes(file.name)) {
          await this.getFileList(filePath, fileList);
        }
      } else {
        fileList.push(filePath);
      }
    }

    return fileList;
  }
}

