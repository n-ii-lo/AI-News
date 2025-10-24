import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { analyzeNewsWithGPT } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_AUTH_TOKEN;
    
    if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get queued analysis jobs
    const jobs = await db.getJobsByTypeAndStatus('analyze_news', 'queued', 5);
    
    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No jobs to process'
      });
    }

    let processedCount = 0;
    const errors: string[] = [];

    for (const job of jobs) {
      try {
        // Update job status to processing
        await db.updateJobStatus(job.id, 'processing');
        
        const { news_id } = job.payload as { news_id: string };
        
        // Get news item
        const news = await db.getNewsById(news_id);
        
        // Analyze with GPT
        const verdict = await analyzeNewsWithGPT({
          title: news.title,
          summary: news.summary,
          url: news.url,
          published_at: news.published_at,
          source: news.source
        });

        // Upsert analysis
        await db.upsertAnalysis({
          news_id: news.id,
          model: 'gpt-4o',
          status: 'done',
          verdict,
          error: null
        });

        // Update news status
        await db.updateNewsStatus(news.id, 'done');

        // Update job status to done
        await db.updateJobStatus(job.id, 'done');
        
        processedCount++;
        
      } catch (error) {
        console.error(`Failed to analyze job ${job.id}:`, error);
        
        // Update job status to error
        await db.updateJobStatus(job.id, 'error', error instanceof Error ? error.message : 'Unknown error');
        
        // Update news status to error
        try {
          const { news_id } = job.payload as { news_id: string };
          await db.updateNewsStatus(news_id, 'error');
        } catch (updateError) {
          console.error('Failed to update news status:', updateError);
        }
        
        errors.push(`Job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      total: jobs.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Analyze cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
