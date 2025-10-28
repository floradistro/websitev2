"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Save, Settings, Eye, EyeOff, 
  FlaskConical, Sparkles, AlertCircle, CheckCircle2, Copy
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  provider: string;
  model: string;
  api_key: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  status: 'active' | 'inactive' | 'testing';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface AgentConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentConfigPanel({ isOpen, onClose }: AgentConfigPanelProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    provider: 'claude',
    model: 'claude-sonnet-4-20250514',
    api_key: '',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 8192,
    status: 'active',
  });

  useEffect(() => {
    if (isOpen) {
      loadAgents();
    }
  }, [isOpen]);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/agents');
      const data = await res.json();
      if (data.agents) {
        setAgents(data.agents);
        if (data.agents.length > 0 && !selectedAgent) {
          setSelectedAgent(data.agents[0]);
          setFormData(data.agents[0]);
        }
      }
    } catch (err: any) {
      setError('Failed to load agents');
      console.error(err);
    }
    setIsLoading(false);
  };

  const saveAgent = async () => {
    setSaveStatus('saving');
    setError('');
    
    try {
      const url = '/api/ai/agents';
      const method = formData.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save agent');

      const data = await res.json();
      setSaveStatus('success');
      
      // Reload agents
      await loadAgents();
      
      // Select the saved agent
      if (data.agent) {
        setSelectedAgent(data.agent);
        setFormData(data.agent);
      }
      
      setIsEditing(false);
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent configuration? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/ai/agents?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete agent');
      
      await loadAgents();
      setSelectedAgent(null);
      setFormData({
        name: '',
        provider: 'claude',
        model: 'claude-sonnet-4-20250514',
        api_key: '',
        system_prompt: '',
        temperature: 0.7,
        max_tokens: 8192,
        status: 'active',
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createNewAgent = () => {
    setSelectedAgent(null);
    setFormData({
      name: '',
      provider: 'claude',
      model: 'claude-sonnet-4-20250514',
      api_key: '',
      system_prompt: '',
      temperature: 0.7,
      max_tokens: 8192,
      status: 'active',
    });
    setIsEditing(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-black border border-white/10 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <FlaskConical size={16} className="text-white/60" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-white font-black uppercase text-sm tracking-tight" style={{ fontWeight: 900 }}>
                Agent Configuration
              </h2>
              <p className="text-white/40 text-[10px] uppercase tracking-wide">
                Manage AI Agents & System Prompts
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
          {/* Sidebar - Agent List */}
          <div className="w-72 border-r border-white/5 flex flex-col bg-[#0a0a0a]">
            <div className="p-4 border-b border-white/5">
              <button
                onClick={createNewAgent}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2"
                style={{ fontWeight: 900 }}
              >
                <Plus size={14} strokeWidth={2} />
                New Agent
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Sparkles size={24} className="text-white/20 mb-3" strokeWidth={1.5} />
                  <p className="text-white/40 text-xs">No agents configured yet</p>
                  <p className="text-white/20 text-[10px] mt-1">Create your first agent</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgent(agent);
                        setFormData(agent);
                        setIsEditing(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${
                        selectedAgent?.id === agent.id
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'border-transparent text-white/60 hover:bg-white/[0.02] hover:border-white/5 hover:text-white/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-xs font-black uppercase tracking-tight truncate" style={{ fontWeight: 900 }}>
                          {agent.name}
                        </div>
                        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          agent.status === 'active' ? 'bg-green-500/10 text-green-400' :
                          agent.status === 'testing' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-white/5 text-white/40'
                        }`}>
                          {agent.status}
                        </div>
                      </div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wide">
                        {agent.provider} · {agent.model}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Agent Details */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedAgent || isEditing ? (
              <>
                {/* Header Actions */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
                  <div className="text-xs font-black uppercase tracking-tight text-white" style={{ fontWeight: 900 }}>
                    {isEditing ? (formData.id ? 'Edit Agent' : 'New Agent') : 'Agent Details'}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white rounded-lg text-xs font-black uppercase tracking-tight transition-all"
                          style={{ fontWeight: 900 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAgent(selectedAgent!.id)}
                          className="p-1.5 hover:bg-red-500/10 text-white/40 hover:text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </>
                    )}
                    {isEditing && (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            if (selectedAgent) {
                              setFormData(selectedAgent);
                            }
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-xs font-black uppercase tracking-tight transition-all"
                          style={{ fontWeight: 900 }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveAgent}
                          disabled={saveStatus === 'saving'}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-lg text-xs font-black uppercase tracking-tight transition-all disabled:opacity-50 flex items-center gap-2"
                          style={{ fontWeight: 900 }}
                        >
                          {saveStatus === 'saving' ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              Saving
                            </>
                          ) : saveStatus === 'success' ? (
                            <>
                              <CheckCircle2 size={14} strokeWidth={2} />
                              Saved
                            </>
                          ) : (
                            <>
                              <Save size={14} strokeWidth={2} />
                              Save
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                      <AlertCircle size={14} className="text-red-400 mt-0.5" strokeWidth={2} />
                      <div className="text-red-400 text-xs">{error}</div>
                    </div>
                  )}

                  <div className="space-y-6 max-w-3xl">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div className="text-white/40 text-[10px] uppercase tracking-wide font-black" style={{ fontWeight: 900 }}>
                        Basic Information
                      </div>
                      
                      <div>
                        <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                          Agent Name
                        </label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={!isEditing}
                          placeholder="e.g. Flora AI Assistant"
                          className="w-full bg-[#0a0a0a] border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none transition-all disabled:opacity-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                            Provider
                          </label>
                          <select
                            value={formData.provider || 'claude'}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                            disabled={!isEditing}
                            className="w-full bg-[#0a0a0a] border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all disabled:opacity-50"
                          >
                            <option value="claude">Claude (Anthropic)</option>
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Google Gemini</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                            Model
                          </label>
                          <input
                            type="text"
                            value={formData.model || ''}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            disabled={!isEditing}
                            placeholder="e.g. claude-sonnet-4-20250514"
                            className="w-full bg-[#0a0a0a] border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none transition-all disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                          API Key
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={formData.api_key || ''}
                            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                            disabled={!isEditing}
                            placeholder="sk-ant-api03-..."
                            className="w-full bg-[#0a0a0a] border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 pr-20 text-white text-sm placeholder:text-white/20 focus:outline-none transition-all disabled:opacity-50 font-mono"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(formData.api_key || '')}
                              className="p-1.5 hover:bg-white/5 text-white/40 hover:text-white rounded-lg transition-all"
                            >
                              <Copy size={12} strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="p-1.5 hover:bg-white/5 text-white/40 hover:text-white rounded-lg transition-all"
                            >
                              {showApiKey ? <EyeOff size={12} strokeWidth={2} /> : <Eye size={12} strokeWidth={2} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                            Temperature
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            value={formData.temperature || 0.7}
                            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                            disabled={!isEditing}
                            className="w-full bg-[#0a0a0a] border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                            Max Tokens
                          </label>
                          <input
                            type="number"
                            step="1024"
                            min="1024"
                            max="200000"
                            value={formData.max_tokens || 8192}
                            onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                            disabled={!isEditing}
                            className="w-full bg-[#0a0a0a] border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                            Status
                          </label>
                          <select
                            value={formData.status || 'active'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'testing' })}
                            disabled={!isEditing}
                            className="w-full bg-[#0a0a0a] border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all disabled:opacity-50"
                          >
                            <option value="active">Active</option>
                            <option value="testing">Testing</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-white/40 text-[10px] uppercase tracking-wide font-black" style={{ fontWeight: 900 }}>
                          System Prompt
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(formData.system_prompt || '')}
                          className="text-white/40 hover:text-white text-[10px] uppercase tracking-wide flex items-center gap-1 transition-all"
                        >
                          <Copy size={10} strokeWidth={2} />
                          Copy
                        </button>
                      </div>
                      
                      <textarea
                        value={formData.system_prompt || ''}
                        onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter system prompt / instructions for the AI agent..."
                        rows={24}
                        className="w-full bg-[#0a0a0a] border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl px-4 py-3 text-white/80 text-xs leading-relaxed placeholder:text-white/20 focus:outline-none transition-all disabled:opacity-50 font-mono resize-none"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Settings size={48} className="text-white/10 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-white/40 text-sm">Select an agent or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

