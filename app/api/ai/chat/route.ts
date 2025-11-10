/**
 * AI Chat API - Cursor/Claude Code Style
 * Uses configured agents from database
 * Maintains conversation history
 * Streaming responses with tool use
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceSupabase } from "@/lib/supabase/client";
import { ExaClient } from "@/lib/ai/exa-client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { checkAIRateLimit, RateLimitConfigs } from "@/lib/rate-limiter";
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const exa = new ExaClient(process.env.EXA_API_KEY);

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // RATE LIMIT: AI chat endpoint
  const rateLimitResult = checkAIRateLimit(request, RateLimitConfigs.aiChat);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const encoder = new TextEncoder();

  const {
    messages,
    agentId,
    conversationId,
    context = {},
  } = await request.json();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`),
        );
      };

      try {
        // Fetch agent configuration from database
        const supabase = getServiceSupabase();
        const { data: agent, error: agentError } = await supabase
          .from("ai_agents")
          .select("*")
          .eq("id", agentId)
          .eq("status", "active")
          .single();

        if (agentError || !agent) {
          throw new Error("Agent not found or inactive");
        }

        send("status", { message: `🤖 Initializing ${agent.name}...` });

        // Save conversation to database
        let dbConversationId = conversationId;
        if (!dbConversationId) {
          const { data: newConv, error: convError } = await supabase
            .from("ai_conversations")
            .insert({
              user_id: context.userId || "anonymous",
              agent_id: agent.id,
              title: context.title || "New Conversation",
              context: context,
            })
            .select("id")
            .single();

          if (!convError && newConv) {
            dbConversationId = newConv.id;
          }
        }

        // Save user message
        if (dbConversationId && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          await supabase.from("ai_messages").insert({
            conversation_id: dbConversationId,
            role: lastMessage.role,
            content:
              typeof lastMessage.content === "string"
                ? lastMessage.content
                : JSON.stringify(lastMessage.content),
          });
        }

        // Build context-aware system prompt
        const contextPrompt = buildContextPrompt(context);
        const fullSystemPrompt = agent.system_prompt + "\n\n" + contextPrompt;

        // Stream response from Claude
        send("status", { message: "💭 Thinking..." });

        const messageStream = await anthropic.messages.stream({
          model: agent.model,
          max_tokens: agent.max_tokens,
          temperature: agent.temperature,
          system: fullSystemPrompt,
          messages: messages,
        });

        let fullResponse = "";
        let currentThinking = "";
        let inThinkingBlock = false;

        messageStream.on("text", (text) => {
          // Check if we're in extended thinking
          if (text.includes("<thinking>")) {
            inThinkingBlock = true;
            currentThinking = "";
          }

          if (inThinkingBlock) {
            currentThinking += text;
            send("thinking", { content: currentThinking });

            if (text.includes("</thinking>")) {
              inThinkingBlock = false;
            }
          } else {
            fullResponse += text;
            send("text", { content: text, full: fullResponse });
          }
        });

        // @ts-expect-error - Anthropic SDK types are incomplete for streaming events
        messageStream.on("content_block_start", (block) => {
          if (block.type === "tool_use") {
            send("tool_start", {
              tool: block.name,
              id: block.id,
            });
          }
        });

        // @ts-expect-error - Anthropic SDK types are incomplete for streaming events
        messageStream.on("content_block_delta", (delta) => {
          if (delta.type === "text_delta") {
            // Already handled in 'text' event
          }
        });

        await messageStream.finalMessage();

        // Save assistant response
        if (dbConversationId && fullResponse) {
          await supabase.from("ai_messages").insert({
            conversation_id: dbConversationId,
            role: "assistant",
            content: fullResponse,
          });
        }

        send("complete", {
          conversationId: dbConversationId,
          message: fullResponse,
        });

        controller.close();
      } catch (error) {
        const err = toError(error);
        if (process.env.NODE_ENV === "development") {
          logger.error("Chat API error:", err);
        }
        send("error", {
          message: err.message || "Failed to generate response",
          details: err.stack,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function buildContextPrompt(context: any): string {
  let prompt = "\n## CURRENT CONTEXT\n";

  if (context.vendorId) {
    prompt += `Vendor ID: ${context.vendorId}\n`;
  }
  if (context.vendorName) {
    prompt += `Vendor Name: ${context.vendorName}\n`;
  }
  if (context.currentCode) {
    prompt += `\n### CURRENT CODE\n\`\`\`code\n${context.currentCode}\n\`\`\`\n`;
  }
  if (context.selectedSection) {
    prompt += `\nUser is editing: ${context.selectedSection}\n`;
  }
  if (context.isEditing) {
    prompt += `\n⚠️ EDITING MODE: Make surgical changes only. Preserve all existing functionality.\n`;
  }

  return prompt;
}
