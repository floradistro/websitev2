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
  Sparkles,
  Code2,
  Eye,
  Zap
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
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview')

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

          if (lastFileUpdate > 0 && timestamp > lastFileUpdate) {
            // Start loading transition
            setPreviewLoading(true)

            // Clear existing reload timeout
            if (reloadTimeoutRef.current) {
              clearTimeout(reloadTimeoutRef.current)
            }

            // Set new reload timeout with smooth transition
            reloadTimeoutRef.current = setTimeout(() => {
              setLastFileUpdate(timestamp)
              loadFiles()

              // End loading after iframe loads
              setTimeout(() => {
                setPreviewLoading(false)
              }, 800)
            }, 1000) // Wait 1 second before reloading
          } else if (lastFileUpdate === 0) {
            setLastFileUpdate(timestamp)
          }
        }
      } catch (error) {
        console.error('Error checking file timestamp:', error)
      }
    }, 2000) // Check every 2 seconds

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
    if (!app?.id) return

    setFilesLoading(true)

    try {
      const response = await fetch(`/api/vendor/apps/${app.id}/files`)
      const data = await response.json()

      if (data.success && data.files) {
        // Convert array to Sandpack format: { "path": "content" }
        const filesObject: Record<string, string> = {}
        data.files.forEach((file: any) => {
          if (file.path && file.content) {
            filesObject[file.path] = file.content
          }
        })
        setAppFiles(filesObject)
      }
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setFilesLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading || !app) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    // Add placeholder assistant message
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: '', streaming: true }
    ])

    try {
      const response = await fetch('/api/vendor/ai-chat-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor?.id || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          appId: app.id
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      const filesChanged: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue

          const data = line.slice(6)

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'text_delta') {
              // V2: Stream text
              setMessages(prev => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1].content += parsed.data.text
                return newMessages
              })
            } else if (parsed.type === 'tool_use_progress') {
              // V2: Tool execution update
              const { toolId, status, data: toolData } = parsed.data

              setMessages(prev => {
                const newMessages = [...prev]
                const lastMsg = newMessages[newMessages.length - 1]

                // Add tool status to message
                if (status === 'executing') {
                  if (!lastMsg.content.includes('*Executing:')) {
                    lastMsg.content += `\n\n*Executing: ${toolData?.toolName || 'tool'}...*`
                  }
                } else if (status === 'completed' && toolData?.filePath) {
                  filesChanged.push(toolData.filePath)
                }

                return newMessages
              })
            } else if (parsed.type === 'message_complete') {
              // V2: Stream complete
              setMessages(prev => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  filesChanged: filesChanged.length > 0 ? filesChanged : undefined,
                  streaming: false
                }
                return newMessages
              })
              break
            } else if (parsed.type === 'error') {
              // V2: Error occurred
              throw new Error(parsed.data.message || 'An error occurred')
            }
          } catch (e: any) {
            // Ignore JSON parsing errors for incomplete chunks
            if (e.message && !e.message.includes('JSON')) {
              throw e
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
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 size={32} className="text-white/60 animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header - Edge to Edge */}
      <div className="flex-none border-b border-white/5 bg-[#0a0a0a]">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Link
              href="/vendor/code"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={16} className="text-white/60" />
            </Link>

            <div>
              <h1 className="text-white text-sm font-black tracking-tight" style={{ fontWeight: 900 }}>
                {app.name}
              </h1>
              <p className="text-white/40 text-[9px] uppercase tracking-[0.15em]">
                {app.app_type.replace('-', ' ')}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Live Badge */}
            <div className="px-2 py-1 bg-white/5 rounded-lg flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-green-400" />
              <span className="text-[9px] uppercase tracking-[0.15em] font-black text-white/60" style={{ fontWeight: 900 }}>
                Live
              </span>
            </div>

            {/* Publish */}
            <button
              onClick={publishApp}
              disabled={publishing}
              className="px-3 py-1.5 bg-white hover:bg-white/90 disabled:bg-white/20 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <span className="text-[9px] uppercase tracking-[0.15em] font-black text-black" style={{ fontWeight: 900 }}>
                {publishing ? 'Publishing...' : 'Publish'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main - Edge to Edge, Fixed Height */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Preview/Code Section */}
        <div className="flex-1 flex flex-col border-r border-white/5 min-w-0 overflow-hidden">
          {/* Toolbar */}
          <div className="flex-none px-4 py-2 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between">
            {/* Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.15em] font-black transition-all ${
                  viewMode === 'preview'
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
                style={{ fontWeight: 900 }}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.15em] font-black transition-all ${
                  viewMode === 'code'
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
                style={{ fontWeight: 900 }}
              >
                Code
              </button>
            </div>

            {/* Auto-refresh */}
            {viewMode === 'preview' && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg">
                <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] uppercase tracking-[0.15em] font-black text-white/40" style={{ fontWeight: 900 }}>
                  Auto-Refresh
                </span>
              </div>
            )}
          </div>

          {/* Content - Only this scrolls */}
          <div className="flex-1 bg-black relative overflow-hidden min-h-0">
            {filesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 size={32} className="text-white/60 mx-auto mb-3 animate-spin" />
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                    Loading...
                  </p>
                </div>
              </div>
            ) : Object.keys(appFiles).length > 0 ? (
              <div className="h-full w-full">
                {/* Code */}
                {viewMode === 'code' && (
                  <div className="h-full w-full">
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
                )}

                {/* Preview */}
                {viewMode === 'preview' && (
                  <div className="h-full w-full bg-white relative">
                    {previewLoading && (
                      <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center">
                        <div className="bg-black/90 px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2">
                          <Loader2 size={16} className="text-white/60 animate-spin" />
                          <span className="text-white/60 text-[10px] uppercase tracking-[0.15em]">Refreshing...</span>
                        </div>
                      </div>
                    )}

                    <iframe
                      key={`preview-${lastFileUpdate}`}
                      src={`/api/vendor/apps/${app.id}/preview`}
                      className={`w-full h-full border-0 transition-opacity ${
                        previewLoading ? 'opacity-50' : 'opacity-100'
                      }`}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-3">
                    <FileCode size={32} className="text-white/20" />
                  </div>
                  <p className="text-white/60 text-[10px] uppercase tracking-[0.15em] mb-1">
                    No Files
                  </p>
                  <p className="text-white/40 text-[9px] uppercase tracking-[0.15em]">
                    Ask AI to create
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Chat Section - Edge to Edge */}
        <div className="w-[420px] flex flex-col bg-[#0a0a0a] border-l border-white/5">
          {/* Header */}
          <div className="flex-none px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                  AI Assistant
                </h2>
                <p className="text-white/40 text-[8px] uppercase tracking-[0.15em]">
                  Claude Sonnet
                </p>
              </div>
            </div>
          </div>

          {/* Messages - Only this scrolls */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-white/10 border border-white/10'
                      : 'bg-white/5 border border-white/5'
                  } ${message.streaming ? 'animate-pulse' : ''}`}
                >
                  {message.role === 'user' ? (
                    <p className="text-[11px] leading-relaxed text-white/90 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : (
                    <div className="text-[11px] leading-relaxed prose prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '')
                            const language = match ? match[1] : 'typescript'
                            const codeString = String(children).replace(/\n$/, '')

                            if (inline) {
                              return (
                                <code className="px-1.5 py-0.5 rounded bg-white/10 text-white/90 font-mono text-[10px]" {...props}>
                                  {children}
                                </code>
                              )
                            }

                            return (
                              <div className="my-2 rounded-lg overflow-hidden border border-white/10 bg-black/50">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
                                  <span className="text-[8px] text-white/40 uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>{language}</span>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(codeString)}
                                    className="text-[8px] text-white/40 hover:text-white/80 uppercase tracking-[0.15em]"
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
                                    padding: '12px',
                                    fontSize: '10px',
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
                          p: ({ children }) => <p className="mb-2 text-white/80 leading-relaxed last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-white/70 pl-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-white/70 pl-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-black text-white" style={{ fontWeight: 900 }}>{children}</strong>,
                          em: ({ children }) => <em className="italic text-white/80">{children}</em>,
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-white underline">
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
                    <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                      <p className="text-[8px] text-white/40 uppercase tracking-[0.15em] mb-1.5 font-black" style={{ fontWeight: 900 }}>
                        Files Updated
                      </p>
                      {message.filesChanged.map((file, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[9px] bg-white/5 rounded px-2 py-1">
                          <Check size={10} className="text-green-400 flex-shrink-0" />
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
          <div className="flex-none p-3 border-t border-white/5">
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
                placeholder="ASK ME TO BUILD..."
                rows={1}
                disabled={loading}
                className="w-full px-3 py-2 pr-11 bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/30 rounded-lg text-[11px] text-white placeholder:text-white/30 placeholder:uppercase placeholder:tracking-[0.15em] focus:outline-none transition-colors resize-none disabled:opacity-50"
                style={{ minHeight: '36px', maxHeight: '100px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = target.scrollHeight + 'px'
                }}
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white hover:bg-white/90 disabled:bg-white/20 disabled:cursor-not-allowed rounded transition-colors"
              >
                {loading ? (
                  <Loader2 size={14} className="text-black animate-spin" />
                ) : (
                  <Send size={14} className="text-black" />
                )}
              </button>
            </div>

            <p className="text-[8px] text-white/20 text-center mt-1.5 uppercase tracking-[0.15em]">
              ⏎ Send • ⇧⏎ New Line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
