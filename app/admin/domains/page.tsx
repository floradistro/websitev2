"use client";

import { useState, useEffect } from 'react';
import { Globe, Check, AlertCircle, ExternalLink, Search, Star, Edit2, Trash2, Power } from 'lucide-react';

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  verified_at: string | null;
  dns_configured: boolean;
  ssl_status: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  vendor: {
    id: string;
    store_name: string;
    slug: string;
    email: string;
  };
}

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending'>('all');

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/domains');
      const data = await response.json();
      
      if (data.success) {
        setDomains(data.domains || []);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDomain(domainId: string, domain: string, vendorName: string) {
    if (!confirm(`Remove domain ${domain} from ${vendorName}?`)) return;

    try {
      const response = await fetch(`/api/admin/domains?id=${domainId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        loadDomains();
      } else {
        alert(data.error || 'Failed to delete domain');
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
      alert('Failed to delete domain');
    }
  }

  async function handleToggleActive(domainId: string, isActive: boolean) {
    try {
      const response = await fetch('/api/admin/domains/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId, isActive: !isActive })
      });

      const data = await response.json();

      if (data.success) {
        loadDomains();
      } else {
        alert(data.error || 'Failed to update domain status');
      }
    } catch (error) {
      console.error('Error updating domain:', error);
      alert('Failed to update domain status');
    }
  }

  const filteredDomains = domains.filter(domain => {
    const matchesSearch = 
      domain.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.vendor.store_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'verified' && domain.verified) ||
      (filterStatus === 'pending' && !domain.verified);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl text-white font-light tracking-tight mb-2">Domains</h1>
        <p className="text-white/50 text-sm">{filteredDomains.length} custom domains</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 text-white placeholder-white/40 pl-9 pr-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider transition-all ${
              filterStatus === 'all' ? 'bg-white text-black' : 'bg-[#111111] text-white/60 hover:text-white border border-white/10'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('verified')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider transition-all ${
              filterStatus === 'verified' ? 'bg-white/10 text-white border border-white' : 'bg-[#111111] text-white/60 hover:text-white border border-white/10'
            }`}
          >
            Verified
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2.5 text-xs uppercase tracking-wider transition-all ${
              filterStatus === 'pending' ? 'bg-white/10 text-white border border-white' : 'bg-[#111111] text-white/60 hover:text-white border border-white/10'
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Domains List */}
      {loading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : filteredDomains.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center">
          <Globe className="text-white/20 mx-auto mb-3" size={32} />
          <div className="text-white/60 text-sm">No domains found</div>
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/10">
          {filteredDomains.map((domain, index) => (
            <div
              key={domain.id}
              className={`flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors ${
                index !== filteredDomains.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <div className="w-8 h-8 bg-white/5 flex items-center justify-center flex-shrink-0">
                <Globe size={16} className="text-white/40" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-white text-sm font-medium">{domain.domain}</div>
                  {domain.is_primary && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                </div>
                <div className="text-white/40 text-xs">{domain.vendor.store_name}</div>
              </div>
              <div className="text-white/60 text-xs uppercase">{domain.ssl_status}</div>
              <div className="flex-shrink-0">
                {domain.verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/60 border border-white/10">
                    <Check size={10} />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/40 border border-white/10">
                    <AlertCircle size={10} />
                    Pending
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <a 
                  href={`/vendors/${domain.vendor.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => handleToggleActive(domain.id, domain.is_active)}
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Power size={14} />
                </button>
                <button
                  onClick={() => handleDeleteDomain(domain.id, domain.domain, domain.vendor.store_name)}
                  className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
