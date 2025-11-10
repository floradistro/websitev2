/**
 * AI Chat Panel Component
 * Improved UX for AI Code Feature V2
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useAIChat } from "@/hooks/useAIChat";
import type { ChatMessage, ToolUse, FileChange } from "@/hooks/useAIChat";

interface AIChatPanelProps {
  appId: string;
  sessionId?: string;
  onFileChange?: (change: FileChange) => void;
}

export default function AIChatPanel({
  appId,
  sessionId,
  onFileChange,
}: AIChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isConnected,
    isProcessing,
    currentTool,
    fileChanges,
    sendMessage,
    cancel,
    clearHistory,
  } = useAIChat({
    appId,
    sessionId,
    onFileChange,
    onError: (error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("AI Chat Error:", error);
      }
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isProcessing) {
      return;
    }

    const message = inputValue.trim();
    setInputValue("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
          {isConnected && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">Connected</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isProcessing && (
            <button
              onClick={cancel}
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={clearHistory}
            disabled={messages.length === 0}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-sm text-gray-600 max-w-sm">
              Ask me to build features, fix bugs, search the web, or edit your
              code. I can help with React, TypeScript, CSS, and more!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Tool execution indicator */}
        {isProcessing && currentTool && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Executing: {formatToolName(currentTool)}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File changes notification */}
      {fileChanges.length > 0 && (
        <div className="px-6 py-2 bg-green-50 border-t border-green-200">
          <p className="text-sm text-green-800">
            ✓ {fileChanges.length} file{fileChanges.length !== 1 ? "s" : ""}{" "}
            modified
          </p>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to build something..."
            disabled={isProcessing}
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ minHeight: "52px", maxHeight: "200px" }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Thinking...</span>
              </div>
            ) : (
              "Send"
            )}
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/**
 * Message Bubble Component
 */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </div>

        {/* Tool uses */}
        {message.toolUses && message.toolUses.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
            {message.toolUses.map((tool) => (
              <ToolUseIndicator key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`mt-2 text-xs ${isUser ? "text-blue-200" : "text-gray-500"}`}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
          {message.isStreaming && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="w-1 h-1 bg-current rounded-full animate-pulse" />
              Streaming...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Tool Use Indicator Component
 */
function ToolUseIndicator({ tool }: { tool: ToolUse }) {
  const getStatusIcon = (status: ToolUse["status"]) => {
    switch (status) {
      case "running":
        return (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        );
      case "completed":
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "failed":
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return <div className="w-3 h-3 border-2 border-current rounded-full" />;
    }
  };

  const getStatusColor = (status: ToolUse["status"]) => {
    switch (status) {
      case "running":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className={`flex items-center gap-2 text-xs ${getStatusColor(tool.status)}`}
    >
      {getStatusIcon(tool.status)}
      <span className="font-medium">{formatToolName(tool.name)}</span>
      {tool.status === "completed" && tool.output && (
        <span className="text-gray-600">
          {tool.output.action && `(${tool.output.action})`}
        </span>
      )}
      {tool.error && <span className="text-red-600">- {tool.error}</span>}
    </div>
  );
}

/**
 * Format tool name for display
 */
function formatToolName(name: string): string {
  switch (name) {
    case "web_search":
      return "Web Search";
    case "get_current_code":
      return "Read File";
    case "apply_edit":
      return "Edit File";
    default:
      return name;
  }
}
