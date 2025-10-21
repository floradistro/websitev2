"use client";

import { useState, useEffect } from 'react';
import { Users, Search, Shield, User, Trash2 } from 'lucide-react';
import axios from 'axios';

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

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      
      // Fetch WooCommerce customers
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
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
          User Management
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
        </p>
      </div>

      {/* Search */}
      <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 px-4 lg:p-4 py-3 lg:py-4 mb-0 lg:mb-6">
        <div className="relative">
          <Search size={16} className="lg:w-[18px] lg:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-white/40 pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 focus:outline-none focus:border-white/20 transition-colors text-sm lg:text-base"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 lg:p-16 text-center">
          <div className="inline-block w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white/60">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 text-center">
          <Users size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-4">No users found</div>
        </div>
      ) : (
        <>
          {/* Mobile List */}
          <div className="lg:hidden">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-[#1a1a1a] border-b border-white/5 p-4 active:bg-white/5 transition-all">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/5 flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-base font-medium mb-1">{user.name}</div>
                    <div className="text-white/60 text-sm mb-2">{user.email}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 uppercase">
                        {user.role}
                      </span>
                      <span className="text-white/40">{user.orders} orders</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-[#1a1a1a] border border-white/5">
            <table className="w-full">
              <thead className="border-b border-white/5 bg-[#1a1a1a]">
                <tr>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">User</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Email</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Role</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Orders</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Registered</th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#303030] transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 flex items-center justify-center">
                          <User size={18} className="text-white/40" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{user.name}</div>
                          <div className="text-white/40 text-xs">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white/60 text-sm">{user.email}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs uppercase">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-white text-sm">{user.orders}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white/60 text-xs">
                        {new Date(user.registered).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-500/60 hover:text-red-500 text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
