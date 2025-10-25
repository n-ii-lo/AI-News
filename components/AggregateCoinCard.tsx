'use client';

import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { ConfidenceBar } from './ConfidenceBar';
import type { Direction } from '@/lib/schemas';

interface AggregateCoinCardProps {
  symbol: string;
  direction: Direction;
  confidence: number;
  score: number;
}

export function AggregateCoinCard({ 
  symbol, 
  direction, 
  confidence, 
  score 
}: AggregateCoinCardProps) {
  const getDirectionIcon = (dir: Direction) => {
    switch (dir) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      case 'neutral':
        return <ArrowRight className="w-4 h-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.25) return 'text-green-500';
    if (score <= -0.25) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="p-4 bg-muted/30 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono font-semibold text-lg">{symbol}</span>
          {getDirectionIcon(direction)}
        </div>
        <span className={`text-sm font-mono ${getScoreColor(score)}`}>
          {score >= 0 ? '+' : ''}{score.toFixed(2)}
        </span>
      </div>
      
      <ConfidenceBar 
        confidence={confidence}
        label={`${Math.round(confidence * 100)}% confidence`}
      />
    </div>
  );
}
