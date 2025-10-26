import { NextRequest } from 'next/server';
import { db } from '@/lib/supabase';
import type { StreamInsertEvent, StreamHeartbeat } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const after = searchParams.get('after');
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection confirmation
      controller.enqueue(encoder.encode(`event: connected\ndata: {"ts": ${Date.now()}}\n\n`));
      
      let lastCursor = after || new Date().toISOString();
      let eventCount = 0;
      const maxEventsPerSecond = 10;
      let lastEventTime = Date.now();
      
      // Heartbeat interval
      const heartbeatInterval = setInterval(async () => {
        try {
          const heartbeat: StreamHeartbeat = {
            type: 'heartbeat',
            ts: Date.now()
          };
          
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${JSON.stringify(heartbeat)}\n\n`));
        } catch (error) {
          console.error('Heartbeat error:', error);
          clearInterval(heartbeatInterval);
          controller.close();
        }
      }, 15000); // Every 15 seconds
      
      // Check for new news periodically
      const checkInterval = setInterval(async () => {
        try {
          const now = Date.now();
          const timeSinceLastEvent = now - lastEventTime;
          
          // Rate limiting: max 10 events per second
          if (timeSinceLastEvent < 1000 / maxEventsPerSecond) {
            return;
          }
          
          // Get new news since last cursor
          const newNews = await db.getNews({
            cursor: lastCursor,
            limit: 50
            // No status filter - get all new news regardless of status
          });
          
          if (newNews.length > 0) {
            // Update cursor to the latest item
            lastCursor = newNews[0].published_at;
            
            const insertEvent: StreamInsertEvent = {
              type: 'insert',
              items: newNews,
              cursor: lastCursor
            };
            
            controller.enqueue(encoder.encode(`event: insert\ndata: ${JSON.stringify(insertEvent)}\n\n`));
            lastEventTime = now;
            eventCount++;
          }
        } catch (error) {
          console.error('News check error:', error);
          clearInterval(checkInterval);
          clearInterval(heartbeatInterval);
          controller.close();
        }
      }, 2000); // Check every 2 seconds
      
      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(checkInterval);
        clearInterval(heartbeatInterval);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
