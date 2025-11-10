import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { createRepositoryFromTemplate } from "@/lib/deployment/github";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  try {
    // Verify vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("store_name, slug, github_access_token, github_username")
      .eq("id", vendorId)
      .single();

    if (vendorError || !vendor) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Vendor not found:", vendorError);
      }
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (!vendor.github_access_token || !vendor.github_username) {
      if (process.env.NODE_ENV === "development") {
        logger.error("GitHub not connected for vendor");
      }
      return NextResponse.json(
        { error: "Please connect your GitHub account first" },
        { status: 400 },
      );
    }

    // Create repository in vendor's GitHub account
    const repoName = `${vendor.slug}-storefront`;
    const description = `${vendor.store_name} - Cannabis Storefront`;

    const repo = await createRepositoryFromTemplate({
      vendorAccessToken: vendor.github_access_token,
      vendorUsername: vendor.github_username,
      name: repoName,
      description,
      isPrivate: false, // Public so they can deploy to Vercel
    });

    // Update vendor record with repo info
    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        github_repo_name: repoName,
        github_repo_url: repo.html_url,
        github_repo_full_name: repo.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendorId);

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error updating vendor with repo info:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      repo: {
        name: repo.name,
        url: repo.html_url,
        fullName: repo.full_name,
        defaultBranch: repo.default_branch,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error creating website repo:", err);
    }
    return NextResponse.json(
      { error: err.message || "Failed to create repository" },
      { status: 500 },
    );
  }
}
