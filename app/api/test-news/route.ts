import { NextResponse } from 'next/server';
import { getNewsProvider, normalizeNewsItem } from '@/lib/news';

export async function GET() {
  try {
    console.log('Testing news provider...');
    
    const provider = getNewsProvider();
    const newsItems = await provider.fetchNews();
    
    console.log('Fetched news items:', newsItems.length);
    console.log('First item:', newsItems[0]);
    
    if (newsItems.length > 0) {
      const normalized = normalizeNewsItem(newsItems[0]);
      console.log('Normalized item:', normalized);
      
      return NextResponse.json({ 
        success: true, 
        itemsCount: newsItems.length,
        firstItem: newsItems[0],
        normalized: normalized
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'No news items',
      itemsCount: newsItems.length
    });
    
  } catch (error) {
    console.error('Test news provider error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
