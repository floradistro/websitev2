import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getServiceSupabase } from "@/lib/supabase/client";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const execAsync = promisify(exec);

/**
 * POST /api/webhooks/github
 * GitHub webhook for vendor storefront updates
 *
 * Flow:
 * 1. Vendor pushes to their repo (e.g., flora-distro-storefront)
 * 2. Webhook fires to this endpoint
 * 3. Pull their changes into components/storefront/templates/[vendor-slug]/
 * 4. Commit to main WhaleTools repo
 * 5. Vercel auto-deploys the main project (websitev2)
 *
 * Setup in vendor's GitHub:
 * 1. Go to repo Settings > Webhooks > Add webhook
 * 2. Payload URL: https://whaletools.dev/api/webhooks/github
 * 3. Content type: application/json
 * 4. Secret: Your GITHUB_WEBHOOK_SECRET
 * 5. Events: Just the push event
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");

    if (!signature || event !== "push") {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    const payload = await request.text();

    // Verify webhook signature
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      if (process.env.NODE_ENV === "development") {
        logger.error("GITHUB_WEBHOOK_SECRET not configured");
      }
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const expectedSignature =
      "sha256=" + createHmac("sha256", webhookSecret).update(payload).digest("hex");

    if (signature !== expectedSignature) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Invalid webhook signature");
      }
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the payload
    const data = JSON.parse(payload);

    // Only process pushes to main/master branch
    const branch = data.ref?.replace("refs/heads/", "");
    if (branch !== "main" && branch !== "master") {
      return NextResponse.json({
        message: `Ignoring push to ${branch} branch`,
      });
    }

    // Extract commit info
    const commitSha = data.after;
    const commitMessage = data.head_commit?.message || "No commit message";
    const commitAuthor = data.head_commit?.author?.name || "Unknown";
    const repoFullName = data.repository?.full_name; // e.g., "floradistro/flora-distro-storefront"

    if (!repoFullName) {
      return NextResponse.json({ error: "Repository info missing" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Find vendor by repository name
    const [githubUsername, githubRepoName] = repoFullName.split("/");

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, slug, store_name")
      .eq("github_username", githubUsername)
      .eq("github_repo_name", githubRepoName)
      .single();

    if (vendorError || !vendor) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Vendor not found for repo:", repoFullName);
      }
      return NextResponse.json({ error: "Vendor not found for this repository" }, { status: 404 });
    }

    // Pull vendor's repo into our monorepo
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
      // Clone vendor's repo to temp directory
      const githubToken = process.env.GITHUB_TOKEN;
      const cloneUrl = githubToken
        ? `https://${githubToken}@github.com/${repoFullName}.git`
        : `https://github.com/${repoFullName}.git`;

      await execAsync(`git clone --depth 1 --branch ${branch} ${cloneUrl} ${tempClonePath}`);

      // Create vendor template directory if it doesn't exist
      await fs.mkdir(vendorTemplatePath, { recursive: true });

      // Copy files from vendor repo to our template folder
      // Exclude .git, node_modules, .next, etc.
      await execAsync(
        `rsync -av --delete --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='.env*' ${tempClonePath}/ ${vendorTemplatePath}/`,
      );

      // Commit changes to main repo
      await execAsync(`git add ${vendorTemplatePath}`, { cwd: projectRoot });

      const commitMsg = `chore: sync ${vendor.slug} storefront\n\n${commitMessage}\n\nCommit: ${commitSha.substring(0, 7)}\nAuthor: ${commitAuthor}`;

      await execAsync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, {
        cwd: projectRoot,
      });
      await execAsync("git push origin main", { cwd: projectRoot });

      // Clean up temp directory
      await fs.rm(tempClonePath, { recursive: true, force: true });

      // Update vendor status - mark as ready since we successfully pushed
      await supabase
        .from("vendors")
        .update({
          deployment_status: "ready",
          last_deployment_at: new Date().toISOString(),
          deployment_error: null,
        })
        .eq("id", vendor.id);

      // Create deployment record - mark as completed since git push succeeded
      await supabase.from("vendor_deployments").insert({
        vendor_id: vendor.id,
        status: "ready",
        commit_sha: commitSha,
        commit_message: commitMessage,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `Synced ${vendor.store_name} storefront`,
        vendor: vendor.slug,
        commit: commitSha.substring(0, 7),
      });
    } catch (syncError: any) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error syncing vendor repo:", syncError);
      }
      // Clean up temp directory on error
      try {
        await fs.rm(tempClonePath, { recursive: true, force: true });
      } catch {}

      throw new Error(`Failed to sync vendor repo: ${syncError.message}`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("GitHub webhook error:", err);
    }
    return NextResponse.json(
      {
        error: err.message || "Webhook processing failed",
        details: error.toString(),
      },
      { status: 500 },
    );
  }
}
