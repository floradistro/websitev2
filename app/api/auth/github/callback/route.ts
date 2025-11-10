import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Missing code or state parameter");
    }
    return NextResponse.redirect(new URL("/vendor/website?error=missing_params", request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ GitHub OAuth error:", tokenData);
      }
      return NextResponse.redirect(
        new URL("/vendor/website?error=github_auth_failed", request.url),
      );
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ No access token received");
      }
      return NextResponse.redirect(new URL("/vendor/website?error=no_token", request.url));
    }

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const githubUser = await userResponse.json();

    // Store in database (encrypted)
    const supabase = getServiceSupabase();

    // Get vendor ID from state
    const vendorId = state;

    const { error } = await supabase
      .from("vendors")
      .update({
        github_access_token: accessToken, // Should be encrypted in production
        github_username: githubUser.login,
        github_user_id: githubUser.id.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendorId);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Database update error:", error);
      }
      return NextResponse.redirect(new URL("/vendor/website?error=db_update_failed", request.url));
    }

    return NextResponse.redirect(new URL("/vendor/website?success=github_connected", request.url));
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("GitHub OAuth callback error:", error);
    }
    return NextResponse.redirect(new URL("/vendor/website?error=unknown", request.url));
  }
}
