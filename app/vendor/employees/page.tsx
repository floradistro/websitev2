'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Mail, Phone, Shield, MapPin, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import axios from 'axios';

interface Employee {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
  employee_id: string | null;
  phone: string | null;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

const ROLES = [
  { value: 'vendor_manager', label: 'Manager', color: 'cyan' },
  { value: 'location_manager', label: 'Location Manager', color: 'green' },
  { value: 'pos_staff', label: 'POS Staff', color: 'blue' },
  { value: 'inventory_staff', label: 'Inventory', color: 'orange' },
];

export default function EmployeesPage() {
  const { vendor, isLoading: authLoading } = useAppAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'pos_staff',
    phone: '',
  });

  useEffect(() => {
    if (vendor?.id) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [vendor?.id, authLoading]);

  async function loadData() {
    if (!vendor?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [empRes, locRes] = await Promise.all([
        axios.get('/api/vendor/employees', { headers: { 'x-vendor-id': vendor.id } }),
        axios.get('/api/vendor/locations', { headers: { 'x-vendor-id': vendor.id } })
      ]);

      if (empRes.data.success) setEmployees(empRes.data.employees || []);
      if (locRes.data.success) setLocations(locRes.data.locations || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor?.id || !newEmployee.email || !newEmployee.first_name || !newEmployee.last_name) return;

    try {
      const res = await axios.post('/api/vendor/employees', {
        action: 'create',
        ...newEmployee
      }, {
        headers: { 'x-vendor-id': vendor.id }
      });

      if (res.data.success) {
        setShowAddModal(false);
        setNewEmployee({ email: '', first_name: '', last_name: '', role: 'pos_staff', phone: '' });
        loadData();
      }
    } catch (error: any) {
      console.error('Error adding employee:', error);
      alert(error.response?.data?.error || 'Failed to add employee');
    }
  }

  async function toggleStatus(employeeId: string, currentStatus: string) {
    if (!vendor?.id) return;

    try {
      await axios.post('/api/vendor/employees', {
        action: 'toggle_status',
        employee_id: employeeId,
        status: currentStatus === 'active' ? 'inactive' : 'active'
      }, {
        headers: { 'x-vendor-id': vendor.id }
      });
      loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  }

  const getRoleColorClass = (role: string) => {
    const r = ROLES.find(r => r.value === role);
    switch (r?.color) {
      case 'cyan': return 'text-cyan-400/60';
      case 'green': return 'text-green-400/60';
      case 'blue': return 'text-blue-400/60';
      case 'orange': return 'text-orange-400/60';
      default: return 'text-white/60';
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLES.find(r => r.value === role)?.label || role;
  };

  // Show error state if something broke
  if (error) {
    return (
      <div className="w-full animate-fadeIn">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="text-red-400/60 text-sm mb-2 tracking-tight">Error</div>
          <p className="text-white/40 text-[11px] text-center max-w-md font-light tracking-wide">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              loadData();
            }}
            className="mt-6 px-6 py-3 bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-white/60 text-[10px] uppercase tracking-[0.2em] font-light transition-all duration-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fadeIn">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-white/70 text-2xl tracking-tight mb-1 font-light">
              Team
            </h1>
            <p className="text-white/25 text-[11px] uppercase tracking-[0.2em] font-light">
              {employees.length} {employees.length === 1 ? 'Employee' : 'Employees'}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="group flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] px-6 py-3 rounded-2xl transition-all duration-400 active:scale-[0.96]"
          >
            <Plus size={16} className="text-white/60 group-hover:text-white/80 transition-colors duration-400" strokeWidth={1.5} />
            <span className="text-white/60 group-hover:text-white/80 text-[10px] uppercase tracking-[0.2em] font-light transition-colors duration-400">
              Add Employee
            </span>
          </button>
        </div>

        {/* Employees Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-white/40 text-sm tracking-tight">Loading...</div>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-6 shadow-lg shadow-black/20">
              <Users size={32} className="text-white/20" strokeWidth={1.5} />
            </div>
            <div className="text-white/40 text-sm mb-2 tracking-tight">
              No employees yet
            </div>
            <p className="text-white/20 text-[11px] text-center max-w-md font-light tracking-wide">
              Add your first employee to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="group bg-[#0a0a0a] border border-white/[0.04] hover:border-white/[0.08] rounded-3xl p-6 transition-all duration-400 shadow-lg shadow-black/30"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <Users size={20} className="text-white/40" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-white/80 text-sm font-light tracking-tight mb-0.5">
                        {emp.first_name} {emp.last_name}
                      </div>
                      <div className={`${getRoleColorClass(emp.role)} text-[10px] uppercase tracking-[0.15em] font-light`}>
                        {getRoleLabel(emp.role)}
                      </div>
                    </div>
                  </div>

                  {emp.status === 'active' ? (
                    <CheckCircle size={16} className="text-green-400/60" strokeWidth={1.5} />
                  ) : (
                    <XCircle size={16} className="text-white/20" strokeWidth={1.5} />
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4 pb-4 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-white/30" strokeWidth={1.5} />
                    <span className="text-white/40 text-[11px] font-light tracking-tight truncate">
                      {emp.email}
                    </span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-white/30" strokeWidth={1.5} />
                      <span className="text-white/40 text-[11px] font-light tracking-tight">
                        {emp.phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStatus(emp.id, emp.status)}
                    className="flex-1 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.08] rounded-xl text-white/50 hover:text-white/70 text-[9px] uppercase tracking-[0.15em] font-light transition-all duration-400"
                  >
                    {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="px-3 py-2 bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/30 rounded-xl transition-all duration-400"
                  >
                    <Trash2 size={12} className="text-white/30 hover:text-red-400/60 transition-colors duration-400" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-black/50">
            <h2 className="text-white/70 text-xl tracking-tight mb-6 font-light">
              Add New Employee
            </h2>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newEmployee.first_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all duration-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newEmployee.last_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all duration-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all duration-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all duration-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                  Role
                </label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all duration-400 focus:outline-none"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value} className="bg-[#0a0a0a]">
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.08] rounded-xl text-white/50 hover:text-white/70 text-[10px] uppercase tracking-[0.2em] font-light transition-all duration-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] rounded-xl text-white/60 hover:text-white/80 text-[10px] uppercase tracking-[0.2em] font-light transition-all duration-400"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
