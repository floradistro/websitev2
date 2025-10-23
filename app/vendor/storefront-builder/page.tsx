"use client";

import { useState, useEffect, useRef } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { MessageSquare, Sparkles, Loader2, ExternalLink, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface StorefrontPreview {
  id: string;
  previewUrl: string;
  requirements: any;
}

export default function StorefrontBuilder() {
  const { vendor, isAuthenticated } = useVendorAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: `Hi ${vendor?.store_name || 'there'}! 👋 I'm your AI storefront designer. 

Describe your ideal online store in natural language, and I'll create it for you. You can tell me about:

🎨 Style & aesthetics (minimalist, luxury, modern, etc.)
🌈 Colors and branding
📐 Layout preferences (grid size, navigation style)
✨ Features you want (filters, reviews, age verification)

What kind of storefront would you like?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [preview, setPreview] = useState<StorefrontPreview | null>(null);
  const [deployed, setDeployed] = useState<{ url: string; id: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!input.trim() || generating) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setGenerating(true);

    try {
      const response = await fetch('/api/ai-agent/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor!.id.toString(),
        },
        body: JSON.stringify({
          message: input,
          history: messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
        };

        setMessages([...messages, userMessage, assistantMessage]);

        setPreview({
          id: result.storefrontId,
          previewUrl: result.previewUrl,
          requirements: result.requirements,
        });
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${result.error}. Please try again.`,
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

  async function handleDeploy() {
    if (!preview) return;

    setDeploying(true);

    try {
      const response = await fetch('/api/ai-agent/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor!.id.toString(),
        },
        body: JSON.stringify({
          storefrontId: preview.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDeployed({
          url: result.deploymentUrl,
          id: result.deploymentId,
        });

        const successMessage: Message = {
          role: 'assistant',
          content: `🎉 Your storefront is now live at ${result.deploymentUrl}!`,
          timestamp: new Date(),
        };
        setMessages([...messages, successMessage]);
      } else {
        alert(`Deployment failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Deployment error:', error);
      alert('Deployment failed. Please try again.');
    } finally {
      setDeploying(false);
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full max-w-full h-[calc(100vh-200px)] animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl text-white mb-2 font-light tracking-tight">
          AI Storefront Builder
        </h1>
        <p className="text-white/50 text-sm">
          Describe your ideal storefront, and our AI will build it for you
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[calc(100%-120px)]">
        {/* Chat Interface */}
        <div className="bg-[#111111] border border-white/10 flex flex-col h-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-white/10'
                      : msg.role === 'system'
                      ? 'bg-purple-500/20'
                      : 'bg-purple-500/10'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <span className="text-white text-sm">You</span>
                  ) : (
                    <Sparkles size={16} className="text-purple-400" />
                  )}
                </div>
                <div
                  className={`flex-1 ${
                    msg.role === 'user'
                      ? 'bg-white/5 border border-white/10'
                      : msg.role === 'system'
                      ? 'bg-purple-500/5 border border-purple-500/20'
                      : 'bg-purple-500/5 border border-purple-500/10'
                  } p-4 rounded`}
                >
                  <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
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
                  <div className="text-white/60 text-sm">
                    Analyzing your requirements...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-6 border-t border-white/10">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your ideal storefront..."
                disabled={generating}
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-all text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={generating || !input.trim()}
                className="px-6 py-3 bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 transition-all text-sm uppercase tracking-wider font-medium"
              >
                {generating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <MessageSquare size={16} />
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview/Deployment */}
        <div className="bg-[#111111] border border-white/10 flex flex-col h-full">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-white font-medium">Storefront Preview</h2>
              {preview && (
                <p className="text-white/40 text-xs mt-1">
                  Template: {preview.requirements?.theme?.style || 'Custom'}
                </p>
              )}
            </div>
            {preview && !deployed && (
              <button
                onClick={handleDeploy}
                disabled={deploying}
                className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 disabled:bg-green-500/50 transition-all text-xs uppercase tracking-wider font-medium flex items-center gap-2"
              >
                {deploying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <ExternalLink size={14} />
                    Deploy Live
                  </>
                )}
              </button>
            )}
            {deployed && (
              <a
                href={deployed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white text-black hover:bg-white/90 transition-all text-xs uppercase tracking-wider font-medium flex items-center gap-2"
              >
                <Check size={14} />
                View Live Site
              </a>
            )}
          </div>

          <div className="flex-1 overflow-hidden bg-[#0a0a0a]">
            {preview ? (
              <div className="w-full h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={32} className="text-purple-400" />
                  </div>
                  <h3 className="text-white text-lg mb-2">Storefront Generated!</h3>
                  <p className="text-white/60 text-sm mb-6 max-w-md">
                    Your {preview.requirements?.theme?.style || 'custom'} storefront is ready. 
                    Click "Deploy Live" to publish it to the web.
                  </p>
                  {preview.requirements && (
                    <div className="bg-white/5 border border-white/10 p-4 text-left text-xs space-y-2">
                      <div className="text-white/40">Specifications:</div>
                      <div className="text-white/80">
                        Style: {preview.requirements.theme?.style}
                      </div>
                      <div className="text-white/80">
                        Colors: {preview.requirements.theme?.colors?.primary}
                      </div>
                      <div className="text-white/80">
                        Grid: {preview.requirements.layout?.productGrid} columns
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white/40 text-sm">
                  Start a conversation to generate your storefront
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

