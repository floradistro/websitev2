import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import FormData from "form-data";
import axios from "axios";
import { toError } from "@/lib/errors";

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || "";

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
    const { files, concurrency = 50 } = body;

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
                const formData = new FormData();
                formData.append("image_url", file.url);
                formData.append("size", "full");
                formData.append("format", "png");
                formData.append("type", "auto");
                formData.append("crop", "false");
                formData.append("scale", "original");

                const removeBgResponse = await axios({
                  method: "post",
                  url: "https://api.remove.bg/v1.0/removebg",
                  data: formData,
                  responseType: "arraybuffer",
                  headers: {
                    ...formData.getHeaders(),
                    "X-Api-Key": REMOVE_BG_API_KEY,
                  },
                  timeout: 90000,
                });

                const supabase = getServiceSupabase();

                // Delete original
                await supabase.storage
                  .from("vendor-product-images")
                  .remove([`${vendorId}/${file.name}`]);

                // Upload with same name
                const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                const newFileName = `${fileNameWithoutExt}.png`;
                const filePath = `${vendorId}/${newFileName}`;

                await supabase.storage
                  .from("vendor-product-images")
                  .upload(filePath, removeBgResponse.data, {
                    contentType: "image/png",
                    cacheControl: "3600",
                    upsert: true,
                  });

                const {
                  data: { publicUrl },
                } = supabase.storage.from("vendor-product-images").getPublicUrl(filePath);

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
              } catch (error) {
                const err = toError(error);
                completedCount++;
                send({
                  type: "error",
                  fileName: file.name,
                  status: "error",
                  error: err.message,
                  completed: completedCount,
                  total: files.length,
                });
              }
            });

            await Promise.all(promises);

            // Small delay between chunks
            if (chunks.indexOf(chunk) < chunks.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 250));
            }
          }

          send({
            type: "complete",
            completed: completedCount,
            total: files.length,
          });
          controller.close();
        } catch (error) {
          const err = toError(error);
          send({ type: "error", error: err.message });
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
  } catch (error) {
    const err = toError(error);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
