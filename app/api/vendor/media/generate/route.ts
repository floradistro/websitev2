import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServiceSupabase } from '@/lib/supabase/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/vendor/media/generate
 * Generate an image with DALL-E and save to vendor's media library
 */
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    console.log('🎨 Generating image with DALL-E:', { prompt, size, quality, style });

    // Generate image with DALL-E
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: size as '1024x1024' | '1024x1792' | '1792x1024',
      quality: quality as 'standard' | 'hd',
      style: style as 'vivid' | 'natural',
    });

    const imageData = response.data?.[0];
    if (!imageData?.url) {
      throw new Error('No image URL returned from DALL-E');
    }

    const imageUrl = imageData.url;
    console.log('✅ DALL-E image generated:', imageUrl);

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });

    // Generate filename
    const timestamp = Date.now();
    const sanitizedPrompt = prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 50);
    const fileName = `dalle-${sanitizedPrompt}-${timestamp}.png`;

    console.log('💾 Saving to Supabase:', fileName);

    // Upload to Supabase
    const supabase = getServiceSupabase();
    const filePath = `${vendorId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vendor-product-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('vendor-product-images')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    console.log('✅ Image saved to media library:', publicUrl);

    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        url: publicUrl,
        size: imageBlob.size,
        type: 'image/png',
        generated: true,
        prompt,
        revised_prompt: imageData?.revised_prompt,
      },
    });
  } catch (error: any) {
    console.error('❌ DALL-E generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
