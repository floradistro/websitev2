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
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl text-white mb-2 font-light">User Management</h1>
          <p className="text-white/60 text-sm">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 px-4 py-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-10 pr-4 py-2.5 focus:outline-none focus:border-white/10 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-[#1a1a1a] border border-white/5 p-16 text-center">
          <div className="inline-block w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white/60">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/5 p-12 text-center">
          <Users size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-4">No users found</div>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/5">
          <table className="w-full">
            <thead className="border-b border-white/5">
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
                      <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center">
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
      )}
    </div>
  );
}
