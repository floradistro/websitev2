import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import OpenAI from 'openai';

// Lazy-load OpenAI client to avoid build-time errors
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }
  return openai;
}

// Helper: AI auto-tag image with GPT-4 Vision
async function analyzeImageWithAI(imageUrl: string) {
  try {
    console.log('🔍 Analyzing image with GPT-4 Vision...');

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image and return ONLY a JSON object with this exact structure:
{
  "category": "product_photos" | "marketing" | "menus" | "brand",
  "tags": ["tag1", "tag2", "tag3"],
  "description": "Brief description",
  "colors": ["#hex1", "#hex2", "#hex3"],
  "quality_score": 1-100,
  "detected_content": {
    "has_text": boolean,
    "has_product": boolean,
    "has_logo": boolean,
    "has_people": boolean,
    "style": "photo" | "graphic" | "illustration"
  }
}

Categories:
- "product_photos": Product photography, cannabis flowers, edibles, etc.
- "marketing": Promotional graphics, social media content, flyers
- "menus": Menu boards, price lists, category headers
- "brand": Logos, brand elements, templates

Respond with ONLY the JSON, no other text.`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const analysis = JSON.parse(jsonMatch[0]);
    console.log('✅ AI Analysis complete:', analysis);

    return analysis;
  } catch (error: any) {
    console.error('❌ AI analysis error:', error.message);
    return null;
  }
}

// GET - List all vendor images with metadata
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const productId = searchParams.get('productId');

    const supabase = getServiceSupabase();

    // Build query
    let query = supabase
      .from('vendor_media')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (tag) {
      query = query.contains('ai_tags', [tag]);
    }

    if (search) {
      query = query.or(`file_name.ilike.%${search}%,ai_description.ilike.%${search}%,title.ilike.%${search}%`);
    }

    if (productId) {
      query = query.contains('linked_product_ids', [productId]);
    }

    const { data: files, error } = await query;

    if (error) {
      console.error('❌ Error listing files:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get smart collections stats
    const { data: stats } = await supabase
      .from('vendor_media_smart_collections')
      .select('*')
      .eq('vendor_id', vendorId);

    return NextResponse.json({
      success: true,
      files: files || [],
      count: files?.length || 0,
      smart_collections: stats?.[0] || null
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Upload new image with AI auto-tagging
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'product_photos';
    const skipAI = formData.get('skipAI') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
      }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 10MB.'
      }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${vendorId}/${sanitizedName}`;

    // Check if file already exists in database
    const { data: existingMedia } = await supabase
      .from('vendor_media')
      .select('file_name')
      .eq('vendor_id', vendorId)
      .eq('file_name', sanitizedName)
      .single();

    // Generate unique filename if exists
    let finalFileName = sanitizedName;
    let finalFilePath = filePath;

    if (existingMedia) {
      const fileNameWithoutExt = sanitizedName.replace(/\.[^/.]+$/, '');
      const fileExt = sanitizedName.split('.').pop();
      const timestamp = Date.now();
      finalFileName = `${fileNameWithoutExt}-${timestamp}.${fileExt}`;
      finalFilePath = `${vendorId}/${finalFileName}`;
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vendor-product-images')
      .upload(finalFilePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vendor-product-images')
      .getPublicUrl(finalFilePath);

    // AI Analysis (optional, can be skipped for speed)
    let aiAnalysis = null;
    if (!skipAI) {
      aiAnalysis = await analyzeImageWithAI(publicUrl);
    }

    // Save to database with metadata
    const { data: mediaRecord, error: dbError } = await supabase
      .from('vendor_media')
      .insert({
        vendor_id: vendorId,
        file_name: finalFileName,
        file_path: finalFilePath,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        category: aiAnalysis?.category || category,
        ai_tags: aiAnalysis?.tags || [],
        ai_description: aiAnalysis?.description,
        dominant_colors: aiAnalysis?.colors || [],
        detected_content: aiAnalysis?.detected_content || {},
        quality_score: aiAnalysis?.quality_score,
        status: 'active'
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      // Still return success since file was uploaded
      return NextResponse.json({
        success: true,
        warning: 'File uploaded but metadata save failed',
        file: {
          name: finalFileName,
          url: publicUrl,
          size: file.size,
          type: file.type,
          category: category
        }
      });
    }

    console.log('✅ Media uploaded and tagged:', finalFileName);

    return NextResponse.json({
      success: true,
      file: mediaRecord,
      ai_analysis: aiAnalysis ? {
        category_detected: aiAnalysis.category,
        tags: aiAnalysis.tags,
        quality: aiAnalysis.quality_score
      } : null
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update media metadata
export async function PATCH(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, category, custom_tags, title, alt_text, notes, linked_product_ids } = body;

    if (!id) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const updateData: any = {};
    if (category) updateData.category = category;
    if (custom_tags) updateData.custom_tags = custom_tags;
    if (title !== undefined) updateData.title = title;
    if (alt_text !== undefined) updateData.alt_text = alt_text;
    if (notes !== undefined) updateData.notes = notes;
    if (linked_product_ids) updateData.linked_product_ids = linked_product_ids;

    const { data, error } = await supabase
      .from('vendor_media')
      .update(updateData)
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      file: data
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete image
export async function DELETE(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const fileName = searchParams.get('file');

    if (!id && !fileName) {
      return NextResponse.json({ error: 'Media ID or file name required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get file info from database
    let query = supabase
      .from('vendor_media')
      .select('*')
      .eq('vendor_id', vendorId);

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('file_name', fileName);
    }

    const { data: mediaFile, error: fetchError } = await query.single();

    if (fetchError || !mediaFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('vendor-product-images')
      .remove([mediaFile.file_path]);

    if (storageError) {
      console.error('❌ Storage delete error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('vendor_media')
      .delete()
      .eq('id', mediaFile.id);

    if (dbError) {
      console.error('❌ Database delete error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
