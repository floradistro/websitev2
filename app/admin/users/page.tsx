"use client";

import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, CheckCircle, XCircle, Shield, MapPin } from 'lucide-react';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import AdminModal from '@/components/AdminModal';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  vendor_id: string | null;
  status: string;
  employee_id: string | null;
  phone: string | null;
  hire_date: string | null;
  last_login: string | null;
  created_at: string;
  vendors?: {
    store_name: string;
  };
  assigned_locations?: number;
}

interface Vendor {
  id: string;
  store_name: string;
}

interface Location {
  id: string;
  name: string;
  vendor_id: string;
}

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'vendor_owner', label: 'Vendor Owner', description: 'Full vendor access' },
  { value: 'vendor_manager', label: 'Vendor Manager', description: 'Manage locations & staff' },
  { value: 'location_manager', label: 'Location Manager', description: 'Single location management' },
  { value: 'pos_staff', label: 'POS Staff', description: 'Process sales only' },
  { value: 'inventory_staff', label: 'Inventory Staff', description: 'Manage inventory' },
  { value: 'readonly', label: 'Read Only', description: 'View access only' }
];

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [assigningLocationsUser, setAssigningLocationsUser] = useState<User | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [primaryLocation, setPrimaryLocation] = useState<string>('');
  const [newUser, setNewUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'pos_staff',
    vendor_id: '',
    phone: '',
    employee_id: '',
  });

  useEffect(() => {
    loadUsers();
    loadVendors();
    loadLocations();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users');
      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVendors() {
    try {
      const response = await axios.get('/api/admin/vendors');
      if (response.data.success) {
        setVendors(response.data.vendors || []);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  }

  async function loadLocations() {
    try {
      const response = await axios.get('/api/admin/locations');
      if (response.data.success) {
        setLocations(response.data.locations || []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }

  async function createUser() {
    if (!newUser.email || !newUser.first_name || !newUser.last_name) {
      showNotification({
        type: 'error',
        title: 'Missing Fields',
        message: 'Email, first name, and last name are required'
      });
      return;
    }

    try {
      const response = await axios.post('/api/admin/users', {
        action: 'create',
        ...newUser
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'User Created',
          message: `${newUser.first_name} ${newUser.last_name} has been created`
        });
        setShowAddModal(false);
        setNewUser({
          email: '',
          first_name: '',
          last_name: '',
          role: 'pos_staff',
          vendor_id: '',
          phone: '',
          employee_id: '',
        });
        loadUsers();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create user'
      });
    }
  }

  async function updateUser() {
    if (!editingUser) return;

    try {
      const response = await axios.post('/api/admin/users', {
        action: 'update',
        user_id: editingUser.id,
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        phone: editingUser.phone,
        role: editingUser.role,
        employee_id: editingUser.employee_id,
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'User Updated',
          message: 'User information updated successfully'
        });
        setShowEditModal(false);
        setEditingUser(null);
        loadUsers();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update user'
      });
    }
  }

  async function toggleStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await axios.post('/api/admin/users', {
        action: 'toggle_status',
        user_id: userId,
        status: newStatus
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Status Updated',
          message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'}`
        });
        loadUsers();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update status'
      });
    }
  }

  async function deleteUser(userId: string, userName: string) {
    const confirmed = await showConfirm({
      title: 'Delete User',
      message: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {},
    });

    if (!confirmed) return;

    try {
      const response = await axios.post('/api/admin/users', {
        action: 'delete',
        user_id: userId
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'User Deleted',
          message: 'User deleted successfully'
        });
        loadUsers();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to delete user'
      });
    }
  }

  async function openLocationAssignment(user: User) {
    setAssigningLocationsUser(user);
    
    // Load current location assignments
    try {
      const response = await axios.get(`/api/admin/user-locations?user_id=${user.id}`);
      if (response.data.success) {
        const assignedLocations = response.data.locations || [];
        setSelectedLocationIds(assignedLocations.map((loc: any) => loc.location_id));
        const primary = assignedLocations.find((loc: any) => loc.is_primary_location);
        setPrimaryLocation(primary?.location_id || '');
      }
    } catch (error) {
      console.error('Error loading user locations:', error);
    }
    
    setShowLocationModal(true);
  }

  async function assignLocations() {
    if (!assigningLocationsUser) return;

    try {
      const response = await axios.post('/api/admin/user-locations', {
        user_id: assigningLocationsUser.id,
        location_ids: selectedLocationIds,
        is_primary_location: primaryLocation
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Locations Assigned',
          message: response.data.message
        });
        setShowLocationModal(false);
        setAssigningLocationsUser(null);
        setSelectedLocationIds([]);
        setPrimaryLocation('');
        loadUsers();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to assign locations'
      });
    }
  }

  function toggleLocationSelection(locationId: string) {
    setSelectedLocationIds(prev => 
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'vendor_owner': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'vendor_manager': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'location_manager': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pos_staff': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'inventory_staff': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  return (
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl text-white font-light tracking-tight mb-2">Users & Employees</h1>
          <p className="text-white/50 text-sm">{users.length} registered</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2.5 lg:px-5 lg:py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all whitespace-nowrap flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add User</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <Users size={32} className="text-white/20 mx-auto mb-3" />
          <div className="text-white/60 text-sm">No users found</div>
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/10 -mx-4 lg:mx-0">
          {users.map((user, index) => (
            <div
              key={user.id}
              className={`px-4 py-4 hover:bg-white/5 transition-colors ${
                index !== users.length - 1 ? 'border-b border-white/5' : ''
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
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-white/40 text-xs mb-2">{user.email}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 border ${getRoleBadgeColor(user.role)}`}>
                        <Shield size={10} className="inline mr-1" />
                        {ROLES.find(r => r.value === user.role)?.label}
                      </span>
                      {user.status === 'active' ? (
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
                
                {user.vendors && (
                  <div className="pl-13 text-xs text-white/60">
                    📦 {user.vendors.store_name}
                  </div>
                )}

                <div className="flex gap-2 pl-13">
                  <button
                    onClick={() => {
                      setEditingUser(user);
                      setShowEditModal(true);
                    }}
                    className="flex-1 p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openLocationAssignment(user)}
                    className="flex-1 p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 text-xs"
                  >
                    <MapPin size={12} className="inline mr-1" />
                    Locations
                  </button>
                  <button
                    onClick={() => toggleStatus(user.id, user.status)}
                    className="flex-1 p-2.5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 text-xs"
                  >
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                    className="p-2.5 px-4 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all border border-red-500/20 text-xs"
                  >
                    Delete
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
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-white/40 text-xs">{user.email}</div>
                </div>
                <div className="w-40">
                  <span className={`text-xs px-2 py-1 border ${getRoleBadgeColor(user.role)}`}>
                    {ROLES.find(r => r.value === user.role)?.label}
                  </span>
                </div>
                <div className="w-40 text-white/60 text-xs">
                  {user.vendors?.store_name || 'Admin'}
                </div>
                <div className="flex-shrink-0">
                  {user.status === 'active' ? (
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
                      setEditingUser(user);
                      setShowEditModal(true);
                    }}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    title="Edit User"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => openLocationAssignment(user)}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    title="Assign Locations"
                  >
                    <MapPin size={14} />
                  </button>
                  <button
                    onClick={() => toggleStatus(user.id, user.status)}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    {user.status === 'active' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                    className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Delete User"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      <AdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
        description="Create a new employee account"
        onSubmit={createUser}
        submitText="Create User"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">First Name *</label>
              <input
                type="text"
                value={newUser.first_name}
                onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Last Name *</label>
              <input
                type="text"
                value={newUser.last_name}
                onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Email *</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Phone</label>
              <input
                type="tel"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Employee ID</label>
              <input
                type="text"
                value={newUser.employee_id}
                onChange={(e) => setNewUser({ ...newUser, employee_id: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Role *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Vendor</label>
              <select
                value={newUser.vendor_id}
                onChange={(e) => setNewUser({ ...newUser, vendor_id: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              >
                <option value="">Admin (No Vendor)</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.store_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4">
            <p className="text-white/60 text-xs">
              A temporary password will be generated and sent to the user's email address. They will be required to change it on first login.
            </p>
          </div>
        </div>
      </AdminModal>

      {/* Assign Locations Modal */}
      <AdminModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          setAssigningLocationsUser(null);
          setSelectedLocationIds([]);
          setPrimaryLocation('');
        }}
        title="Assign Locations"
        description={assigningLocationsUser ? `Assign ${assigningLocationsUser.first_name} ${assigningLocationsUser.last_name} to locations` : ''}
        onSubmit={assignLocations}
        submitText="Save Locations"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {assigningLocationsUser?.role === 'admin' ? (
            <div className="bg-white/5 border border-white/10 p-8 text-center">
              <Shield size={32} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Admin users have access to all locations</p>
            </div>
          ) : assigningLocationsUser?.vendor_id ? (
            <>
              <div className="text-white/60 text-sm mb-4">
                Select which locations this employee can access. Choose one as their primary location.
              </div>
              
              {locations.filter(loc => loc.vendor_id === assigningLocationsUser.vendor_id).length === 0 ? (
                <div className="bg-white/5 border border-white/10 p-8 text-center">
                  <MapPin size={32} className="text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">No locations found for this vendor</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {locations
                    .filter(loc => loc.vendor_id === assigningLocationsUser.vendor_id)
                    .map(location => (
                      <div
                        key={location.id}
                        className="bg-[#111111] border border-white/10 p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedLocationIds.includes(location.id)}
                            onChange={() => toggleLocationSelection(location.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="text-white text-sm font-medium mb-1">{location.name}</div>
                            {selectedLocationIds.includes(location.id) && (
                              <label className="flex items-center gap-2 text-xs text-white/60 mt-2">
                                <input
                                  type="radio"
                                  name="primary_location"
                                  checked={primaryLocation === location.id}
                                  onChange={() => setPrimaryLocation(location.id)}
                                />
                                Set as primary location
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              
              {selectedLocationIds.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/20 p-3">
                  <p className="text-green-400 text-xs">
                    {selectedLocationIds.length} location(s) selected
                    {primaryLocation && ' • Primary location set'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white/5 border border-white/10 p-8 text-center">
              <MapPin size={32} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">This user needs to be assigned to a vendor first</p>
            </div>
          )}
        </div>
      </AdminModal>

      {/* Edit User Modal */}
      {editingUser && (
        <AdminModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          title="Edit User"
          description={`Update ${editingUser.first_name} ${editingUser.last_name}`}
          onSubmit={updateUser}
          submitText="Update User"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">First Name *</label>
                <input
                  type="text"
                  value={editingUser.first_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Last Name *</label>
                <input
                  type="text"
                  value={editingUser.last_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Phone</label>
              <input
                type="tel"
                value={editingUser.phone || ''}
                onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Role *</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                >
                  {ROLES.map(role => (
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
                  value={editingUser.employee_id || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, employee_id: e.target.value })}
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
