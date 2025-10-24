import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('news_id');

    if (!newsId) {
      return NextResponse.json({ error: 'news_id parameter is required' }, { status: 400 });
    }

    const analysis = await db.getAnalysisByNewsId(newsId);

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Analyses API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
