"use client";

import { useEffect, useState } from 'react';
import { Search, FileText, CheckCircle, XCircle, AlertCircle, Upload, Download, Eye } from 'lucide-react';
import Link from 'next/link';

interface COA {
  id: number;
  productId: number;
  productName: string;
  coaNumber: string;
  testDate: string;
  uploadDate: string;
  status: 'approved' | 'pending' | 'rejected' | 'expired';
  fileUrl: string;
  thc: string;
  cbd: string;
  testingLab: string;
  batchNumber: string;
}

export default function VendorLabResults() {
  const [coas, setCoas] = useState<COA[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCOA, setSelectedCOA] = useState<COA | null>(null);

  useEffect(() => {
    // TODO: Fetch actual COAs from API: /vendor-marketplace/v1/lab-results
    // For now, mock data
    setTimeout(() => {
      setCoas([
        {
          id: 1,
          productId: 41735,
          productName: 'Lemon Cherry Diesel',
          coaNumber: 'COA-2025-001547',
          testDate: '2025-10-15',
          uploadDate: '2025-10-16',
          status: 'approved',
          fileUrl: '/coa/sample.pdf',
          thc: '24.5%',
          cbd: '0.8%',
          testingLab: 'Quantix Analytics',
          batchNumber: 'LCD-OCT-2025-01'
        },
        {
          id: 2,
          productId: 41734,
          productName: 'Blue Zushi',
          coaNumber: 'COA-2025-001548',
          testDate: '2025-10-14',
          uploadDate: '2025-10-15',
          status: 'approved',
          fileUrl: '/coa/sample.pdf',
          thc: '26.2%',
          cbd: '0.5%',
          testingLab: 'Quantix Analytics',
          batchNumber: 'BZ-OCT-2025-02'
        },
        {
          id: 3,
          productId: 41733,
          productName: 'Detroit Runts',
          coaNumber: 'COA-2025-001549',
          testDate: '2025-10-17',
          uploadDate: '2025-10-17',
          status: 'pending',
          fileUrl: '/coa/sample.pdf',
          thc: '28.2%',
          cbd: '0.5%',
          testingLab: 'Quantix Analytics',
          batchNumber: 'DR-OCT-2025-03'
        },
        {
          id: 4,
          productId: 41586,
          productName: 'Black Ice Runtz',
          coaNumber: 'COA-2025-001540',
          testDate: '2025-10-10',
          uploadDate: '2025-10-11',
          status: 'rejected',
          fileUrl: '/coa/sample.pdf',
          thc: '26.8%',
          cbd: '0.6%',
          testingLab: 'Quantix Analytics',
          batchNumber: 'BIR-OCT-2025-01'
        },
        {
          id: 5,
          productId: 41588,
          productName: 'Black Jack',
          coaNumber: 'COA-2025-001541',
          testDate: '2025-09-28',
          uploadDate: '2025-09-29',
          status: 'expired',
          fileUrl: '/coa/sample.pdf',
          thc: '22.4%',
          cbd: '1.2%',
          testingLab: 'Quantix Analytics',
          batchNumber: 'BJ-SEP-2025-05'
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20", icon: CheckCircle },
      pending: { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/20", icon: AlertCircle },
      rejected: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", icon: XCircle },
      expired: { bg: "bg-gray-500/10", text: "text-gray-500", border: "border-gray-500/20", icon: AlertCircle },
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

  const filteredCOAs = coas.filter(coa => {
    if (statusFilter !== 'all' && coa.status !== statusFilter) return false;
    if (search && !coa.productName.toLowerCase().includes(search.toLowerCase()) && !coa.coaNumber.includes(search)) return false;
    return true;
  });

  const stats = {
    total: coas.length,
    approved: coas.filter(c => c.status === 'approved').length,
    pending: coas.filter(c => c.status === 'pending').length,
    expired: coas.filter(c => c.status === 'expired').length,
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <h1 className="text-3xl font-light text-white mb-2 tracking-tight">
          Lab Results & COAs
        </h1>
        <p className="text-white/60 text-sm">
          Manage Certificates of Analysis for your products
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Total COAs</div>
              <FileText size={20} className="text-white/40" />
            </div>
            <div className="text-3xl font-light text-white mb-1">{loading ? '—' : stats.total}</div>
            <div className="text-white/40 text-xs">All certificates</div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Approved</div>
              <CheckCircle size={20} className="text-green-500/60" />
            </div>
            <div className="text-3xl font-light text-white mb-1">{loading ? '—' : stats.approved}</div>
            <div className="text-green-500/60 text-xs">Ready to sell</div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Pending Review</div>
              <AlertCircle size={20} className="text-yellow-500/60" />
            </div>
            <div className="text-3xl font-light text-white mb-1">{loading ? '—' : stats.pending}</div>
            <div className="text-yellow-500/60 text-xs">Under review</div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Expired</div>
              <AlertCircle size={20} className="text-red-500/60" />
            </div>
            <div className="text-3xl font-light text-white mb-1">{loading ? '—' : stats.expired}</div>
            <div className="text-red-500/60 text-xs">Need renewal</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1a1a] border border-white/5 p-4 mb-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by product name or COA number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/10 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-black border border-white'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                statusFilter === 'approved'
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                statusFilter === 'pending'
                  ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                statusFilter === 'expired'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              Expired
            </button>
          </div>
        </div>
      </div>

      {/* COAs Table */}
      {loading ? (
        <div className="bg-[#1a1a1a] border border-white/5 p-12">
          <div className="text-center text-white/60">Loading lab results...</div>
        </div>
      ) : filteredCOAs.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/5 p-12">
          <div className="text-center">
            <FileText size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60 mb-4">No lab results found</div>
            <p className="text-white/40 text-sm">Upload COAs in your product edit pages</p>
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/5 overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
          <table className="w-full">
            <thead className="border-b border-white/5 bg-[#1a1a1a]">
              <tr>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Product</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">COA Number</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Test Results</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Test Date</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Lab</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCOAs.map((coa) => (
                <tr key={coa.id} className="hover:bg-[#303030] transition-all group">
                  <td className="p-4">
                    <Link 
                      href={`/vendor/products/${coa.productId}/edit`}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <FileText size={16} className="text-white/40" />
                      <span className="text-white text-sm">{coa.productName}</span>
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className="text-white/60 font-mono text-xs">{coa.coaNumber}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3 text-xs">
                      <span className="text-white/60">THC: <span className="text-white font-medium">{coa.thc}</span></span>
                      <span className="text-white/60">CBD: <span className="text-white font-medium">{coa.cbd}</span></span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white/60 text-sm">{new Date(coa.testDate).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white/60 text-xs">{coa.testingLab}</span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(coa.status)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCOA(coa)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                        title="View COA"
                      >
                        <Eye size={14} className="text-white/60" />
                      </button>
                      <button
                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                        title="Download COA"
                      >
                        <Download size={14} className="text-white/60" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* COA Detail Modal */}
      {selectedCOA && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedCOA(null)}>
          <div className="bg-[#1a1a1a] border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="border-b border-white/5 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-light text-white mb-1">Certificate of Analysis</h2>
                  <p className="text-white/60 text-sm">{selectedCOA.productName}</p>
                </div>
                <button
                  onClick={() => setSelectedCOA(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* COA Content */}
            <div className="p-6">
              {/* COA Header */}
              <div className="bg-white/5 border border-white/5 p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-white/60 text-xs mb-1">COA Number</div>
                    <div className="text-white font-mono">{selectedCOA.coaNumber}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs mb-1">Batch Number</div>
                    <div className="text-white font-mono">{selectedCOA.batchNumber}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs mb-1">Test Date</div>
                    <div className="text-white">{new Date(selectedCOA.testDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs mb-1">Testing Laboratory</div>
                    <div className="text-white">{selectedCOA.testingLab}</div>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-wider text-white/60 mb-3">Cannabinoid Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/5 p-4">
                    <div className="text-white/60 text-xs mb-2">Total THC</div>
                    <div className="text-2xl font-light text-white">{selectedCOA.thc}</div>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-4">
                    <div className="text-white/60 text-xs mb-2">Total CBD</div>
                    <div className="text-2xl font-light text-white">{selectedCOA.cbd}</div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-wider text-white/60 mb-3">Verification Status</h3>
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedCOA.status)}
                  {selectedCOA.status === 'approved' && (
                    <span className="text-green-500/80 text-xs">Verified by Flora Distro Quality Team</span>
                  )}
                  {selectedCOA.status === 'expired' && (
                    <span className="text-red-500/80 text-xs">COA is older than 90 days - renewal required</span>
                  )}
                  {selectedCOA.status === 'rejected' && (
                    <span className="text-red-500/80 text-xs">COA rejected - please contact support</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-6 py-3 bg-white text-black border border-white hover:bg-black hover:text-white hover:border-white/20 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300">
                  <Download size={16} />
                  Download PDF
                </button>
                <Link
                  href={`/vendor/products/${selectedCOA.productId}/edit`}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300"
                >
                  View Product
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-500/5 border border-blue-500/10 p-4">
        <div className="flex gap-3">
          <div className="text-blue-500/80 flex-shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <div className="text-blue-500/80 text-sm font-medium mb-1 uppercase tracking-wider">COA Requirements</div>
            <div className="text-white/60 text-xs leading-relaxed">
              All products must have a valid Certificate of Analysis from an accredited lab. COAs expire after 90 days and must be renewed. 
              Products without approved COAs cannot be sold on the marketplace.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

