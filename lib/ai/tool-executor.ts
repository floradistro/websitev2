/**
 * AI Code Feature V2 - Parallel Tool Executor
 * Executes AI tools in parallel with timeouts and error handling
 */

import Exa from "exa-js";
import { getServiceSupabase } from "@/lib/supabase/client";
import { withTimeout, retryWithBackoff, parallelWithTimeouts } from "./utils";
import { sessionManager, PendingTool } from "./session-manager";

import { logger } from "@/lib/logger";
// Tool timeout configurations (in milliseconds)
const TOOL_TIMEOUTS = {
  web_search: 15000, // 15 seconds for web search
  get_current_code: 5000, // 5 seconds for file read
  apply_edit: 10000, // 10 seconds for file write
  default: 10000, // 10 seconds default
};

// Tool result types
export interface ToolResult {
  toolUseId: string;
  toolName: string;
  content: any;
  isError: boolean;
  executionTime: number;
}

export interface ToolExecutionOptions {
  sessionId: string;
  appId: string;
  vendorId: string;
  onProgress?: (toolId: string, status: string, data?: any) => void;
}

/**
 * Web Search Tool
 */
async function executeWebSearch(query: string, options: ToolExecutionOptions): Promise<any> {
  const exa = new Exa(process.env.EXA_API_KEY || "");

  if (!process.env.EXA_API_KEY) {
    throw new Error("EXA_API_KEY not configured");
  }

  options.onProgress?.("web_search", "searching", { query });

  // Execute with retry logic for transient failures
  const results = await retryWithBackoff(
    async () => {
      return await exa.searchAndContents(query, {
        type: "auto",
        useAutoprompt: true,
        numResults: 5,
        text: { maxCharacters: 1000 },
      });
    },
    {
      maxRetries: 2,
      baseDelay: 1000,
      onRetry: (attempt, error) => {
        if (process.env.NODE_ENV === "development") {
          logger.warn(`Web search retry ${attempt + 1}`, { error: error.message });
        }
        options.onProgress?.("web_search", "retrying", {
          attempt: attempt + 1,
        });
      },
    },
  );

  return {
    query,
    results: results.results.map((r) => ({
      title: r.title,
      url: r.url,
      text: r.text?.substring(0, 500),
    })),
  };
}

/**
 * Get Current Code Tool
 */
async function executeGetCurrentCode(
  filePath: string,
  appId: string,
  vendorId: string,
  options: ToolExecutionOptions,
): Promise<any> {
  options.onProgress?.("get_current_code", "reading", { filePath });

  const supabase = getServiceSupabase();

  // Get app to verify ownership
  const { data: app } = await supabase
    .from("vendor_apps")
    .select("id")
    .eq("id", appId)
    .eq("vendor_id", vendorId)
    .single();

  if (!app) {
    throw new Error("App not found or access denied");
  }

  // Get file content
  const { data: file, error } = await supabase
    .from("app_files")
    .select("content, path")
    .eq("app_id", appId)
    .eq("path", filePath)
    .single();

  if (error || !file) {
    // File doesn't exist yet - return empty
    return {
      path: filePath,
      content: "",
      exists: false,
    };
  }

  return {
    path: file.path,
    content: file.content,
    exists: true,
  };
}

/**
 * Apply Edit Tool
 */
