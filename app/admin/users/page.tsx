"use client";

import { useState, useEffect } from 'react';
import { Users, Search, User, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import AdminModal from '@/components/AdminModal';

const baseUrl = "https://api.floradistro.com";
const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
const authParams = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  registered: string;
  orders: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseUrl}/wp-json/wc/v3/customers?${authParams}&per_page=100&_t=${Date.now()}`
      );

      const usersList = response.data.map((customer: any) => ({
        id: customer.id,
        name: customer.first_name && customer.last_name 
          ? `${customer.first_name} ${customer.last_name}` 
          : customer.username || customer.email,
        email: customer.email,
        role: customer.role || 'customer',
        registered: customer.date_created,
        orders: customer.orders_count || 0,
      }));

      setUsers(usersList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setLoading(false);
    }
  }

  async function deleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(
        `${baseUrl}/wp-json/wc/v3/customers/${userId}?${authParams}&force=true`
      );
      alert('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  }

  const filteredUsers = users.filter(user =>
    search ? (
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    ) : true
  );

  return (
    <div className="w-full animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl text-white font-light tracking-tight mb-2">Users</h1>
        <p className="text-white/50 text-sm">{filteredUsers.length} registered</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 text-white placeholder-white/40 pl-9 pr-4 py-2.5 focus:outline-none focus:border-white/20 transition-colors text-sm"
          />
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center">
          <Users size={32} className="text-white/20 mx-auto mb-3" />
          <div className="text-white/60 text-sm">No users found</div>
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/10">
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors ${
                index !== filteredUsers.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <div className="w-8 h-8 bg-white/5 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white/40" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium">{user.name}</div>
                <div className="text-white/40 text-xs">{user.email}</div>
              </div>
              <div className="text-white/60 text-xs uppercase px-2 py-1 border border-white/10">
                {user.role}
              </div>
              <div className="text-white/40 text-xs">{user.orders} orders</div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingUser(user);
                    setShowEditModal(true);
                  }}
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => deleteUser(user.id)}
                  className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <AdminModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          title="Edit User"
          description={`Update ${editingUser.name}`}
          onSubmit={() => {
            alert('User update functionality coming soon');
            setShowEditModal(false);
            setEditingUser(null);
          }}
          submitText="Update User"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Name</label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Role</label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              >
                <option value="customer">Customer</option>
                <option value="subscriber">Subscriber</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
