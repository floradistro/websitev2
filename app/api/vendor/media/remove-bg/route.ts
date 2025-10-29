import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import FormData from 'form-data';
import axios from 'axios';
import { removeBgRateLimiter } from '@/lib/rate-limiter-advanced';

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { imageUrl, fileName } = body;
    
    if (!imageUrl || !fileName) {
      return NextResponse.json({ 
        error: 'Image URL and filename required' 
      }, { status: 400 });
    }
    
    console.log('🔵 Removing background for:', fileName);
    
    // Call remove.bg API
    const formData = new FormData();
    formData.append('image_url', imageUrl);
    formData.append('size', 'auto');
    
    const removeBgResponse = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      data: formData,
      responseType: 'arraybuffer',
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      timeout: 60000, // 60 second timeout
    });
    
    console.log('✅ Background removed successfully');

    const supabase = getServiceSupabase();

    // Upload with "-no-bg" suffix to create NEW file (keep original)
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const newFileName = `${fileNameWithoutExt}-no-bg.png`;
    const filePath = `${vendorId}/${newFileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vendor-product-images')
      .upload(filePath, removeBgResponse.data, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vendor-product-images')
      .getPublicUrl(filePath);
    
    console.log('✅ Created:', newFileName);
    
    return NextResponse.json({
      success: true,
      file: {
        name: newFileName,
        url: publicUrl,
        originalFileName: fileName
      }
    });
    
  } catch (error: any) {
    console.error('❌ Remove.bg error:', error.response?.data || error.message);
    
    // Handle remove.bg specific errors
    if (error.response?.status === 402) {
      return NextResponse.json({ 
        error: 'API credits exhausted. Please contact support.' 
      }, { status: 402 });
    }
    
    if (error.response?.status === 403) {
      return NextResponse.json({ 
        error: 'Invalid API key. Please contact support.' 
      }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: error.response?.data?.errors?.[0]?.title || error.message 
    }, { status: 500 });
  }
}

// Helper function to process a single image with retry logic
async function processImage(file: { url: string; name: string }, vendorId: string, retries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Add delay before retry attempts
      if (attempt > 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff: 2s, 4s, 8s
        console.log(`⏳ Retry ${attempt}/${retries} for ${file.name} after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Call remove.bg API with premium settings
      const formData = new FormData();
      formData.append('image_url', file.url);
      formData.append('size', 'full'); // MAX QUALITY - premium feature
      formData.append('format', 'png'); // PNG for transparency
      formData.append('type', 'auto'); // Auto-detect subject type
      formData.append('crop', 'false'); // Don't crop, keep full image
      formData.append('scale', 'original'); // Keep original resolution
      
      const removeBgResponse = await axios({
        method: 'post',
        url: 'https://api.remove.bg/v1.0/removebg',
        data: formData,
        responseType: 'arraybuffer',
        headers: {
          ...formData.getHeaders(),
          'X-Api-Key': REMOVE_BG_API_KEY,
        },
        timeout: 90000,
      });
      
      // Update rate limiter with response headers
      if (removeBgResponse.headers) {
        removeBgRateLimiter.updateFromHeaders(removeBgResponse.headers);
      }
    
    const supabase = getServiceSupabase();

    // Upload with "-no-bg" suffix to create NEW file (keep original)
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    const newFileName = `${fileNameWithoutExt}-no-bg.png`;
    const filePath = `${vendorId}/${newFileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vendor-product-images')
      .upload(filePath, removeBgResponse.data, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('vendor-product-images')
      .getPublicUrl(filePath);
    
    console.log(`✅ Created: ${newFileName}`);
    
      return {
        success: true,
        originalName: file.name,
        newName: newFileName,
        url: publicUrl
      };
      
    } catch (error: any) {
      lastError = error;
      
      // Capture detailed error information
      let errorMessage = error.message || 'Unknown error';
      let shouldRetry = false;
      
      if (error.response) {
        const status = error.response.status;
        
        // Rate limit error - retry with backoff
        if (status === 429) {
          shouldRetry = attempt < retries;
          errorMessage = 'Rate limit exceeded';
          console.log(`⚠️ Rate limited on ${file.name} (attempt ${attempt}/${retries})`);
        }
        // Server errors - retry
        else if (status >= 500) {
          shouldRetry = attempt < retries;
          errorMessage = `Server error: ${status}`;
          console.log(`⚠️ Server error on ${file.name} (attempt ${attempt}/${retries})`);
        }
        // Client errors - don't retry
        else {
          errorMessage = error.response?.data?.errors?.[0]?.title || 
                        error.response?.data?.message || 
                        `API Error: ${status}`;
        }
        
        console.error(`API Response:`, error.response.data);
      } else if (error.code) {
        // Network errors - retry
        shouldRetry = attempt < retries;
        errorMessage = `${error.code}: ${error.message}`;
      }
      
      // If we should retry and haven't exhausted retries, continue loop
      if (shouldRetry && attempt < retries) {
        continue;
      }
      
      // All retries exhausted or non-retryable error
      console.error(`❌ Failed processing ${file.name} after ${attempt} attempt(s)`);
      throw new Error(`${file.name}: ${errorMessage}`);
    }
  }
  
  // This shouldn't be reached, but TypeScript needs it
  throw lastError || new Error(`${file.name}: Unknown error`);
}

// Advanced parallel processing with adaptive rate limiting
async function processInParallel(
  files: Array<{ url: string; name: string }>,
  vendorId: string,
  requestedConcurrency: number = 50 // Request up to 50, will auto-adjust
): Promise<{ results: any[]; errors: any[] }> {
  
  // Calculate optimal batch size based on current rate limit state
  const optimalConcurrency = removeBgRateLimiter.calculateBatchSize('full');
  const concurrency = Math.min(requestedConcurrency, optimalConcurrency);
  
  console.log(`🔵 Processing ${files.length} images with ADAPTIVE rate limiting`);
  console.log(`⚡ Starting with ${concurrency} concurrent requests (max: 50, adaptive)`);
  console.log(`📊 Rate limit: ${removeBgRateLimiter.getStats().remaining}/${removeBgRateLimiter.getStats().limit} remaining`);
  
  const results: any[] = [];
  const errors: any[] = [];
  
  // Queue all files with rate limiter
  const promises = files.map((file, index) => {
    return removeBgRateLimiter.enqueue(
      `image-${index}-${file.name}`,
      async () => {
        try {
          const result = await processImage(file, vendorId, 5);
          console.log(`✅ Completed ${index + 1}/${files.length}: ${file.name}`);
          return { success: true, result, file };
        } catch (error: any) {
          console.error(`❌ Failed ${index + 1}/${files.length}: ${file.name} - ${error.message}`);
          throw error;
        }
      },
      0 // Default priority
    );
  });
  
  // Wait for all to complete with status tracking
  const settled = await Promise.allSettled(promises);
  
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      results.push(result.value.result);
    } else {
      const errorMsg = result.status === 'rejected' 
        ? result.reason?.message || 'Unknown error'
        : 'Processing failed';
      errors.push({
        fileName: files[index].name,
        error: errorMsg
      });
    }
  });
  
  const stats = removeBgRateLimiter.getStats();
  console.log(`📊 Final stats: ${stats.remaining}/${stats.limit} quota remaining (${stats.quotaPercentage}%)`);
  
  return { results, errors };
}

// Bulk background removal with parallel processing
export async function PUT(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { files, concurrency = 5 } = body; // Array of { url, name } + optional concurrency
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ 
        error: 'Files array required' 
      }, { status: 400 });
    }
    
    // PREMIUM: Adaptive concurrency (max 50 concurrent, auto-adjusts)
    const safeConcurrency = Math.min(Math.max(1, concurrency), 50);
    
    console.log(`🔵 Bulk removing backgrounds for ${files.length} images`);
    console.log(`⚡ PREMIUM MODE: Adaptive rate limiting (up to ${safeConcurrency} concurrent)`);
    
    const { results, errors } = await processInParallel(files, vendorId, safeConcurrency);
    
    console.log(`✅ Bulk processing complete: ${results.length} success, ${errors.length} failed`);
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

