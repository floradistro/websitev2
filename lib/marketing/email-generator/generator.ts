/**
 * Email Generator Core Class
 * Main logic for generating AI-powered email campaigns
 */

import OpenAI from "openai";
import type { EmailGenerationParams, GeneratedEmail, EmailContent } from "./types";
import { buildEmailPrompt } from "./prompts";
import { buildEmailHTML } from "./templates";
import { stripHTML } from "./utils";

export class EmailGenerator {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate complete email campaign
   */
  async generateCampaign(params: EmailGenerationParams): Promise<GeneratedEmail> {
    // Generate content with AI
    const content = await this.generateContent(params);

    // Build branded HTML
    const html = buildEmailHTML(params, content);

    // Extract plain text
    const plainText = stripHTML(content.body);

    return {
      subject: content.subject,
      preheader: content.preheader,
      html,
      plain_text: plainText,
      metadata: {
        tone: content.tone,
        word_count: plainText.split(" ").length,
        estimated_read_time: `${Math.ceil(plainText.split(" ").length / 200)} min`,
      },
    };
  }

  /**
   * Generate email content using AI
   */
  private async generateContent(params: EmailGenerationParams): Promise<EmailContent> {
    const prompt = buildEmailPrompt(params);

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert cannabis dispensary marketing copywriter.
Create compelling, professional, and compliant email marketing content.

RULES:
- Be professional and friendly
- Keep subject lines under 50 characters
- Make preheader text compelling (under 100 chars)
- Use proper cannabis terminology
- Emphasize quality, safety, and customer experience
- Include a clear call-to-action
- Be compliant with cannabis marketing regulations
- No medical claims
- Always include 21+ age requirement reminder
- Output valid JSON only`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");
    return response as EmailContent;
  }

  /**
   * Generate multiple variants for A/B testing
   */
  async generateVariants(
    params: EmailGenerationParams,
    count: number = 3,
  ): Promise<GeneratedEmail[]> {
    const variants: GeneratedEmail[] = [];

    for (let i = 0; i < count; i++) {
      const variant = await this.generateCampaign({
        ...params,
        additionalContext: `${params.additionalContext || ""} Variant ${i + 1} - Try different approach/tone`,
      });
      variants.push(variant);
    }

    return variants;
  }
}

/**
 * Factory function to create EmailGenerator instance
 */
export function createEmailGenerator(openAIKey?: string): EmailGenerator {
  const apiKey = openAIKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key required");
  }
  return new EmailGenerator(apiKey);
}
