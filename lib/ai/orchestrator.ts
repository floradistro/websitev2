/**
 * AI Code Feature V2 - AI Orchestrator
 * Manages conversation loop with Claude AI using WebSocket
 */

import Anthropic from "@anthropic-ai/sdk";
import { sessionManager, Message, ContentBlock } from "./session-manager";
import { executeToolsParallel, formatToolResultsForClaude, ToolResult } from "./tool-executor";
import { withTimeout, retryWithBackoff } from "./utils";

import { logger } from "@/lib/logger";
// Claude API configuration
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
const CLAUDE_MAX_TOKENS = 8000;
const CLAUDE_TIMEOUT = 180000; // 180 seconds (3 min) for Claude responses

// WebSocket message types
export type WSMessageType =
  | "connection_established"
  | "text_delta"
  | "tool_use_start"
  | "tool_use_progress"
  | "tool_use_complete"
  | "message_complete"
  | "error"
  | "thinking";

export interface WSMessage {
  type: WSMessageType;
  data?: any;
  timestamp: number;
}

/**
 * AI Orchestrator Class
 * Manages the conversation loop with Claude AI
 */
export class AIOrchestrator {
  private anthropic: Anthropic;
  private abortController: AbortController | null = null;
  private isProcessing = false;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Send a message and handle the conversation loop
   */
  async sendMessage(
    sessionId: string,
    appId: string,
    vendorId: string,
    userMessage: string,
    sendUpdate: (message: WSMessage) => void,
  ): Promise<void> {
    if (this.isProcessing) {
      throw new Error("Already processing a message");
    }

    this.isProcessing = true;
    this.abortController = new AbortController();

    try {
      // Get or create session
      let session = await sessionManager.getSession(sessionId);

      if (!session) {
        session = await sessionManager.createSession(sessionId, appId, vendorId);
      }

      // Add user message to session
      await sessionManager.addMessage(sessionId, {
        role: "user",
        content: userMessage,
      });

      sendUpdate({
        type: "connection_established",
        data: { sessionId, appId },
        timestamp: Date.now(),
      });

      // Start conversation loop
      await this.conversationLoop(sessionId, appId, vendorId, sendUpdate);

      sendUpdate({
        type: "message_complete",
        timestamp: Date.now(),
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Orchestrator error:", error);
      }
      sendUpdate({
        type: "error",
        data: {
          message: error.message || "An error occurred",
          code: error.code,
        },
        timestamp: Date.now(),
      });

      throw error;
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }

  /**
   * Main conversation loop
   * Handles back-and-forth with Claude including tool use
   */
  private async conversationLoop(
    sessionId: string,
    appId: string,
    vendorId: string,
    sendUpdate: (message: WSMessage) => void,
  ): Promise<void> {
    const maxIterations = 10; // Prevent infinite loops
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      // Check for abort
      if (this.abortController?.signal.aborted) {
        throw new Error("Request cancelled by user");
      }

      // Get conversation history
      const messages = await sessionManager.getConversationHistory(sessionId);

      // Prepare messages for Claude API
      const claudeMessages = this.formatMessagesForClaude(messages);

      // Call Claude API with timeout
      const response = await withTimeout(
        this.callClaude(claudeMessages, sendUpdate),
        CLAUDE_TIMEOUT,
        undefined, // No fallback - let it throw on timeout
      );

      // Save assistant message to session
      await sessionManager.addMessage(sessionId, {
        role: "assistant",
        content: response.content,
      });

      // Extract tool uses
      const toolUses = response.content.filter((block: any) => block.type === "tool_use");

      // If no tools to execute, we're done
      if (toolUses.length === 0) {
        break;
      }

      // Execute tools in parallel
      const toolResults = await executeToolsParallel(
        toolUses.map((t: any) => ({
          id: t.id,
          name: t.name,
          input: t.input,
        })),
        {
          sessionId,
          appId,
          vendorId,
          onProgress: (toolId, status, data) => {
            sendUpdate({
              type: "tool_use_progress",
              data: { toolId, status, data },
              timestamp: Date.now(),
            });
          },
        },
      );

      // Send tool completion update
      sendUpdate({
        type: "tool_use_complete",
        data: { toolResults },
        timestamp: Date.now(),
      });

      // Add tool results as a user message
      const toolResultContent = formatToolResultsForClaude(toolResults);

      await sessionManager.addMessage(sessionId, {
        role: "user",
        content: toolResultContent,
      });

      // Continue loop - Claude will process tool results
    }

    if (iteration >= maxIterations) {
      if (process.env.NODE_ENV === "development") {
        logger.warn("⚠️  Max conversation iterations reached");
      }
    }
  }

  /**
   * Call Claude API with streaming
   */
  private async callClaude(
    messages: any[],
    sendUpdate: (message: WSMessage) => void,
  ): Promise<any> {
    const stream = await this.anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      messages,
      tools: this.getToolDefinitions(),
      stream: true,
    });

