"use client";

import React, { useState } from 'react';
import { WCLCompiler, WCLCompilerError } from '@/lib/wcl/compiler';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedComponent {
  name: string;
  wclCode: string;
  tsCode: string;
  wclLines: number;
  tsLines: number;
  reduction: number;
}

export default function WCLGeneratorPage() {
  const [goal, setGoal] = useState('');
  const [industry, setIndustry] = useState('cannabis');
  const [style, setStyle] = useState('luxury');
  const [requirements, setRequirements] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedComponent | null>(null);
  
  const [activeTab, setActiveTab] = useState<'wcl' | 'typescript'>('wcl');

  const handleGenerate = async () => {
    if (!goal.trim()) {
      setError('Please describe what component you want to create');
      return;
    }

    setLoading(true);
    setError(null);
    setGenerated(null);

    try {
      // Call AI generation API
      const response = await fetch('/api/ai/generate-wcl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          context: {
            vendorType: industry,
            industry,
            targetAudience: style === 'luxury' ? 'premium customers' : 'general consumers',
            style
          },
          requirements: requirements.split('\n').filter(r => r.trim()),
          componentName: `SmartGenerated${Date.now()}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate component');
      }

      const data = await response.json();
      
      setGenerated({
        name: data.componentKey,
        wclCode: data.wclCode,
        tsCode: data.tsCode,
        wclLines: data.wclCode.split('\n').length,
        tsLines: data.tsCode.split('\n').length,
        reduction: Math.round((1 - data.wclCode.split('\n').length / data.tsCode.split('\n').length) * 100)
      });

    } catch (err: any) {
      setError(err.message);
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!generated) return;
    
    setLoading(true);
    try {
      // TODO: Implement deployment logic
      alert('Component deployed successfully! (Implementation pending)');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-4xl font-black uppercase tracking-tight">
            🎨 WCL Component Generator
          </h1>
          <p className="text-white/60 mt-2">
            AI-powered component generation using Claude Sonnet 4.5
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-black uppercase mb-6">Configure Generation</h2>
              
              {/* Goal Input */}
              <div className="mb-6">
                <label className="block text-white/60 text-sm font-bold mb-2 uppercase tracking-wider">
                  What do you want to create?
                </label>
                <textarea
                  className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none transition-colors resize-none"
                  rows={4}
                  placeholder="E.g., Create a hero section with a headline, subheadline, and CTA button that adapts for mobile and desktop..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>

              {/* Industry */}
              <div className="mb-6">
                <label className="block text-white/60 text-sm font-bold mb-2 uppercase tracking-wider">
                  Industry
                </label>
                <select
                  className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:border-white/40 focus:outline-none transition-colors"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                >
                  <option value="cannabis">Cannabis</option>
                  <option value="fashion">Fashion</option>
                  <option value="tech">Technology</option>
                  <option value="food">Food & Beverage</option>
                  <option value="lifestyle">Lifestyle</option>
                </select>
              </div>

              {/* Style */}
              <div className="mb-6">
                <label className="block text-white/60 text-sm font-bold mb-2 uppercase tracking-wider">
                  Style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['luxury', 'modern', 'minimal'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`py-3 px-4 rounded-xl font-bold uppercase text-sm transition-all ${
                        style === s
                          ? 'bg-white text-black'
                          : 'bg-black border border-white/20 text-white hover:border-white/40'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="mb-6">
                <label className="block text-white/60 text-sm font-bold mb-2 uppercase tracking-wider">
                  Additional Requirements (optional)
                </label>
                <textarea
                  className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="One requirement per line...
- Include quantum states for mobile/desktop
- Add hover animations
- Use gradient backgrounds"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !goal.trim()}
                className="w-full bg-white text-black py-4 px-6 rounded-2xl font-black uppercase tracking-tight text-lg hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 transition-all"
              >
                {loading ? '🤖 Generating...' : '✨ Generate Component'}
              </button>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
                >
                  <p className="font-bold">❌ Error:</p>
                  <p className="text-sm mt-1">{error}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Output Panel */}
          <div className="space-y-6">
            <AnimatePresence>
              {generated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black uppercase">Generated Component</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('wcl')}
                        className={`py-2 px-4 rounded-lg font-bold uppercase text-xs transition-all ${
                          activeTab === 'wcl'
                            ? 'bg-white text-black'
                            : 'bg-black border border-white/20 text-white/60'
                        }`}
                      >
                        WCL
                      </button>
                      <button
                        onClick={() => setActiveTab('typescript')}
                        className={`py-2 px-4 rounded-lg font-bold uppercase text-xs transition-all ${
                          activeTab === 'typescript'
                            ? 'bg-white text-black'
                            : 'bg-black border border-white/20 text-white/60'
                        }`}
                      >
                        TypeScript
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-black border border-white/10 rounded-xl p-4 text-center">
                      <div className="text-3xl font-black text-green-400">{generated.wclLines}</div>
                      <div className="text-white/40 text-xs uppercase tracking-wider mt-1">WCL Lines</div>
                    </div>
                    <div className="bg-black border border-white/10 rounded-xl p-4 text-center">
                      <div className="text-3xl font-black text-blue-400">{generated.tsLines}</div>
                      <div className="text-white/40 text-xs uppercase tracking-wider mt-1">TS Lines</div>
                    </div>
                    <div className="bg-black border border-white/10 rounded-xl p-4 text-center">
                      <div className="text-3xl font-black text-purple-400">{generated.reduction}%</div>
                      <div className="text-white/40 text-xs uppercase tracking-wider mt-1">Reduction</div>
                    </div>
                  </div>

                  {/* Code Display */}
                  <div className="bg-black border border-white/10 rounded-xl overflow-hidden">
                    <pre className="p-4 overflow-x-auto text-sm leading-relaxed max-h-96 overflow-y-auto">
                      <code className="text-green-400">
                        {activeTab === 'wcl' ? generated.wclCode : generated.tsCode}
                      </code>
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleDeploy}
                      className="flex-1 bg-green-500 text-black py-3 px-6 rounded-xl font-black uppercase hover:bg-green-400 transition-colors"
                    >
                      🚀 Deploy Component
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(generated.wclCode)}
                      className="flex-1 bg-white/10 text-white py-3 px-6 rounded-xl font-bold uppercase hover:bg-white/20 transition-colors"
                    >
                      📋 Copy WCL
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!generated && !loading && (
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-black uppercase text-white/60">
                  No Component Generated Yet
                </h3>
                <p className="text-white/40 mt-2">
                  Fill out the form and click "Generate Component" to create your first AI-powered WCL component
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
