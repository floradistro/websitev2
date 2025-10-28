'use client';

import { useRef } from 'react';
import { Printer, Mail, X } from 'lucide-react';

interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface POSReceiptProps {
  orderNumber: string;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  cashTendered?: number;
  changeGiven?: number;
  customerName?: string;
  locationName: string;
  vendorName: string;
  transactionDate: Date;
  onClose: () => void;
}

export function POSReceipt({
  orderNumber,
  items,
  subtotal,
  taxAmount,
  total,
  paymentMethod,
  cashTendered,
  changeGiven,
  customerName,
  locationName,
  vendorName,
  transactionDate,
  onClose,
}: POSReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // TODO: Email receipt
    console.log('Email receipt - coming soon');
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header Actions */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-xs uppercase tracking-[0.15em] text-white font-black" style={{ fontWeight: 900 }}>
            Receipt
          </h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="p-6 bg-white text-black print:p-8">
          {/* Business Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black uppercase tracking-tight mb-1" style={{ fontWeight: 900 }}>
              {vendorName}
            </h1>
            <div className="text-xs uppercase tracking-[0.15em] text-black/60">
              {locationName}
            </div>
          </div>

          {/* Order Info */}
          <div className="border-t border-b border-black/10 py-3 mb-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="uppercase tracking-[0.15em] text-black/60">Order</span>
              <span className="font-black">{orderNumber}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="uppercase tracking-[0.15em] text-black/60">Date</span>
              <span className="font-black">{transactionDate.toLocaleString()}</span>
            </div>
            {customerName && customerName !== 'Walk-In' && (
              <div className="flex justify-between text-xs">
                <span className="uppercase tracking-[0.15em] text-black/60">Customer</span>
                <span className="font-black">{customerName}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-4">
            {items.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-xs font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
                      {item.productName}
                    </div>
                    <div className="text-[10px] text-black/60 uppercase tracking-[0.15em]">
                      {item.quantity} × ${item.unitPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-sm font-black" style={{ fontWeight: 900 }}>
                    ${item.lineTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-black/10 pt-3 space-y-2 mb-4">
            <div className="flex justify-between text-xs">
              <span className="uppercase tracking-[0.15em] text-black/60">Subtotal</span>
              <span className="font-black">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="uppercase tracking-[0.15em] text-black/60">Tax (8%)</span>
              <span className="font-black">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base border-t border-black/10 pt-2">
              <span className="uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>Total</span>
              <span className="font-black" style={{ fontWeight: 900 }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t border-black/10 pt-3 mb-6 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="uppercase tracking-[0.15em] text-black/60">Payment</span>
              <span className="font-black uppercase">{paymentMethod}</span>
            </div>
            {cashTendered && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="uppercase tracking-[0.15em] text-black/60">Cash</span>
                  <span className="font-black">${cashTendered.toFixed(2)}</span>
                </div>
                {changeGiven !== undefined && changeGiven > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="uppercase tracking-[0.15em] text-black/60">Change</span>
                    <span className="font-black">${changeGiven.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] uppercase tracking-[0.15em] text-black/40">
            Thank You!
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/5 flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-white/10 text-white border-2 border-white/20 rounded-2xl py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all duration-300 flex items-center justify-center gap-2"
            style={{ fontWeight: 900 }}
          >
            <Printer size={12} strokeWidth={2.5} />
            Print
          </button>
          <button
            onClick={handleEmail}
            className="flex-1 border border-white/10 text-white rounded-2xl py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-white/5 hover:border-white/20 font-black transition-all flex items-center justify-center gap-2"
            style={{ fontWeight: 900 }}
          >
            <Mail size={12} strokeWidth={2.5} />
            Email
          </button>
        </div>
      </div>
    </div>
  );
}

