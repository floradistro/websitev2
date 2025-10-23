"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  DollarSign, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  TrendingUp,
  Award,
  Package,
  AlertCircle,
  Calculator
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku?: string;
  regular_price: number;
  sale_price?: number;
  wholesale_price?: number;
  is_wholesale: boolean;
  wholesale_only: boolean;
  minimum_wholesale_quantity: number;
  vendor_id: string;
}

interface PricingTier {
  id?: string;
  tier_name: string;
  minimum_quantity: number;
  unit_price: number;
  discount_percentage?: number;
}

export default function WholesalePricingPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pricing state
  const [isWholesale, setIsWholesale] = useState(false);
  const [wholesaleOnly, setWholesaleOnly] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [minimumQuantity, setMinimumQuantity] = useState(1);
  
  // Tier pricing
  const [tiers, setTiers] = useState<PricingTier[]>([]);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      setLoading(true);
      
      // Load product
      const { data: productData } = await axios.get(`/api/admin/products/${productId}`);
      setProduct(productData.product);
      
      // Set form values
      setIsWholesale(productData.product.is_wholesale || false);
      setWholesaleOnly(productData.product.wholesale_only || false);
      setWholesalePrice(productData.product.wholesale_price || 0);
      setMinimumQuantity(productData.product.minimum_wholesale_quantity || 1);
      
      // Load tier pricing
      const { data: tierData } = await axios.get(`/api/admin/products/${productId}/pricing-tiers`);
      setTiers(tierData.tiers || []);
      
    } catch (error) {
      console.error('Load error:', error);
      alert('Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  async function savePricing() {
    try {
      setSaving(true);
      
      // Update product wholesale settings
      await axios.put(`/api/admin/products/${productId}`, {
        is_wholesale: isWholesale,
        wholesale_only: wholesaleOnly,
        wholesale_price: wholesalePrice,
        minimum_wholesale_quantity: minimumQuantity
      });
      
      // Update tier pricing
      await axios.put(`/api/admin/products/${productId}/pricing-tiers`, {
        tiers: tiers.filter(t => t.tier_name && t.minimum_quantity > 0 && t.unit_price > 0)
      });
      
      alert('Wholesale pricing saved successfully!');
      loadProduct();
    } catch (error: any) {
      console.error('Save error:', error);
      alert('Failed to save pricing: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  }

  function addTier() {
    setTiers([...tiers, {
      tier_name: `Tier ${tiers.length + 1}`,
      minimum_quantity: (tiers.length > 0 ? tiers[tiers.length - 1].minimum_quantity : minimumQuantity) * 2,
      unit_price: wholesalePrice * 0.9,
      discount_percentage: 10
    }]);
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index));
  }

  function updateTier(index: number, field: keyof PricingTier, value: any) {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    
    // Auto-calculate discount percentage
    if (field === 'unit_price' && product?.regular_price) {
      const discount = ((product.regular_price - value) / product.regular_price) * 100;
      newTiers[index].discount_percentage = Math.round(discount);
    }
    
    setTiers(newTiers);
  }

  function calculateSavings(quantity: number): { price: number; total: number; savings: number } {
    if (!product) return { price: 0, total: 0, savings: 0 };
    
    // Find applicable tier
    const applicableTier = [...tiers]
      .sort((a, b) => b.minimum_quantity - a.minimum_quantity)
      .find(t => quantity >= t.minimum_quantity);
    
    const price = applicableTier ? applicableTier.unit_price : wholesalePrice;
    const total = price * quantity;
    const retailTotal = product.regular_price * quantity;
    const savings = retailTotal - total;
    
    return { price, total, savings };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading pricing...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <p className="text-white/60">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          
          <h1 className="text-3xl font-light mb-2">Wholesale Pricing</h1>
          <p className="text-white/60">{product.name}</p>
          {product.sku && (
            <p className="text-white/40 text-sm">SKU: {product.sku}</p>
          )}
        </div>

        {/* Current Pricing Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Retail Price</p>
            <p className="text-2xl font-light">${product.regular_price.toFixed(2)}</p>
          </div>
          
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-xs text-green-400 uppercase tracking-wider mb-2">Wholesale Price</p>
            <p className="text-2xl font-light text-green-400">
              ${wholesalePrice > 0 ? wholesalePrice.toFixed(2) : '—'}
            </p>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-2">Potential Discount</p>
            <p className="text-2xl font-light text-blue-400">
              {wholesalePrice > 0 && product.regular_price > 0
                ? `${Math.round(((product.regular_price - wholesalePrice) / product.regular_price) * 100)}%`
                : '—'}
            </p>
          </div>
        </div>

        {/* Wholesale Settings */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Wholesale Configuration</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isWholesale}
                  onChange={(e) => setIsWholesale(e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium">Enable Wholesale</span>
              </label>
              
              {isWholesale && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={wholesaleOnly}
                    onChange={(e) => setWholesaleOnly(e.target.checked)}
                    className="rounded"
                  />
                  <span className="font-medium">Wholesale Only</span>
                  <span className="text-xs text-white/40">(Hide from retail)</span>
                </label>
              )}
            </div>

            {isWholesale && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      Base Wholesale Price (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                      <input
                        type="number"
                        value={wholesalePrice}
                        onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                        placeholder="99.99"
                        className="w-full bg-white/5 border border-white/10 rounded pl-10 pr-4 py-3 text-white focus:outline-none focus:border-white/30"
                        step="0.01"
                      />
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      Price for minimum quantity orders
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      Minimum Order Quantity
                    </label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                      <input
                        type="number"
                        value={minimumQuantity}
                        onChange={(e) => setMinimumQuantity(parseInt(e.target.value) || 1)}
                        placeholder="10"
                        className="w-full bg-white/5 border border-white/10 rounded pl-10 pr-4 py-3 text-white focus:outline-none focus:border-white/30"
                        min="1"
                      />
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      Minimum units per wholesale order
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tier Pricing */}
        {isWholesale && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium mb-1">Volume Tier Pricing</h3>
                <p className="text-sm text-white/60">Offer better prices for larger orders</p>
              </div>
              <button
                onClick={addTier}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded transition-all"
              >
                <Plus size={18} />
                Add Tier
              </button>
            </div>

            {tiers.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-lg">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-white/20" />
                <p className="text-white/60 mb-2">No pricing tiers yet</p>
                <p className="text-sm text-white/40 mb-4">
                  Add tiers to offer volume discounts
                </p>
                <button
                  onClick={addTier}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 transition-all"
                >
                  <Plus size={18} />
                  Create First Tier
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tiers.map((tier, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex-1 grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Tier Name</label>
                        <input
                          type="text"
                          value={tier.tier_name}
                          onChange={(e) => updateTier(index, 'tier_name', e.target.value)}
                          placeholder="Bronze"
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-white/40 mb-1">Min. Quantity</label>
                        <input
                          type="number"
                          value={tier.minimum_quantity}
                          onChange={(e) => updateTier(index, 'minimum_quantity', parseInt(e.target.value) || 0)}
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-white/40 mb-1">Unit Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                          <input
                            type="number"
                            value={tier.unit_price}
                            onChange={(e) => updateTier(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded pl-6 pr-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-white/40 mb-1">Discount</label>
                        <div className="flex items-center gap-2 text-sm">
                          <Award size={14} className="text-green-400" />
                          <span className="text-green-400 font-medium">
                            {tier.discount_percentage || 0}% off
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeTier(index)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pricing Calculator */}
        {isWholesale && wholesalePrice > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="text-blue-400" size={20} />
              <h3 className="text-lg font-medium text-blue-400">Pricing Calculator</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[minimumQuantity, minimumQuantity * 5, minimumQuantity * 10].map((qty) => {
                const calc = calculateSavings(qty);
                return (
                  <div key={qty} className="bg-black/30 rounded-lg p-4">
                    <p className="text-sm text-white/60 mb-2">{qty} units</p>
                    <p className="text-xl font-light mb-1">${calc.price.toFixed(2)}/ea</p>
                    <p className="text-sm text-white/60 mb-2">Total: ${calc.total.toFixed(2)}</p>
                    {calc.savings > 0 && (
                      <p className="text-xs text-green-400">
                        Save ${calc.savings.toFixed(2)} vs retail
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Warnings */}
        {isWholesale && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-yellow-400">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="space-y-1 text-yellow-400/80">
                  <li>• Wholesale prices should be lower than retail prices</li>
                  <li>• Tier quantities must be in ascending order</li>
                  <li>• Lower unit prices for higher quantities</li>
                  <li>• Changes take effect immediately</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={savePricing}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black font-medium hover:bg-white/90 transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Wholesale Pricing'}
          </button>
          
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-white/20 text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

