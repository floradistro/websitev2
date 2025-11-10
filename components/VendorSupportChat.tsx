"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  MessageCircle,
  User,
  Bot,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";

interface Message {
  id: number;
  sender: "user" | "support";
  text: string;
  timestamp: string;
  avatar?: string;
}

interface VendorSupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorSupportChat({
  isOpen,
  onClose,
}: VendorSupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "support",
      text: "Hi there! Welcome to Yacht Club Vendor Support. How can we help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      sender: "user",
      text: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setTyping(true);

    // Simulate support response
    setTimeout(() => {
      const responses = [
        "Thanks for reaching out! I'm looking into that for you right now.",
        "That's a great question. Let me connect you with our product team.",
        "I can help with that. Could you provide your product ID or order number?",
        "Our team will review this and get back to you within 2 hours.",
        "I've escalated this to our vendor success team. They'll reach out shortly.",
      ];

      const supportMessage: Message = {
        id: messages.length + 2,
        sender: "support",
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, supportMessage]);
      setTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] animate-fadeIn"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full md:w-[420px] bg-[#0a0a0a] border-l border-white/5 z-[9999] flex flex-col"
        style={{ animation: "slideInRight 0.3s ease-out" }}
      >
        {/* Header */}
        <div className="border-b border-white/5 p-6 bg-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 flex items-center justify-center overflow-hidden">
                <img
                  src="/yacht-club-logo.png"
                  alt="Yacht Club"
                  className="w-full h-full object-contain p-1.5 opacity-80"
                />
              </div>
              <div>
                <h2 className="text-white text-sm uppercase tracking-[0.2em] font-light mb-1">
                  Support
                </h2>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <div className="w-1.5 h-1.5 bg-green-500/80 rounded-full"></div>
                  <span className="uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] flex flex-col ${message.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* Sender Label */}
                <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1 px-1">
                  {message.sender === "user" ? "You" : "Flora Support"}
                </div>

                {/* Message */}
                <div
                  className={`px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-white/5 border border-white/10"
                      : "bg-black border border-white/5"
                  }`}
                >
                  <p className="text-sm text-white/90 leading-relaxed">
                    {message.text}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-white/30 mt-1 px-1 uppercase tracking-wider">
                  {new Date(message.timestamp).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {typing && (
            <div className="flex justify-start animate-fadeIn">
              <div className="flex flex-col items-start">
                <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-1 px-1">
                  Flora Support
                </div>
                <div className="bg-black border border-white/5 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div
                      className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="border-t border-white/5 px-6 py-4 bg-black">
          <div className="grid grid-cols-4 gap-2">
            <button className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/60 hover:text-white text-[10px] uppercase tracking-[0.15em] transition-all duration-300">
              COA
            </button>
            <button className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/60 hover:text-white text-[10px] uppercase tracking-[0.15em] transition-all duration-300">
              Approval
            </button>
            <button className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/60 hover:text-white text-[10px] uppercase tracking-[0.15em] transition-all duration-300">
              Payout
            </button>
            <button className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/60 hover:text-white text-[10px] uppercase tracking-[0.15em] transition-all duration-300">
              Technical
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/5 p-6 bg-black">
          <div className="flex items-stretch gap-3">
            {/* Input */}
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message..."
                rows={1}
                className="w-full h-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 text-sm focus:outline-none focus:border-white/10 transition-colors resize-none"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="w-12 bg-white text-black border border-white hover:bg-black hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center flex-shrink-0"
              title="Send"
            >
              <Send size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
