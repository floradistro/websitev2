'use client';

import { useState } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Sparkles,
  Send,
  Calendar,
  Users,
  Eye,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Wand2,
} from 'lucide-react';
import Link from 'next/link';

interface ProductSelection {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  thc_percent?: number;
}

export default function NewEmailCampaignPage() {
  const { vendor } = useAppAuth();
  const router = useRouter();

  // Form state
  const [step, setStep] = useState<'type' | 'content' | 'audience' | 'schedule' | 'preview'>(
    'type'
  );
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState<
    'welcome' | 'new_product' | 'sale' | 'win_back' | 'birthday' | 'loyalty_reward' | 'custom'
  >('sale');

  // AI Generation
  const [useAI, setUseAI] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  // Manual content
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Product selection for product campaigns
  const [selectedProduct, setSelectedProduct] = useState<ProductSelection | null>(null);
  const [discountValue, setDiscountValue] = useState('15');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');

  // Audience
  const [audienceType, setAudienceType] = useState<'all' | 'segment'>('all');
  const [selectedSegment, setSelectedSegment] = useState('');

  // Schedule
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const [saving, setSaving] = useState(false);

  // Campaign type options
  const campaignTypes = [
    {
      value: 'sale',
      label: 'Sale/Promotion',
      description: 'Announce discounts and special offers',
      icon: '🎉',
      color: 'from-red-500/20 to-red-600/20',
    },
    {
      value: 'new_product',
      label: 'New Product',
      description: 'Launch new products to customers',
      icon: '✨',
      color: 'from-purple-500/20 to-purple-600/20',
    },
    {
      value: 'welcome',
      label: 'Welcome Series',
      description: 'Greet new customers',
      icon: '👋',
      color: 'from-blue-500/20 to-blue-600/20',
    },
    {
      value: 'win_back',
      label: 'Win-Back',
      description: 'Re-engage lapsed customers',
      icon: '💚',
      color: 'from-green-500/20 to-green-600/20',
    },
    {
      value: 'birthday',
      label: 'Birthday',
      description: 'Celebrate customer birthdays',
      icon: '🎂',
      color: 'from-pink-500/20 to-pink-600/20',
    },
    {
      value: 'custom',
      label: 'Custom',
      description: 'Create from scratch',
      icon: '✍️',
      color: 'from-gray-500/20 to-gray-600/20',
    },
  ];

  // Generate email with AI
  const generateWithAI = async () => {
    if (!vendor) return;
    setGenerating(true);

    try {
      const response = await fetch('/api/vendor/marketing/email/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id,
        },
        body: JSON.stringify({
          campaignType,
          productData: selectedProduct,
          discountData: {
            type: discountType,
            value: parseInt(discountValue),
          },
        }),
      });

      const data = await response.json();
      setGeneratedContent(data);
      setSubject(data.subject);
      setPreheader(data.preheader);
      setEmailBody(data.html);
      setStep('preview');
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate email. Please try again or create manually.');
    } finally {
      setGenerating(false);
    }
  };

  // Save campaign
  const saveCampaign = async () => {
    if (!vendor) return;
    setSaving(true);

    try {
      const response = await fetch('/api/vendor/marketing/email/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id,
        },
        body: JSON.stringify({
          name: campaignName,
          subject_line: subject,
          preheader: preheader,
          html_body: emailBody,
          segment_id: audienceType === 'segment' ? selectedSegment : null,
          status: scheduleType === 'now' ? 'sending' : 'scheduled',
          scheduled_for:
            scheduleType === 'scheduled' ? `${scheduleDate}T${scheduleTime}:00` : null,
        }),
      });

      if (response.ok) {
        router.push('/vendor/marketing');
      } else {
        alert('Failed to save campaign');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full px-4 lg:px-0 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/vendor/marketing"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Marketing
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1">
              Create Email Campaign
            </h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
              AI-Powered • Professional • Cannabis-Compliant
            </p>
          </div>

          {/* Progress Steps */}
          <div className="hidden md:flex items-center gap-2">
            {['Type', 'Content', 'Audience', 'Schedule', 'Review'].map((label, index) => {
              const stepValues = ['type', 'content', 'audience', 'schedule', 'preview'];
              const currentIndex = stepValues.indexOf(step);
              const isActive = index === currentIndex;
              const isComplete = index < currentIndex;

              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                      isComplete
                        ? 'bg-green-500/20 border-green-500'
                        : isActive
                        ? 'bg-white/10 border-white'
                        : 'bg-white/5 border-white/20'
                    }`}
                  >
                    {isComplete ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <span
                        className={`text-xs ${isActive ? 'text-white' : 'text-white/40'}`}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>
                  {index < 4 && (
                    <div
                      className={`w-8 h-0.5 ${isComplete ? 'bg-green-500' : 'bg-white/10'}`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step 1: Campaign Type */}
      {step === 'type' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <label className="block text-xs uppercase tracking-wider text-white/60 mb-3">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Black Friday Sale 2025"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider text-white/60 mb-4">
              Select Campaign Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaignTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setCampaignType(type.value as any)}
                  className={`relative bg-gradient-to-br ${type.color} border rounded-2xl p-6 text-left transition-all ${
                    campaignType === type.value
                      ? 'border-white/30 scale-105'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {campaignType === type.value && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    </div>
                  )}
                  <div className="text-3xl mb-3">{type.icon}</div>
                  <h4 className="text-white font-bold mb-1">{type.label}</h4>
                  <p className="text-white/60 text-sm">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* AI Toggle */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles size={24} className="text-purple-400" />
                <div>
                  <h4 className="text-white font-bold">AI-Powered Generation</h4>
                  <p className="text-white/60 text-sm">
                    Let AI create professional email content for you
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUseAI(!useAI)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  useAI ? 'bg-purple-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    useAI ? 'translate-x-8' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>
          </div>

          {/* Additional Fields for Product/Discount Campaigns */}
          {(campaignType === 'new_product' || campaignType === 'sale') && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h4 className="text-white font-bold mb-4">Campaign Details</h4>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                  Discount
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="percentage">% Off</option>
                    <option value="fixed_amount">$ Off</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setStep('content')}
              disabled={!campaignName}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next: Content
              <ArrowLeft size={16} className="rotate-180" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Content */}
      {step === 'content' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {useAI ? (
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-8 text-center">
              <Wand2 size={48} className="mx-auto mb-4 text-purple-400" />
              <h3 className="text-white font-black text-xl mb-2">Ready to Generate</h3>
              <p className="text-white/60 mb-6">
                AI will create professional email content based on your campaign type
              </p>
              <button
                onClick={generateWithAI}
                disabled={generating}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-bold disabled:opacity-50 transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Email with AI
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Your compelling subject line..."
                  maxLength={50}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
                <div className="text-xs text-white/40 mt-2">{subject.length}/50 characters</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                  Preview Text
                </label>
                <input
                  type="text"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="This appears in email preview..."
                  maxLength={100}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
                <div className="text-xs text-white/40 mt-2">
                  {preheader.length}/100 characters
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                  Email Body (HTML)
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="<p>Your email content here...</p>"
                  rows={12}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30 font-mono text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep('type')}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            {!useAI && (
              <button
                onClick={() => setStep('audience')}
                disabled={!subject || !emailBody}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next: Audience
                <ArrowLeft size={16} className="rotate-180" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Step 3: Audience (simplified for now) */}
      {step === 'audience' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Select Audience</h3>
            <div className="space-y-3">
              <button
                onClick={() => setAudienceType('all')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  audienceType === 'all'
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-white/60" />
                  <div className="text-left">
                    <div className="text-white font-medium">All Customers</div>
                    <div className="text-white/40 text-sm">Send to everyone</div>
                  </div>
                </div>
                {audienceType === 'all' && <Check size={20} className="text-green-500" />}
              </button>

              <button
                onClick={() => setAudienceType('segment')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  audienceType === 'segment'
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-white/60" />
                  <div className="text-left">
                    <div className="text-white font-medium">Specific Segment</div>
                    <div className="text-white/40 text-sm">Target specific group</div>
                  </div>
                </div>
                {audienceType === 'segment' && <Check size={20} className="text-green-500" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('content')}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setStep('schedule')}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all"
            >
              Next: Schedule
              <ArrowLeft size={16} className="rotate-180" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Schedule */}
      {step === 'schedule' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">When to Send</h3>
            <div className="space-y-3">
              <button
                onClick={() => setScheduleType('now')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  scheduleType === 'now'
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Send size={20} className="text-white/60" />
                  <div className="text-left">
                    <div className="text-white font-medium">Send Now</div>
                    <div className="text-white/40 text-sm">Deliver immediately</div>
                  </div>
                </div>
                {scheduleType === 'now' && <Check size={20} className="text-green-500" />}
              </button>

              <button
                onClick={() => setScheduleType('scheduled')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  scheduleType === 'scheduled'
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-white/60" />
                  <div className="text-left">
                    <div className="text-white font-medium">Schedule for Later</div>
                    <div className="text-white/40 text-sm">Pick date and time</div>
                  </div>
                </div>
                {scheduleType === 'scheduled' && <Check size={20} className="text-green-500" />}
              </button>
            </div>

            {scheduleType === 'scheduled' && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('audience')}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setStep('preview')}
              disabled={scheduleType === 'scheduled' && (!scheduleDate || !scheduleTime)}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Review Campaign
              <Eye size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 5: Preview & Send */}
      {step === 'preview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Campaign Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Campaign Name:</span>
                <span className="text-white font-medium">{campaignName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Type:</span>
                <span className="text-white font-medium capitalize">{campaignType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Audience:</span>
                <span className="text-white font-medium">
                  {audienceType === 'all' ? 'All Customers' : 'Selected Segment'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Schedule:</span>
                <span className="text-white font-medium">
                  {scheduleType === 'now'
                    ? 'Send Immediately'
                    : `${scheduleDate} at ${scheduleTime}`}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Email Preview</h3>
            <div className="bg-white/10 rounded-xl p-4 space-y-3">
              <div>
                <div className="text-xs text-white/40 mb-1">Subject:</div>
                <div className="text-white font-medium">{subject}</div>
              </div>
              <div>
                <div className="text-xs text-white/40 mb-1">Preview:</div>
                <div className="text-white/60 text-sm">{preheader}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('schedule')}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={saveCampaign}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl text-white font-bold disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send size={20} />
                  {scheduleType === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
