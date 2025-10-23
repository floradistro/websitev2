/**
 * AI Storefront Agent - Main Entry Point
 * Coordinates NLP processing, code generation, and deployment
 */

import { NLPProcessor } from './nlp/processor';
import { StorefrontGenerator } from './generator/engine';
import { VercelDeployment } from './deployment/vercel';
import { StoreRequirements } from './nlp/schemas';
import * as path from 'path';

export interface GenerateRequest {
  vendorId: string;
  vendorSlug: string;
  userMessage: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface GenerateResponse {
  success: boolean;
  requirements?: StoreRequirements;
  response?: string;
  confidence?: number;
  outputPath?: string;
  files?: string[];
  error?: string;
}

export interface DeployRequest {
  vendorId: string;
  vendorSlug: string;
  requirements: StoreRequirements;
  domain?: string;
}

export interface DeployResponse {
  success: boolean;
  deploymentUrl?: string;
  deploymentId?: string;
  error?: string;
}

export class AIStorefrontAgent {
  private nlpProcessor: NLPProcessor;
  private generator: StorefrontGenerator;
  private deployment: VercelDeployment;

  constructor() {
    this.nlpProcessor = new NLPProcessor('anthropic'); // or 'openai'
    
    const templatesDir = path.join(__dirname, '../templates');
    const outputDir = path.join(__dirname, '../../generated');
    this.generator = new StorefrontGenerator(templatesDir, outputDir);

    this.deployment = new VercelDeployment(
      process.env.VERCEL_TOKEN!,
      process.env.VERCEL_TEAM_ID
    );
  }

  /**
   * Generate storefront from natural language
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      console.log(`🔵 Processing request for vendor: ${request.vendorSlug}`);

      // 1. Parse natural language into requirements
      const { requirements, response, confidence } = await this.nlpProcessor.processVendorRequest(
        request.userMessage,
        request.conversationHistory
      );

      console.log(`✅ Requirements extracted (confidence: ${confidence})`);

      // 2. Generate code
      const { outputPath, files } = await this.generator.generateStorefront(
        request.vendorId,
        request.vendorSlug,
        requirements
      );

      console.log(`✅ Generated ${files.length} files at ${outputPath}`);

      return {
        success: true,
        requirements,
        response,
        confidence,
        outputPath,
        files,
      };
    } catch (error: any) {
      console.error('❌ Generation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Deploy generated storefront to Vercel
   */
  async deploy(request: DeployRequest): Promise<DeployResponse> {
    try {
      console.log(`🔵 Deploying storefront for: ${request.vendorSlug}`);

      // 1. Generate code first
      const outputDir = path.join(__dirname, '../../generated');
      const projectPath = path.join(outputDir, `storefront-${request.vendorSlug}`);

      // 2. Deploy to Vercel
      const result = await this.deployment.deploy({
        vendorId: request.vendorId,
        vendorSlug: request.vendorSlug,
        projectPath,
        domain: request.domain,
      });

      return {
        success: true,
        deploymentUrl: result.deploymentUrl,
        deploymentId: result.deploymentId,
      };
    } catch (error: any) {
      console.error('❌ Deployment failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update existing storefront
   */
  async update(request: GenerateRequest & { deploymentId: string }): Promise<GenerateResponse> {
    // Similar to generate, but updates existing deployment
    return this.generate(request);
  }
}

// Export for use in Next.js API routes
export default AIStorefrontAgent;

