"use client";

import { useState, useEffect } from 'react';
import { Globe, Check, AlertCircle, ExternalLink, Search, Star, Trash2, X } from 'lucide-react';

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

  // Filter domains
  const filteredDomains = domains.filter(domain => {
    const matchesSearch = 
      domain.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.vendor.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.vendor.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'verified' && domain.verified) ||
      (filterStatus === 'pending' && !domain.verified);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: domains.length,
    verified: domains.filter(d => d.verified).length,
    pending: domains.filter(d => !d.verified).length,
    active: domains.filter(d => d.is_active).length
  };

  return (
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <h1 className="text-2xl lg:text-4xl text-white mb-1.5 lg:mb-2 leading-tight font-light tracking-tight">
          Custom Domains
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          Manage vendor custom domains and DNS configuration
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-6 mb-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <div className="bg-[#1a1a1a] border-r lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Total Domains</div>
              <Globe size={18} className="hidden lg:block text-white/40" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
                {loading ? '—' : stats.total}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">Registered domains</div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border-b lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-green-500/20 lg:hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Verified</div>
              <Check size={18} className="hidden lg:block text-green-500" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-green-500 mb-0.5 lg:mb-1">
                {loading ? '—' : stats.verified}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">DNS confirmed</div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border-r lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-yellow-500/20 lg:hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Pending</div>
              <AlertCircle size={18} className="hidden lg:block text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-yellow-500 mb-0.5 lg:mb-1">
                {loading ? '—' : stats.pending}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">Awaiting DNS</div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border-b lg:border border-white/5 p-4 lg:p-6 active:bg-white/5 lg:hover:border-white/10 lg:hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group min-h-[120px] lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 lg:mb-4">
              <div className="text-white/60 text-[10px] lg:text-xs uppercase tracking-wider">Active</div>
              <Check size={18} className="hidden lg:block text-white/40" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-white mb-0.5 lg:mb-1">
                {loading ? '—' : stats.active}
              </div>
              <div className="text-white/40 text-[10px] lg:text-xs">Live domains</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1a1a] border border-white/5 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              placeholder="Search domains, vendors, or emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                filterStatus === 'all'
                  ? 'bg-red-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('verified')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                filterStatus === 'verified'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                filterStatus === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      {/* Domains List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <p className="text-white/60 mt-4 text-sm">Loading domains...</p>
        </div>
      ) : filteredDomains.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/5 p-12 text-center">
          <Globe className="text-white/20 mx-auto mb-4" size={48} />
          <h3 className="text-white font-light text-xl mb-2">
            {searchQuery || filterStatus !== 'all' ? 'No domains found' : 'No custom domains yet'}
          </h3>
          <p className="text-white/40 text-sm">
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Vendors can add custom domains from their dashboard'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDomains.map((domain) => (
            <div key={domain.id} className="bg-[#1a1a1a] border border-white/5 hover:border-white/10 transition-all p-6 group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 ${domain.verified ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                    <Globe className={domain.verified ? 'text-green-500' : 'text-yellow-500'} size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-white font-light text-lg">{domain.domain}</h3>
                      {domain.is_primary && (
                        <Star className="text-yellow-500 fill-yellow-500" size={14} />
                      )}
                      {domain.verified ? (
                        <span className="bg-green-500/20 text-green-500 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                          Verified
                        </span>
                      ) : (
                        <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                      {!domain.is_active && (
                        <span className="bg-red-500/20 text-red-500 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-white/60">
                        <span className="text-white/40">Vendor:</span>
                        <span className="text-white/80">{domain.vendor.store_name}</span>
                        <a 
                          href={`/vendors/${domain.vendor.slug}`}
                          target="_blank"
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <span className="text-white/40">Email:</span>
                        <span>{domain.vendor.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <span className="text-white/40">Added:</span>
                        <span>{new Date(domain.created_at).toLocaleDateString()}</span>
                      </div>
                      {domain.verified_at && (
                        <div className="flex items-center gap-2 text-white/60">
                          <span className="text-white/40">Verified:</span>
                          <span>{new Date(domain.verified_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-white/60">
                        <span className="text-white/40">SSL:</span>
                        <span className={`uppercase text-[10px] ${
                          domain.ssl_status === 'active' ? 'text-green-500' : 
                          domain.ssl_status === 'failed' ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                          {domain.ssl_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleActive(domain.id, domain.is_active)}
                    className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-all ${
                      domain.is_active
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                    }`}
                  >
                    {domain.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteDomain(domain.id, domain.domain, domain.vendor.store_name)}
                    className="text-red-500/60 hover:text-red-500 p-2 transition-colors"
                    title="Remove domain"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
