"use client";

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Camera, Search, BookOpen, Brain, Code } from 'lucide-react';

export interface StreamEvent {
  event: string;
  message?: string;
  tool?: string;
  text?: string;
  code?: string;
  sections?: number;
  sources?: number;
  title?: string;
}

interface StreamingProgressProps {
  onComplete: (code: string) => void;
  onError: (error: string) => void;
}

export function StreamingProgress({ onComplete, onError }: StreamingProgressProps) {
  const [phase, setPhase] = useState<string>('starting');
  const [status, setStatus] = useState<string>('Initializing...');
  const [thinking, setThinking] = useState<string>('');
  const [codePreview, setCodePreview] = useState<string>('');
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  
  const phaseIcons: Record<string, any> = {
    screenshot: Camera,
    research: Search,
    thinking: Brain,
    generate: Code,
    complete: CheckCircle
  };
  
  const CurrentIcon = phaseIcons[phase] || Loader2;
  
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
            <CurrentIcon 
              size={28} 
              className={`${phase === 'complete' ? 'text-green-500' : 'text-white/60 animate-pulse'}`} 
              strokeWidth={2}
            />
          </div>
          <div className="flex-1">
            <div className="text-white font-black uppercase text-lg tracking-tight">
              AI GENERATING
            </div>
            <div className="text-white/60 text-sm">
              {status}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Tools Used */}
        {toolsUsed.length > 0 && (
          <div className="mb-6">
            <div className="text-white/40 text-xs uppercase tracking-wider mb-3 font-black">
              Tools Used
            </div>
            <div className="flex flex-wrap gap-2">
              {toolsUsed.map((tool, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 flex items-center gap-2">
                  <CheckCircle size={12} className="text-green-500" />
                  {tool}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Thinking Preview */}
        {thinking && (
          <div className="mb-6 bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} className="text-purple-400" />
              <div className="text-purple-400 text-xs uppercase font-black">Deep Thinking</div>
            </div>
            <div className="text-white/60 text-xs leading-relaxed max-h-32 overflow-auto font-mono">
              {thinking.substring(0, 300)}...
            </div>
          </div>
        )}
        
        {/* Code Preview */}
        {codePreview && (
          <div className="bg-black border border-white/5 rounded-xl p-4 max-h-64 overflow-auto">
            <div className="text-white/40 text-xs uppercase tracking-wider mb-2 font-black">
              Generating Code...
            </div>
            <pre className="text-white/60 text-xs font-mono leading-relaxed">
              {codePreview.substring(0, 500)}...
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export function useStreamingGeneration(
  apiUrl: string,
  requestData: any,
  onComplete: (code: string) => void
) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState('');
  const [thinking, setThinking] = useState('');
  const [code, setCode] = useState('');
  const [progress, setProgress] = useState(0);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  
  const startStreaming = async () => {
    setIsStreaming(true);
    setProgress(10);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) throw new Error('Stream failed');
      if (!response.body) throw new Error('No stream');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const event: StreamEvent = JSON.parse(line.slice(6));
            
            switch (event.event) {
              case 'status':
                setStatus(event.message || '');
                break;
              case 'tool_start':
                setToolsUsed(prev => [...prev, event.tool || '']);
                setProgress(prev => Math.min(prev + 15, 70));
                break;
              case 'thinking':
                setThinking(prev => prev + (event.text || ''));
                break;
              case 'code_chunk':
                setCode(prev => prev + (event.text || ''));
                setProgress(prev => Math.min(prev + 1, 95));
                break;
              case 'complete':
                setCode(event.code || '');
                setProgress(100);
                onComplete(event.code || '');
                setIsStreaming(false);
                break;
              case 'error':
                throw new Error(event.message);
            }
          } catch (parseError) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error: any) {
      console.error('Streaming error:', error);
      setIsStreaming(false);
    }
  };
  
  return {
    isStreaming,
    status,
    thinking,
    code,
    progress,
    toolsUsed,
    startStreaming
  };
}

