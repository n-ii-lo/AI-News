import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export async function GET() {
  try {
    const aggregate = await db.getDailyAggregate();

    if (!aggregate) {
      return NextResponse.json({
        date: null,
        summary: null,
        message: 'No aggregate data available'
      });
    }

    return NextResponse.json({
      date: aggregate.id,
      summary: aggregate.summary,
      computedAt: aggregate.computed_at
    });

  } catch (error) {
    console.error('Aggregate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
