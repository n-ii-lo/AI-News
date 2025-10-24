'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { AggregateCoinCard } from './AggregateCoinCard';
import { ConfidenceBar } from './ConfidenceBar';
import type { DailyAggregate } from '@/lib/schemas';

interface AggregatePanelProps {
  className?: string;
}

export function AggregatePanel({ className }: AggregatePanelProps) {
  const [sensitivity, setSensitivity] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [excludeLowConfidence, setExcludeLowConfidence] = useState(false);

  const { data: aggregate, isLoading, error } = useQuery({
    queryKey: ['aggregate'],
    queryFn: async () => {
      const response = await fetch('/api/aggregate/tomorrow');
      if (!response.ok) throw new Error('Failed to fetch aggregate');
      return response.json() as Promise<{ date: string; summary: DailyAggregate['summary'] }>;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const getBiasColor = (bias: string) => {
    switch (bias) {
      case 'bullish':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'bearish':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'mixed':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'neutral':
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-8 bg-muted rounded"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error || !aggregate?.summary) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-muted-foreground">
          <p>No aggregate data available</p>
          <p className="text-xs mt-1">Check back later</p>
        </div>
      </Card>
    );
  }

  const { summary } = aggregate;
  const confidencePercentage = Math.round(summary.overall.confidence * 100);

  return (
    <Card className={`p-4 space-y-3 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Tomorrow Verdict</h3>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`px-3 py-1 ${getBiasColor(summary.overall.bias)}`}
          >
            {summary.overall.bias.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Confidence {confidencePercentage}%
          </span>
        </div>
      </div>

      {/* Overall Confidence */}
      <ConfidenceBar 
        confidence={summary.overall.confidence}
        label="Overall Confidence"
      />

      {/* Per-coin cards */}
      <div className="space-y-2">
        <AggregateCoinCard 
          symbol="BTC"
          direction={summary.BTC.direction}
          confidence={summary.BTC.confidence}
          score={summary.BTC.score}
        />
        <AggregateCoinCard 
          symbol="SOL"
          direction={summary.SOL.direction}
          confidence={summary.SOL.confidence}
          score={summary.SOL.score}
        />
        <AggregateCoinCard 
          symbol="BNB"
          direction={summary.BNB.direction}
          confidence={summary.BNB.confidence}
          score={summary.BNB.score}
        />
      </div>

      {/* Controls */}
      <div className="space-y-4 pt-3 border-t">
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">
            Sensitivity: {sensitivity}
          </label>
          <div className="px-1">
            <Slider
              value={[sensitivity === 'conservative' ? 0 : sensitivity === 'moderate' ? 1 : 2]}
              onValueChange={([value]) => {
                const newSensitivity = value === 0 ? 'conservative' : 
                                     value === 1 ? 'moderate' : 'aggressive';
                setSensitivity(newSensitivity);
              }}
              max={2}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>Conservative</span>
            <span>Aggressive</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="exclude-low-confidence"
            checked={excludeLowConfidence}
            onChange={(e) => setExcludeLowConfidence(e.target.checked)}
            className="rounded border-border"
          />
          <label htmlFor="exclude-low-confidence" className="text-xs text-muted-foreground">
            Exclude low-confidence news
          </label>
        </div>
      </div>

      {/* 7-day sparkline placeholder */}
      <div className="pt-2 border-t">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          7-day trend
        </div>
        <div className="h-8 bg-muted rounded flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Sparkline coming soon</span>
        </div>
      </div>
    </Card>
  );
}
