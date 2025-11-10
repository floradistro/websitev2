import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    const { vendorId } = authResult;

    const body = await request.json();
    const { files = [], concurrency = 30 } = body;

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "Files array required" }), {
        status: 400,
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          send({ type: "start", total: files.length });

          const chunks = [];
          for (let i = 0; i < files.length; i += concurrency) {
            chunks.push(files.slice(i, i + concurrency));
          }

          let completedCount = 0;

          for (const chunk of chunks) {
            const promises = chunk.map(async (file: any) => {
              const startTime = Date.now();
              send({
                type: "processing",
                fileName: file.name,
                status: "processing",
              });

              try {
                // Upload to Cloudinary (just store the image first)
                const uploadResult = await cloudinary.uploader.upload(file.url, {
                  folder: `vendors/${vendorId}`,
                  public_id: file.name.replace(/\.[^/.]+$/, ""),
                  overwrite: true,
                  invalidate: true,
                });

                // Build TRANSFORMED URL with aggressive enhancements
                const transformedUrl = cloudinary.url(uploadResult.public_id, {
                  transformation: [
                    { effect: "improve:outdoor:50" },
                    { effect: "auto_color:80" },
                    { effect: "auto_brightness:80" },
                    { effect: "auto_contrast:80" },
                    { effect: "vibrance:30" },
                    { effect: "sharpen:100" },
                    { quality: "auto:best" },
                    { fetch_format: "png" },
                  ],
                  secure: true,
                });

                // Download ENHANCED image
                const enhancedResponse = await axios.get(transformedUrl, {
                  responseType: "arraybuffer",
                });

                const supabase = getServiceSupabase();

                // Upload enhanced version
                const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                const newFileName = `${fileNameWithoutExt}.png`;
                const finalPath = `${vendorId}/${newFileName}`;

                await supabase.storage
                  .from("vendor-product-images")
                  .upload(finalPath, Buffer.from(enhancedResponse.data), {
                    contentType: "image/png",
                    cacheControl: "3600",
                    upsert: true,
                  });

                // Delete original if different
                if (file.name !== newFileName) {
                  await supabase.storage
                    .from("vendor-product-images")
                    .remove([`${vendorId}/${file.name}`]);
                }

                const {
                  data: { publicUrl },
                } = supabase.storage.from("vendor-product-images").getPublicUrl(finalPath);

                const endTime = Date.now();
                completedCount++;

                send({
                  type: "success",
                  fileName: file.name,
                  status: "success",
                  url: publicUrl,
                  duration: endTime - startTime,
                  completed: completedCount,
                  total: files.length,
                });
              } catch (error: any) {
                completedCount++;
                send({
                  type: "error",
                  fileName: file.name,
                  status: "error",
                  error: error.message,
                  completed: completedCount,
                  total: files.length,
                });
              }
            });

            await Promise.all(promises);

            if (chunks.indexOf(chunk) < chunks.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 100)); // Minimal delay
            }
          }

          send({
            type: "complete",
            completed: completedCount,
            total: files.length,
          });
          controller.close();
        } catch (error: any) {
          send({ type: "error", error: error.message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
