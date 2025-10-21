"use client";

import { useState } from 'react';
import { DollarSign, CheckCircle, Clock, XCircle, Calendar } from 'lucide-react';

interface Payout {
  id: string;
  vendor: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  period: string;
  date: string;
}

export default function AdminPayouts() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  // Sample data - replace with real API
  const payouts: Payout[] = [
    {
      id: '1',
      vendor: 'Vendor A',
      amount: 1524.50,
      status: 'pending',
      period: 'Oct 1-15, 2025',
      date: '2025-10-15'
    },
    {
      id: '2',
      vendor: 'Vendor B',
      amount: 2840.00,
      status: 'completed',
      period: 'Oct 1-15, 2025',
      date: '2025-10-16'
    },
    {
      id: '3',
      vendor: 'Vendor C',
      amount: 987.25,
      status: 'processing',
      period: 'Oct 1-15, 2025',
      date: '2025-10-15'
    },
  ];

  const filteredPayouts = payouts.filter(payout => {
    if (filterStatus === 'all') return true;
    return payout.status === filterStatus;
  });

  const stats = {
    pending: payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    processing: payouts.filter(p => p.status === 'processing').reduce((sum, p) => sum + p.amount, 0),
    completed: payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    total: payouts.reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="w-full animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl text-white font-light tracking-tight mb-2">
          Vendor Payouts
        </h1>
        <p className="text-white/50 text-sm">
          Manage vendor payments and commissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111111] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Pending</span>
            <Clock size={18} className="text-white/30" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            ${stats.pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-white/30 text-xs">Awaiting payment</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Processing</span>
            <DollarSign size={18} className="text-white/30" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            ${stats.processing.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-white/30 text-xs">In progress</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Completed</span>
            <CheckCircle size={18} className="text-white/30" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            ${stats.completed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-white/30 text-xs">This period</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/50 text-xs uppercase tracking-wider">Total</span>
            <DollarSign size={18} className="text-white/30" />
          </div>
          <div className="text-2xl font-light text-white mb-1">
            ${stats.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-white/30 text-xs">All payouts</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
            filterStatus === 'all'
              ? 'bg-white text-black'
              : 'bg-[#111111] text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
            filterStatus === 'pending'
              ? 'bg-white/10 text-white border border-white'
              : 'bg-[#111111] text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
            filterStatus === 'completed'
              ? 'bg-white/10 text-white border border-white'
              : 'bg-[#111111] text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Payouts List */}
      <div className="grid gap-4">
        {filteredPayouts.map((payout) => (
          <div
            key={payout.id}
            className="bg-[#111111] border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="p-6">
              <div className="flex items-start gap-6">
                {/* Icon */}
                <div className="w-16 h-16 bg-white/5 flex items-center justify-center flex-shrink-0">
                  <DollarSign size={28} className="text-white/30" />
                </div>

                {/* Payout Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-lg mb-2">
                        {payout.vendor}
                      </h3>
                      <div className="text-white/50 text-sm mb-1">
                        Period: {payout.period}
                      </div>
                      <div className="text-white/40 text-xs">
                        ID: {payout.id}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {payout.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 border border-white/20">
                          <CheckCircle size={14} />
                          Completed
                        </span>
                      ) : payout.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/40 border border-white/10">
                          <Clock size={14} />
                          Pending
                        </span>
                      ) : payout.status === 'processing' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/60 border border-white/15">
                          <DollarSign size={14} />
                          Processing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 border border-red-500/30">
                          <XCircle size={14} />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-6 py-4 border-t border-b border-white/5 mb-4">
                    <div>
                      <div className="text-white/40 text-xs mb-1">Amount</div>
                      <div className="text-white text-lg font-medium">
                        ${payout.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/40 text-xs mb-1">Date</div>
                      <div className="text-white text-sm">
                        {new Date(payout.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {payout.status === 'pending' && (
                    <div className="flex gap-3">
                      <button className="px-4 py-2 text-xs text-white bg-white/10 border border-white hover:bg-white/20 transition-all">
                        Process Payment
                      </button>
                      <button className="px-4 py-2 text-xs text-white/60 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
