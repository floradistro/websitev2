import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as bcrypt from "bcryptjs";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Admin users configuration from environment variables
interface AdminUser {
  username: string;
  passwordHash: string;
  role: "admin" | "readonly";
  name: string;
}

function getAdminUsers(): AdminUser[] {
  const users: AdminUser[] = [];

  // Admin user
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH) {
    users.push({
      username: process.env.ADMIN_USERNAME,
      passwordHash: process.env.ADMIN_PASSWORD_HASH,
      role: "admin",
      name: "Super Admin",
    });
  }

  // Read-only user
  if (process.env.READONLY_USERNAME && process.env.READONLY_PASSWORD_HASH) {
    users.push({
      username: process.env.READONLY_USERNAME,
      passwordHash: process.env.READONLY_PASSWORD_HASH,
      role: "readonly",
      name: "Read Only",
    });
  }

  if (users.length === 0) {
    throw new Error("No admin users configured. Please set environment variables.");
  }

  return users;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // Get admin users from environment
    let adminUsers: AdminUser[];
    try {
      adminUsers = getAdminUsers();
    } catch (error) {
      return NextResponse.json({ error: "Admin authentication not configured" }, { status: 500 });
    }

    // Find user by username
    const user = adminUsers.find((u) => u.username === username);

    if (!user) {
      // Use timing-safe comparison by still comparing hash even if user not found
      await bcrypt.compare(password, "$2a$10$invalidhashtopreventtimingattack");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate secure session token
    const sessionToken = Buffer.from(
      JSON.stringify({
        username: user.username,
        name: user.name,
        role: user.role,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      }),
    ).toString("base64");

    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    // Don't log the actual error details in production for security
    if (process.env.NODE_ENV === "development") {
      logger.error("Admin login error:", err);
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
