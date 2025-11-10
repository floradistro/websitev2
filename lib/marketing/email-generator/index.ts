/**
 * Email Generator - Main Exports
 * AI-powered email template generator for cannabis dispensaries
 */

// Export types
export type { EmailGenerationParams, GeneratedEmail, EmailContent } from "./types";

// Export main class and factory
export { EmailGenerator, createEmailGenerator } from "./generator";

// Export utilities (if needed by consumers)
export { stripHTML } from "./utils";
export { buildEmailPrompt } from "./prompts";
export { buildEmailHTML } from "./templates";
