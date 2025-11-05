'use client';

import { useState, useEffect } from 'react';
import AddToWalletButton from '@/components/customer/AddToWalletButton';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestWalletPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [loading, setLoading] = useState(true);
  const [testUrl, setTestUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Get customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, loyalty_points, loyalty_tier')
        .limit(20);

      // Get vendors
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id, store_name, slug, logo_url')
        .eq('status', 'active')
        .limit(20);

      setCustomers(customersData || []);
      setVendors(vendorsData || []);

      // Auto-select first ones
      if (customersData?.length) setSelectedCustomer(customersData[0].id);
      if (vendorsData?.length) setSelectedVendor(vendorsData[0].id);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedCustomer && selectedVendor) {
      setTestUrl(
        `/api/customer/wallet-pass?customer_id=${selectedCustomer}&vendor_id=${selectedVendor}`
      );
    }
  }, [selectedCustomer, selectedVendor]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);
  const selectedVendorData = vendors.find((v) => v.id === selectedVendor);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border border-white/10 rounded-2xl p-6 bg-white/5">
          <h1 className="text-2xl font-black uppercase tracking-wider mb-2">
            🧪 Apple Wallet Test Page
          </h1>
          <p className="text-sm text-white/60 uppercase tracking-wider">
            Test wallet pass generation and customer experience
          </p>
        </div>

        {/* Customer Selection */}
        <div className="border border-white/10 rounded-2xl p-6 bg-white/5">
          <h2 className="text-xs uppercase tracking-[0.15em] font-black mb-4">
            1. Select Customer
          </h2>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-sm"
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.first_name} {customer.last_name} - {customer.email} ({customer.loyalty_points || 0} points, {customer.loyalty_tier || 'bronze'})
              </option>
            ))}
          </select>

          {selectedCustomerData && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="text-xs uppercase tracking-[0.15em] text-blue-300 font-black mb-2">
                Selected Customer:
              </div>
              <div className="text-sm text-white">
                <div><strong>Name:</strong> {selectedCustomerData.first_name} {selectedCustomerData.last_name}</div>
                <div><strong>Email:</strong> {selectedCustomerData.email}</div>
                <div><strong>Points:</strong> {selectedCustomerData.loyalty_points || 0}</div>
                <div><strong>Tier:</strong> {selectedCustomerData.loyalty_tier || 'bronze'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Vendor Selection */}
        <div className="border border-white/10 rounded-2xl p-6 bg-white/5">
          <h2 className="text-xs uppercase tracking-[0.15em] font-black mb-4">
            2. Select Vendor
          </h2>
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-sm"
          >
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.store_name} (@{vendor.slug})
              </option>
            ))}
          </select>

          {selectedVendorData && (
            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="text-xs uppercase tracking-[0.15em] text-purple-300 font-black mb-2">
                Selected Vendor:
              </div>
              <div className="text-sm text-white">
                <div><strong>Store:</strong> {selectedVendorData.store_name}</div>
                <div><strong>Slug:</strong> {selectedVendorData.slug}</div>
                <div><strong>Has Logo:</strong> {selectedVendorData.logo_url ? 'Yes ✅' : 'No ❌'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Test Methods */}
        <div className="border border-white/10 rounded-2xl p-6 bg-white/5">
          <h2 className="text-xs uppercase tracking-[0.15em] font-black mb-4">
            3. Test Wallet Pass Generation
          </h2>

          {/* Method 1: Component */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.15em] text-green-400 font-black mb-3">
              ✅ Method 1: Use Component (Recommended)
            </div>
            <div className="p-4 bg-black/60 border border-white/10 rounded-xl">
              {selectedCustomer && selectedVendor && (
                <AddToWalletButton
                  customerId={selectedCustomer}
                  vendorId={selectedVendor}
                  variant="full"
                />
              )}
            </div>
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
              <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-2">
                Code:
              </div>
              <pre className="text-[10px] text-white/80 font-mono overflow-x-auto">
{`<AddToWalletButton
  customerId="${selectedCustomer?.substring(0, 8)}..."
  vendorId="${selectedVendor?.substring(0, 8)}..."
/>`}
              </pre>
            </div>
          </div>

          {/* Method 2: Direct Link */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.15em] text-blue-400 font-black mb-3">
              ✅ Method 2: Direct Download Link
            </div>
            <div className="p-4 bg-black/60 border border-white/10 rounded-xl">
              <a
                href={testUrl}
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all"
              >
                <span className="text-xs uppercase tracking-[0.15em] font-black">
                  Download Pass Directly
                </span>
              </a>
            </div>
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
              <div className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-2">
                URL:
              </div>
              <pre className="text-[10px] text-white/80 font-mono overflow-x-auto break-all">
                {testUrl}
              </pre>
            </div>
          </div>

          {/* Method 3: cURL */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-yellow-400 font-black mb-3">
              ✅ Method 3: cURL Command
            </div>
            <div className="p-4 bg-black/60 border border-white/10 rounded-xl">
              <pre className="text-[10px] text-white/80 font-mono overflow-x-auto">
{`curl "http://localhost:3000${testUrl}" -o test-pass.pkpass`}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`curl "http://localhost:3000${testUrl}" -o test-pass.pkpass`);
                  alert('Copied to clipboard!');
                }}
                className="mt-3 px-4 py-2 bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 transition-all text-xs"
              >
                Copy Command
              </button>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="border border-green-500/20 bg-green-500/10 rounded-2xl p-6">
          <h2 className="text-xs uppercase tracking-[0.15em] font-black mb-4 text-green-400">
            📱 What Happens Next
          </h2>
          <div className="space-y-3 text-sm text-green-300/80">
            <div className="flex items-start gap-3">
              <span className="text-xl">1️⃣</span>
              <div>
                <strong className="text-green-300">Customer clicks button</strong>
                <br />
                <span className="text-xs text-green-300/60">Browser downloads .pkpass file</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">2️⃣</span>
              <div>
                <strong className="text-green-300">Customer taps the file</strong>
                <br />
                <span className="text-xs text-green-300/60">iOS shows "Add to Apple Wallet" screen</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">3️⃣</span>
              <div>
                <strong className="text-green-300">Pass added to Wallet</strong>
                <br />
                <span className="text-xs text-green-300/60">Device registers for automatic updates</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">4️⃣</span>
              <div>
                <strong className="text-green-300">Automatic updates</strong>
                <br />
                <span className="text-xs text-green-300/60">When points change, pass updates automatically on iPhone</span>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Guide */}
        <div className="border border-white/10 rounded-2xl p-6 bg-white/5">
          <h2 className="text-xs uppercase tracking-[0.15em] font-black mb-4">
            🚀 How to Add to Your Customer Pages
          </h2>
          <div className="space-y-4 text-sm text-white/80">
            <div>
              <strong>Option 1: Customer Profile/Loyalty Page</strong>
              <pre className="mt-2 p-3 bg-black/60 rounded-lg text-[10px] overflow-x-auto">
{`import AddToWalletButton from '@/components/customer/AddToWalletButton';

// In your customer profile page:
<AddToWalletButton
  customerId={customer.id}
  vendorId={vendor.id}
/>`}
              </pre>
            </div>

            <div>
              <strong>Option 2: Email Link</strong>
              <pre className="mt-2 p-3 bg-black/60 rounded-lg text-[10px] overflow-x-auto">
{`Subject: Add Your Loyalty Card to Apple Wallet

Hi {customer_name},

Add your loyalty card to Apple Wallet:
https://yachtclub.vip/api/customer/wallet-pass?customer_id={id}&vendor_id={vendor_id}

Your points will update automatically!`}
              </pre>
            </div>

            <div>
              <strong>Option 3: QR Code</strong>
              <pre className="mt-2 p-3 bg-black/60 rounded-lg text-[10px] overflow-x-auto">
{`Generate QR code linking to:
https://yachtclub.vip/api/customer/wallet-pass?customer_id={id}&vendor_id={vendor_id}

Customer scans → Pass downloads → Add to Wallet`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
