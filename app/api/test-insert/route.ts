import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const testNews = {
      title: `Test News ${Date.now()}`,
      summary: 'This is a test news item for realtime feed testing',
      url: `https://example.com/test-${Date.now()}`,
      source: 'TestSource',
      published_at: new Date().toISOString(),
      image_url: 'https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=400',
      video_url: null,
      tickers: ['BTC'],
      status: 'done' as const,
    };
    
    console.log('[TestInsert] Creating test news:', testNews.title);
    const inserted = await db.insertNews(testNews);
    
    // Create analysis job
    await db.createJob('analyze_news', { news_id: inserted.id });
    
    console.log('[TestInsert] News created:', inserted.id);
    
    return NextResponse.json({ 
      success: true, 
      news: inserted,
      message: 'Test news created successfully' 
    });
  } catch (error) {
    console.error('[TestInsert] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create test news', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

