"use client";

/**
 * WCL Sandbox - Test WCL Components with Real Data
 * Allows testing AI-generated components without affecting live stores
 */

import { useState } from 'react';
import { FileCode } from 'lucide-react';
import { FloraDistroHalloweenHomepage } from '@/components/component-registry/smart/FloraDistroHalloweenHomepage';

export default function WCLSandboxPage() {
  const [mode, setMode] = useState<'preview' | 'editor'>('preview');
  const [quantumState, setQuantumState] = useState<'auto' | 'first-visit' | 'returning' | 'cart-abandoned'>('auto');
  
  // Simulate different quantum states for testing
  const simulateUserContext = () => {
    if (quantumState === 'first-visit') {
      return { visits: 1, cartAbandoned: false };
    } else if (quantumState === 'returning') {
      return { visits: 5, cartAbandoned: false };
    } else if (quantumState === 'cart-abandoned') {
      return { visits: 3, cartAbandoned: true };
    }
    return null; // Auto
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Sandbox Controls */}
      <div className="bg-black/95 border-b border-white/10 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black uppercase text-white">WCL Sandbox</h1>
              <p className="text-white/40 text-xs uppercase tracking-wider mt-1">Test components with real data</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quantum State Selector */}
              <div className="flex items-center gap-2">
                <label className="text-white/60 text-xs uppercase tracking-wider">Quantum State:</label>
                <select
                  value={quantumState}
                  onChange={(e) => setQuantumState(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="auto">Auto (Real User)</option>
                  <option value="first-visit">First Visit</option>
                  <option value="returning">Returning Customer</option>
                  <option value="cart-abandoned">Cart Abandoned</option>
                </select>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setMode('preview')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                    mode === 'preview'
                      ? 'bg-white text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setMode('editor')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                    mode === 'editor'
                      ? 'bg-white text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Editor
                </button>
              </div>

              <a
                href="/wcl-editor"
                className="bg-white text-black px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-white/90 transition-all flex items-center gap-2"
              >
                <FileCode size={14} />
                Open WCL Editor
              </a>
              
              <a
                href="/admin"
                className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-white/20 transition-all"
              >
                Exit Sandbox
              </a>
            </div>
          </div>

          {/* Info Bar */}
          <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <div className="flex items-start gap-3">
              <div className="text-blue-400 text-xl">ℹ️</div>
              <div>
                <p className="text-blue-400 text-sm font-bold">Sandbox Mode Active</p>
                <p className="text-blue-400/60 text-xs mt-1">
                  This is a safe testing environment. Changes here won't affect Flora Distro's live store.
                  Using REAL products from database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Preview */}
      {mode === 'preview' && (
        <div className="relative">
          {/* Quantum State Indicator */}
          {quantumState !== 'auto' && (
            <div className="fixed bottom-4 right-4 z-50">
              <div className="bg-orange-500/20 border border-orange-500/40 backdrop-blur-lg rounded-xl p-4">
                <p className="text-orange-400 text-xs font-black uppercase">
                  Testing: {quantumState.replace('-', ' ')}
                </p>
              </div>
            </div>
          )}

          <FloraDistroHalloweenHomepage 
            vendorId="cd2e1122-d511-4edb-be5d-98ef274b4baf"
            vendorSlug="flora-distro"
            vendorName="Flora Distro"
            heroHeadline="SPIRITS & STRAINS"
            heroSubheadline="Hauntingly Good Cannabis This Halloween"
            featuredTitle="SPOOKY SPECIALS"
            ctaPrimary="TRICK OR TREAT"
            ctaSecondary="SHOP SPOOKY SPECIALS"
          />
        </div>
      )}

      {/* Editor Mode (Future) */}
      {mode === 'editor' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
            <div className="text-6xl mb-6">🎨</div>
            <h2 className="text-3xl font-black uppercase text-white mb-4">WCL Editor Coming Soon</h2>
            <p className="text-white/60 max-w-2xl mx-auto mb-8">
              The visual WCL editor will allow you to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <div className="text-2xl mb-2">✏️</div>
                <p className="text-white font-bold text-sm">Edit WCL Code</p>
                <p className="text-white/40 text-xs mt-1">Live syntax highlighting</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <div className="text-2xl mb-2">👀</div>
                <p className="text-white font-bold text-sm">Live Preview</p>
                <p className="text-white/40 text-xs mt-1">See changes instantly</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <div className="text-2xl mb-2">🤖</div>
                <p className="text-white font-bold text-sm">AI Suggestions</p>
                <p className="text-white/40 text-xs mt-1">Claude helps optimize</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-white font-bold text-sm">Hot Reload</p>
                <p className="text-white/40 text-xs mt-1">No page refresh needed</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

