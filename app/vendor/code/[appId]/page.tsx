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
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview } from '@codesandbox/sandpack-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  filesChanged?: string[]
  streaming?: boolean
}

interface VendorApp {
  id: string
  name: string
  slug: string
  app_type: string
  description: string
  deployment_url: string | null
  preview_url: string | null
  preview_machine_id: string | null
  preview_status: string
  status: string
}

export default function AIEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { vendor } = useAppAuth()

  const [app, setApp] = useState<VendorApp | null>(null)
  const [appFiles, setAppFiles] = useState<Record<string, string>>({})
  const [filesLoading, setFilesLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hey! I'm your AI coding assistant.

Tell me what you'd like to build and I'll write the code for you. I can create components, add features, fix bugs, or modify anything in your app.

What would you like to work on?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [lastFileUpdate, setLastFileUpdate] = useState<number>(0)
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'ready'>('idle')
  const [previewLoading, setPreviewLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!vendor?.id || !params.appId) return
    loadApp()
    loadFiles()
  }, [vendor?.id, params.appId])

  // Poll for deployment status when building
  useEffect(() => {
    if (!app || app.status !== 'building') return

    const interval = setInterval(() => {
      loadApp() // Reload to check if deployment is ready
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [app?.status])

  // Poll for file changes and reload files with smooth transition
  useEffect(() => {
    if (!app?.id) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/vendor/apps/${app.id}/files-timestamp`)
        const data = await response.json()

        if (data.success && data.lastModified) {
          const timestamp = new Date(data.lastModified).getTime()

          // If files changed, debounce reload to prevent flicker
          if (lastFileUpdate > 0 && timestamp > lastFileUpdate) {
            console.log('🔄 Files changed, scheduling smooth reload...')

            // Clear any pending reload
            if (reloadTimeoutRef.current) {
              clearTimeout(reloadTimeoutRef.current)
            }

            // Debounce to prevent rapid reloads (wait 300ms for more changes)
            reloadTimeoutRef.current = setTimeout(() => {
              setPreviewLoading(true)
              loadFiles()
              // Remove loading state after iframe has time to load
              setTimeout(() => setPreviewLoading(false), 800)
            }, 300)
          }

          setLastFileUpdate(timestamp)
        }
      } catch (error) {
        console.error('Error polling for file changes:', error)
      }
    }, 1000) // Poll every second

    return () => {
      clearInterval(pollInterval)
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current)
      }
    }
  }, [app?.id, lastFileUpdate])

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

  async function loadFiles() {
    if (!params.appId) return

    setFilesLoading(true)
    try {
      const response = await fetch(`/api/vendor/apps/${params.appId}/files`)
      const data = await response.json()

      if (data.success && data.files) {
        // Convert array of files to Sandpack format: { filepath: content }
        const filesObject: Record<string, string> = {}
        data.files.forEach((file: any) => {
          filesObject[file.filepath] = file.content
        })
        setAppFiles(filesObject)
        console.log('📁 Loaded', data.files.length, 'files')
      }
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setFilesLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading || !app) return

    const userMessage: Message = { role: 'user', content: input }
    const userInstruction = input
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Add placeholder for streaming assistant response
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      streaming: true
    }])

    try {
      const response = await fetch('/api/vendor/ai-edit-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: app.id,
          vendorId: vendor?.id,
          instruction: userInstruction,
          conversationHistory: messages
        })
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to start stream')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''
      let filesChanged: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              // Mark streaming as complete
              setMessages(prev => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: accumulatedText,
                  filesChanged: filesChanged.length > 0 ? filesChanged : undefined,
                  streaming: false
                }
                return newMessages
              })
              break
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === 'text') {
                accumulatedText += parsed.content
                // Update the streaming message
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: accumulatedText,
                    streaming: true
                  }
                  return newMessages
                })
              } else if (parsed.type === 'status') {
                // Show status as subtle inline text (don't accumulate, just show temporarily)
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: accumulatedText + `\n\n*${parsed.content}*`,
                    streaming: true
                  }
                  return newMessages
                })
                // Status doesn't accumulate - it's ephemeral
              } else if (parsed.type === 'files') {
                filesChanged = parsed.files
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error)
              }
            } catch (e) {
              // Ignore parsing errors for partial chunks
              if (data.includes('Error:')) {
                throw new Error(data)
              }
            }
          }
        }
      }

      // Files saved - reload preview
      if (filesChanged.length > 0) {
        console.log('✅ Files updated:', filesChanged)
        // Reload files to update preview
        await loadFiles()
      }

    } catch (error: any) {
      console.error('Error sending message:', error)
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}`,
          streaming: false
        }
        return newMessages
      })
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

          <div className="flex-1 bg-white/[0.02] relative overflow-hidden">
            {filesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 size={48} className="text-emerald-400 mx-auto mb-4 animate-spin" />
                  <p className="text-white font-bold text-lg mb-2">
                    Loading app files...
                  </p>
                </div>
              </div>
            ) : Object.keys(appFiles).length > 0 ? (
              <div className="h-full w-full flex">
                {/* Code Editor */}
                <div className="flex-1 h-full">
                  <SandpackProvider
                    template="static"
                    theme="dark"
                    files={appFiles}
                    options={{
                      autorun: false,
                    }}
                  >
                    <SandpackCodeEditor
                      showTabs
                      showLineNumbers
                      showInlineErrors
                      style={{ height: '100%' }}
                    />
                  </SandpackProvider>
                </div>

                {/* Live Preview */}
                <div className="flex-1 h-full bg-white border-l border-white/10 relative">
                  {/* Loading overlay with smooth fade */}
                  {previewLoading && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center transition-opacity duration-300">
                      <div className="bg-black/80 px-6 py-3 rounded-lg border border-emerald-500/30 flex items-center gap-3">
                        <Loader2 size={20} className="text-emerald-400 animate-spin" />
                        <span className="text-white/90 text-sm font-medium">Updating preview...</span>
                      </div>
                    </div>
                  )}

                  <iframe
                    key={`preview-${lastFileUpdate}`}
                    src={`/api/vendor/apps/${app.id}/preview`}
                    className={`w-full h-full border-0 transition-opacity duration-500 ${
                      previewLoading ? 'opacity-50' : 'opacity-100'
                    }`}
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileCode size={48} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 text-sm mb-4">
                    No files found for this app
                  </p>
                  <p className="text-white/40 text-xs">
                    Start by asking the AI to create your first component
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Chat Pane - Cursor AI Style */}
        <div className="w-[500px] flex flex-col bg-zinc-950">
          {/* Header */}
          <div className="flex-none px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <h2 className="text-sm font-medium text-white/90">
                AI Assistant
              </h2>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`group ${
                  message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-lg px-3.5 py-2.5 ${
                    message.role === 'user'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-white'
                      : 'bg-zinc-900/50 border border-white/5 text-white/95'
                  } ${message.streaming ? 'animate-pulse' : ''}`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : (
                    <div className="text-sm leading-relaxed prose prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            const language = match ? match[1] : 'typescript'
                            const codeString = String(children).replace(/\n$/, '')

                            if (inline) {
                              return (
                                <code className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-xs border border-emerald-500/20" {...props}>
                                  {children}
                                </code>
                              )
                            }

                            return (
                              <div className="my-3 rounded-md overflow-hidden border border-white/10 bg-zinc-900 group/code">
                                <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 border-b border-white/5">
                                  <span className="text-xs text-white/40 font-mono">{language}</span>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(codeString)}
                                    className="text-xs text-white/40 hover:text-white/80 transition-colors opacity-0 group-hover/code:opacity-100"
                                  >
                                    Copy
                                  </button>
                                </div>
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={language}
                                  PreTag="div"
                                  customStyle={{
                                    margin: 0,
                                    padding: '12px 16px',
                                    fontSize: '13px',
                                    background: 'transparent',
                                    lineHeight: '1.5'
                                  }}
                                  codeTagProps={{
                                    style: {
                                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
                                    }
                                  }}
                                  {...props}
                                >
                                  {codeString}
                                </SyntaxHighlighter>
                              </div>
                            )
                          },
                          p: ({ children }) => <p className="mb-2.5 text-white/90 leading-[1.6] last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2.5 space-y-1 text-white/85 pl-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2.5 space-y-1 text-white/85 pl-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-[1.6]">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({ children }) => <em className="italic text-white/90">{children}</em>,
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {message.content || (message.streaming ? '▋' : '')}
                      </ReactMarkdown>
                    </div>
                  )}

                  {message.filesChanged && message.filesChanged.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/5 space-y-1">
                      <p className="text-xs text-white/50 mb-1.5">
                        Files updated
                      </p>
                      {message.filesChanged.map((file, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          <Check size={12} className="text-emerald-400 flex-shrink-0" />
                          <span className="font-mono text-white/70">{file}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-none p-3 border-t border-white/5 bg-zinc-950">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Ask me to build something..."
                rows={1}
                disabled={loading}
                className="w-full px-4 py-2.5 pr-12 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all resize-none disabled:opacity-50"
                style={{ minHeight: '40px', maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = target.scrollHeight + 'px'
                }}
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:cursor-not-allowed rounded-md transition-all"
              >
                {loading ? (
                  <Loader2 size={16} className="text-white animate-spin" />
                ) : (
                  <Send size={16} className="text-white" />
                )}
              </button>
            </div>

            <p className="text-[10px] text-white/30 mt-1.5 text-center">
              ⏎ to send • ⇧⏎ for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
