"use client";

import { useState, useEffect, useRef } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { MessageSquare, Sparkles, Loader2, Code2, Eye, FileCode, Plus } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  files?: Array<{ path: string; content: string; action: string }>;
  timestamp: Date;
}

export default function StorefrontBuilderV2() {
  const { vendor, isAuthenticated } = useVendorAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: `👋 Hi ${vendor?.store_name || 'there'}! I'm your AI developer.

I'll build your custom storefront **step by step** with actual React/Next.js code.

Just describe what you want and I'll create it:
- "Create a hero section with my logo"
- "Add a product grid showing my flower products"
- "Make a navigation menu with cart"
- "Build a checkout page"

Each prompt builds on the previous code. Let's create something amazing!`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [storefrontId, setStorefrontId] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize storefront
  useEffect(() => {
    if (vendor && !storefrontId) {
      initializeStorefront();
    }
  }, [vendor]);

  async function initializeStorefront() {
    // Create a new storefront entry
    const response = await fetch('/api/ai-agent/init-storefront', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vendor-id': vendor!.id.toString(),
      },
    });
    
    const result = await response.json();
    if (result.success) {
      setStorefrontId(result.storefrontId);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!input.trim() || generating || !storefrontId) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setGenerating(true);

    try {
      const response = await fetch('/api/ai-agent/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor!.id.toString(),
        },
        body: JSON.stringify({
          message: input,
          storefrontId: storefrontId,
          conversationHistory: messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.explanation,
          files: result.files,
          timestamp: new Date(),
        };

        setMessages([...messages, userMessage, assistantMessage]);

        // Update files state
        const newFiles = { ...files };
        for (const file of result.files) {
          newFiles[file.path] = file.content;
        }
        setFiles(newFiles);

        // Select first new file
        if (result.files.length > 0 && !selectedFile) {
          setSelectedFile(result.files[0].path);
        }

        // Trigger preview reload
        setPreviewKey(prev => prev + 1);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${result.error}`,
          timestamp: new Date(),
        };
        setMessages([...messages, userMessage, errorMessage]);
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages([...messages, userMessage, errorMessage]);
    } finally {
      setGenerating(false);
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full max-w-full h-[calc(100vh-200px)] animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl text-white mb-2 font-light tracking-tight">
          AI Storefront Builder <span className="text-purple-400">v2</span>
        </h1>
        <p className="text-white/50 text-sm">
          Build your custom storefront with actual code, piece by piece
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 h-[calc(100%-120px)]">
        {/* Chat - Left Column */}
        <div className="bg-[#111111] border border-white/10 flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-purple-400" />
              <h2 className="text-white font-medium">AI Chat</h2>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-white/10' : msg.role === 'system' ? 'bg-purple-500/20' : 'bg-purple-500/10'
                }`}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className={`flex-1 ${
                  msg.role === 'user' ? 'bg-white/5' : msg.role === 'system' ? 'bg-purple-500/5' : 'bg-purple-500/5'
                } border ${msg.role === 'user' ? 'border-white/10' : 'border-purple-500/10'} p-4 rounded`}>
                  <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  {msg.files && msg.files.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-white/40 text-xs mb-2">Files modified:</div>
                      {msg.files.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs text-white/60 mb-1 cursor-pointer hover:text-white"
                          onClick={() => setSelectedFile(f.path)}
                        >
                          <FileCode size={12} />
                          <span>{f.path}</span>
                          <span className={`ml-auto px-2 py-0.5 rounded text-[10px] ${
                            f.action === 'create' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {f.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-white/30 text-xs mt-2">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {generating && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Loader2 size={16} className="text-purple-400 animate-spin" />
                </div>
                <div className="flex-1 bg-purple-500/5 border border-purple-500/10 p-4 rounded">
                  <div className="text-white/60 text-sm">Writing code...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me what to build..."
                disabled={generating}
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-all text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={generating || !input.trim()}
                className="px-6 py-3 bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 transition-all text-sm uppercase tracking-wider font-medium"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : 'Build'}
              </button>
            </div>
          </form>
        </div>

        {/* Code Editor - Middle Column */}
        <div className="bg-[#111111] border border-white/10 flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-green-400" />
              <h2 className="text-white font-medium">Generated Code</h2>
            </div>
          </div>

          {/* File tabs */}
          {Object.keys(files).length > 0 && (
            <div className="flex gap-1 p-2 border-b border-white/5 overflow-x-auto">
              {Object.keys(files).map(path => (
                <button
                  key={path}
                  onClick={() => setSelectedFile(path)}
                  className={`px-3 py-1.5 text-xs rounded transition-all whitespace-nowrap ${
                    selectedFile === path
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:bg-white/5'
                  }`}
                >
                  {path.split('/').pop()}
                </button>
              ))}
            </div>
          )}

          {/* Code viewer */}
          <div className="flex-1 overflow-auto bg-[#0a0a0a]">
            {selectedFile && files[selectedFile] ? (
              <pre className="p-4 text-xs text-white/80 font-mono leading-relaxed">
                <code>{files[selectedFile]}</code>
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                No files yet. Start coding with AI!
              </div>
            )}
          </div>
        </div>

        {/* Live Preview - Right Column */}
        <div className="bg-[#111111] border border-white/10 flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-blue-400" />
                <h2 className="text-white font-medium">Live Preview</h2>
              </div>
              {Object.keys(files).length > 0 && (
                <button
                  onClick={() => setPreviewKey(prev => prev + 1)}
                  className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs rounded transition-all"
                >
                  Refresh
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-white">
            {storefrontId ? (
              <iframe
                key={previewKey}
                src={`/api/ai-agent/preview/${storefrontId}`}
                className="w-full h-full border-0"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Initializing...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick suggestions */}
      {Object.keys(files).length === 0 && (
        <div className="mt-4 flex gap-2">
          {[
            'Create a modern homepage with hero section',
            'Build a product grid with my inventory',
            'Make a McDonald\'s themed store',
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setInput(suggestion)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs rounded transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

