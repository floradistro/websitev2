"use client";

import { useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, Package, Users } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  type: string;
  period: string;
  generatedAt: string;
  size: string;
}

export default function AdminReports() {
  const [selectedType, setSelectedType] = useState<'all' | 'sales' | 'inventory' | 'vendors'>('all');

  // Sample reports - replace with real API
  const reports: Report[] = [
    {
      id: '1',
      name: 'Sales Report - October 2025',
      type: 'sales',
      period: 'Oct 1-21, 2025',
      generatedAt: '2025-10-21',
      size: '2.4 MB'
    },
    {
      id: '2',
      name: 'Inventory Report - Q3 2025',
      type: 'inventory',
      period: 'Jul 1 - Sep 30, 2025',
      generatedAt: '2025-10-01',
      size: '1.8 MB'
    },
    {
      id: '3',
      name: 'Vendor Performance - September',
      type: 'vendors',
      period: 'Sep 1-30, 2025',
      generatedAt: '2025-10-01',
      size: '856 KB'
    },
  ];

  const filteredReports = reports.filter(report => {
    if (selectedType === 'all') return true;
    return report.type === selectedType;
  });

  return (
    <div className="w-full px-4 lg:px-0">
      <style jsx>{`
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
            Reports
          </h1>
          <p className="text-white/40 text-xs font-light tracking-wide">
            GENERATE · DOWNLOAD · MARKETPLACE DATA
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white text-black px-5 py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all">
          <Calendar size={16} />
          Generate New
        </button>
      </div>

      {/* Quick Generate Cards */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6 -mx-4 lg:mx-0">
        <div className="bg-black border-0 lg:border border-white/10 p-6 hover:border-white/20 transition-all cursor-pointer group border-b lg:border-b-0 border-white/5">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp size={24} className="text-white/30 group-hover:text-white/50 transition-colors" />
            <button className="text-white/60 hover:text-white text-xs transition-colors">
              Generate →
            </button>
          </div>
          <h3 className="text-white font-medium mb-2">Sales Report</h3>
          <p className="text-white/40 text-xs">
            Revenue, orders, and transaction data
          </p>
        </div>

        <div className="bg-black border-0 lg:border border-white/10 p-6 hover:border-white/20 transition-all cursor-pointer group border-b lg:border-b-0 border-white/5">
          <div className="flex items-center justify-between mb-4">
            <Package size={24} className="text-white/30 group-hover:text-white/50 transition-colors" />
            <button className="text-white/60 hover:text-white text-xs transition-colors">
              Generate →
            </button>
          </div>
          <h3 className="text-white font-medium mb-2">Inventory Report</h3>
          <p className="text-white/40 text-xs">
            Stock levels and product tracking
          </p>
        </div>

        <div className="bg-black border-0 lg:border border-white/10 p-6 hover:border-white/20 transition-all cursor-pointer group border-b lg:border-b-0 border-white/5">
          <div className="flex items-center justify-between mb-4">
            <Users size={24} className="text-white/30 group-hover:text-white/50 transition-colors" />
            <button className="text-white/60 hover:text-white text-xs transition-colors">
              Generate →
            </button>
          </div>
          <h3 className="text-white font-medium mb-2">Vendor Report</h3>
          <p className="text-white/40 text-xs">
            Performance and payout data
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
            selectedType === 'all'
              ? 'bg-white text-black'
              : 'bg-black text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          All Reports
        </button>
        <button
          onClick={() => setSelectedType('sales')}
          className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
            selectedType === 'sales'
              ? 'bg-white/10 text-white border border-white'
              : 'bg-black text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          Sales
        </button>
        <button
          onClick={() => setSelectedType('inventory')}
          className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
            selectedType === 'inventory'
              ? 'bg-white/10 text-white border border-white'
              : 'bg-black text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          Inventory
        </button>
        <button
          onClick={() => setSelectedType('vendors')}
          className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
            selectedType === 'vendors'
              ? 'bg-white/10 text-white border border-white'
              : 'bg-black text-white/60 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          Vendors
        </button>
      </div>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-black border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="p-6">
              <div className="flex items-start gap-6">
                {/* Icon */}
                <div className="w-16 h-16 bg-white/5 flex items-center justify-center flex-shrink-0">
                  <FileText size={28} className="text-white/30" />
                </div>

                {/* Report Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-lg mb-2">
                        {report.name}
                      </h3>
                      <div className="text-white/50 text-sm mb-1">
                        Period: {report.period}
                      </div>
                      <div className="text-white/40 text-xs">
                        Generated: {new Date(report.generatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Type Badge */}
                    <span className="px-3 py-1.5 text-xs text-white/70 border border-white/20 uppercase flex-shrink-0">
                      {report.type}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-6 py-4 border-t border-b border-white/5 mb-4">
                    <div>
                      <div className="text-white/40 text-xs mb-1">File Size</div>
                      <div className="text-white text-sm">{report.size}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-xs mb-1">Format</div>
                      <div className="text-white text-sm">PDF</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 text-xs text-white bg-white/10 border border-white hover:bg-white/20 transition-all">
                      <Download size={14} />
                      Download
                    </button>
                    <button className="px-4 py-2 text-xs text-white/60 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
