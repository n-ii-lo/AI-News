import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Creating jobs for existing news...');
    
    // Get all news without analyses
    const news = await db.getNews({ limit: 100 });
    console.log('Found news items:', news.length);
    
    let created = 0;
    
    for (const item of news) {
      try {
        // Check if analysis exists
        const analysis = await db.getAnalysis(item.id);
        if (!analysis) {
          // Create job
          await db.createJob('analyze_news', { news_id: item.id });
          created++;
          console.log('Created job for news:', item.id);
        }
      } catch (error) {
        console.log('Skipping (likely has job):', item.id);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      created,
      total: news.length
    });
    
  } catch (error) {
    console.error('Create jobs error:', error);
    return NextResponse.json(
      { error: 'Failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
