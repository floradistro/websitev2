"use client";

import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, CheckCircle, XCircle, Shield, MapPin } from 'lucide-react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import AdminModal from '@/components/AdminModal';

interface Employee {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
  employee_id: string | null;
  phone: string | null;
  hire_date: string | null;
  last_login: string | null;
  created_at: string;
  assigned_locations?: Location[];
}

interface Location {
  id: string;
  name: string;
  type: string;
}

const VENDOR_ROLES = [
  { value: 'vendor_manager', label: 'Manager', description: 'Manage locations & staff' },
  { value: 'location_manager', label: 'Location Manager', description: 'Single location management' },
  { value: 'pos_staff', label: 'POS Staff', description: 'Process sales only' },
  { value: 'inventory_staff', label: 'Inventory Staff', description: 'Manage inventory' },
];

export default function VendorEmployees() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [assigningEmployee, setAssigningEmployee] = useState<Employee | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'pos_staff',
    phone: '',
    employee_id: '',
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadEmployees();
      loadLocations();
    }
  }, [authLoading, isAuthenticated]);

  async function loadEmployees() {
    try {
      setLoading(true);
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) return;

      const response = await axios.get('/api/vendor/employees', {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadLocations() {
    try {
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) return;

      const response = await axios.get('/api/vendor/locations', {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        setLocations(response.data.locations || []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }

  async function createEmployee() {
    if (!newEmployee.email || !newEmployee.first_name || !newEmployee.last_name) {
      showNotification({
        type: 'error',
        title: 'Missing Fields',
        message: 'Email, first name, and last name are required'
      });
      return;
    }

    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await axios.post('/api/vendor/employees', {
        action: 'create',
        ...newEmployee
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Employee Added',
          message: `${newEmployee.first_name} ${newEmployee.last_name} has been added`
        });
        setShowAddModal(false);
        setNewEmployee({
          email: '',
          first_name: '',
          last_name: '',
          role: 'pos_staff',
          phone: '',
          employee_id: '',
        });
        loadEmployees();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to add employee'
      });
    }
  }

  async function updateEmployee() {
    if (!editingEmployee) return;

    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await axios.post('/api/vendor/employees', {
        action: 'update',
        employee_id: editingEmployee.id,
        first_name: editingEmployee.first_name,
        last_name: editingEmployee.last_name,
        phone: editingEmployee.phone,
        role: editingEmployee.role,
        employee_id: editingEmployee.employee_id,
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Employee Updated',
          message: 'Employee information updated successfully'
        });
        setShowEditModal(false);
        setEditingEmployee(null);
        loadEmployees();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update employee'
      });
    }
  }

  async function assignLocations() {
    if (!assigningEmployee || selectedLocations.length === 0) {
      showNotification({
        type: 'error',
        title: 'No Locations Selected',
        message: 'Please select at least one location'
      });
      return;
    }

    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await axios.post('/api/vendor/employees', {
        action: 'assign_locations',
        employee_id: assigningEmployee.id,
        location_ids: selectedLocations
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Locations Assigned',
          message: 'Employee assigned to selected locations'
        });
        setShowAssignModal(false);
        setAssigningEmployee(null);
        setSelectedLocations([]);
        loadEmployees();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to assign locations'
      });
    }
  }

  async function toggleStatus(employeeId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await axios.post('/api/vendor/employees', {
        action: 'toggle_status',
        employee_id: employeeId,
        status: newStatus
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Employee ${newStatus === 'active' ? 'activated' : 'deactivated'}`
        });
        loadEmployees();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update status'
      });
    }
  }

  async function deleteEmployee(employeeId: string, employeeName: string) {
    const confirmed = await showConfirm({
      title: 'Remove Employee',
      message: `Are you sure you want to remove ${employeeName}? This action cannot be undone.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {},
    });

    if (!confirmed) return;

    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await axios.post('/api/vendor/employees', {
        action: 'delete',
        employee_id: employeeId
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Employee Removed',
          message: 'Employee removed successfully'
        });
        loadEmployees();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to remove employee'
      });
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'vendor_manager': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'location_manager': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pos_staff': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'inventory_staff': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl text-white font-light tracking-tight mb-2">Employees</h1>
          <p className="text-white/50 text-sm">{employees.length} employee{employees.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2.5 lg:px-5 lg:py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all whitespace-nowrap flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Employee</span>
          <span className="sm:inline">Add</span>
        </button>
      </div>

      {/* Employees List */}
      {loading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center">
          <Users size={32} className="text-white/20 mx-auto mb-3" />
          <div className="text-white/60 text-sm mb-2">No employees found</div>
          <div className="text-white/40 text-xs">Add your first employee to get started</div>
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/10">
          {employees.map((employee, index) => (
            <div
              key={employee.id}
              className={`px-4 py-4 hover:bg-white/5 transition-colors ${
                index !== employees.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              {/* Mobile Layout */}
              <div className="lg:hidden space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/5 flex items-center justify-center flex-shrink-0 rounded">
                    <Users size={18} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium mb-1">
                      {employee.first_name} {employee.last_name}
                    </div>
                    <div className="text-white/40 text-xs mb-2">{employee.email}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 border ${getRoleBadgeColor(employee.role)}`}>
                        <Shield size={10} className="inline mr-1" />
                        {VENDOR_ROLES.find(r => r.value === employee.role)?.label}
                      </span>
                      {employee.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-white/60 border border-white/10">
                          <CheckCircle size={10} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-white/40 border border-white/10">
                          <XCircle size={10} />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pl-13">
                  <button
                    onClick={() => {
                      setEditingEmployee(employee);
                      setShowEditModal(true);
                    }}
                    className="flex-1 p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setAssigningEmployee(employee);
                      setShowAssignModal(true);
                    }}
                    className="flex-1 p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 text-xs"
                  >
                    <MapPin size={12} className="inline mr-1" />
                    Assign
                  </button>
                  <button
                    onClick={() => toggleStatus(employee.id, employee.status)}
                    className="flex-1 p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 text-xs"
                  >
                    {employee.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="w-8 h-8 bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Users size={16} className="text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">
                    {employee.first_name} {employee.last_name}
                  </div>
                  <div className="text-white/40 text-xs">{employee.email}</div>
                </div>
                <div className="w-40">
                  <span className={`text-xs px-2 py-1 border ${getRoleBadgeColor(employee.role)}`}>
                    {VENDOR_ROLES.find(r => r.value === employee.role)?.label}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  {employee.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/60 border border-white/10">
                      <CheckCircle size={10} />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white/40 border border-white/10">
                      <XCircle size={10} />
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingEmployee(employee);
                      setShowEditModal(true);
                    }}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setAssigningEmployee(employee);
                      setShowAssignModal(true);
                    }}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    title="Assign Locations"
                  >
                    <MapPin size={14} />
                  </button>
                  <button
                    onClick={() => toggleStatus(employee.id, employee.status)}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    {employee.status === 'active' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                  </button>
                  <button
                    onClick={() => deleteEmployee(employee.id, `${employee.first_name} ${employee.last_name}`)}
                    className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      <AdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Employee"
        description="Create a new employee account"
        onSubmit={createEmployee}
        submitText="Add Employee"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">First Name *</label>
              <input
                type="text"
                value={newEmployee.first_name}
                onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Last Name *</label>
              <input
                type="text"
                value={newEmployee.last_name}
                onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Email *</label>
            <input
              type="email"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Phone</label>
              <input
                type="tel"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Employee ID</label>
              <input
                type="text"
                value={newEmployee.employee_id}
                onChange={(e) => setNewEmployee({ ...newEmployee, employee_id: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Role *</label>
            <select
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
              className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            >
              {VENDOR_ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white/5 border border-white/10 p-4">
            <p className="text-white/60 text-xs">
              A temporary password will be sent to the employee's email. They must change it on first login. After creating the employee, assign them to specific locations.
            </p>
          </div>
        </div>
      </AdminModal>

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <AdminModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingEmployee(null);
          }}
          title="Edit Employee"
          description={`Update ${editingEmployee.first_name} ${editingEmployee.last_name}`}
          onSubmit={updateEmployee}
          submitText="Update"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">First Name *</label>
                <input
                  type="text"
                  value={editingEmployee.first_name || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, first_name: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Last Name *</label>
                <input
                  type="text"
                  value={editingEmployee.last_name || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, last_name: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Phone</label>
              <input
                type="tel"
                value={editingEmployee.phone || ''}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Role *</label>
                <select
                  value={editingEmployee.role}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                >
                  {VENDOR_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Employee ID</label>
                <input
                  type="text"
                  value={editingEmployee.employee_id || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, employee_id: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Assign Locations Modal */}
      {assigningEmployee && (
        <AdminModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setAssigningEmployee(null);
            setSelectedLocations([]);
          }}
          title="Assign Locations"
          description={`Assign ${assigningEmployee.first_name} ${assigningEmployee.last_name} to locations`}
          onSubmit={assignLocations}
          submitText="Assign Locations"
          maxWidth="xl"
        >
          <div className="space-y-3">
            <p className="text-white/60 text-sm mb-4">
              Select which locations this employee can access:
            </p>
            
            {locations.map(location => (
              <label
                key={location.id}
                className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLocations([...selectedLocations, location.id]);
                    } else {
                      setSelectedLocations(selectedLocations.filter(id => id !== location.id));
                    }
                  }}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="text-white text-sm">{location.name}</div>
                  <div className="text-white/40 text-xs capitalize">{location.type}</div>
                </div>
              </label>
            ))}

            {locations.length === 0 && (
              <div className="bg-white/5 border border-white/10 p-6 text-center">
                <div className="text-white/40 text-sm">No locations available</div>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}

