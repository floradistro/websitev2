"use client";

import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, User, Bot, Paperclip, Image as ImageIcon } from 'lucide-react';

interface Message {
  id: number;
  sender: 'user' | 'support';
  text: string;
  timestamp: string;
  avatar?: string;
}

interface VendorSupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorSupportChat({ isOpen, onClose }: VendorSupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'support',
      text: 'Hi there! Welcome to Flora Distro Vendor Support. How can we help you today?',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputText, setInputText] = useState('');
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
      sender: 'user',
      text: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setTyping(true);

    // Simulate support response
    setTimeout(() => {
      const responses = [
        "Thanks for reaching out! I'm looking into that for you right now.",
        "That's a great question. Let me connect you with our product team.",
        "I can help with that. Could you provide your product ID or order number?",
        "Our team will review this and get back to you within 2 hours.",
        "I've escalated this to our vendor success team. They'll reach out shortly."
      ];
      
      const supportMessage: Message = {
        id: messages.length + 2,
        sender: 'support',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, supportMessage]);
      setTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <div 
        className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-[#1a1a1a] border-l border-white/10 z-50 flex flex-col shadow-2xl"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="border-b border-white/5 p-6 bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/20 rounded-full flex items-center justify-center">
                <MessageCircle size={20} className="text-sky-500" />
              </div>
              <div>
                <h2 className="text-white font-medium">Vendor Support</h2>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Quick Info */}
          <div className="bg-white/5 border border-white/5 p-3">
            <p className="text-white/60 text-xs leading-relaxed">
              Typical response time: <span className="text-white font-medium">Under 2 hours</span>
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ 
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(14, 165, 233, 0.03) 0%, transparent 50%)'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fadeIn`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' ? 'bg-sky-500/20' : 'bg-white/10'
              }`}>
                {message.sender === 'user' ? (
                  <User size={16} className="text-sky-500" />
                ) : (
                  <Bot size={16} className="text-white/60" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[75%] ${message.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-sky-500 text-white'
                    : 'bg-white/10 text-white/90 border border-white/5'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
                <span className="text-xs text-white/40 px-2">
                  {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {typing && (
            <div className="flex gap-3 animate-fadeIn">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10">
                <Bot size={16} className="text-white/60" />
              </div>
              <div className="bg-white/10 border border-white/5 px-4 py-3 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="border-t border-white/5 px-6 py-3 bg-[#0a0a0a]">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button className="flex-shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-xs transition-all duration-300">
              COA Question
            </button>
            <button className="flex-shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-xs transition-all duration-300">
              Product Approval
            </button>
            <button className="flex-shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-xs transition-all duration-300">
              Payout Question
            </button>
            <button className="flex-shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-xs transition-all duration-300">
              Technical Issue
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/5 p-4 bg-[#1a1a1a]">
          <div className="flex items-end gap-2">
            {/* Attachment Buttons */}
            <div className="flex gap-1 pb-2">
              <button 
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                title="Attach file"
              >
                <Paperclip size={18} className="text-white/60" />
              </button>
              <button 
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                title="Attach image"
              >
                <ImageIcon size={18} className="text-white/60" />
              </button>
            </div>

            {/* Input */}
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows={1}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white placeholder-white/40 px-4 py-3 pr-12 focus:outline-none focus:border-white/20 transition-colors resize-none max-h-32"
                style={{ minHeight: '44px' }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="p-3 bg-sky-500 hover:bg-sky-400 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex-shrink-0"
              title="Send message"
            >
              <Send size={20} />
            </button>
          </div>

          <p className="text-white/40 text-xs mt-3 text-center">
            Press Enter to send • Shift + Enter for new line
          </p>
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

