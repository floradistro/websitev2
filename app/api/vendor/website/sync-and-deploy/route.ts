import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";

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
      error: "This endpoint is deprecated",
      message: "The monorepo sync architecture has been replaced with separate Vercel projects",
      migration: {
        oldFlow: "Sync vendor code → Commit to main → Deploy entire platform",
        newFlow: "Push to your repo → Deploy only your project",
        action:
          "Use POST /api/vendor/website/create-vercel-project to create your isolated project",
      },
      documentation: "See docs for the new separate projects architecture",
    },
    { status: 410 }, // 410 Gone - resource permanently removed
  );
}
