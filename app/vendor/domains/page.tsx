"use client";

import { useState, useEffect } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import { Globe, Plus, Check, X, AlertCircle, ExternalLink, Copy, Trash2, Star, RefreshCw } from 'lucide-react';

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  verified_at: string | null;
  dns_configured: boolean;
  ssl_status: string;
  is_primary: boolean;
  is_active: boolean;
  verification_token: string;
  created_at: string;
}

export default function VendorDomainsPage() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useAppAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDomains();
    }
  }, [authLoading, isAuthenticated]);

  async function loadDomains() {
    try {
      setLoading(true);
      
      // Get vendor ID from localStorage
      const vendorId = vendor?.id;
      if (!vendorId) {
        console.error('No vendor ID found');
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/vendor/domains', {
        headers: {
          'x-vendor-id': vendorId
        }
      });
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

  async function handleAddDomain() {
    if (!newDomain.trim()) return;

    try {
      setAddingDomain(true);
      
      const vendorId = vendor?.id;
      if (!vendorId) {
        alert('Vendor ID not found');
        setAddingDomain(false);
        return;
      }
      
      const response = await fetch('/api/vendor/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId
        },
        body: JSON.stringify({ domain: newDomain })
      });

      const data = await response.json();

      if (data.success) {
        setNewDomain('');
        setShowAddDomain(false);
        loadDomains();
      } else {
        alert(data.error || 'Failed to add domain');
      }
    } catch (error) {
      console.error('Error adding domain:', error);
      alert('Failed to add domain');
    } finally {
      setAddingDomain(false);
    }
  }

  async function handleVerifyDomain(domainId: string) {
    try {
      setVerifyingDomain(domainId);
      
      const vendorId = vendor?.id;
      if (!vendorId) return;
      
      const response = await fetch('/api/vendor/domains/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId
        },
        body: JSON.stringify({ domainId })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        loadDomains();
      } else {
        alert(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      alert('Verification failed');
    } finally {
      setVerifyingDomain(null);
    }
  }

  async function handleSetPrimary(domainId: string) {
    try {
      const vendorId = vendor?.id;
      if (!vendorId) return;
      
      const response = await fetch('/api/vendor/domains/set-primary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId
        },
        body: JSON.stringify({ domainId })
      });

      const data = await response.json();

      if (data.success) {
        loadDomains();
      } else {
        alert(data.error || 'Failed to set primary domain');
      }
    } catch (error) {
      console.error('Error setting primary domain:', error);
      alert('Failed to set primary domain');
    }
  }

  async function handleDeleteDomain(domainId: string, domain: string) {
    if (!confirm(`Are you sure you want to remove ${domain}?`)) return;

    try {
      const vendorId = vendor?.id;
      if (!vendorId) return;
      
      const response = await fetch(`/api/vendor/domains?id=${domainId}`, {
        method: 'DELETE',
        headers: {
          'x-vendor-id': vendorId
        }
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

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const vendorSlug = vendor?.slug || vendor?.slug || 'vendor';
  const platformDomain = `${vendorSlug}.floradistro.com`;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Custom Domains</h1>
          <p className="text-white/60">Use your own domain for your storefront</p>
        </div>
        <button
          onClick={() => setShowAddDomain(true)}
          className="bg-white text-black px-6 py-3 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus size={20} />
          Add Domain
        </button>
      </div>

      {/* Add Domain Modal */}
      {showAddDomain && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/10 rounded-lg max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Add Custom Domain</h2>
            
            <div className="mb-6">
              <label className="block text-white/80 mb-2">Domain Name</label>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="w-full bg-black/98 border border-white/10 rounded-lg px-4 py-3 text-white"
                autoFocus
              />
              <p className="text-white/40 text-sm mt-2">
                Don't include http:// or https://
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddDomain(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-lg transition-colors"
                disabled={addingDomain}
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                disabled={addingDomain || !newDomain.trim()}
                className="flex-1 bg-white text-black px-4 py-3 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingDomain ? 'Adding...' : 'Add Domain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Default Platform Domain */}
      <div className="bg-black border border-white/10 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-white/5 p-3 rounded-lg">
              <Globe className="text-white" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-semibold">{platformDomain}</h3>
                <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded-[14px] text-xs">
                  Platform Domain
                </span>
              </div>
              <p className="text-white/60 text-sm">Your default storefront URL</p>
              <a 
                href={`https://${platformDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white text-sm flex items-center gap-1 mt-2"
              >
                Visit storefront <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Domains */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-white/60 mt-4">Loading domains...</p>
        </div>
      ) : domains.length === 0 ? (
        <div className="bg-black border border-white/10 rounded-lg p-12 text-center">
          <Globe className="text-white/40 mx-auto mb-4" size={48} />
          <h3 className="text-white font-semibold mb-2">No custom domains yet</h3>
          <p className="text-white/60 mb-6">
            Add your own domain to create a branded storefront experience
          </p>
          <button
            onClick={() => setShowAddDomain(true)}
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Add Your First Domain
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => (
            <div key={domain.id} className="bg-black border border-white/10 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${domain.verified ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                    <Globe className={domain.verified ? 'text-green-500' : 'text-yellow-500'} size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{domain.domain}</h3>
                      {domain.is_primary && (
                        <Star className="text-yellow-500 fill-yellow-500" size={16} />
                      )}
                      {domain.verified ? (
                        <span className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded-[14px] text-xs flex items-center gap-1">
                          <Check size={12} /> Verified
                        </span>
                      ) : (
                        <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-[14px] text-xs flex items-center gap-1">
                          <AlertCircle size={12} /> Pending Verification
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm">
                      Added {new Date(domain.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDomain(domain.id, domain.domain)}
                  className="text-red-500 hover:text-red-400 p-2"
                  title="Remove domain"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {!domain.verified && (
                <div className="bg-black/98 border border-white/5 rounded-lg p-4 mb-4">
                  <h4 className="text-white font-medium mb-3">DNS Configuration</h4>
                  <p className="text-white/60 text-sm mb-3">
                    Add a CNAME record to your DNS provider:
                  </p>
                  <div className="bg-black/50 border border-white/10 rounded-[14px] p-3 font-mono text-sm mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60">Type:</span>
                      <span className="text-white">CNAME</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60">Name:</span>
                      <span className="text-white">@ or www</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Value:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white">cname.vercel-dns.com</span>
                        <button
                          onClick={() => copyToClipboard('cname.vercel-dns.com', domain.id)}
                          className="text-white/60 hover:text-white"
                        >
                          {copiedToken === domain.id ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleVerifyDomain(domain.id)}
                    disabled={verifyingDomain === domain.id}
                    className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={verifyingDomain === domain.id ? 'animate-spin' : ''} />
                    {verifyingDomain === domain.id ? 'Checking...' : 'Verify DNS'}
                  </button>
                </div>
              )}

              {domain.verified && !domain.is_primary && (
                <button
                  onClick={() => handleSetPrimary(domain.id)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Star size={16} />
                  Set as Primary Domain
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Information */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex gap-3">
          <AlertCircle className="text-blue-500 flex-shrink-0" size={24} />
          <div>
            <h4 className="text-white font-medium mb-2">About Custom Domains</h4>
            <ul className="text-white/60 text-sm space-y-1">
              <li>• SSL certificates are automatically provisioned for verified domains</li>
              <li>• DNS changes can take up to 48 hours to propagate</li>
              <li>• Your primary domain will be used as the default storefront URL</li>
              <li>• All backend functionality runs through our infrastructure</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

