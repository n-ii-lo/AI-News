import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ news_id: string }> }) {
  try {
    const { news_id } = await params;

    if (!news_id) {
      return NextResponse.json({ error: 'news_id is required' }, { status: 400 });
    }

    const analysis = await db.getAnalysisByNewsId(news_id);

    if (!analysis || !analysis.verdict) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const { quotes, keywords } = analysis.verdict.why;

    return NextResponse.json({
      quotes,
      keywords,
      newsTitle: analysis.news.title,
      newsUrl: analysis.news.url
    });

  } catch (error) {
    console.error('Why API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
