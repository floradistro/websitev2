import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
/**
 * GET /api/preview/[appId] - Serve live preview of app files
 * This returns HTML that loads the app's files from the database and renders them
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  try {
    const { appId } = await params;
    const supabase = getServiceSupabase();

    // Get all files for this app
    const { data: files, error } = await supabase
      .from("app_files")
      .select("filepath, content")
      .eq("app_id", appId)
      .order("filepath");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Find the page.tsx content
    const pageFile = files?.find((f) => f.filepath === "app/page.tsx");
    const layoutFile = files?.find((f) => f.filepath === "app/layout.tsx");
    const globalsFile = files?.find((f) => f.filepath === "app/globals.css");

    if (!pageFile) {
      return new NextResponse(
        `<html><body style="margin:0;padding:40px;font-family:system-ui">
          <div style="max-width:600px;margin:0 auto;text-align:center">
            <h1 style="color:#666">No Preview Available</h1>
            <p style="color:#999">App has no page.tsx file yet</p>
          </div>
        </body></html>`,
        { headers: { "Content-Type": "text/html" } },
      );
    }

    // Create a preview HTML page that renders the React component
    // This is a simplified preview - full Next.js features may not work
    const previewHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Live Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  ${globalsFile ? `<style>${globalsFile.content}</style>` : ""}
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    // Convert the page content to JSX
    ${pageFile.content.replace(/^export default /m, "// Removed: export default ")}

    // Render the page
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<HomePage />);
  </script>
</body>
</html>`;

    return new NextResponse(previewHtml, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Preview error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
