import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { computeDailyAggregate } from '@/lib/aggregate';
import { getTomorrowDate } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_AUTH_TOKEN;
    
    if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's completed analyses
    const today = new Date().toISOString().split('T')[0];
    const analyses = await db.getAnalysesByStatus('done');
    
    // Filter analyses from today
    const todayAnalyses = analyses.filter(analysis => 
      analysis.created_at.startsWith(today)
    );

    if (todayAnalyses.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No analyses to aggregate',
        date: getTomorrowDate(),
        summary: null
      });
    }

    // Compute aggregate
    const summary = computeDailyAggregate(todayAnalyses);
    
    // Upsert daily aggregate for tomorrow
    const tomorrowDate = getTomorrowDate();
    await db.upsertDailyAggregate(tomorrowDate, summary);

    return NextResponse.json({
      success: true,
      date: tomorrowDate,
      summary,
      analysesCount: todayAnalyses.length
    });

  } catch (error) {
    console.error('Aggregate cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
