# AI Storefront Agent for WhaleTools

AI-powered storefront generator that converts natural language vendor requests into fully functional Next.js e-commerce sites on the WhaleTools platform.

## Quick Start

### Installation

```bash
cd ai-agent
npm install
```

### Environment Setup

Create `.env` file:

```env
# AI Providers (choose one)
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key

# WhaleTools Platform
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_TEAM_ID=your_team_id (optional)

# GitHub (optional - for repo creation)
GITHUB_TOKEN=your_github_token
```

### Usage

```typescript
import { AIStorefrontAgent } from './src/index';

const agent = new AIStorefrontAgent();

// Generate storefront
const result = await agent.generate({
  vendorId: 'vendor-uuid',
  vendorSlug: 'luxury-cannabis-co',
  userMessage: 'I want a luxury boutique with gold accents',
});

// Deploy to Vercel
const deployment = await agent.deploy({
  vendorId: 'vendor-uuid',
  vendorSlug: 'luxury-cannabis-co',
  requirements: result.requirements!,
  domain: 'luxurycannabisco.com', // optional
});
```

## Project Structure

```
ai-agent/
├── src/
│   ├── nlp/
│   │   ├── processor.ts      # Natural language processing
│   │   └── schemas.ts         # Zod validation schemas
│   ├── generator/
│   │   ├── engine.ts          # Code generation engine
│   │   └── components.ts      # Component generation
│   ├── deployment/
│   │   ├── vercel.ts          # Vercel deployment
│   │   └── github.ts          # GitHub integration
│   └── index.ts               # Main orchestrator
├── templates/
│   ├── minimalist/            # Minimalist template
│   ├── luxury/                # Luxury template
│   └── modern/                # Modern template
├── generated/                 # Output directory
└── tests/                     # Unit tests
```

## Architecture

### 1. NLP Processor
- Converts vendor descriptions to structured specs
- Uses Claude 3.5 Sonnet or GPT-4
- Validates output with Zod schemas

### 2. Code Generator
- Selects base template (minimalist/luxury/modern)
- Applies customizations (colors, fonts, layout)
- Generates Next.js app with TypeScript
- Integrates Supabase for vendor data

### 3. Deployment Pipeline
- Deploys to Vercel
- Configures custom domains
- Sets up SSL automatically

## API Integration

Add to your WhaleTools platform:

```typescript
// app/api/ai-agent/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AIStorefrontAgent } from '@/ai-agent/src/index';

export async function POST(request: NextRequest) {
  const vendorId = request.headers.get('x-vendor-id');
  const { message, history } = await request.json();

  const agent = new AIStorefrontAgent();
  const result = await agent.generate({
    vendorId: vendorId!,
    vendorSlug: 'vendor-slug', // Get from DB
    userMessage: message,
    conversationHistory: history,
  });

  return NextResponse.json(result);
}
```

## Testing

```bash
npm test
```

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Run built version
npm start
```

## Templates

### Minimalist
- Clean, spacious design
- Black & white color scheme
- Inter font family
- 3-column product grid

### Luxury
- Sophisticated, high-end feel
- Gold accents on black
- Playfair Display + Lato fonts
- Large hero images

### Modern
- Bold, geometric layouts
- Vibrant accent colors
- Poppins font family
- Asymmetric grids

## Contributing

1. Create new templates in `templates/`
2. Add template metadata in `config.json`
3. Update NLP processor to recognize new styles
4. Test with various vendor descriptions

## License

Proprietary - WhaleTools Internal Use Only

