import { NextRequest, NextResponse } from "next/server";
import { withVendorAuth } from "@/lib/api/route-wrapper";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * POST /api/vendor/media/analyze-references
 * Analyze reference images to extract style description for AI generation
 */
export const POST = withVendorAuth(async (request: NextRequest, { vendorId }) => {
  const body = await request.json();
  const { imageUrls, weights } = body as { imageUrls: string[]; weights: number[] };

  if (!imageUrls || imageUrls.length === 0) {
    return NextResponse.json({ success: false, error: "No images provided" }, { status: 400 });
  }

  try {
    // Build the messages array with multiple images
    const imageMessages = imageUrls.map((url, index) => ({
      type: "image_url" as const,
      image_url: {
        url,
        detail: "high" as const,
      },
    }));

    // Create weight descriptions
    const weightDescriptions = weights
      .map((w, i) => `Image ${i + 1}: ${w}% influence`)
      .join(", ");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a professional art director analyzing reference images for AI image generation.

Analyze these ${imageUrls.length} reference image(s) and create a detailed style description that can be used to guide AI image generation.

Reference weights: ${weightDescriptions}

Focus on:
1. **Art Style** - Is it realistic, illustrated, abstract, minimalist, maximalist, etc?
2. **Color Palette** - Dominant colors, saturation levels, color harmony
3. **Composition** - Layout, balance, focal points, negative space
4. **Lighting & Mood** - Bright/dark, dramatic/subtle, warm/cool tones
5. **Texture & Details** - Smooth, rough, detailed, simplified
6. **Visual Elements** - Patterns, shapes, typography style if any

Create a concise prompt addition (2-3 sentences max) that captures the essence of these references.
Start with "Match the style of the reference images:" and describe the key visual characteristics.

Make it specific enough to guide generation but flexible enough to work with different subjects.`,
            },
            ...imageMessages,
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const styleDescription = response.choices[0]?.message?.content?.trim() || "";

    return {
      success: true,
      styleDescription,
    };
  } catch (error) {
    console.error("Error analyzing references:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze reference images" },
      { status: 500 },
    );
  }
});
