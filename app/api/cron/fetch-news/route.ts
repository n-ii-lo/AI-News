import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { getNewsProvider, normalizeNewsItem } from '@/lib/news';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_AUTH_TOKEN;
    
    if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch news from provider
    const provider = getNewsProvider();
    const newsItems = await provider.fetchNews();
    
    let insertedCount = 0;
    const errors: string[] = [];

    for (const item of newsItems) {
      try {
        // Check if news already exists
        const existingNews = await db.getNews({ 
          limit: 1,
          // Simple check by URL - in production you might want a more sophisticated deduplication
        });
        
        const exists = existingNews.some(news => news.url === item.url);
        if (exists) {
          continue;
        }

        // Normalize and insert news
        const normalizedNews = normalizeNewsItem(item);
        const insertedNews = await db.insertNews(normalizedNews);
        
        // Create analysis job
        console.log('Creating analysis job for news:', insertedNews.id);
        await db.createJob('analyze_news', { news_id: insertedNews.id });
        console.log('Analysis job created successfully');
        
        insertedCount++;
      } catch (error) {
        console.error(`Failed to process news item: ${item.url}`, error);
        errors.push(`Failed to process: ${item.url}`);
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      total: newsItems.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Fetch news cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
