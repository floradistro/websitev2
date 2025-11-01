/**
 * AI Code Feature V2 - Session Manager
 * Persistent session state with Redis for resume capability
 */

import { Redis } from '@upstash/redis'

// Types
export interface Message {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
  timestamp: number
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result'
  text?: string
  id?: string
  name?: string
  input?: any
  content?: any
  is_error?: boolean
}

export interface FileModification {
  path: string
  oldContent: string
  newContent: string
  timestamp: number
  applied: boolean
}

export interface PendingTool {
  id: string
  name: string
  input: any
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: any
  error?: string
  startedAt?: number
  completedAt?: number
}

export interface SessionState {
  sessionId: string
  appId: string
  vendorId: string
  createdAt: number
  lastActivityAt: number
  messages: Message[]
  fileModifications: FileModification[]
  pendingTools: PendingTool[]
  metadata: {
    totalTokens?: number
    totalCost?: number
    model?: string
    [key: string]: any
  }
}

// Initialize Redis client
let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error('Redis credentials not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')
    }

    redis = new Redis({
      url,
      token,
    })
  }

  return redis
}

/**
 * Session Manager Class
 */
export class SessionManager {
  private redis: Redis
  private ttl: number // Session TTL in seconds (default 24 hours)

  constructor(ttl: number = 86400) {
    this.redis = getRedis()
    this.ttl = ttl
  }

