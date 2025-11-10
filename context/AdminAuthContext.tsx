"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AdminAuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function checkAdminRole(userId: string) {
    try {
      console.log("🔍 Checking admin role for user:", userId);
      const startTime = Date.now();

      // Add timeout to prevent hanging
      const { data, error } = await Promise.race([
        supabase
          .from("users")
          .select("role, email")
          .eq("auth_user_id", userId)
          .maybeSingle(),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error("Role check timeout")), 5000),
        ),
      ]);

      console.log(
        `✅ Admin role check completed in ${Date.now() - startTime}ms`,
      );

      if (error) {
        console.error("❌ Error fetching user role:", error);
        setIsAdmin(false);
        return;
      }

      // Check if user has admin role
      const adminRoles = ["admin", "super_admin"];
      const hasAdminRole = !!(data && adminRoles.includes(data.role));

      console.log("👤 User role:", data?.role, "| Is admin:", hasAdminRole);
      setIsAdmin(hasAdminRole);

      // Redirect non-admin users trying to access admin routes
      if (
        !hasAdminRole &&
        pathname?.startsWith("/admin") &&
        pathname !== "/admin/login"
      ) {
        console.log("⚠️ Redirecting non-admin user to login");
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("❌ Error checking admin role:", error);
      setIsAdmin(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      console.log("🔐 Starting admin login...");
      const startTime = Date.now();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log(`✅ Auth completed in ${Date.now() - startTime}ms`);

      if (error) {
        console.error("❌ Auth error:", error);
        throw error;
      }

      if (data.user) {
        console.log("👤 Checking admin role...");
        const roleCheckStart = Date.now();

        // Check if user has admin role with timeout
        const { data: userData, error: roleError } = await Promise.race([
          supabase
            .from("users")
            .select("role")
            .eq("auth_user_id", data.user.id)
            .maybeSingle(),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error("Role check timeout")), 5000),
          ),
        ]);

        console.log(
          `✅ Role check completed in ${Date.now() - roleCheckStart}ms`,
        );

        if (roleError) {
          console.error("❌ Error checking role:", roleError);
          await supabase.auth.signOut();
          throw new Error("Failed to verify admin privileges");
        }

        const adminRoles = ["admin", "super_admin"];
        const hasAdminRole = userData && adminRoles.includes(userData.role);

        if (!hasAdminRole) {
          console.warn("⚠️ User is not admin:", userData);
          await supabase.auth.signOut();
          throw new Error("You do not have admin privileges");
        }

        console.log(`🎉 Admin login successful in ${Date.now() - startTime}ms`);
        setIsAdmin(true);
        router.push("/admin/dashboard");
      }
    } catch (error: any) {
      console.error("❌ Login failed:", error);
      throw new Error(error.message || "Failed to sign in");
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      router.push("/admin/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  return (
    <AdminAuthContext.Provider
      value={{ user, isAdmin, loading, signIn, signOut }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
