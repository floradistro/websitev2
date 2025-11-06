import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * POST /api/vendor/website/sync-and-deploy
 * Simplified deploy - just sync vendor repo and push to main
 * Vercel will auto-deploy, vendor can see logs at vercel.com
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Sync and deploy requested');

    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    const { data: vendor } = await supabase
      .from('vendors')
      .select('slug, github_username, github_repo_name')
      .eq('id', vendorId)
      .single();

    if (!vendor || !vendor.github_repo_name) {
      return NextResponse.json(
        { error: 'GitHub repository not configured' },
        { status: 400 }
      );
    }

    const projectRoot = process.cwd();
    const vendorTemplatePath = path.join(projectRoot, 'components', 'storefront', 'templates', vendor.slug);
    const tempClonePath = path.join('/tmp', `vendor-${vendor.slug}-${Date.now()}`);

    try {
      // Clone vendor's repo
      const githubToken = process.env.GITHUB_TOKEN;
      const repoFullName = `${vendor.github_username}/${vendor.github_repo_name}`;
      const cloneUrl = `https://${githubToken}@github.com/${repoFullName}.git`;

      console.log(`📥 Cloning ${repoFullName}...`);
      await execAsync(`git clone --depth 1 ${cloneUrl} ${tempClonePath}`);

      // Create vendor template directory
      await fs.mkdir(vendorTemplatePath, { recursive: true });

      // Sync files
      console.log(`📦 Syncing files to ${vendorTemplatePath}...`);
      await execAsync(
        `rsync -av --delete --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='.env*' ${tempClonePath}/ ${vendorTemplatePath}/`
      );

      // Git add, commit, push
      console.log('📝 Committing changes...');
      await execAsync(`git add "${vendorTemplatePath}"`, { cwd: projectRoot });

      // Check if there are changes ONLY in the vendor template path
      const { stdout: statusOutput } = await execAsync(`git diff --cached --name-only`, { cwd: projectRoot });

      const commitMsg = `deploy: sync ${vendor.slug} storefront`;

      if (statusOutput.trim()) {
        // There are actual changes - commit them
        try {
          await execAsync(`git commit -m "${commitMsg}"`, { cwd: projectRoot });
          console.log('🚀 Pushing to main...');
          await execAsync('git push origin main', { cwd: projectRoot });
          console.log('✅ Pushed - Vercel will auto-deploy');
        } catch (commitError: any) {
          console.log('⚠️  Commit/push failed:', commitError.message);
          throw commitError;
        }
      } else {
        // No changes, but force a rebuild with an empty commit
        console.log('ℹ️  No changes detected - creating empty commit to trigger rebuild');
        try {
          await execAsync(`git commit --allow-empty -m "${commitMsg} (rebuild)"`, { cwd: projectRoot });
          console.log('🚀 Pushing to main...');
          await execAsync('git push origin main', { cwd: projectRoot });
          console.log('✅ Pushed - Vercel will auto-deploy');
        } catch (commitError: any) {
          console.log('⚠️  Empty commit/push failed:', commitError.message);
          throw commitError;
        }
      }

      // Clean up
      await fs.rm(tempClonePath, { recursive: true, force: true });

      // Update vendor status
      await supabase
        .from('vendors')
        .update({
          deployment_status: 'ready',
          last_deployment_at: new Date().toISOString(),
        })
        .eq('id', vendorId);

      return NextResponse.json({
        success: true,
        message: 'Synced to main branch - check Vercel for deployment status',
        vercelUrl: 'https://vercel.com/floradistros-projects',
      });
    } catch (error: any) {
      // Clean up on error
      try {
        await fs.rm(tempClonePath, { recursive: true, force: true });
      } catch {}

      throw error;
    }
  } catch (error: any) {
    console.error('Sync error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to sync',
      },
      { status: 500 }
    );
  }
}
