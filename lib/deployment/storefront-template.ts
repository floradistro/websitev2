import fs from "fs";
import path from "path";

import { logger } from "@/lib/logger";
export interface VendorBranding {
  storeName: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  brandColors?: Record<string, string>;
  description?: string;
}

/**
 * Recursively walk a directory and collect all files
 */
function walkDirectory(
  dir: string,
  baseDir: string,
  files: Array<{ path: string; content: string }> = [],
): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      // Skip node_modules and test directories
      if (
        entry.name !== "node_modules" &&
        !entry.name.includes(".test") &&
        !entry.name.includes(".spec")
      ) {
        walkDirectory(fullPath, baseDir, files);
      }
    } else if (entry.isFile()) {
      // Skip test files
      if (!entry.name.includes(".test.") && !entry.name.includes(".spec.")) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          files.push({
            path: relativePath,
            content,
          });
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            logger.error(`Error reading file ${relativePath}:`, error);
          }
        }
      }
    }
  }
}

/**
 * Get all storefront template files that should be pushed to vendor repos
 */
export async function getStorefrontTemplateFiles(): Promise<
  Array<{ path: string; content: string }>
> {
  const files: Array<{ path: string; content: string }> = [];
  const projectRoot = process.cwd();

  // Directories to include in the template
  const directories = [
    "app/(storefront)",
    "components/storefront",
    "lib/storefront", // If exists
  ];

  for (const dir of directories) {
    const fullDirPath = path.join(projectRoot, dir);

    // Check if directory exists before walking
    if (fs.existsSync(fullDirPath)) {
      walkDirectory(fullDirPath, projectRoot, files);
    } else {
    }
  }

  return files;
}

/**
 * Rebrand storefront files with vendor's information
 */
export function rebrandStorefrontFiles(
  files: Array<{ path: string; content: string }>,
  branding: VendorBranding,
): Array<{ path: string; content: string }> {
  return files.map((file) => {
    let content = file.content;

    // Replace Flora Distro with vendor's store name
    content = content.replace(/Flora Distro/g, branding.storeName);
    content = content.replace(/flora-distro/g, branding.slug);
    content = content.replace(/floradistro/g, branding.slug.replace(/-/g, ""));

    // Replace logo URLs if vendor has one
    if (branding.logoUrl) {
      content = content.replace(/\/yacht-club-logo\.png/g, branding.logoUrl);
    }

    // Replace colors if vendor has brand colors
    if (branding.brandColors) {
      // Example: Replace primary color
      if (branding.brandColors.primary) {
        content = content.replace(
          /#10b981/gi, // Flora Distro's green
          branding.brandColors.primary,
        );
      }
    }

    // Replace meta descriptions
    if (branding.description) {
      content = content.replace(/Premium cannabis products/g, branding.description);
    }

    return {
      path: file.path,
      content,
    };
  });
}

/**
 * Create essential config files for the vendor's repo
 */
export function createVendorConfigFiles(
  branding: VendorBranding,
  vendorId: string,
): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];

  // Create .env.local.example
  files.push({
    path: ".env.local.example",
    content: `# WhaleTools API Configuration
NEXT_PUBLIC_WHALETOOLS_VENDOR_ID=${vendorId}
NEXT_PUBLIC_WHALETOOLS_API_URL=https://whaletools.dev/api

# Site Configuration
NEXT_PUBLIC_SITE_NAME="${branding.storeName}"
NEXT_PUBLIC_SITE_URL=https://${branding.slug}.com

# Add your own environment variables below
`,
  });

  // Create README.md
  files.push({
    path: "README.md",
    content: `# ${branding.storeName} Storefront

This is your custom cannabis storefront powered by WhaleTools.

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Copy \`.env.local.example\` to \`.env.local\`:
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This storefront is ready to deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/${branding.slug}-storefront)

## Customization

- Edit pages in \`app/(storefront)/storefront/\`
- Customize components in \`components/storefront/\`
- Update branding in your WhaleTools dashboard

## Support

Visit [WhaleTools Documentation](https://docs.whaletools.vip) or contact support@whaletools.vip
`,
  });

  // Create package.json
  files.push({
    path: "package.json",
    content: JSON.stringify(
      {
        name: `${branding.slug}-storefront`,
        version: "1.0.0",
        description: `${branding.storeName} - Cannabis Storefront`,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint",
        },
        dependencies: {
          next: "^15.0.0",
          react: "^18.3.0",
          "react-dom": "^18.3.0",
          axios: "^1.6.0",
          "lucide-react": "^0.400.0",
          "framer-motion": "^11.0.0",
        },
        devDependencies: {
          "@types/node": "^20",
          "@types/react": "^18",
          "@types/react-dom": "^18",
          typescript: "^5",
          postcss: "^8",
          tailwindcss: "^3.4.0",
        },
      },
      null,
      2,
    ),
  });

  // Create next.config.js
  files.push({
    path: "next.config.js",
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['uaednwpxursknmwdeejn.supabase.co', 'whaletools.dev'],
  },
};

module.exports = nextConfig;
`,
  });

  // Create tsconfig.json
  files.push({
    path: "tsconfig.json",
    content: JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [
            {
              name: "next",
            },
          ],
          paths: {
            "@/*": ["./*"],
          },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2,
    ),
  });

  // Create tailwind.config.ts
  files.push({
    path: "tailwind.config.ts",
    content: `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '${branding.primaryColor || "#10b981"}',
        secondary: '${branding.secondaryColor || "#3b82f6"}',
      },
    },
  },
  plugins: [],
};

export default config;
`,
  });

  // Create .gitignore
  files.push({
    path: ".gitignore",
    content: `# Dependencies
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
`,
  });

  return files;
}