    const content: ContentBlock[] = [];
    let currentTextBlock = "";
    let currentToolUse: any = null;

    for await (const event of stream) {
      // Check for abort
      if (this.abortController?.signal.aborted) {
        throw new Error("Request cancelled by user");
      }

      if (event.type === "content_block_start") {
        if (event.content_block.type === "text") {
          currentTextBlock = "";
        } else if (event.content_block.type === "tool_use") {
          currentToolUse = {
            type: "tool_use",
            id: event.content_block.id,
            name: event.content_block.name,
            input: {},
          };

          sendUpdate({
            type: "tool_use_start",
            data: {
              toolId: event.content_block.id,
              toolName: event.content_block.name,
            },
            timestamp: Date.now(),
          });
        }
      } else if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta") {
          currentTextBlock += event.delta.text;

          // Stream text to client
          sendUpdate({
            type: "text_delta",
            data: { text: event.delta.text },
            timestamp: Date.now(),
          });
        } else if (event.delta.type === "input_json_delta") {
          // Accumulate tool input
          if (currentToolUse) {
            try {
              currentToolUse.input = {
                ...currentToolUse.input,
                ...JSON.parse(event.delta.partial_json || "{}"),
              };
            } catch (e) {
              // Ignore incomplete JSON chunks during streaming
            }
          }
        }
      } else if (event.type === "content_block_stop") {
        if (currentTextBlock) {
          content.push({
            type: "text",
            text: currentTextBlock,
          });
          currentTextBlock = "";
        }

        if (currentToolUse) {
          content.push(currentToolUse);
          currentToolUse = null;
        }
      }
    }

    return { content };
  }

  /**
   * Format session messages for Claude API
   */
  private formatMessagesForClaude(messages: Message[]): any[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: Array.isArray(msg.content)
        ? msg.content
        : [{ type: "text", text: msg.content as string }],
    }));
  }

  /**
   * Get tool definitions for Claude
   */
  private getToolDefinitions(): any[] {
    return [
      {
        name: "web_search",
        description:
          "Search the web for current information, documentation, libraries, or examples. Use this when you need up-to-date information.",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query to execute",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_current_code",
        description:
          "Read the current content of a file in the app. Use this before making edits to see what currently exists.",
        input_schema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: 'The path to the file (e.g., "src/App.tsx", "styles.css")',
            },
          },
          required: ["file_path"],
        },
      },
      {
        name: "apply_edit",
        description:
          "Apply an edit to a file. Provide the old content (or empty string for new files) and the new content.",
        input_schema: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "The path to the file",
            },
            old_content: {
              type: "string",
              description: "The current content of the file (use get_current_code first)",
            },
            new_content: {
              type: "string",
              description: "The new content to write to the file",
            },
          },
          required: ["file_path", "new_content"],
        },
      },
    ];
  }

  /**
   * Cancel the current operation
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Check if currently processing
   */
  isActive(): boolean {
    return this.isProcessing;
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();
