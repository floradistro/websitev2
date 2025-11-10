"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, Minimize2, Terminal } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AIActivityMonitor() {
  const [isMinimized, setIsMinimized] = useState(true);
  const [content, setContent] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleAIStart = (event: CustomEvent) => {
      setIsMinimized(false);
      setIsActive(true);
      setContent("");
    };

    const handleAIProgress = (event: CustomEvent) => {
      const message = event.detail.message.trim();
      if (!message) return;
      setContent((prev) => prev + (prev ? "\n" : "") + message);

      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 10);
    };

    const handleAIComplete = () => {
      setIsActive(false);
    };

    window.addEventListener("ai-autofill-start" as any, handleAIStart);
    window.addEventListener("ai-autofill-progress" as any, handleAIProgress);
    window.addEventListener("ai-autofill-complete" as any, handleAIComplete);

    return () => {
      window.removeEventListener("ai-autofill-start" as any, handleAIStart);
      window.removeEventListener(
        "ai-autofill-progress" as any,
        handleAIProgress,
      );
      window.removeEventListener(
        "ai-autofill-complete" as any,
        handleAIComplete,
      );
    };
  }, []);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[200] bg-white text-black p-3 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-white hover:border-white/90"
        title="Expand AI Agent"
      >
        <Sparkles className={`w-5 h-5 ${isActive ? "animate-pulse" : ""}`} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 left-4 lg:bottom-6 lg:right-6 lg:left-auto z-[200] lg:w-[420px] bg-[#0a0a0a] border border-white/10 shadow-2xl flex flex-col h-[60vh] lg:h-[500px] max-h-[600px] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
            <Sparkles
              className={`w-4 h-4 text-white ${isActive ? "animate-pulse" : ""}`}
            />
          </div>
          <div>
            <h3
              className="text-white font-black uppercase tracking-tight text-xs"
              style={{ fontWeight: 900 }}
            >
              AI Agent
            </h3>
            <p className="text-white/40 text-[10px]">
              {isActive ? "Processing..." : "Ready"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="w-8 h-8 hover:bg-white/10 rounded-xl transition-all flex items-center justify-center"
          title="Minimize"
        >
          <Minimize2 className="w-4 h-4 text-white/60 hover:text-white" />
        </button>
      </div>

      {/* Activity Feed with Markdown */}
      <div
        ref={scrollRef}
        className="overflow-y-auto flex-1 bg-[#0a0a0a] ai-activity-content"
      >
        {content ? (
          <div className="p-3">
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => (
                  <p
                    className="mb-2 text-white/70 text-[11px] leading-relaxed"
                    style={{
                      fontFamily:
                        'SF Mono, Monaco, Consolas, "Liberation Mono", monospace',
                    }}
                    {...props}
                  />
                ),
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-white/40 font-normal text-[10px] mb-2 mt-3 uppercase tracking-wider"
                    style={{
                      fontFamily: "SF Mono, Monaco, Consolas, monospace",
                    }}
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-white/60 font-semibold text-[12px] mb-1.5 mt-2"
                    style={{
                      fontFamily: "SF Mono, Monaco, Consolas, monospace",
                    }}
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="text-white/40 font-normal text-[10px] mb-1 mt-2 uppercase tracking-wider"
                    style={{
                      fontFamily: "SF Mono, Monaco, Consolas, monospace",
                    }}
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="space-y-0.5 mb-2 ml-0 list-none" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    className="space-y-0.5 mb-2 ml-3 list-decimal text-white/30"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li
                    className="text-white text-[11px] leading-relaxed"
                    style={{
                      fontFamily: "SF Mono, Monaco, Consolas, monospace",
                    }}
                    {...props}
                  />
                ),
                code: ({ node, className, children, ...props }: any) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) {
                    // Syntax highlight: field names gray, values colored
                    const code = String(children);
                    const highlighted = code
                      .replace(
                        /([\w_]+):/g,
                        '<span style="color: rgba(255,255,255,0.4)">$1</span>:',
                      ) // Field names in gray
                      .replace(
                        /:\s*"([^"]+)"/g,
                        ': <span style="color: #60a5fa">"$1"</span>',
                      ) // String values in blue
                      .replace(
                        /:\s*(\d+\.?\d*)/g,
                        ': <span style="color: #fbbf24">$1</span>',
                      ) // Number values in yellow
                      .replace(
                        /:\s*\[([^\]]+)\]/g,
                        ': <span style="color: #34d399">[$1]</span>',
                      ); // Arrays in green

                    return (
                      <code
                        className="block bg-[#0d0d0d] border border-white/10 p-3 rounded-md text-[11px] leading-relaxed my-2 overflow-x-auto text-white/40"
                        style={{
                          fontFamily:
                            "JetBrains Mono, SF Mono, Monaco, Consolas, monospace",
                        }}
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                      />
                    );
                  }
                  return (
                    <code
                      className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white/60 border border-white/10"
                      style={{
                        fontFamily:
                          "JetBrains Mono, SF Mono, Monaco, Consolas, monospace",
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ node, ...props }) => (
                  <pre className="mb-2" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="text-white font-semibold" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="text-white/70 not-italic" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-2 border-white/20 pl-3 text-white/60 my-2"
                    {...props}
                  />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="border-white/10 my-3" {...props} />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <Terminal
              className="w-14 h-14 text-white/10 mb-3"
              strokeWidth={1.5}
            />
            <p
              className="text-white/60 text-xs font-medium mb-2"
              style={{ fontFamily: "SF Mono, Monaco, Consolas, monospace" }}
            >
              AI Agent Ready
            </p>
            <p className="text-white/40 text-[10px] leading-relaxed max-w-xs mb-3">
              Select products and use AI Autofill to research strain data
            </p>
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 rounded border border-white/10">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span
                className="text-white/50 text-[9px] uppercase tracking-wider"
                style={{ fontFamily: "SF Mono, Monaco, Consolas, monospace" }}
              >
                Online
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="px-4 py-3 border-t border-white/10 bg-black/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {isActive ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-500 text-[10px] uppercase tracking-[0.15em] font-bold">
                Active
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-white/20 rounded-full"></div>
              <span className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-bold">
                Idle
              </span>
            </>
          )}
        </div>
        <span className="text-white/30 text-[10px] font-mono">
          {new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <style jsx global>{`
        .ai-activity-content {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .ai-activity-content::-webkit-scrollbar {
          width: 6px;
        }
        .ai-activity-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-activity-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .ai-activity-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
