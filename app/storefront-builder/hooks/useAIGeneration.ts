/**
 * AI Generation Hook
 * Handles Claude Sonnet 4.5 streaming generation with backups and error recovery
 */

import { useState, useCallback, useEffect } from 'react';
import { StreamingState, ToolExecuted, ScreenshotPreview, Vendor } from '@/lib/storefront-builder/types';

export function useAIGeneration(
  code: string,
  setCode: (code: string) => void,
  selectedVendor: string,
  currentVendor?: Vendor
) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStreamingPanel, setShowStreamingPanel] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [streamingThinking, setStreamingThinking] = useState<string>('');
  const [streamingText, setStreamingText] = useState<string>('');
  const [displayedCode, setDisplayedCode] = useState<string>('');
  const [toolsExecuted, setToolsExecuted] = useState<ToolExecuted[]>([]);
  const [screenshotPreview, setScreenshotPreview] = useState<ScreenshotPreview | null>(null);
  const [generatedCodeBackup, setGeneratedCodeBackup] = useState<string>('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset displayed code when panel opens/closes
  useEffect(() => {
    if (!showStreamingPanel) {
      setDisplayedCode('');
    }
  }, [showStreamingPanel]);

  // Handle AI generation with streaming
  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) return;

    // Detect if editing existing or generating new
    const hasSubstantialContent = code.length > 500 &&
      !code.includes('Your Headline') &&
      !code.includes('BlankCanvas');

    const isEditingExisting = hasSubstantialContent && (
      aiPrompt.toLowerCase().includes('optimize') ||
      aiPrompt.toLowerCase().includes('improve') ||
      aiPrompt.toLowerCase().includes('add') ||
      aiPrompt.toLowerCase().includes('change') ||
      aiPrompt.toLowerCase().includes('update') ||
      aiPrompt.toLowerCase().includes('make') ||
      aiPrompt.toLowerCase().includes('better')
    );

    setIsGenerating(true);

    // Reset all streaming state
    setShowStreamingPanel(true);
    setStreamingStatus('Initializing Claude Sonnet 4.5...');
    setStreamingText('');
    setDisplayedCode('');
    setStreamingThinking('');
    setToolsExecuted([]);
    setGeneratedCodeBackup('');
    setScreenshotPreview(null);

    try {
      // Add timeout controller (3 minutes max)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 180000); // 3 minutes

      const response = await fetch('/api/ai/storefront-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          fullCode: code,
          vendorId: selectedVendor,
          vendorName: currentVendor?.store_name,
          industry: 'cannabis',
          isEditingExisting: isEditingExisting,
          conversationId: currentConversationId,
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body - streaming not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullCode = '';

      let chunkCount = 0;
      let lastChunkTime = Date.now();

      // Inactivity timeout - if no data for 120s, assume connection died
      const inactivityCheck = setInterval(() => {
        const timeSinceLastChunk = Date.now() - lastChunkTime;
        if (timeSinceLastChunk > 120000) {
          clearInterval(inactivityCheck);
          reader.cancel();
          throw new Error('Stream timeout - no data received for 120 seconds');
        }
      }, 5000);

      try {
        while (true) {
          const { done, value } = await reader.read();
          lastChunkTime = Date.now();

          if (done) {
            clearInterval(inactivityCheck);
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            try {
              const event = JSON.parse(line.slice(6));

              switch (event.event) {
                case 'status':
                  setStreamingStatus(event.message || '');
                  break;
                case 'tool_start':
                  setStreamingStatus(`🔧 Using tool: ${event.tool}...`);
                  break;
                case 'tool_result':
                  setToolsExecuted(prev => [...prev, {
                    tool: event.tool || '',
                    result: event.result || '',
                    details: event.details || ''
                  }]);
                  break;
                case 'screenshot':
                  setScreenshotPreview({
                    data: event.data,
                    title: event.title || 'Screenshot'
                  });
                  break;
                case 'thinking_start':
                  setStreamingStatus('💭 Extended thinking...');
                  break;
                case 'thinking':
                  setStreamingThinking(prev => prev + (event.text || ''));
                  break;
                case 'text':
                  // Stream full AI response (includes explanations + code)
                  const newChunk = event.content || event.text || '';
                  setStreamingText(prev => prev + newChunk);

                  // Extract and display code blocks in real-time
                  const codeMatch = (streamingText + newChunk).match(/```(?:jsx|javascript|js|tsx|typescript)?\n([\s\S]*?)```/);
                  if (codeMatch && codeMatch[1]) {
                    const extractedCode = codeMatch[1];
                    setDisplayedCode(extractedCode);
                    setGeneratedCodeBackup(extractedCode); // Backup extracted code
                  }

                  setStreamingStatus('✨ Generating code...');
                  break;
                case 'code_chunk':
                  // Legacy support for direct code streaming
                  const codeChunk = event.text || '';
                  setStreamingText(prev => {
                    const updated = prev + codeChunk;
                    setGeneratedCodeBackup(updated);
                    return updated;
                  });
                  setStreamingStatus('✨ Generating code...');
                  break;
                case 'tokens':
                  // Track token usage (optional)
                  break;
                case 'complete':
                  // Use event code first, then backup, then streamingText
                  const finalCode = event.code || generatedCodeBackup || streamingText;

                  // Save conversation ID
                  if (event.conversationId) {
                    setCurrentConversationId(event.conversationId);
                  }

                  // Update backup with final code
                  if (finalCode) {
                    setGeneratedCodeBackup(finalCode);
                    fullCode = finalCode;
                  }

                  // Apply to editor with fallback
                  if (fullCode) {
                    try {
                      setCode(fullCode);
                      setStreamingStatus('✅ Complete!');
                    } catch (error) {
                      // Fallback to backup if main code fails
                      const fallbackCode = generatedCodeBackup || streamingText;
                      if (fallbackCode) {
                        setCode(fallbackCode);
                        setStreamingStatus('✅ Complete (with fallback)');
                      }
                    }
                  }

                  // Close panel after showing success
                  setTimeout(() => {
                    setShowStreamingPanel(false);
                    setIsGenerating(false);
                    setAiPrompt('');
                  }, 2000);
                  return;
                case 'error':
                  clearInterval(inactivityCheck);
                  throw new Error(event.message || 'Unknown error');
              }
            } catch (parseError) {
              // Skip invalid JSON
            }
          }
        }
      } catch (readError) {
        clearInterval(inactivityCheck);
        throw readError;
      }
    } catch (error: any) {
      let displayError = error.message || 'AI generation failed';

      // Try to recover any code we got before error
      if (generatedCodeBackup) {
        setCode(generatedCodeBackup);
        setErrorMessage(`⚠️ ${displayError} - But partial code was saved! (${generatedCodeBackup.length} chars)`);
      } else if (streamingText) {
        setCode(streamingText);
        setErrorMessage(`⚠️ ${displayError} - But partial code was saved! (${streamingText.length} chars)`);
      } else {
        setErrorMessage(displayError);
      }

      setTimeout(() => setErrorMessage(null), 10000);

      setShowStreamingPanel(false);
      setIsGenerating(false);
      return;
    }
  }, [aiPrompt, code, selectedVendor, currentVendor, currentConversationId, generatedCodeBackup, streamingText, setCode]);

  return {
    aiPrompt,
    setAiPrompt,
    isGenerating,
    showStreamingPanel,
    streamingStatus,
    streamingThinking,
    streamingText,
    displayedCode,
    toolsExecuted,
    screenshotPreview,
    generatedCodeBackup,
    currentConversationId,
    errorMessage,
    setErrorMessage,
    handleAIGenerate,
  };
}
