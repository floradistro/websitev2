/**
 * AI Code Feature V2 - React Hook for AI Chat
 * Handles SSE streaming connection to AI chat API
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
  toolUses?: ToolUse[]
}

export interface ToolUse {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input?: any
  output?: any
  error?: string
}

export interface FileChange {
  path: string
  action: 'created' | 'updated' | 'deleted'
  linesChanged?: number
}

interface UseAIChatOptions {
  appId: string
  sessionId?: string
  onMessage?: (message: ChatMessage) => void
  onToolUse?: (toolUse: ToolUse) => void
  onFileChange?: (change: FileChange) => void
  onError?: (error: string) => void
}

interface UseAIChatReturn {
  messages: ChatMessage[]
  isConnected: boolean
  isProcessing: boolean
  currentTool: string | null
  fileChanges: FileChange[]
  sendMessage: (message: string) => Promise<void>
  cancel: () => void
  clearHistory: () => void
}

export function useAIChat(options: UseAIChatOptions): UseAIChatReturn {
  const {
    appId,
    sessionId,
    onMessage,
    onToolUse,
    onFileChange,
    onError
  } = options

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTool, setCurrentTool] = useState<string | null>(null)
  const [fileChanges, setFileChanges] = useState<FileChange[]>([])

  const eventSourceRef = useRef<EventSource | null>(null)
  const currentMessageRef = useRef<ChatMessage | null>(null)
  const toolUsesRef = useRef<Map<string, ToolUse>>(new Map())

  /**
   * Close SSE connection
   */
  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
      setIsProcessing(false)
      setCurrentTool(null)
    }
  }, [])

  /**
   * Send a message to the AI
   */
  const sendMessage = useCallback(async (message: string) => {
    if (isProcessing) {
      console.warn('Already processing a message')
      return
    }

    try {
      setIsProcessing(true)

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, userMessage])

      // Initialize assistant message
      currentMessageRef.current = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
        toolUses: []
      }

      setMessages(prev => [...prev, currentMessageRef.current!])
      toolUsesRef.current.clear()

      // Create SSE connection
      const response = await fetch('/api/vendor/ai-chat-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message,
          appId,
          sessionId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // Read SSE stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      setIsConnected(true)

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))
              handleSSEMessage(data)
            } catch (e) {
              console.error('Failed to parse SSE message:', e)
            }
          }
        }
      }

      // Mark message as complete
      if (currentMessageRef.current) {
        currentMessageRef.current.isStreaming = false
        setMessages(prev => [...prev.slice(0, -1), currentMessageRef.current!])
      }

      setIsConnected(false)
      setIsProcessing(false)
      setCurrentTool(null)
    } catch (error: any) {
      console.error('Send message error:', error)
      setIsConnected(false)
      setIsProcessing(false)
      setCurrentTool(null)

      const errorMsg = error.message || 'Failed to send message'
      onError?.(errorMsg)

      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `❌ Error: ${errorMsg}`,
          timestamp: Date.now()
        }
      ])
    }
  }, [appId, sessionId, isProcessing, onError])

  /**
   * Handle incoming SSE message
   */
  const handleSSEMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'connection_established':
        setIsConnected(true)
        break

      case 'text_delta':
        if (currentMessageRef.current) {
          currentMessageRef.current.content += data.data.text
          setMessages(prev => [...prev.slice(0, -1), currentMessageRef.current!])
        }
        break

      case 'tool_use_start':
        const newToolUse: ToolUse = {
          id: data.data.toolId,
          name: data.data.toolName,
          status: 'pending'
        }

        toolUsesRef.current.set(data.data.toolId, newToolUse)

        if (currentMessageRef.current) {
          currentMessageRef.current.toolUses = Array.from(toolUsesRef.current.values())
          setMessages(prev => [...prev.slice(0, -1), currentMessageRef.current!])
        }

        setCurrentTool(data.data.toolName)
        onToolUse?.(newToolUse)
        break

      case 'tool_use_progress':
        const existingTool = toolUsesRef.current.get(data.data.toolId)

        if (existingTool) {
          existingTool.status = data.data.status === 'completed' ? 'completed' :
                                data.data.status === 'failed' ? 'failed' : 'running'

          if (data.data.data?.result) {
            existingTool.output = data.data.data.result
          }

          if (data.data.data?.error) {
            existingTool.error = data.data.data.error
          }

          toolUsesRef.current.set(data.data.toolId, existingTool)

          if (currentMessageRef.current) {
            currentMessageRef.current.toolUses = Array.from(toolUsesRef.current.values())
            setMessages(prev => [...prev.slice(0, -1), currentMessageRef.current!])
          }

          onToolUse?.(existingTool)

          // Track file changes
          if (existingTool.name === 'apply_edit' && existingTool.output) {
            const fileChange: FileChange = {
              path: existingTool.output.path,
              action: existingTool.output.action || 'updated',
              linesChanged: existingTool.output.linesChanged
            }

            setFileChanges(prev => [...prev, fileChange])
            onFileChange?.(fileChange)
          }
        }
        break

      case 'tool_use_complete':
        setCurrentTool(null)
        break

      case 'message_complete':
        if (currentMessageRef.current) {
          currentMessageRef.current.isStreaming = false
          setMessages(prev => [...prev.slice(0, -1), currentMessageRef.current!])
          onMessage?.(currentMessageRef.current)
        }
        setIsConnected(false)
        setIsProcessing(false)
        setCurrentTool(null)
        break

      case 'error':
        const errorMessage = data.data?.message || 'An error occurred'
        onError?.(errorMessage)

        if (currentMessageRef.current) {
          currentMessageRef.current.content += `\n\n❌ Error: ${errorMessage}`
          currentMessageRef.current.isStreaming = false
          setMessages(prev => [...prev.slice(0, -1), currentMessageRef.current!])
        }

        setIsConnected(false)
        setIsProcessing(false)
        setCurrentTool(null)
        break
    }
  }, [onMessage, onToolUse, onFileChange, onError])

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    closeConnection()
  }, [closeConnection])

  /**
   * Clear chat history
   */
  const clearHistory = useCallback(() => {
    setMessages([])
    setFileChanges([])
    currentMessageRef.current = null
    toolUsesRef.current.clear()
  }, [])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      closeConnection()
    }
  }, [closeConnection])

  return {
    messages,
    isConnected,
    isProcessing,
    currentTool,
    fileChanges,
    sendMessage,
    cancel,
    clearHistory
  }
}
