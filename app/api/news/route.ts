import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { createHash } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const cursor = searchParams.get('cursor');
    const after = searchParams.get('after'); // New parameter for delta requests
    const limit = parseInt(searchParams.get('limit') || '20');
    const tickers = searchParams.get('tickers')?.split(',').filter(Boolean) || [];
    const status = searchParams.get('status');
    const search = searchParams.get('q');

    // Use 'after' parameter for delta requests, fallback to 'cursor' for pagination
    const timeFilter = after || cursor;

    const news = await db.getNews({
      cursor: timeFilter || undefined,
      limit,
      tickers: tickers.length > 0 ? tickers : undefined,
      status: status || undefined,
      search: search || undefined
    });

    // Generate ETag from news IDs and updated timestamps
    const etagData = news.map(item => `${item.id}:${item.inserted_at}`).join('|');
    const etag = createHash('md5').update(etagData).digest('hex');
    
    // Check If-None-Match header for conditional requests
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // Get total count for pagination (only if not a delta request)
    let total = 0;
    if (!after) {
      const totalNews = await db.getNews({
        tickers: tickers.length > 0 ? tickers : undefined,
        status: status || undefined,
        search: search || undefined
      });
      total = totalNews.length;
    }

    const nextCursor = news.length === limit && news.length > 0 
      ? news[news.length - 1].published_at 
      : null;

    const response = NextResponse.json({
      data: news,
      nextCursor,
      total,
      hasMore: !!nextCursor
    });

    // Set caching headers
    response.headers.set('ETag', etag);
    response.headers.set('Last-Modified', new Date().toUTCString());
    response.headers.set('Cache-Control', 'no-cache, must-revalidate');

    return response;

  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
