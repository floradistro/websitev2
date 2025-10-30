'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppAuth } from '@/context/AppAuthContext'
import {
  ArrowLeft,
  Send,
  Loader2,
  Check,
  FileCode,
  Globe,
  Sparkles,
  ExternalLink,
  Save
} from 'lucide-react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  filesChanged?: string[]
}

interface VendorApp {
  id: string
  name: string
  slug: string
  app_type: string
  description: string
  deployment_url: string | null
  status: string
}

export default function AIEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { vendor } = useAppAuth()

  const [app, setApp] = useState<VendorApp | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI coding assistant. I'll help you build your app step by step.

What would you like to create or modify? I can:
• Add new pages or components
• Style and design elements
• Connect to your backend data
• Set up forms and interactions
• Anything else you need!

Just tell me what you want in plain English, and I'll write the code for you.`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!vendor?.id || !params.appId) return
    loadApp()
  }, [vendor?.id, params.appId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadApp() {
    try {
      const response = await fetch(`/api/vendor/apps/${params.appId}`)
      const data = await response.json()

      if (data.success) {
        setApp(data.app)
      }
    } catch (error) {
      console.error('Error loading app:', error)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading || !app) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/vendor/ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: app.id,
          vendorId: vendor?.id,
          instruction: input,
          conversationHistory: messages
        })
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          filesChanged: data.filesChanged
        }
        setMessages(prev => [...prev, assistantMessage])

        // Refresh preview
        if (previewRef.current) {
          previewRef.current.src = previewRef.current.src
        }
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${data.error || 'Unknown error'}`
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  async function publishApp() {
    if (!app || publishing) return

    setPublishing(true)

    try {
      const response = await fetch(`/api/vendor/apps/${app.id}/publish`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        alert('App published successfully!')
        loadApp()
      } else {
        alert('Failed to publish: ' + data.error)
      }
    } catch (error) {
      console.error('Error publishing:', error)
      alert('Failed to publish app')
    } finally {
      setPublishing(false)
    }
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="text-white/60 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none border-b border-white/5 bg-white/[0.02]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/vendor/code"
              className="text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>

            <div>
              <h1 className="text-lg font-black text-white tracking-tight" style={{ fontWeight: 900 }}>
                {app.name}
              </h1>
              <p className="text-xs text-white/40 uppercase tracking-wider">
                {app.app_type.replace('-', ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {app.deployment_url && (
              <a
                href={app.deployment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/80 transition-all"
              >
                <Globe size={16} />
                <span>View Live</span>
                <ExternalLink size={14} className="text-white/40" />
              </a>
            )}

            <button
              onClick={publishApp}
              disabled={publishing}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-white/10 disabled:to-white/10 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20"
            >
              {publishing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Publish to Production
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Pane */}
        <div className="flex-1 border-r border-white/5 flex flex-col">
          <div className="flex-none px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-white/40" />
              <span className="text-sm font-medium text-white/60">Live Preview</span>
              <div className="ml-auto px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                <span className="text-[10px] uppercase tracking-wider font-bold text-green-400">
                  Auto-refresh
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white/[0.02] relative">
            {app.deployment_url ? (
              <iframe
                ref={previewRef}
                src={app.deployment_url}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Globe size={48} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 text-sm">
                    Preview will appear here once deployed
                  </p>
                  <button
                    onClick={publishApp}
                    className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm text-white transition-all"
                  >
                    Deploy Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Chat Pane */}
        <div className="w-[500px] flex flex-col bg-black">
          <div className="flex-none px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-emerald-400" />
              <h2 className="text-lg font-black text-white tracking-tight" style={{ fontWeight: 900 }}>
                AI Assistant
              </h2>
            </div>
            <p className="text-xs text-white/40 mt-1">
              Tell me what to build or change
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-100'
                      : 'bg-white/5 border border-white/10 text-white/90'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>

                  {message.filesChanged && message.filesChanged.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                        <FileCode size={14} />
                        <span>Files updated:</span>
                      </div>
                      {message.filesChanged.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-emerald-400">
                          <Check size={12} />
                          <span className="font-mono">{file}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="text-emerald-400 animate-spin" />
                    <span className="text-sm text-white/60">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-none p-4 border-t border-white/5">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Tell me what to build..."
                rows={3}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex-none p-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-white/10 disabled:to-white/10 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                <Send size={20} className="text-white" />
              </button>
            </div>

            <p className="text-[10px] text-white/30 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
