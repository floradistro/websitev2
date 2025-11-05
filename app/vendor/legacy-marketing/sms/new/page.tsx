'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Users,
  Calendar,
  Send,
  Check,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';

type Step = 'type' | 'content' | 'audience' | 'schedule' | 'preview';
type CampaignType =
  | 'flash_sale'
  | 'new_product'
  | 'order_ready'
  | 'win_back'
  | 'birthday'
  | 'loyalty_points'
  | 'event_reminder'
  | 'restock_alert';

export default function NewSMSCampaignPage() {
  const { vendor } = useAppAuth();
  const [step, setStep] = useState<Step>('type');
  const [useAI, setUseAI] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Campaign data
  const [name, setName] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('flash_sale');
  const [message, setMessage] = useState('');
  const [includeLink, setIncludeLink] = useState(true);
  const [productData, setProductData] = useState({ name: '', price: 0 });
  const [discountData, setDiscountData] = useState<{ type: 'percentage' | 'fixed_amount'; value: number }>({ type: 'percentage', value: 0 });
  const [audienceType, setAudienceType] = useState<'all' | 'segment'>('all');
  const [segmentId, setSegmentId] = useState('');
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
  const [scheduledFor, setScheduledFor] = useState('');

  // Generated content
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const campaignTypes = [
    {
      value: 'flash_sale' as CampaignType,
      label: 'Flash Sale',
      icon: '⚡',
      color: 'from-red-500/20 to-red-600/20',
      iconColor: 'text-red-400',
    },
    {
      value: 'new_product' as CampaignType,
      label: 'New Product',
      icon: '🌿',
      color: 'from-green-500/20 to-green-600/20',
      iconColor: 'text-green-400',
    },
    {
      value: 'order_ready' as CampaignType,
      label: 'Order Ready',
      icon: '📦',
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-400',
    },
    {
      value: 'win_back' as CampaignType,
      label: 'Win Back',
      icon: '💝',
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-400',
    },
    {
      value: 'birthday' as CampaignType,
      label: 'Birthday',
      icon: '🎂',
      color: 'from-pink-500/20 to-pink-600/20',
      iconColor: 'text-pink-400',
    },
    {
      value: 'loyalty_points' as CampaignType,
      label: 'Loyalty Points',
      icon: '⭐',
      color: 'from-yellow-500/20 to-yellow-600/20',
      iconColor: 'text-yellow-400',
    },
  ];

  const generateWithAI = async () => {
    if (!vendor) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/vendor/marketing/sms/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id,
        },
        body: JSON.stringify({
          campaignType,
          productData: campaignType === 'new_product' ? productData : undefined,
          discountData: ['flash_sale', 'win_back', 'birthday'].includes(campaignType)
            ? discountData
            : undefined,
          includeLink,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedContent(data.sms);
        setMessage(data.sms.message);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const saveCampaign = async () => {
    if (!vendor) return;

    try {
      const response = await fetch('/api/vendor/marketing/sms/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id,
        },
        body: JSON.stringify({
          name,
          campaign_type: campaignType,
          message_body: message,
          segment_id: audienceType === 'segment' ? segmentId : null,
          schedule_type: scheduleType,
          scheduled_for: scheduleType === 'scheduled' ? scheduledFor : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        window.location.href = '/vendor/marketing';
      }
    } catch (error) {
      console.error('Campaign creation failed:', error);
    }
  };

  const charCount = message.length + (includeLink ? 20 : 0); // Estimate link length
  const segmentCount = Math.ceil(charCount / 160);
  const isOverLimit = charCount > 160;

  return (
    <div className="w-full px-4 lg:px-0 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white mb-2">New SMS Campaign</h1>
          <p className="text-white/60 text-sm">
            Create targeted text message campaigns with AI assistance
          </p>
        </div>
        <button
          onClick={() => (window.location.href = '/vendor/marketing')}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center gap-2">
        {[
          { key: 'type', label: 'Type' },
          { key: 'content', label: 'Content' },
          { key: 'audience', label: 'Audience' },
          { key: 'schedule', label: 'Schedule' },
          { key: 'preview', label: 'Review' },
        ].map((s, index) => {
          const steps = ['type', 'content', 'audience', 'schedule', 'preview'];
          const currentIndex = steps.indexOf(step);
          const isActive = s.key === step;
          const isComplete = steps.indexOf(s.key) < currentIndex;

          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-white/10 border-white'
                    : isComplete
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-white/5 border-white/20'
                }`}
              >
                {isComplete ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <span className="text-sm text-white">{index + 1}</span>
                )}
              </div>
              <span
                className={`text-xs ${
                  isActive ? 'text-white font-bold' : 'text-white/40'
                }`}
              >
                {s.label}
              </span>
              {index < 4 && (
                <div className="w-8 h-[2px] bg-white/10 mx-1"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        {step === 'type' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Campaign Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      console.log('Input changing to:', e.target.value);
                      setName(e.target.value);
                      console.log('State should now be:', e.target.value);
                    }}
                    placeholder="e.g., Flash Sale - Weekend Deal"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/60 mb-3">
                    Campaign Type
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {campaignTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setCampaignType(type.value)}
                        className={`relative p-4 rounded-xl border-2 transition-all ${
                          campaignType === type.value
                            ? 'border-white bg-white/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className={`text-2xl mb-2`}>{type.icon}</div>
                        <div className="text-sm font-bold text-white">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign-specific fields */}
            {(campaignType === 'flash_sale' ||
              campaignType === 'win_back' ||
              campaignType === 'birthday') && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Discount Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                      Type
                    </label>
                    <select
                      value={discountData.type}
                      onChange={(e) =>
                        setDiscountData({
                          ...discountData,
                          type: e.target.value as 'percentage' | 'fixed_amount',
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                      Value
                    </label>
                    <input
                      type="number"
                      value={discountData.value}
                      onChange={(e) =>
                        setDiscountData({ ...discountData, value: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="20"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {campaignType === 'new_product' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Product Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={productData.name}
                      onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                      placeholder="Blue Dream"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      value={productData.price}
                      onChange={(e) =>
                        setProductData({ ...productData, price: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="35"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => {
                  console.log('Next button clicked. Name value is:', name);
                  setStep('content');
                }}
                disabled={!name}
                className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="ml-4 text-xs text-white/40">
                Debug: name = "{name}" (length: {name.length})
              </div>
            </div>
          </div>
        )}

        {step === 'content' && (
          <div className="space-y-6">
            {/* AI Toggle */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold mb-1">AI-Powered Generation</h4>
                  <p className="text-white/60 text-sm mb-4">
                    Let AI create optimized SMS copy in seconds
                  </p>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAI}
                        onChange={(e) => setUseAI(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm">Use AI Generation</span>
                    </label>
                    {useAI && (
                      <button
                        onClick={generateWithAI}
                        disabled={generating}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        {generating ? 'Generating...' : 'Generate Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Message Editor */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Message Content</h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className={`${isOverLimit ? 'text-red-400' : 'text-white/60'}`}>
                    {charCount} / 160 chars
                  </div>
                  <div className="text-white/40">
                    {segmentCount} segment{segmentCount > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your SMS message..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
              />

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeLink"
                  checked={includeLink}
                  onChange={(e) => setIncludeLink(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="includeLink" className="text-sm text-white/60">
                  Include shop link (+20 chars)
                </label>
              </div>

              {isOverLimit && (
                <div className="mt-4 flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-300">
                    Message exceeds 160 characters. This will be sent as {segmentCount} messages,
                    increasing costs.
                  </div>
                </div>
              )}

              {generatedContent?.metadata?.compliance_check && (
                <div
                  className={`mt-4 flex items-start gap-2 p-4 rounded-xl ${
                    generatedContent.metadata.compliance_check.passed
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-yellow-500/10 border border-yellow-500/20'
                  }`}
                >
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/80">
                    {generatedContent.metadata.compliance_check.passed ? (
                      'Message passes compliance checks'
                    ) : (
                      <div>
                        <div className="font-bold mb-1">Compliance Issues:</div>
                        <ul className="list-disc list-inside">
                          {generatedContent.metadata.compliance_check.issues.map(
                            (issue: string, i: number) => (
                              <li key={i}>{issue}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('type')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setStep('audience')}
                disabled={!message}
                className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'audience' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Audience
              </h2>
              <div className="space-y-4">
                <button
                  onClick={() => setAudienceType('all')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    audienceType === 'all'
                      ? 'border-white bg-white/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-white mb-1">All Customers</div>
                  <div className="text-sm text-white/60">Send to everyone on your SMS list</div>
                </button>

                <button
                  onClick={() => setAudienceType('segment')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    audienceType === 'segment'
                      ? 'border-white bg-white/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-white mb-1">Specific Segment</div>
                  <div className="text-sm text-white/60">Target a specific customer group</div>
                </button>

                {audienceType === 'segment' && (
                  <div className="ml-4 p-4 bg-white/5 rounded-xl">
                    <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                      Select Segment
                    </label>
                    <select
                      value={segmentId}
                      onChange={(e) => setSegmentId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    >
                      <option value="">Choose segment...</option>
                      <option value="vip">VIP Customers</option>
                      <option value="inactive">Inactive (30+ days)</option>
                      <option value="high-value">High Value</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('content')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setStep('schedule')}
                className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule Campaign
              </h2>
              <div className="space-y-4">
                <button
                  onClick={() => setScheduleType('now')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    scheduleType === 'now'
                      ? 'border-white bg-white/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-white mb-1">Send Immediately</div>
                  <div className="text-sm text-white/60">Start sending right away</div>
                </button>

                <button
                  onClick={() => setScheduleType('scheduled')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    scheduleType === 'scheduled'
                      ? 'border-white bg-white/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-white mb-1">Schedule for Later</div>
                  <div className="text-sm text-white/60">Choose a specific date and time</div>
                </button>

                {scheduleType === 'scheduled' && (
                  <div className="ml-4 p-4 bg-white/5 rounded-xl">
                    <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                      Send Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('audience')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setStep('preview')}
                className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6">Review Campaign</h2>

              <div className="space-y-6">
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                    Campaign Name
                  </div>
                  <div className="text-white font-bold">{name}</div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                    Type
                  </div>
                  <div className="text-white">
                    {campaignTypes.find((t) => t.value === campaignType)?.label}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                    Message Preview
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="font-mono text-sm text-white whitespace-pre-wrap">
                      {message}
                      {includeLink && (
                        <span className="text-blue-400"> https://shop.example.com</span>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4 text-xs text-white/60">
                      <div>{charCount} characters</div>
                      <div>{segmentCount} SMS segments</div>
                      {generatedContent && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${generatedContent.estimated_cost.toFixed(2)} per recipient
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                    Audience
                  </div>
                  <div className="text-white">
                    {audienceType === 'all' ? 'All Customers' : 'Specific Segment'}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                    Schedule
                  </div>
                  <div className="text-white">
                    {scheduleType === 'now'
                      ? 'Send Immediately'
                      : `Scheduled for ${new Date(scheduledFor).toLocaleString()}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('schedule')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={saveCampaign}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl text-white font-bold transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {scheduleType === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
