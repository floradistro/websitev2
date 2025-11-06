import { NextRequest, NextResponse } from 'next/server';
import { requireVendor } from '@/lib/auth/middleware';

/**
 * POST /api/vendor/website/sync-and-deploy
 *
 * ⚠️  DEPRECATED - DO NOT USE
 *
 * This endpoint was part of the old multi-tenant monorepo architecture where
 * vendor code was synced into the main app repo. This caused:
 * - Vendor code breaking platform builds
 * - Security issues (vendors inject code into platform)
 * - Deployment coupling (one vendor breaks everyone)
 * - Git pollution (vendor code committed to main branch)
 *
 * NEW ARCHITECTURE:
 * Each vendor gets their own isolated Vercel project.
 * Use: POST /api/vendor/website/create-vercel-project
 *
 * Benefits:
 * ✅ Complete isolation - vendor bugs don't affect platform
 * ✅ Independent deployments - push to your repo triggers your deploy
 * ✅ Scalable - works for 10 or 10,000 vendors
 * ✅ Secure - vendor code never touches platform code
 */
export async function POST(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  return NextResponse.json(
    {
      error: 'This endpoint is deprecated',
      message: 'The monorepo sync architecture has been replaced with separate Vercel projects',
      migration: {
        oldFlow: 'Sync vendor code → Commit to main → Deploy entire platform',
        newFlow: 'Push to your repo → Deploy only your project',
        action: 'Use POST /api/vendor/website/create-vercel-project to create your isolated project',
      },
      documentation: 'See docs for the new separate projects architecture'
    },
    { status: 410 } // 410 Gone - resource permanently removed
  );
}

/**
 * ORIGINAL IMPLEMENTATION - KEPT FOR REFERENCE ONLY
 *
 * This is what we're moving away from. Do not restore this code.
 */
/*
export async function POST_OLD_DO_NOT_USE(request: NextRequest) {
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
*/
