'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Phone } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import { supabase } from '@/lib/supabase/client';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  employee_id: string | null;
}

export default function EmployeesPage() {
  const { vendor } = useAppAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vendor?.id) {
      loadEmployees();
    }
  }, [vendor?.id]);

  async function loadEmployees() {
    if (!vendor?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'vendor_admin': return 'bg-purple-500/10 text-purple-400/80 border-purple-500/20';
      case 'manager': return 'bg-blue-500/10 text-blue-400/80 border-blue-500/20';
      case 'employee': return 'bg-green-500/10 text-green-400/80 border-green-500/20';
      default: return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'vendor_admin': return 'Admin';
      case 'manager': return 'Manager';
      case 'employee': return 'Employee';
      default: return role;
    }
  };

  return (
    <div className="w-full min-h-screen p-8">
      <div className="mb-12">
        <h1 className="text-white/70 text-2xl tracking-tight mb-1 font-light">
          Team
        </h1>
        <p className="text-white/25 text-[11px] uppercase tracking-[0.2em] font-light">
          {employees.length} {employees.length === 1 ? 'Employee' : 'Employees'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Users size={48} className="text-white/20 mb-4" strokeWidth={1} />
          <div className="text-white/40 text-sm mb-2">No employees found</div>
          <div className="text-white/30 text-xs">Add team members to get started</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-[#0a0a0a] border border-white/[0.04] rounded-3xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <Users size={18} className="text-white/40" strokeWidth={1.5} />
                </div>
                <span className={`px-2 py-1 rounded-lg border text-[9px] uppercase tracking-wider font-light ${getRoleBadgeColor(emp.role)}`}>
                  {getRoleLabel(emp.role)}
                </span>
              </div>

              <h3 className="text-white/80 text-lg font-light tracking-tight mb-1">
                {emp.first_name} {emp.last_name}
              </h3>

              {emp.employee_id && (
                <div className="text-white/30 text-[10px] mb-4 font-mono">
                  #{emp.employee_id}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-white/30" strokeWidth={1.5} />
                  <span className="text-white/40 text-[11px] font-light truncate">
                    {emp.email}
                  </span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-white/30" strokeWidth={1.5} />
                    <span className="text-white/40 text-[11px] font-light">
                      {emp.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
