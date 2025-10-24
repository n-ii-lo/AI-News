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
        return <ArrowUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-3 h-3 text-red-500" />;
      case 'neutral':
        return <ArrowRight className="w-3 h-3 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.25) return 'text-green-500';
    if (score <= -0.25) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="p-3 bg-muted/30 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-sm">{symbol}</span>
          {getDirectionIcon(direction)}
        </div>
        <span className={`text-xs font-mono ${getScoreColor(score)}`}>
          {score >= 0 ? '+' : ''}{score.toFixed(2)}
        </span>
      </div>
      
      <ConfidenceBar 
        confidence={confidence}
        className="scale-90 origin-left"
      />
    </div>
  );
}
