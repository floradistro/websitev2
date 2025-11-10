"use client";

import React, { useState, useEffect } from "react";
import { X, MessageSquare, Trash2, Clock, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  messages?: Message[];
}

interface ConversationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation?: (conversationId: string, messages: Message[]) => void;
}

export function ConversationHistory({
  isOpen,
  onClose,
  onLoadConversation,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      // For now, fetch from database - you can create an API endpoint
      // Or directly query from React editor's local storage
      const storedConversations = localStorage.getItem("code_conversations");
      if (storedConversations) {
        setConversations(JSON.parse(storedConversations));
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load conversations:", err);
      }
    }
    setLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    setLoading(true);

    try {
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv?.messages) {
        setMessages(conv.messages);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load messages:", err);
      }
    }

    setLoading(false);
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm("Delete this conversation? This cannot be undone.")) return;

    const updated = conversations.filter((c) => c.id !== conversationId);
    setConversations(updated);
    localStorage.setItem("code_conversations", JSON.stringify(updated));

    if (selectedConversation === conversationId) {
      setSelectedConversation(null);
      setMessages([]);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 7) return date.toLocaleDateString();
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-black border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <MessageSquare
                size={16}
                className="text-white/60"
                strokeWidth={2}
              />
            </div>
            <div>
              <h2
                className="text-white font-black uppercase text-sm tracking-tight"
                style={{ fontWeight: 900 }}
              >
                Conversation History
              </h2>
              <p className="text-white/40 text-[10px] uppercase tracking-wide">
                {conversations.length} Conversations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Conversation List */}
          <div className="w-80 border-r border-white/5 flex flex-col bg-[#0a0a0a]">
            <div className="flex-1 overflow-y-auto p-2">
              {loading && conversations.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-white/20 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-white/20 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-white/20 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Sparkles
                    size={24}
                    className="text-white/20 mb-3"
                    strokeWidth={1.5}
                  />
                  <p className="text-white/40 text-xs">No conversations yet</p>
                  <p className="text-white/20 text-[10px] mt-1">
                    Start chatting to see history
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadMessages(conv.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all border group ${
                        selectedConversation === conv.id
                          ? "bg-white/5 border-white/10 text-white"
                          : "border-transparent text-white/60 hover:bg-white/[0.02] hover:border-white/5 hover:text-white/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div
                          className="text-xs font-black uppercase tracking-tight truncate flex-1"
                          style={{ fontWeight: 900 }}
                        >
                          {conv.title}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-white/40 hover:text-red-400 rounded transition-all"
                        >
                          <Trash2 size={12} strokeWidth={2} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <Clock size={10} strokeWidth={2} />
                        {formatTime(conv.updated_at)}
                        <span className="ml-auto">
                          {conv.message_count} msgs
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main - Messages */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-white/10 border border-white/20 text-white"
                            : "bg-[#0a0a0a] border border-white/5 text-white/80"
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-wide mb-2 opacity-60">
                          {msg.role === "user" ? "You" : "AI"}
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content.length > 500
                            ? msg.content.substring(0, 500) + "..."
                            : msg.content}
                        </div>
                        <div className="text-[9px] text-white/30 mt-2">
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {onLoadConversation && (
                  <div className="p-4 border-t border-white/5">
                    <button
                      onClick={() =>
                        onLoadConversation(selectedConversation, messages)
                      }
                      className="w-full bg-white/10 hover:bg-white/15 border border-white/20 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all"
                      style={{ fontWeight: 900 }}
                    >
                      Load This Conversation
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare
                    size={48}
                    className="text-white/10 mx-auto mb-4"
                    strokeWidth={1.5}
                  />
                  <p className="text-white/40 text-sm">
                    Select a conversation to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
