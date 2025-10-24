import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tickers = searchParams.get('tickers')?.split(',').filter(Boolean) || [];
    const status = searchParams.get('status');
    const search = searchParams.get('q');

    const news = await db.getNews({
      cursor: cursor || undefined,
      limit,
      tickers: tickers.length > 0 ? tickers : undefined,
      status: status || undefined,
      search: search || undefined
    });

    // Get total count for pagination
    const totalNews = await db.getNews({
      tickers: tickers.length > 0 ? tickers : undefined,
      status: status || undefined,
      search: search || undefined
    });

    const nextCursor = news.length === limit && news.length > 0 
      ? news[news.length - 1].published_at 
      : null;

    return NextResponse.json({
      data: news,
      nextCursor,
      total: totalNews.length,
      hasMore: !!nextCursor
    });

  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
