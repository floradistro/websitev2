'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, LayoutGrid, Type, Maximize2, Lightbulb, TrendingUp } from 'lucide-react';

interface AIRecommendationViewerProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: any;
  deviceName: string;
  menuId: string;
  onApply: () => void;
}

export default function AIRecommendationViewer({
  isOpen,
  onClose,
  recommendation,
  deviceName,
  menuId,
  onApply,
}: AIRecommendationViewerProps) {
  const [applying, setApplying] = useState(false);
  const [selectedAlternative, setSelectedAlternative] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !recommendation) return null;

  const { layout, reasoning, alternatives, customizationTips, confidence } = recommendation;

  const handleApply = async (layoutToApply?: any) => {
    setApplying(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/apply-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: recommendation.recommendationId,
          menuId,
          modifications: layoutToApply ? { layout: layoutToApply } : null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to apply layout');
      }

      onApply();
    } catch (err: any) {
      console.error('Error applying layout:', err);
      setError(err.message || 'Failed to apply layout');
    } finally {
      setApplying(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceBar = (score: number) => {
    if (score >= 85) return 'bg-green-400';
    if (score >= 70) return 'bg-yellow-400';
    return 'bg-orange-400';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-black border border-white/20 rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white" style={{ fontWeight: 900 }}>
                  AI Recommendation
                </h2>
                <p className="text-white/40 text-sm mt-1">{deviceName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-white/60" />
            </button>
          </div>

          {/* Confidence Score */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Confidence</span>
              <span className={`text-lg font-bold ${getConfidenceColor(confidence)}`}>
                {confidence}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full ${getConfidenceBar(confidence)}`}
              />
            </div>
          </div>

          {/* Recommended Layout */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <LayoutGrid size={20} />
              Recommended Layout
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/50 rounded-lg p-4">
                <div className="text-white/40 text-xs mb-1">Display Mode</div>
                <div className="text-white font-bold capitalize">{layout.displayMode}</div>
              </div>
              <div className="bg-black/50 rounded-lg p-4">
                <div className="text-white/40 text-xs mb-1">Grid</div>
                <div className="text-white font-bold">
                  {layout.gridColumns}×{layout.gridRows}
                </div>
              </div>
              <div className="bg-black/50 rounded-lg p-4">
                <div className="text-white/40 text-xs mb-1">Products/Page</div>
                <div className="text-white font-bold">{layout.productsPerPage}</div>
              </div>
              <div className="bg-black/50 rounded-lg p-4">
                <div className="text-white/40 text-xs mb-1">Price Font</div>
                <div className="text-white font-bold">{layout.typography?.priceSize}px</div>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          {reasoning && reasoning.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Type size={20} />
                Why This Layout?
              </h3>
              <div className="space-y-2">
                {reasoning.map((reason: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 text-white/70 text-sm"
                  >
                    <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Alternatives */}
          {alternatives && alternatives.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Maximize2 size={20} />
                Alternative Layouts
              </h3>
              <div className="space-y-3">
                {alternatives.map((alt: any, index: number) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedAlternative(selectedAlternative === index ? null : index)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedAlternative === index
                        ? 'border-white bg-white/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-white font-bold mb-1">{alt.name}</div>
                        <div className="text-white/60 text-sm">{alt.description}</div>
                      </div>
                      {selectedAlternative === index && (
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                          <Check size={14} className="text-black" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Customization Tips */}
          {customizationTips && customizationTips.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Lightbulb size={20} />
                Pro Tips
              </h3>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="space-y-2">
                  {customizationTips.map((tip: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 text-white/80 text-sm">
                      <TrendingUp size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={applying}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              Not Now
            </button>
            <button
              onClick={() => handleApply(selectedAlternative !== null ? alternatives[selectedAlternative].layout : null)}
              disabled={applying}
              className="flex-1 px-6 py-3 bg-white hover:bg-white/90 text-black rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-white/10 flex items-center justify-center gap-2"
            >
              {applying ? (
                'Applying...'
              ) : (
                <>
                  <Check size={18} />
                  {selectedAlternative !== null ? 'Apply Alternative' : 'Apply Layout'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
