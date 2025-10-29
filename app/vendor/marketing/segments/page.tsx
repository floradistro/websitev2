'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Filter,
  DollarSign,
  Calendar,
  MapPin,
  Star,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Search,
} from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';

interface Segment {
  id: string;
  name: string;
  description: string;
  customer_count: number;
  rules: any;
  created_at: string;
}

export default function SegmentsPage() {
  const { vendor } = useAppAuth();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (vendor) {
      loadSegments();
    }
  }, [vendor]);

  const loadSegments = async () => {
    if (!vendor) return;

    try {
      const response = await fetch('/api/vendor/marketing/segments', {
        headers: {
          'x-vendor-id': vendor.id,
        },
      });
      const data = await response.json();
      setSegments(data);
    } catch (error) {
      console.error('Failed to load segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSegments = segments.filter((segment) =>
    segment.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Predefined segment templates
  const segmentTemplates = [
    {
      name: 'VIP Customers',
      description: 'High-value customers with $1000+ lifetime spend',
      icon: Star,
      color: 'from-yellow-500/20 to-yellow-600/20',
      iconColor: 'text-yellow-400',
      rules: {
        lifetime_value_min: 1000,
      },
    },
    {
      name: 'Inactive Customers',
      description: 'No purchases in the last 30 days',
      icon: Calendar,
      color: 'from-red-500/20 to-red-600/20',
      iconColor: 'text-red-400',
      rules: {
        last_order_days_ago_min: 30,
      },
    },
    {
      name: 'Frequent Buyers',
      description: '5+ orders in the last 90 days',
      icon: TrendingUp,
      color: 'from-green-500/20 to-green-600/20',
      iconColor: 'text-green-400',
      rules: {
        order_count_min: 5,
        order_count_period_days: 90,
      },
    },
    {
      name: 'Birthday This Month',
      description: 'Customers with birthdays this month',
      icon: '🎂',
      color: 'from-pink-500/20 to-pink-600/20',
      iconColor: 'text-pink-400',
      rules: {
        birthday_month: new Date().getMonth() + 1,
      },
    },
    {
      name: 'Local Customers',
      description: 'Within 10 miles of main location',
      icon: MapPin,
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-400',
      rules: {
        distance_miles_max: 10,
      },
    },
    {
      name: 'High Cart Value',
      description: 'Average order value over $100',
      icon: DollarSign,
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-400',
      rules: {
        avg_order_value_min: 100,
      },
    },
  ];

  return (
    <div className="w-full px-4 lg:px-0 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white mb-2">Customer Segments</h1>
          <p className="text-white/60 text-sm">
            Create targeted customer groups for personalized campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Segment
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search segments..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* Quick Templates */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-xs uppercase tracking-[0.15em] text-white/40 font-black">
            Quick Templates
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segmentTemplates.map((template, index) => (
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

      {/* Existing Segments */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="text-xs uppercase tracking-[0.15em] text-white/40 font-black">
            Your Segments
          </div>
          <div className="h-[1px] flex-1 bg-white/10"></div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/40">Loading segments...</div>
        ) : filteredSegments.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-bold mb-2">No segments yet</h3>
            <p className="text-white/60 text-sm mb-6">
              Create your first customer segment to start targeted marketing
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Segment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSegments.map((segment) => (
              <motion.div
                key={segment.id}
                className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-bold text-lg">{segment.name}</h3>
                      <div className="px-3 py-1 bg-white/10 rounded-lg">
                        <span className="text-xs font-bold text-white">
                          {segment.customer_count.toLocaleString()} customers
                        </span>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm">{segment.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
                      <Eye className="w-4 h-4 text-white/60" />
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

      {/* Create Segment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Create Segment</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-white/60 text-2xl">&times;</span>
              </button>
            </div>

            <SegmentBuilder onSave={() => setShowCreateModal(false)} vendor={vendor} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Segment Builder Component
type RuleFieldBase = {
  key: string;
  label: string;
};

type RuleFieldNumber = RuleFieldBase & {
  type: "number";
  prefix?: string;
};

type RuleFieldSelect = RuleFieldBase & {
  type: "select";
  options: string[];
};

type RuleField = RuleFieldNumber | RuleFieldSelect;

function SegmentBuilder({ onSave, vendor }: { onSave: () => void; vendor: any }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState<any[]>([]);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);

  const ruleTypes = [
    {
      type: 'lifetime_value',
      label: 'Lifetime Value',
      icon: DollarSign,
      fields: [
        { key: 'min', label: 'Minimum', type: 'number', prefix: '$' },
        { key: 'max', label: 'Maximum', type: 'number', prefix: '$' },
      ],
    },
    {
      type: 'order_count',
      label: 'Order Count',
      icon: TrendingUp,
      fields: [
        { key: 'min', label: 'Minimum Orders', type: 'number' },
        { key: 'days', label: 'In Last X Days', type: 'number' },
      ],
    },
    {
      type: 'last_order',
      label: 'Last Order Date',
      icon: Calendar,
      fields: [
        { key: 'days_ago', label: 'Days Ago', type: 'number' },
        { key: 'operator', label: 'Operator', type: 'select', options: ['more than', 'less than'] },
      ],
    },
    {
      type: 'location',
      label: 'Location',
      icon: MapPin,
      fields: [
        { key: 'distance', label: 'Within X Miles', type: 'number' },
        { key: 'location_id', label: 'Of Location', type: 'select', options: ['Main Store'] },
      ],
    },
  ];

  const addRule = () => {
    setRules([...rules, { type: 'lifetime_value', config: {} }]);
  };

  const updateRule = (index: number, updates: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    setRules(newRules);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const calculateEstimate = async () => {
    if (!vendor) return;

    try {
      const response = await fetch('/api/vendor/marketing/segments/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id,
        },
        body: JSON.stringify({ rules }),
      });
      const data = await response.json();
      setEstimatedCount(data.count);
    } catch (error) {
      console.error('Failed to estimate:', error);
    }
  };

  const saveSegment = async () => {
    if (!vendor) return;

    try {
      const response = await fetch('/api/vendor/marketing/segments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id,
        },
        body: JSON.stringify({
          name,
          description,
          rules,
        }),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save segment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
          Segment Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., High-Value Customers"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this segment..."
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs uppercase tracking-wider text-white/60">
            Segment Rules
          </label>
          <button
            onClick={addRule}
            className="text-xs text-white/60 hover:text-white flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Rule
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="bg-white/5 border border-white/10 border-dashed rounded-xl p-8 text-center">
            <Filter className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">No rules added yet</p>
            <button
              onClick={addRule}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-sm transition-colors"
            >
              Add First Rule
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, index) => {
              const ruleType = ruleTypes.find((t) => t.type === rule.type);
              return (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <select
                        value={rule.type}
                        onChange={(e) => updateRule(index, { type: e.target.value, config: {} })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
                      >
                        {ruleTypes.map((type) => (
                          <option key={type.type} value={type.type}>
                            {type.label}
                          </option>
                        ))}
                      </select>

                      {ruleType?.fields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs text-white/40 mb-1">
                            {field.label}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              value={rule.config[field.key] || ''}
                              onChange={(e) =>
                                updateRule(index, {
                                  config: { ...rule.config, [field.key]: e.target.value },
                                })
                              }
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
                            >
                              <option value="">Select...</option>
                              {(field as RuleFieldSelect).options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="relative">
                              {(field as RuleFieldNumber).prefix && (
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 text-sm">
                                  {(field as RuleFieldNumber).prefix}
                                </span>
                              )}
                              <input
                                type={field.type}
                                value={rule.config[field.key] || ''}
                                onChange={(e) =>
                                  updateRule(index, {
                                    config: { ...rule.config, [field.key]: e.target.value },
                                  })
                                }
                                className={`w-full bg-white/5 border border-white/10 rounded-lg ${
                                  (field as RuleFieldNumber).prefix ? 'pl-7' : 'pl-3'
                                } pr-3 py-2 text-white text-sm focus:outline-none focus:border-white/30`}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => removeRule(index)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rules.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white font-bold mb-1">Estimated Audience Size</div>
              <div className="text-xs text-white/60">
                {estimatedCount !== null
                  ? `${estimatedCount.toLocaleString()} customers match these rules`
                  : 'Click to calculate estimate'}
              </div>
            </div>
            <button
              onClick={calculateEstimate}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm font-bold transition-colors"
            >
              Calculate
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={() => onSave()}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={saveSegment}
          disabled={!name || rules.length === 0}
          className="px-6 py-2 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Segment
        </button>
      </div>
    </div>
  );
}
