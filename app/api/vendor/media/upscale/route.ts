import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import axios from 'axios';
import sharp from 'sharp';

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || '';

// Real-ESRGAN model for 4x upscaling  
const REAL_ESRGAN_MODEL = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b';

// GPU memory limit: ~2MP max input (1448x1448 px)
const MAX_INPUT_PIXELS = 2000000; // 2 megapixels safe limit

// Poll prediction status
async function pollPrediction(predictionId: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const prediction = response.data;

    if (prediction.status === 'succeeded') {
      return prediction;
    } else if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Upscaling failed');
    } else if (prediction.status === 'canceled') {
      throw new Error('Upscaling was canceled');
    }

    // Still processing, wait and retry
    await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
  }

  throw new Error('Upscaling timeout - processing took too long');
}

// Single image upscaling
export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { imageUrl, fileName, scale = 4 } = body; // Default 4x upscaling
    
    if (!imageUrl || !fileName) {
      return NextResponse.json({ 
        error: 'Image URL and filename required' 
      }, { status: 400 });
    }
    
    console.log(`🔵 Upscaling ${fileName} by ${scale}x using Real-ESRGAN...`);
    
    // Download original image first to check/resize if needed
    const originalImageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    
    // Check image dimensions
    const imageBuffer = Buffer.from(originalImageResponse.data);
    const metadata = await sharp(imageBuffer).metadata();
    
    const totalPixels = (metadata.width || 0) * (metadata.height || 0);
    console.log(`📐 Original: ${metadata.width}x${metadata.height} (${(totalPixels / 1000000).toFixed(1)}MP)`);
    
    let processImageUrl = imageUrl;
    
    // If image is too large, resize it first
    if (totalPixels > MAX_INPUT_PIXELS) {
      const scaleFactor = Math.sqrt(MAX_INPUT_PIXELS / totalPixels);
      const newWidth = Math.floor((metadata.width || 0) * scaleFactor);
      const newHeight = Math.floor((metadata.height || 0) * scaleFactor);
      
      console.log(`⚠️ Image too large! Resizing to ${newWidth}x${newHeight} before upscaling...`);
      
      // Resize image
      const resizedBuffer = await sharp(imageBuffer)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
      
      // Upload resized version temporarily
      const supabase = getServiceSupabase();
      const tempFileName = `temp-resize-${Date.now()}.png`;
      const tempPath = `${vendorId}/${tempFileName}`;
      
      await supabase.storage
        .from('vendor-product-images')
        .upload(tempPath, resizedBuffer, {
          contentType: 'image/png',
          cacheControl: '60',
          upsert: true
        });
      
      const { data: { publicUrl } } = supabase.storage
        .from('vendor-product-images')
        .getPublicUrl(tempPath);
      
      processImageUrl = publicUrl;
      console.log(`✅ Resized temp image ready for upscaling`);
    }
    
    // Start Replicate prediction with (possibly resized) image
    const predictionResponse = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: REAL_ESRGAN_MODEL.split(':')[1],
        input: {
          image: processImageUrl,
          scale: scale, // 2 or 4
          face_enhance: false,
        },
      },
      {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const predictionId = predictionResponse.data.id;
    console.log(`⏳ Prediction started: ${predictionId}`);
    
    // Poll for completion
    const prediction = await pollPrediction(predictionId);
    
    if (!prediction.output) {
      throw new Error('No output from upscaling');
    }
    
    const upscaledImageUrl = prediction.output;
    console.log(`✅ Upscaling complete: ${upscaledImageUrl}`);
    
    // Download upscaled image
    const imageResponse = await axios.get(upscaledImageUrl, {
      responseType: 'arraybuffer',
    });
    
    const supabase = getServiceSupabase();
    
    // Clean up temp file if we created one
    if (processImageUrl !== imageUrl) {
      const tempPath = processImageUrl.split('/vendor-product-images/')[1];
      if (tempPath) {
        await supabase.storage
          .from('vendor-product-images')
          .remove([tempPath]);
        console.log(`🗑️ Deleted temp resize file`);
      }
    }
    
    // Delete original file (SAME AS REMOVE.BG)
    const originalFilePath = `${vendorId}/${fileName}`;
    await supabase.storage
      .from('vendor-product-images')
      .remove([originalFilePath]);
    
    console.log(`🗑️ Deleted original: ${fileName}`);
    
    // Upload upscaled version with same filename
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const newFileName = `${fileNameWithoutExt}.png`; // Keep same name
    const filePath = `${vendorId}/${newFileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('vendor-product-images')
      .upload(filePath, Buffer.from(imageResponse.data), {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('vendor-product-images')
      .getPublicUrl(filePath);
    
    console.log(`✅ Replaced with ${scale}x upscaled version: ${newFileName}`);
    
    return NextResponse.json({
      success: true,
      file: {
        name: newFileName,
        url: publicUrl,
        scale: scale,
        originalFileName: fileName
      }
    });
    
  } catch (error: any) {
    console.error('❌ Upscale error:', error.response?.data || error.message);
    return NextResponse.json({ 
      error: error.message || 'Failed to upscale image'
    }, { status: 500 });
  }
}

// Bulk upscaling with parallel processing
export async function PUT(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { files, scale = 4, concurrency = 20 } = body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ 
        error: 'Files array required' 
      }, { status: 400 });
    }
    
    console.log(`🔵 Bulk upscaling ${files.length} images by ${scale}x`);
    console.log(`⚡ Concurrency: ${concurrency} (Replicate has no rate limits)`);
    
    const results: any[] = [];
    const errors: any[] = [];
    
    // Process in chunks (Replicate can handle high concurrency)
    const chunks = [];
    for (let i = 0; i < files.length; i += concurrency) {
      chunks.push(files.slice(i, i + concurrency));
    }
    
    for (const chunk of chunks) {
      // Start all predictions in parallel
      const predictionPromises = chunk.map(async (file) => {
        try {
          // Download and check image size
          const originalImageResponse = await axios.get(file.url, {
            responseType: 'arraybuffer',
          });
          
          const imageBuffer = Buffer.from(originalImageResponse.data);
          const metadata = await sharp(imageBuffer).metadata();
          const totalPixels = (metadata.width || 0) * (metadata.height || 0);
          
          let processImageUrl = file.url;
          
          // Resize if too large
          if (totalPixels > MAX_INPUT_PIXELS) {
            const scaleFactor = Math.sqrt(MAX_INPUT_PIXELS / totalPixels);
            const newWidth = Math.floor((metadata.width || 0) * scaleFactor);
            const newHeight = Math.floor((metadata.height || 0) * scaleFactor);
            
            console.log(`⚠️ ${file.name} too large (${metadata.width}x${metadata.height}). Resizing to ${newWidth}x${newHeight}...`);
            
            const resizedBuffer = await sharp(imageBuffer)
              .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
              .png()
              .toBuffer();
            
            const supabase = getServiceSupabase();
            const tempFileName = `temp-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const tempPath = `${vendorId}/${tempFileName}`;
            
            await supabase.storage
              .from('vendor-product-images')
              .upload(tempPath, resizedBuffer, {
                contentType: 'image/png',
                cacheControl: '60',
                upsert: true
              });
            
            const { data: { publicUrl } } = supabase.storage
              .from('vendor-product-images')
              .getPublicUrl(tempPath);
            
            processImageUrl = publicUrl;
            console.log(`✅ Temp resize ready for ${file.name}: ${processImageUrl}`);
          }
          
          console.log(`🚀 Starting prediction for ${file.name} using: ${processImageUrl}`);
          
          const predictionResponse = await axios.post(
            'https://api.replicate.com/v1/predictions',
            {
              version: REAL_ESRGAN_MODEL.split(':')[1],
              input: {
                image: processImageUrl,
                scale: scale,
                face_enhance: false,
              },
            },
            {
              headers: {
                'Authorization': `Token ${REPLICATE_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          // Extract just the filename from the full URL for temp cleanup
          let extractedTempPath = null;
          if (processImageUrl !== file.url) {
            const urlParts = processImageUrl.split('/');
            const tempFileName = urlParts[urlParts.length - 1];
            extractedTempPath = `${vendorId}/${tempFileName}`;
          }
          
          return {
            file,
            predictionId: predictionResponse.data.id,
            processImageUrl,
            tempPath: extractedTempPath,
            wasResized: processImageUrl !== file.url
          };
        } catch (error: any) {
          throw new Error(`Failed to start prediction for ${file.name}: ${error.message}`);
        }
      });
      
      const predictions = await Promise.allSettled(predictionPromises);
      
      // Poll all predictions in parallel
      const completionPromises = predictions.map(async (p, index) => {
        if (p.status === 'rejected') {
          return { success: false, file: chunk[index], error: p.reason.message };
        }
        
        try {
          const prediction = await pollPrediction(p.value.predictionId);
          
          if (!prediction.output) {
            throw new Error('No output');
          }
          
          // Download upscaled image
          const imageResponse = await axios.get(prediction.output, {
            responseType: 'arraybuffer',
          });
          
          const supabase = getServiceSupabase();
          
          // Clean up temp file if one was created
          if (p.value.tempPath) {
            try {
              await supabase.storage
                .from('vendor-product-images')
                .remove([p.value.tempPath]);
              console.log(`🗑️ Cleaned temp file for ${p.value.file.name}`);
            } catch (cleanupError) {
              console.log(`⚠️ Temp cleanup skip`);
            }
          }
          
          // Delete original (SAME AS REMOVE.BG RULE)
          const originalFilePath = `${vendorId}/${p.value.file.name}`;
          await supabase.storage
            .from('vendor-product-images')
            .remove([originalFilePath]);
          
          console.log(`🗑️ Deleted original: ${p.value.file.name}`);
          
          // Upload upscaled with same name (SAME AS REMOVE.BG RULE)
          const fileNameWithoutExt = p.value.file.name.replace(/\.[^/.]+$/, '');
          const newFileName = `${fileNameWithoutExt}.png`;
          const filePath = `${vendorId}/${newFileName}`;
          
          await supabase.storage
            .from('vendor-product-images')
            .upload(filePath, Buffer.from(imageResponse.data), {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: true
            });
          
          const { data: { publicUrl } } = supabase.storage
            .from('vendor-product-images')
            .getPublicUrl(filePath);
          
          console.log(`✅ Successfully upscaled and replaced: ${newFileName}`);
          
          return {
            success: true,
            file: p.value.file,
            result: {
              originalName: p.value.file.name,
              newName: newFileName,
              url: publicUrl,
            },
          };
        } catch (error: any) {
          console.error(`❌ Upscale failed for ${chunk[index].name}:`, error.message);
          return {
            success: false,
            file: chunk[index],
            error: error.message,
          };
        }
      });
      
      const completed = await Promise.allSettled(completionPromises);
      
      completed.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.push(result.value.result);
          console.log(`✅ Upscaled: ${result.value.file.name}`);
        } else {
          const file = result.status === 'fulfilled' ? result.value.file : chunk[index];
          const errorMsg = result.status === 'fulfilled' ? result.value.error : result.reason?.message;
          errors.push({
            fileName: file.name,
            error: errorMsg,
          });
          console.error(`❌ Failed: ${file.name} - ${errorMsg}`);
        }
      });
      
      // Minimal delay between chunks (Replicate handles high throughput)
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Bulk upscaling complete: ${results.length} success, ${errors.length} failed`);
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors,
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

