"use client";

import { useEffect, useState } from 'react';
import { DollarSign, Calendar, CheckCircle, Clock, Download, TrendingUp } from 'lucide-react';

interface Payout {
  id: number;
  payoutNumber: string;
  period: string;
  grossRevenue: number;
  commission: number;
  netEarnings: number;
  status: 'completed' | 'pending' | 'processing';
  payoutDate: string;
  transactionId: string;
}

export default function VendorPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API: /vendor-marketplace/v1/payouts
    setTimeout(() => {
      setPayouts([
        {
          id: 1,
          payoutNumber: 'PAY-2025-10-001',
          period: 'October 1-18, 2025',
          grossRevenue: 8247.68,
          commission: 1237.15,
          netEarnings: 7010.53,
          status: 'pending',
          payoutDate: '2025-11-05',
          transactionId: 'TXN-PENDING'
        },
        {
          id: 2,
          payoutNumber: 'PAY-2025-09-001',
          period: 'September 2025',
          grossRevenue: 7334.72,
          commission: 1100.21,
          netEarnings: 6234.51,
          status: 'completed',
          payoutDate: '2025-10-05',
          transactionId: 'TXN-092547831'
        },
        {
          id: 3,
          payoutNumber: 'PAY-2025-08-001',
          period: 'August 2025',
          grossRevenue: 6891.24,
          commission: 1033.69,
          netEarnings: 5857.55,
          status: 'completed',
          payoutDate: '2025-09-05',
          transactionId: 'TXN-082441762'
        },
        {
          id: 4,
          payoutNumber: 'PAY-2025-07-001',
          period: 'July 2025',
          grossRevenue: 5623.48,
          commission: 843.52,
          netEarnings: 4779.96,
          status: 'completed',
          payoutDate: '2025-08-05',
          transactionId: 'TXN-072338904'
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20", icon: CheckCircle },
      pending: { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/20", icon: Clock },
      processing: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", icon: Clock },
    };

    const style = styles[status as keyof typeof styles];
    const Icon = style.icon;

    return (
      <span className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider border ${style.bg} ${style.text} ${style.border} inline-flex items-center gap-1.5`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const totalPending = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.netEarnings, 0);
  const totalPaid = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.netEarnings, 0);
  const avgPayout = totalPaid / payouts.filter(p => p.status === 'completed').length || 0;

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <h1 className="text-3xl font-light text-white mb-2 tracking-tight">
          Payout History
        </h1>
        <p className="text-white/60 text-sm">
          Track your earnings and payment history
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Pending Payout</div>
              <Clock size={20} className="text-yellow-500/60" />
            </div>
            <div className="text-3xl font-light text-white mb-1">
              ${totalPending.toLocaleString()}
            </div>
            <div className="text-yellow-500/60 text-xs">Scheduled for Nov 5</div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Total Paid Out</div>
              <DollarSign size={20} className="text-green-500/60" />
            </div>
            <div className="text-3xl font-light text-white mb-1">
              ${totalPaid.toLocaleString()}
            </div>
            <div className="text-green-500/60 text-xs">All time earnings</div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Average Payout</div>
              <TrendingUp size={20} className="text-white/40" />
            </div>
            <div className="text-3xl font-light text-white mb-1">
              ${avgPayout.toLocaleString()}
            </div>
            <div className="text-white/40 text-xs">Per payment period</div>
          </div>
        </div>
      </div>

      {/* Payout Table */}
      {loading ? (
        <div className="bg-[#1a1a1a] border border-white/5 p-12">
          <div className="text-center text-white/60">Loading payout history...</div>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/5 overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
          <table className="w-full">
            <thead className="border-b border-white/5 bg-[#1a1a1a]">
              <tr>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Payout #</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Period</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Gross Revenue</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Commission (15%)</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Net Earnings</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Payout Date</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-[#303030] transition-all">
                  <td className="p-4">
                    <span className="text-white font-mono text-sm">{payout.payoutNumber}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-white/40" />
                      <span className="text-white/60 text-sm">{payout.period}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white text-sm">${payout.grossRevenue.toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-red-500/80 text-sm">-${payout.commission.toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white font-medium">${payout.netEarnings.toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white/60 text-sm">{new Date(payout.payoutDate).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(payout.status)}
                  </td>
                  <td className="p-4">
                    {payout.status === 'completed' && (
                      <button
                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                        title="Download Statement"
                      >
                        <Download size={14} className="text-white/60" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-500/5 border border-blue-500/10 p-4">
        <div className="flex gap-3">
          <div className="text-blue-500/80 flex-shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-blue-500/80 text-sm font-medium mb-1 uppercase tracking-wider">Payout Information</div>
            <div className="text-white/60 text-xs leading-relaxed">
              Payouts are processed on the 5th of each month for the previous month's sales. Commission is 15% of gross revenue. 
              Earnings are deposited directly to your bank account on file. Allow 2-3 business days for funds to appear.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

