'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  display_name: string | null;
  loyalty_points: number;
  loyalty_tier: string;
  vendor_customer_number: string;
}

interface NewCustomerFormProps {
  vendorId: string;
  onCustomerCreated: (customer: Customer) => void;
  onCancel: () => void;
}

export function NewCustomerForm({
  vendorId,
  onCustomerCreated,
  onCancel,
}: NewCustomerFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName) {
      return; // Form validation prevents submission
    }

    setCreating(true);

    try {
      const response = await fetch('/api/pos/customers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          firstName,
          lastName,
          phone: phone || null,
          email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@walk-in.local`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create customer');
      }

      const data = await response.json();
      onCustomerCreated(data.customer);
    } catch (error: any) {
      console.error('Error creating customer:', error);
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs uppercase tracking-[0.15em] text-white font-black" style={{ fontWeight: 900 }}>
            New Customer
          </h3>
          <button
            onClick={onCancel}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
              First Name *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
              placeholder="First name"
            />
          </div>

          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
              Last Name *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
              placeholder="Last name"
            />
          </div>

          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
              placeholder="(704) 555-0100"
            />
          </div>

          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
              Email (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
              placeholder="customer@email.com"
            />
            <div className="text-[9px] text-white/30 mt-1 uppercase tracking-wider">
              Auto-generated if empty
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={creating}
              className="flex-1 px-4 py-3 border border-white/10 text-white rounded-2xl hover:bg-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.15em] disabled:opacity-50 transition-all"
              style={{ fontWeight: 900 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !firstName || !lastName}
              className="flex-1 px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-2xl hover:bg-white/20 hover:border-white/30 text-[10px] font-black uppercase tracking-[0.15em] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              style={{ fontWeight: 900 }}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

