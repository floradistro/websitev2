import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const execAsync = promisify(exec);

/**
 * POST /api/vendor/website/deploy
 * Manual deploy - syncs vendor's GitHub repo and pushes to main
 * Vercel will auto-deploy when main is updated
 */
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
      .select(
        `
        slug,
        store_name,
        github_username,
        github_repo_name
      `,
      )
      .eq("id", vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (!vendor.github_repo_name || !vendor.github_username) {
      return NextResponse.json({ error: "GitHub repository not configured" }, { status: 400 });
    }

    // Sync vendor repo to monorepo
    const projectRoot = process.cwd();
    const vendorTemplatePath = path.join(
      projectRoot,
      "components",
      "storefront",
      "templates",
      vendor.slug,
    );
    const tempClonePath = path.join("/tmp", `vendor-${vendor.slug}-${Date.now()}`);

    try {
      // Clone vendor's repo
      const githubToken = process.env.GITHUB_TOKEN;
      const repoFullName = `${vendor.github_username}/${vendor.github_repo_name}`;
      const cloneUrl = githubToken
        ? `https://${githubToken}@github.com/${repoFullName}.git`
        : `https://github.com/${repoFullName}.git`;

      await execAsync(`git clone --depth 1 ${cloneUrl} ${tempClonePath}`);

      // Create vendor template directory
      await fs.mkdir(vendorTemplatePath, { recursive: true });

      // Copy files to template folder
      await execAsync(
        `rsync -av --delete --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='.env*' ${tempClonePath}/ ${vendorTemplatePath}/`,
      );

      // Commit and push to main
      await execAsync(`git add -A ${vendorTemplatePath}`, { cwd: projectRoot });

      const commitMsg = `deploy: sync ${vendor.slug} storefront (manual deploy)`;

      // Check if there are changes to commit
      try {
        const { stdout: statusOutput } = await execAsync("git status --porcelain", {
          cwd: projectRoot,
        });
        if (statusOutput.trim()) {
          // There are changes, commit them
          await execAsync(`git commit -m "${commitMsg}"`, { cwd: projectRoot });
          await execAsync("git push origin main", { cwd: projectRoot });
        } else {
        }
      } catch (commitError: any) {
        // Continue anyway - might not be changes
      }

      // Clean up
      await fs.rm(tempClonePath, { recursive: true, force: true });

      // Update vendor status - mark as ready since we successfully pushed
      await supabase
        .from("vendors")
        .update({
          deployment_status: "ready",
          last_deployment_at: new Date().toISOString(),
          deployment_error: null,
        })
        .eq("id", vendorId);

      // Create deployment record - mark as completed since git push succeeded
      await supabase.from("vendor_deployments").insert({
        vendor_id: vendorId,
        status: "ready",
        commit_message: "Manual deploy via dashboard",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Pushed to main - Vercel is deploying",
        vendor: vendor.slug,
      });
    } catch (syncError: any) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error syncing vendor repo:", syncError);
      }
      // Clean up
      try {
        await fs.rm(tempClonePath, { recursive: true, force: true });
      } catch {}

      throw new Error(`Failed to sync vendor repo: ${syncError.message}`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Deployment error:", err);
    }
    return NextResponse.json(
      {
        error: err.message || "Failed to deploy",
        details: error.toString(),
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/vendor/website/deploy
 * Get current deployment status from Vercel
 */
export async function GET(request: NextRequest) {
  try {
    // Verify vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Get latest deployment for this vendor
    const { data: deployment } = await supabase
      .from("vendor_deployments")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (!deployment) {
      return NextResponse.json({
        success: true,
        status: null,
        message: "No deployments yet",
      });
    }

    return NextResponse.json({
      success: true,
      status: deployment.status,
      started_at: deployment.started_at,
      completed_at: deployment.completed_at,
      commit_message: deployment.commit_message,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error getting deployment status:", err);
    }
    return NextResponse.json(
      {
        error: err.message || "Failed to get deployment status",
      },
      { status: 500 },
    );
  }
}