  /**
   * Create a new session
   */
  async createSession(
    sessionId: string,
    appId: string,
    vendorId: string
  ): Promise<SessionState> {
    const now = Date.now()

    const session: SessionState = {
      sessionId,
      appId,
      vendorId,
      createdAt: now,
      lastActivityAt: now,
      messages: [],
      fileModifications: [],
      pendingTools: [],
      metadata: {}
    }

    await this.redis.setex(
      this.getKey(sessionId),
      this.ttl,
      JSON.stringify(session)
    )

    return session
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionState | null> {
    const data = await this.redis.get<string>(this.getKey(sessionId))

    if (!data) {
      return null
    }

    try {
      return typeof data === 'string' ? JSON.parse(data) : data as SessionState
    } catch (error) {
      console.error('Failed to parse session data:', error)
      return null
    }
  }

  /**
   * Update session (extends TTL)
   */
  async updateSession(session: SessionState): Promise<void> {
    session.lastActivityAt = Date.now()

    await this.redis.setex(
      this.getKey(session.sessionId),
      this.ttl,
      JSON.stringify(session)
    )
  }

  /**
   * Add message to session
   */
  async addMessage(
    sessionId: string,
    message: Omit<Message, 'timestamp'>
  ): Promise<void> {
    const session = await this.getSession(sessionId)

    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    session.messages.push({
      ...message,
      timestamp: Date.now()
    })

    await this.updateSession(session)
  }

  /**
   * Add file modification
   */
  async addFileModification(
    sessionId: string,
    modification: Omit<FileModification, 'timestamp' | 'applied'>
  ): Promise<void> {
    const session = await this.getSession(sessionId)

    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    session.fileModifications.push({
      ...modification,
      timestamp: Date.now(),
      applied: false
    })

    await this.updateSession(session)
  }

  /**
   * Mark file modification as applied
   */
  async markFileModificationApplied(
    sessionId: string,
    path: string
  ): Promise<void> {
    const session = await this.getSession(sessionId)

    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    // Find most recent modification for this file
    for (let i = session.fileModifications.length - 1; i >= 0; i--) {
      if (session.fileModifications[i].path === path) {
        session.fileModifications[i].applied = true
        break
      }
    }

    await this.updateSession(session)
  }

  /**
   * Add pending tool
   */
  async addPendingTool(
    sessionId: string,
    tool: Omit<PendingTool, 'status' | 'startedAt'>
  ): Promise<void> {
    const session = await this.getSession(sessionId)

    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    session.pendingTools.push({
      ...tool,
      status: 'pending'
    })

    await this.updateSession(session)
  }

  /**
   * Update tool status
   */
  async updateToolStatus(
    sessionId: string,
    toolId: string,
    status: PendingTool['status'],
    result?: any,
    error?: string
  ): Promise<void> {
    const session = await this.getSession(sessionId)

    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const tool = session.pendingTools.find(t => t.id === toolId)

    if (!tool) {
      throw new Error(`Tool ${toolId} not found in session`)
    }

    tool.status = status

    if (status === 'running' && !tool.startedAt) {
      tool.startedAt = Date.now()
    }

    if (status === 'completed' || status === 'failed') {
      tool.completedAt = Date.now()

      if (result !== undefined) {
        tool.result = result
      }

      if (error) {
        tool.error = error
      }
    }

    await this.updateSession(session)
  }

  /**
   * Get pending tools
   */
  async getPendingTools(sessionId: string): Promise<PendingTool[]> {
    const session = await this.getSession(sessionId)

    if (!session) {
      return []
    }

    return session.pendingTools.filter(t =>
      t.status === 'pending' || t.status === 'running'
    )
  }

  /**
   * Update metadata
   */
  async updateMetadata(
    sessionId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const session = await this.getSession(sessionId)

    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    session.metadata = {
      ...session.metadata,
      ...metadata
    }

    await this.updateSession(session)
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(this.getKey(sessionId))
  }

  /**
   * Get all sessions for a vendor (for admin/debugging)
   */
  async getVendorSessions(vendorId: string): Promise<SessionState[]> {
    // This requires scanning keys - use sparingly in production
    const pattern = `ai-session:*`
    const keys = await this.redis.keys(pattern)

    if (!keys || keys.length === 0) {
      return []
    }

    const sessions: SessionState[] = []

    for (const key of keys) {
      const data = await this.redis.get<string>(key)

      if (data) {
        try {
          const session = typeof data === 'string' ? JSON.parse(data) : data as SessionState

          if (session.vendorId === vendorId) {
            sessions.push(session)
          }
        } catch (error) {
          console.error(`Failed to parse session for key ${key}:`, error)
        }
      }
    }

    return sessions.sort((a, b) => b.lastActivityAt - a.lastActivityAt)
  }

  /**
   * Get conversation history for Claude API
   */
  async getConversationHistory(sessionId: string): Promise<Message[]> {
    const session = await this.getSession(sessionId)

    if (!session) {
      return []
    }

    return session.messages
  }

  /**
   * Clear old sessions (cleanup job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const pattern = `ai-session:*`
    const keys = await this.redis.keys(pattern)

    if (!keys || keys.length === 0) {
      return 0
    }

    let deletedCount = 0
    const cutoffTime = Date.now() - (this.ttl * 1000)

    for (const key of keys) {
      const data = await this.redis.get<string>(key)

      if (data) {
        try {
          const session = typeof data === 'string' ? JSON.parse(data) : data as SessionState

          if (session.lastActivityAt < cutoffTime) {
            await this.redis.del(key)
            deletedCount++
          }
        } catch (error) {
          // Delete corrupted sessions
          await this.redis.del(key)
          deletedCount++
        }
      }
    }

    return deletedCount
  }

  /**
   * Generate Redis key for session
   */
  private getKey(sessionId: string): string {
    return `ai-session:${sessionId}`
  }
}

// Export singleton instance
export const sessionManager = new SessionManager()

// Export utility functions
export async function createSession(
  sessionId: string,
  appId: string,
  vendorId: string
): Promise<SessionState> {
  return sessionManager.createSession(sessionId, appId, vendorId)
}

export async function getSession(sessionId: string): Promise<SessionState | null> {
  return sessionManager.getSession(sessionId)
}

export async function addMessage(
  sessionId: string,
  message: Omit<Message, 'timestamp'>
): Promise<void> {
  return sessionManager.addMessage(sessionId, message)
}

export async function getConversationHistory(sessionId: string): Promise<Message[]> {
  return sessionManager.getConversationHistory(sessionId)
}
