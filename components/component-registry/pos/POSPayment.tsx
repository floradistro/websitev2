'use client';

import { useState } from 'react';
import { Plus, X, Banknote, CreditCard, Wallet } from 'lucide-react';

interface SplitPayment {
  method: 'cash' | 'card';
  amount: number;
}

interface POSPaymentProps {
  total: number;
  onPaymentComplete: (paymentData: PaymentData) => void;
  onCancel: () => void;
}

export interface PaymentData {
  paymentMethod: 'cash' | 'card' | 'split';
  cashTendered?: number;
  changeGiven?: number;
  authorizationCode?: string;
  splitPayments?: SplitPayment[];
}

export function POSPayment({ total, onPaymentComplete, onCancel }: POSPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [processing, setProcessing] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [splitMethod, setSplitMethod] = useState<'cash' | 'card'>('cash');
  const [splitAmount, setSplitAmount] = useState('');

  const changeAmount = cashTendered ? parseFloat(cashTendered) - total : 0;
  const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.round((total - totalPaid) * 100) / 100;
  
  const canComplete = paymentMethod === 'cash' 
    ? changeAmount >= 0 
    : paymentMethod === 'split'
    ? remaining <= 0.01
    : true;

  const handleAddSplitPayment = () => {
    const amount = parseFloat(splitAmount);
    if (amount > 0 && amount <= remaining + 0.01) {
      const finalAmount = Math.min(amount, remaining);
      const roundedAmount = Math.round(finalAmount * 100) / 100;
      setSplitPayments([...splitPayments, { method: splitMethod, amount: roundedAmount }]);
      setSplitAmount('');
    }
  };

  const handleRemoveSplitPayment = (index: number) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (!canComplete) return;

    setProcessing(true);

    try {
      if (paymentMethod === 'cash') {
        const tendered = parseFloat(cashTendered);
        const change = tendered - total;
        
        onPaymentComplete({
          paymentMethod: 'cash',
          cashTendered: tendered,
          changeGiven: change,
        });
      } else if (paymentMethod === 'split') {
        onPaymentComplete({
          paymentMethod: 'split',
          splitPayments,
        });
      } else {
        // Card payment (future: integrate with terminal)
        console.log('Card payment processed');
        onPaymentComplete({
          paymentMethod: 'card',
          authorizationCode: `AUTH-${Date.now()}`,
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setProcessing(false);
    }
  };

  // Quick cash amount buttons
  const quickAmounts = [
    Math.ceil(total),
    Math.ceil(total / 20) * 20,
    Math.ceil(total / 50) * 50,
    100,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-white/5">
        {/* Header */}
        <div className="text-center mb-6 border-b border-white/5 pb-4">
          <h2 className="text-xs uppercase tracking-[0.15em] text-white/60 mb-2 font-black">
            Payment
          </h2>
          <div className="text-white font-black text-4xl tracking-tight" style={{ fontWeight: 900 }}>
            ${total.toFixed(2)}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`py-3 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-bold transition-all ${
              paymentMethod === 'cash'
                ? 'bg-white/20 text-white border-2 border-white/30'
                : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <Banknote size={14} className="inline mr-2" />
            Cash
          </button>
          <button
            onClick={() => setPaymentMethod('card')}
            className={`py-3 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-bold transition-all ${
              paymentMethod === 'card'
                ? 'bg-white/20 text-white border-2 border-white/30'
                : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <CreditCard size={14} className="inline mr-2" />
            Card
          </button>
          <button
            onClick={() => setPaymentMethod('split')}
            className={`py-3 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-bold transition-all ${
              paymentMethod === 'split'
                ? 'bg-white/20 text-white border-2 border-white/30'
                : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <Wallet size={14} className="inline mr-2" />
            Split
          </button>
        </div>

        {/* Cash Payment */}
        {paymentMethod === 'cash' && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
                Cash Tendered
              </label>
              <input
                type="number"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                placeholder="0.00"
                step="0.01"
                autoFocus
                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 text-white text-2xl font-black text-center py-4 rounded-2xl focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
                style={{ fontWeight: 900 }}
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setCashTendered(amount.toString())}
                  className="py-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-white/20 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Change Display */}
            {cashTendered && (
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-xs uppercase tracking-[0.15em]">Change Due</span>
                  <span className={`font-black text-2xl tracking-tight ${
                    changeAmount >= 0 ? 'text-green-400' : 'text-red-400'
                  }`} style={{ fontWeight: 900 }}>
                    ${Math.abs(changeAmount).toFixed(2)}
                  </span>
                </div>
                {changeAmount < 0 && (
                  <div className="text-red-400 text-[10px] mt-2 uppercase tracking-wider">
                    Insufficient payment
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Card Payment */}
        {paymentMethod === 'card' && (
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 mb-6 text-center">
            <div className="flex justify-center mb-3">
              <CreditCard size={48} className="text-white/20" />
            </div>
            <div className="text-white/60 text-xs uppercase tracking-wider mb-2">
              Card terminal integration coming soon
            </div>
            <div className="text-white/40 text-[10px]">
              For now, this will record as "card" payment
            </div>
          </div>
        )}

        {/* Split Payment */}
        {paymentMethod === 'split' && (
          <div className="space-y-4 mb-6">
            {/* Split Payments List */}
            {splitPayments.length > 0 && (
              <div className="space-y-2">
                {splitPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#141414] border border-white/5 rounded-2xl p-3">
                    <div className="flex items-center gap-3">
                      {payment.method === 'cash' ? (
                        <Banknote size={20} className="text-white/40" />
                      ) : (
                        <CreditCard size={20} className="text-white/40" />
                      )}
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.15em] text-white/40">{payment.method}</div>
                        <div className="text-white font-black text-sm" style={{ fontWeight: 900 }}>
                          ${payment.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSplitPayment(index)}
                      className="w-7 h-7 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"
                    >
                      <X size={14} className="text-white/60" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Progress */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/40 uppercase tracking-[0.15em]">Paid</span>
                <span className="text-white font-black" style={{ fontWeight: 900 }}>${totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs mb-3">
                <span className="text-white/40 uppercase tracking-[0.15em]">Remaining</span>
                <span className={`font-black ${remaining > 0 ? 'text-white' : 'text-green-400'}`} style={{ fontWeight: 900 }}>
                  ${remaining.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${Math.min((totalPaid / total) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Add Payment Section */}
            {remaining > 0.01 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSplitMethod('cash')}
                    className={`py-3 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-bold transition-all ${
                      splitMethod === 'cash'
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Banknote size={14} className="inline mr-2" />
                    Cash
                  </button>
                  <button
                    onClick={() => setSplitMethod('card')}
                    className={`py-3 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-bold transition-all ${
                      splitMethod === 'card'
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <CreditCard size={14} className="inline mr-2" />
                    Card
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSplitPayment();
                      }
                    }}
                    placeholder={`Max: $${remaining.toFixed(2)}`}
                    className="flex-1 bg-white/5 border border-white/10 text-white text-center py-3 rounded-2xl text-sm font-black focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all placeholder-white/30"
                    style={{ fontWeight: 900 }}
                  />
                  <button
                    onClick={handleAddSplitPayment}
                    disabled={!splitAmount || parseFloat(splitAmount) <= 0}
                    className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={() => setSplitAmount(remaining.toFixed(2))}
                  className="w-full text-[10px] text-white/60 hover:text-white uppercase tracking-[0.15em] transition-colors"
                >
                  Pay Remaining ${remaining.toFixed(2)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 px-4 py-3 border border-white/10 text-white rounded-2xl hover:bg-white/5 hover:border-white/20 text-[10px] font-bold uppercase tracking-[0.15em] disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={!canComplete || processing}
            className="flex-1 px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-2xl hover:bg-white/20 hover:border-white/30 text-[10px] font-black uppercase tracking-[0.15em] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            style={{ fontWeight: 900 }}
          >
            {processing ? 'Processing...' : 'Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}