async function executeApplyEdit(
  filePath: string,
  oldContent: string,
  newContent: string,
  appId: string,
  vendorId: string,
  options: ToolExecutionOptions,
): Promise<any> {
  // Validate file path
  if (!filePath || typeof filePath !== "string") {
    throw new Error("file_path is required and must be a string");
  }

  options.onProgress?.("apply_edit", "validating", { filePath });

  const supabase = getServiceSupabase();

  // Get app to verify ownership
  const { data: app } = await supabase
    .from("vendor_apps")
    .select("id")
    .eq("id", appId)
    .eq("vendor_id", vendorId)
    .single();

  if (!app) {
    throw new Error("App not found or access denied");
  }

  // Get current file content
  const { data: existingFile } = await supabase
    .from("app_files")
    .select("content, id")
    .eq("app_id", appId)
    .eq("path", filePath)
    .single();

  options.onProgress?.("apply_edit", "applying", { filePath });

  // Validate the edit by checking if old content matches
  if (existingFile) {
    const currentContent = existingFile.content || "";

    // Fuzzy match - allow for whitespace differences
    const normalizeContent = (str: string) => str.replace(/\s+/g, " ").trim();

    if (normalizeContent(currentContent) !== normalizeContent(oldContent)) {
      // Content has changed - potential conflict
      if (process.env.NODE_ENV === "development") {
        logger.warn(`⚠️  Content mismatch for ${filePath}. Applying anyway but may cause issues.`);
      }
    }

    // Update existing file
    const { error: updateError } = await supabase
      .from("app_files")
      .update({
        content: newContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingFile.id);

    if (updateError) {
      throw new Error(`Failed to update file: ${updateError.message}`);
    }
  } else {
    // Create new file
    const { error: insertError } = await supabase.from("app_files").insert({
      app_id: appId,
      path: filePath,
      content: newContent,
      type:
        filePath.endsWith(".tsx") || filePath.endsWith(".ts")
          ? "typescript"
          : filePath.endsWith(".css")
            ? "css"
            : filePath.endsWith(".json")
              ? "json"
              : "text",
    });

    if (insertError) {
      throw new Error(`Failed to create file: ${insertError.message}`);
    }
  }

  // Track in session
  await sessionManager.addFileModification(options.sessionId, {
    path: filePath,
    oldContent,
    newContent,
  });

  return {
    path: filePath,
    success: true,
    action: existingFile ? "updated" : "created",
    linesChanged: newContent.split("\n").length - oldContent.split("\n").length,
  };
}

/**
 * Execute a single tool with timeout and error handling
 */
export async function executeTool(
  toolUse: {
    id: string;
    name: string;
    input: any;
  },
  options: ToolExecutionOptions,
): Promise<ToolResult> {
  const startTime = Date.now();

  // Track tool as pending
  await sessionManager.addPendingTool(options.sessionId, {
    id: toolUse.id,
    name: toolUse.name,
    input: toolUse.input,
  });

  await sessionManager.updateToolStatus(options.sessionId, toolUse.id, "running");

  try {
    const timeout =
      TOOL_TIMEOUTS[toolUse.name as keyof typeof TOOL_TIMEOUTS] || TOOL_TIMEOUTS.default;

    let result: any;

    // Execute tool with timeout
    if (toolUse.name === "web_search") {
      result = await withTimeout(executeWebSearch(toolUse.input.query, options), timeout);
    } else if (toolUse.name === "get_current_code") {
      result = await withTimeout(
        executeGetCurrentCode(toolUse.input.file_path, options.appId, options.vendorId, options),
        timeout,
      );
    } else if (toolUse.name === "apply_edit") {
      result = await withTimeout(
        executeApplyEdit(
          toolUse.input.file_path,
          toolUse.input.old_content || "",
          toolUse.input.new_content,
          options.appId,
          options.vendorId,
          options,
        ),
        timeout,
      );
    } else {
      throw new Error(`Unknown tool: ${toolUse.name}`);
    }

    const executionTime = Date.now() - startTime;

    // Mark as completed
    await sessionManager.updateToolStatus(options.sessionId, toolUse.id, "completed", result);

    options.onProgress?.(toolUse.id, "completed", result);

    return {
      toolUseId: toolUse.id,
      toolName: toolUse.name,
      content: result,
      isError: false,
      executionTime,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    // Mark as failed
    await sessionManager.updateToolStatus(
      options.sessionId,
      toolUse.id,
      "failed",
      undefined,
      error.message,
    );

    options.onProgress?.(toolUse.id, "failed", { error: error.message });

    if (process.env.NODE_ENV === "development") {
      logger.error(`Tool execution failed [${toolUse.name}]:`, error);
    }
    return {
      toolUseId: toolUse.id,
      toolName: toolUse.name,
      content: `Error executing ${toolUse.name}: ${error.message}`,
      isError: true,
      executionTime,
    };
  }
}

/**
 * Execute multiple tools in parallel
 */
export async function executeToolsParallel(
  toolUses: Array<{ id: string; name: string; input: any }>,
  options: ToolExecutionOptions,
): Promise<ToolResult[]> {
  const startTime = Date.now();

  // Execute all tools in parallel
  const results = await parallelWithTimeouts(
    toolUses.map((toolUse) => () => executeTool(toolUse, options)),
    30000, // 30 second timeout for the entire batch
  );

  const executionTime = Date.now() - startTime;

  // Extract successful results and errors
  const toolResults: ToolResult[] = results.map((result, index) => {
    if (result.success) {
      return result.value;
    } else {
      // Failed tool - return error result
      const toolUse = toolUses[index];
      return {
        toolUseId: toolUse.id,
        toolName: toolUse.name,
        content: `Timeout or error: ${result.error.message}`,
        isError: true,
        executionTime: 0,
      };
    }
  });

  return toolResults;
}

/**
 * Convert tool results to Claude API format
 */
export function formatToolResultsForClaude(results: ToolResult[]): any[] {
  return results.map((result) => ({
    type: "tool_result",
    tool_use_id: result.toolUseId,
    content: result.isError
      ? `Error: ${result.content}`
      : typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content, null, 2),
    is_error: result.isError,
  }));
}
