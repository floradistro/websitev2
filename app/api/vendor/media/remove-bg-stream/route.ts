import { NextRequest } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import FormData from 'form-data';
import axios from 'axios';

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || '';

export async function POST(request: NextRequest) {
  const vendorId = request.headers.get('x-vendor-id');
  
  if (!vendorId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const { files, concurrency = 50 } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: 'start', total: files.length });

        const chunks = [];
        for (let i = 0; i < files.length; i += concurrency) {
          chunks.push(files.slice(i, i + concurrency));
        }

        let completedCount = 0;

        for (const chunk of chunks) {
          const promises = chunk.map(async (file: any) => {
            const startTime = Date.now();
            send({ type: 'processing', fileName: file.name, status: 'processing' });

            try {
              const formData = new FormData();
              formData.append('image_url', file.url);
              formData.append('size', 'full');
              formData.append('format', 'png');
              formData.append('type', 'auto');
              formData.append('crop', 'false');
              formData.append('scale', 'original');

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

              const supabase = getServiceSupabase();

              // Delete original
              await supabase.storage
                .from('vendor-product-images')
                .remove([`${vendorId}/${file.name}`]);

              // Upload with same name
              const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
              const newFileName = `${fileNameWithoutExt}.png`;
              const filePath = `${vendorId}/${newFileName}`;

              await supabase.storage
                .from('vendor-product-images')
                .upload(filePath, removeBgResponse.data, {
                  contentType: 'image/png',
                  cacheControl: '3600',
                  upsert: true
                });

              const { data: { publicUrl } } = supabase.storage
                .from('vendor-product-images')
                .getPublicUrl(filePath);

              const endTime = Date.now();
              completedCount++;

              send({
                type: 'success',
                fileName: file.name,
                status: 'success',
                url: publicUrl,
                duration: endTime - startTime,
                completed: completedCount,
                total: files.length
              });

            } catch (error: any) {
              completedCount++;
              send({
                type: 'error',
                fileName: file.name,
                status: 'error',
                error: error.message,
                completed: completedCount,
                total: files.length
              });
            }
          });

          await Promise.all(promises);
          
          // Small delay between chunks
          if (chunks.indexOf(chunk) < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 250));
          }
        }

        send({ type: 'complete', completed: completedCount, total: files.length });
        controller.close();

      } catch (error: any) {
        send({ type: 'error', error: error.message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

