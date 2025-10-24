import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Mock backtest data - in production this would fetch real historical data
    const mockBacktestData = {
      days,
      accuracy: {
        BTC: 0.67,
        SOL: 0.61,
        BNB: 0.58
      },
      byDate: Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          predictions: {
            BTC: { direction: Math.random() > 0.5 ? 'up' : 'down', confidence: 0.3 + Math.random() * 0.4 },
            SOL: { direction: Math.random() > 0.5 ? 'up' : 'down', confidence: 0.3 + Math.random() * 0.4 },
            BNB: { direction: Math.random() > 0.5 ? 'up' : 'down', confidence: 0.3 + Math.random() * 0.4 }
          },
          actualPrices: {
            BTC: 45000 + (Math.random() - 0.5) * 10000,
            SOL: 95 + (Math.random() - 0.5) * 20,
            BNB: 320 + (Math.random() - 0.5) * 50
          }
        };
      }).reverse()
    };

    return NextResponse.json(mockBacktestData);

  } catch (error) {
    console.error('Backtest API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
