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

// Helper: AI analyze image
async function analyzeImageWithAI(imageUrl: string) {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image and return ONLY a JSON object:
{
  "category": "product_photos" | "marketing" | "menus" | "brand",
  "tags": ["tag1", "tag2"],
  "description": "Brief description",
  "colors": ["#hex1", "#hex2"],
  "quality_score": 1-100
}

Respond with ONLY the JSON.`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'low' }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('AI analysis error:', error.message);
    return null;
  }
}

/**
 * POST /api/vendor/media/migrate
 * Migrate existing storage files to vendor_media database
 */
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enableAI = false, batchSize = 5 } = body;

    const supabase = getServiceSupabase();

    console.log(`🔄 Starting migration for vendor: ${vendorId}`);

    // 1. Get all files from storage
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('vendor-product-images')
      .list(vendorId, {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (storageError) {
      throw new Error(`Storage error: ${storageError.message}`);
    }

    if (!storageFiles || storageFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files to migrate',
        migrated: 0
      });
    }

    console.log(`📦 Found ${storageFiles.length} files in storage`);

    // 2. Check which files already exist in database
    const { data: existingRecords } = await supabase
      .from('vendor_media')
      .select('file_name')
      .eq('vendor_id', vendorId);

    const existingFileNames = new Set(existingRecords?.map(r => r.file_name) || []);

    // 3. Filter files that need migration
    const filesToMigrate = storageFiles.filter(f => !existingFileNames.has(f.name));

    console.log(`🔄 Need to migrate: ${filesToMigrate.length} files`);
    console.log(`✅ Already migrated: ${existingFileNames.size} files`);

    if (filesToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All files already migrated',
        migrated: 0,
        skipped: existingFileNames.size
      });
    }

    // 4. Get products to check for existing image associations
    const { data: products } = await supabase
      .from('products')
      .select('id, featured_image, image_gallery')
      .eq('vendor_id', vendorId);

    // Build file-to-product mapping
    const fileToProductMap = new Map<string, string[]>();
    products?.forEach(product => {
      // Check featured image
      if (product.featured_image) {
        const fileName = product.featured_image.split('/').pop();
        if (fileName) {
          if (!fileToProductMap.has(fileName)) {
            fileToProductMap.set(fileName, []);
          }
          fileToProductMap.get(fileName)!.push(product.id);
        }
      }

      // Check gallery images
      if (Array.isArray(product.image_gallery)) {
        product.image_gallery.forEach((imgUrl: string) => {
          const fileName = imgUrl.split('/').pop();
          if (fileName) {
            if (!fileToProductMap.has(fileName)) {
              fileToProductMap.set(fileName, []);
            }
            fileToProductMap.get(fileName)!.push(product.id);
          }
        });
      }
    });

    console.log(`🔗 Found ${fileToProductMap.size} files linked to products`);

    // 5. Migrate files in batches
    const results = {
      migrated: 0,
      failed: 0,
      aiAnalyzed: 0,
      linkedToProducts: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < filesToMigrate.length; i += batchSize) {
      const batch = filesToMigrate.slice(i, i + batchSize);

      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(filesToMigrate.length / batchSize)}`);

      for (const file of batch) {
        try {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('vendor-product-images')
            .getPublicUrl(`${vendorId}/${file.name}`);

          // Check if linked to products
          const linkedProductIds = fileToProductMap.get(file.name) || [];

          // Determine category based on filename patterns
          let category = 'product_photos';
          const fileName = file.name.toLowerCase();
          if (fileName.includes('logo') || fileName.includes('brand')) {
            category = 'brand';
          } else if (fileName.includes('flyer') || fileName.includes('promo') || fileName.includes('social')) {
            category = 'marketing';
          } else if (fileName.includes('menu') || fileName.includes('board')) {
            category = 'menus';
          }

          // AI analysis (optional, can be slow)
          let aiAnalysis = null;
          if (enableAI) {
            aiAnalysis = await analyzeImageWithAI(publicUrl);
            if (aiAnalysis) {
              results.aiAnalyzed++;
              category = aiAnalysis.category || category;
            }
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Insert into database
          const { error: insertError } = await supabase
            .from('vendor_media')
            .insert({
              vendor_id: vendorId,
              file_name: file.name,
              file_path: `${vendorId}/${file.name}`,
              file_url: publicUrl,
              file_size: file.metadata?.size || 0,
              file_type: file.metadata?.mimetype || 'image/jpeg',
              category: category,
              ai_tags: aiAnalysis?.tags || [],
              ai_description: aiAnalysis?.description,
              dominant_colors: aiAnalysis?.colors || [],
              quality_score: aiAnalysis?.quality_score,
              linked_product_ids: linkedProductIds,
              status: 'active',
              created_at: file.created_at,
              updated_at: file.updated_at
            });

          if (insertError) {
            console.error(`❌ Failed to migrate ${file.name}:`, insertError.message);
            results.failed++;
            results.errors.push(`${file.name}: ${insertError.message}`);
          } else {
            results.migrated++;
            if (linkedProductIds.length > 0) {
              results.linkedToProducts++;
              console.log(`✅ Migrated ${file.name} (linked to ${linkedProductIds.length} products)`);
            } else {
              console.log(`✅ Migrated ${file.name}`);
            }
          }

        } catch (error: any) {
          console.error(`❌ Error migrating ${file.name}:`, error.message);
          results.failed++;
          results.errors.push(`${file.name}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Migration complete!');
    console.log(`   Migrated: ${results.migrated}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   AI Analyzed: ${results.aiAnalyzed}`);
    console.log(`   Linked to Products: ${results.linkedToProducts}`);

    return NextResponse.json({
      success: true,
      ...results,
      total_files: storageFiles.length,
      already_migrated: existingFileNames.size
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
