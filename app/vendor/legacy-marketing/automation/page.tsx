'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Users,
  Mail,
  MessageSquare,
  Gift,
  ShoppingCart,
  Calendar,
  TrendingDown,
  Package,
  Star,
} from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';

interface AutomationRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_config: any;
  action_type: string;
  action_config: any;
  is_active: boolean;
  created_at: string;
  stats?: {
    triggered_count: number;
    sent_count: number;
    conversion_count: number;
  };
}

export default function AutomationPage() {
  const { vendor } = useAppAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (vendor) {
      loadAutomationRules();
    }
  }, [vendor]);

  const loadAutomationRules = async () => {
    if (!vendor) return;

    try {
      const response = await fetch('/api/vendor/marketing/automation', {
        headers: { 'x-vendor-id': vendor.id },
      });
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Failed to load automation rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    if (!vendor) return;

    try {
      await fetch(`/api/vendor/marketing/automation/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id,
        },
        body: JSON.stringify({ is_active: !isActive }),
      });
      loadAutomationRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const automationTemplates = [
    {
      name: 'Welcome Series',
      description: 'Greet new customers with a welcome message',
      icon: Users,
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-400',
      triggerType: 'customer_created',
      actionType: 'send_email',
    },
    {
      name: 'Win-Back Campaign',
      description: 'Re-engage customers after 30 days of inactivity',
      icon: TrendingDown,
      color: 'from-red-500/20 to-red-600/20',
      iconColor: 'text-red-400',
      triggerType: 'customer_inactive',
      actionType: 'send_email',
    },
    {
      name: 'Birthday Reward',
      description: 'Send birthday discount automatically',
      icon: '🎂',
      color: 'from-pink-500/20 to-pink-600/20',
      iconColor: 'text-pink-400',
      triggerType: 'customer_birthday',
      actionType: 'send_sms',
    },
    {
      name: 'Abandoned Cart',
      description: 'Remind customers about items left in cart',
      icon: ShoppingCart,
      color: 'from-orange-500/20 to-orange-600/20',
      iconColor: 'text-orange-400',
      triggerType: 'cart_abandoned',
      actionType: 'send_email',
    },
    {
      name: 'Product Restock',
      description: 'Alert customers when out-of-stock items return',
      icon: Package,
      color: 'from-green-500/20 to-green-600/20',
      iconColor: 'text-green-400',
      triggerType: 'product_restocked',
      actionType: 'send_sms',
    },
    {
      name: 'Loyalty Milestone',
      description: 'Celebrate when customers reach point milestones',
      icon: Star,
      color: 'from-yellow-500/20 to-yellow-600/20',
      iconColor: 'text-yellow-400',
      triggerType: 'loyalty_milestone',
      actionType: 'send_email',
    },
  ];

  return (
    <div className="w-full px-4 lg:px-0 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white mb-2">Marketing Automation</h1>
          <p className="text-white/60 text-sm">
            Set up automated campaigns triggered by customer behavior
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Quick Templates */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-xs uppercase tracking-[0.15em] text-white/40 font-black">
            Quick Start Templates
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automationTemplates.map((template, index) => (
            <motion.button
              key={index}
              onClick={() => {
                // In a real implementation, this would pre-fill the create modal
                setShowCreateModal(true);
              }}
              className="p-6 bg-gradient-to-br bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all text-left group"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center flex-shrink-0`}
                >
                  {typeof template.icon === 'string' ? (
                    <div className="text-2xl">{template.icon}</div>
                  ) : (
                    <template.icon className={`w-6 h-6 ${template.iconColor}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold mb-1 group-hover:text-white/90">
                    {template.name}
                  </h3>
                  <p className="text-sm text-white/60">{template.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Active Rules */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="text-xs uppercase tracking-[0.15em] text-white/40 font-black">
            Active Automation Rules
          </div>
          <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/40">Loading automation rules...</div>
        ) : rules.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Zap className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-bold mb-2">No automation rules yet</h3>
            <p className="text-white/60 text-sm mb-6">
              Create your first automation rule to start sending triggered campaigns
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Rule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {rules.map((rule) => (
              <motion.div
                key={rule.id}
                className={`bg-white/5 border ${
                  rule.is_active ? 'border-green-500/20' : 'border-white/10'
                } hover:border-white/20 rounded-2xl p-6 transition-all`}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-bold text-lg">{rule.name}</h3>
                      {rule.is_active ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-xs text-green-400 font-bold">Active</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-white/10 rounded-lg">
                          <span className="text-xs text-white/40 font-bold">Paused</span>
                        </div>
                      )}
                    </div>
                    <p className="text-white/60 text-sm mb-4">
                      Trigger: <span className="text-white">{rule.trigger_type}</span> →{' '}
                      Action: <span className="text-white">{rule.action_type}</span>
                    </p>
                    {rule.stats && (
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-white/40">Triggered: </span>
                          <span className="text-white font-bold">
                            {rule.stats.triggered_count}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/40">Sent: </span>
                          <span className="text-white font-bold">{rule.stats.sent_count}</span>
                        </div>
                        <div>
                          <span className="text-white/40">Conversions: </span>
                          <span className="text-white font-bold">
                            {rule.stats.conversion_count}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRule(rule.id, rule.is_active)}
                      className={`p-2 ${
                        rule.is_active
                          ? 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      } border rounded-lg transition-colors`}
                    >
                      {rule.is_active ? (
                        <Pause className="w-4 h-4 text-green-400" />
                      ) : (
                        <Play className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                    <button className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-white/60" />
                    </button>
                    <button className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Create Automation Rule</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-white/60 text-2xl">&times;</span>
              </button>
            </div>

            <AutomationRuleBuilder
              onSave={() => setShowCreateModal(false)}
              vendor={vendor}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Automation Rule Builder Component
function AutomationRuleBuilder({ onSave, vendor }: { onSave: () => void; vendor: any }) {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('customer_created');
  const [triggerConfig, setTriggerConfig] = useState<any>({});
  const [actionType, setActionType] = useState('send_email');
  const [actionConfig, setActionConfig] = useState<any>({});

  const triggerTypes = [
    { value: 'customer_created', label: 'New Customer Signup', icon: Users },
    { value: 'customer_inactive', label: 'Customer Inactive (X days)', icon: TrendingDown },
    { value: 'customer_birthday', label: 'Customer Birthday', icon: Calendar },
    { value: 'cart_abandoned', label: 'Abandoned Cart (X minutes)', icon: ShoppingCart },
    { value: 'product_restocked', label: 'Product Back in Stock', icon: Package },
    { value: 'loyalty_milestone', label: 'Loyalty Points Milestone', icon: Star },
    { value: 'order_completed', label: 'Order Completed', icon: Package },
  ];

  const actionTypes = [
    { value: 'send_email', label: 'Send Email', icon: Mail },
    { value: 'send_sms', label: 'Send SMS', icon: MessageSquare },
    { value: 'add_to_segment', label: 'Add to Segment', icon: Users },
    { value: 'award_points', label: 'Award Loyalty Points', icon: Gift },
  ];

  const saveRule = async () => {
    if (!vendor) return;

    try {
      const response = await fetch('/api/vendor/marketing/automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id,
        },
        body: JSON.stringify({
          name,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          action_type: actionType,
          action_config: actionConfig,
          is_active: true,
        }),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save automation rule:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
          Rule Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Welcome New Customers"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-white/60 mb-3">
          When this happens (Trigger)
        </label>
        <div className="grid grid-cols-1 gap-2">
          {triggerTypes.map((trigger) => (
            <button
              key={trigger.value}
              onClick={() => {
                setTriggerType(trigger.value);
                setTriggerConfig({});
              }}
              className={`p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                triggerType === trigger.value
                  ? 'border-white bg-white/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <trigger.icon className="w-5 h-5 text-white/60" />
              <span className="text-white font-bold">{trigger.label}</span>
            </button>
          ))}
        </div>

        {/* Trigger-specific config */}
        {triggerType === 'customer_inactive' && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl">
            <label className="block text-xs text-white/60 mb-2">Inactive for (days)</label>
            <input
              type="number"
              value={triggerConfig.days || 30}
              onChange={(e) =>
                setTriggerConfig({ ...triggerConfig, days: parseInt(e.target.value) })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        )}

        {triggerType === 'cart_abandoned' && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl">
            <label className="block text-xs text-white/60 mb-2">Wait time (minutes)</label>
            <input
              type="number"
              value={triggerConfig.minutes || 30}
              onChange={(e) =>
                setTriggerConfig({ ...triggerConfig, minutes: parseInt(e.target.value) })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        )}

        {triggerType === 'loyalty_milestone' && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl">
            <label className="block text-xs text-white/60 mb-2">Points milestone</label>
            <input
              type="number"
              value={triggerConfig.points || 100}
              onChange={(e) =>
                setTriggerConfig({ ...triggerConfig, points: parseInt(e.target.value) })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-white/60 mb-3">
          Do this (Action)
        </label>
        <div className="grid grid-cols-1 gap-2">
          {actionTypes.map((action) => (
            <button
              key={action.value}
              onClick={() => {
                setActionType(action.value);
                setActionConfig({});
              }}
              className={`p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                actionType === action.value
                  ? 'border-white bg-white/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <action.icon className="w-5 h-5 text-white/60" />
              <span className="text-white font-bold">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Action-specific config */}
        {(actionType === 'send_email' || actionType === 'send_sms') && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl space-y-3">
            <div>
              <label className="block text-xs text-white/60 mb-2">
                {actionType === 'send_email' ? 'Email Template' : 'SMS Template'}
              </label>
              <select
                value={actionConfig.template_id || ''}
                onChange={(e) =>
                  setActionConfig({ ...actionConfig, template_id: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select template...</option>
                <option value="welcome">Welcome Template</option>
                <option value="win_back">Win Back Template</option>
                <option value="birthday">Birthday Template</option>
              </select>
            </div>
          </div>
        )}

        {actionType === 'award_points' && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl">
            <label className="block text-xs text-white/60 mb-2">Points to award</label>
            <input
              type="number"
              value={actionConfig.points || 10}
              onChange={(e) =>
                setActionConfig({ ...actionConfig, points: parseInt(e.target.value) })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button
          onClick={() => onSave()}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={saveRule}
          disabled={!name}
          className="px-6 py-2 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Create Rule
        </button>
      </div>
    </div>
  );
}
