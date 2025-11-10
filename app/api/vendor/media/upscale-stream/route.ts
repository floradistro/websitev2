import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import axios from "axios";
import sharp from "sharp";

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || "";
const REAL_ESRGAN_MODEL =
  "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";
const MAX_INPUT_PIXELS = 2000000;

async function pollPrediction(predictionId: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        Authorization: `Token ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const prediction = response.data;

    if (prediction.status === "succeeded") {
      return prediction;
    } else if (prediction.status === "failed") {
      throw new Error(prediction.error || "Upscaling failed");
    } else if (prediction.status === "canceled") {
      throw new Error("Upscaling was canceled");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Upscaling timeout");
}

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
    const { files, scale = 4, concurrency = 20 } = body;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          send({ type: "start", total: files.length });

          // Process files with concurrency
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
                // Download and check size
                const originalImageResponse = await axios.get(file.url, {
                  responseType: "arraybuffer",
                });

                const imageBuffer = Buffer.from(originalImageResponse.data);
                const metadata = await sharp(imageBuffer).metadata();
                const totalPixels = (metadata.width || 0) * (metadata.height || 0);

                let processImageUrl = file.url;
                let tempPath = null;

                // Resize if needed
                if (totalPixels > MAX_INPUT_PIXELS) {
                  const scaleFactor = Math.sqrt(MAX_INPUT_PIXELS / totalPixels);
                  const newWidth = Math.floor((metadata.width || 0) * scaleFactor);
                  const newHeight = Math.floor((metadata.height || 0) * scaleFactor);

                  send({
                    type: "info",
                    fileName: file.name,
                    message: `Resizing ${metadata.width}x${metadata.height} → ${newWidth}x${newHeight}`,
                  });

                  const resizedBuffer = await sharp(imageBuffer)
                    .resize(newWidth, newHeight, { fit: "inside" })
                    .png()
                    .toBuffer();

                  const supabase = getServiceSupabase();
                  const tempFileName = `temp-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                  tempPath = `${vendorId}/${tempFileName}`;

                  await supabase.storage
                    .from("vendor-product-images")
                    .upload(tempPath, resizedBuffer, {
                      contentType: "image/png",
                      cacheControl: "60",
                      upsert: true,
                    });

                  const {
                    data: { publicUrl },
                  } = supabase.storage.from("vendor-product-images").getPublicUrl(tempPath);

                  processImageUrl = publicUrl;
                }

                // Start upscaling
                send({
                  type: "info",
                  fileName: file.name,
                  message: "Starting AI upscale...",
                });

                const predictionResponse = await axios.post(
                  "https://api.replicate.com/v1/predictions",
                  {
                    version: REAL_ESRGAN_MODEL.split(":")[1],
                    input: {
                      image: processImageUrl,
                      scale: scale,
                      face_enhance: false,
                    },
                  },
                  {
                    headers: {
                      Authorization: `Token ${REPLICATE_API_KEY}`,
                      "Content-Type": "application/json",
                    },
                  },
                );

                // Poll for result
                const prediction = await pollPrediction(predictionResponse.data.id);

                if (!prediction.output) {
                  throw new Error("No output");
                }

                // Download result
                const upscaledResponse = await axios.get(prediction.output, {
                  responseType: "arraybuffer",
                });

                const supabase = getServiceSupabase();

                // Check upscaled dimensions
                const upscaledBuffer = Buffer.from(upscaledResponse.data);
                const upscaledMetadata = await sharp(upscaledBuffer).metadata();

                // Upload upscaled FIRST (before deleting anything)
                const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                const newFileName = `${fileNameWithoutExt}.png`;
                const finalPath = `${vendorId}/${newFileName}`;

                await supabase.storage
                  .from("vendor-product-images")
                  .upload(finalPath, upscaledBuffer, {
                    contentType: "image/png",
                    cacheControl: "3600",
                    upsert: true,
                  });

                // Clean temp file AFTER successful upload
                if (tempPath) {
                  await supabase.storage.from("vendor-product-images").remove([tempPath]);
                }

                // Delete original ONLY if different from new name
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
