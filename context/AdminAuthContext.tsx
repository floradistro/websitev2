"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AdminAuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkAdminRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, email')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setIsAdmin(false);
        return;
      }

      // Check if user has admin role
      const adminRoles = ['admin', 'super_admin'];
      const hasAdminRole = data && adminRoles.includes(data.role);
      
      setIsAdmin(hasAdminRole);

      // Redirect non-admin users trying to access admin routes
      if (!hasAdminRole && pathname?.startsWith('/admin') && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user has admin role
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        if (roleError) {
          console.error('Error checking role:', roleError);
          await supabase.auth.signOut();
          throw new Error('Failed to verify admin privileges');
        }

        const adminRoles = ['admin', 'super_admin'];
        const hasAdminRole = userData && adminRoles.includes(userData.role);
        
        if (!hasAdminRole) {
          await supabase.auth.signOut();
          throw new Error('You do not have admin privileges');
        }

        setIsAdmin(true);
        router.push('/admin/dashboard');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <AdminAuthContext.Provider value={{ user, isAdmin, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

