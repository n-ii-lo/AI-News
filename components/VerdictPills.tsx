'use client';

import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { VerdictPayload, Direction } from '@/lib/schemas';

interface VerdictPillsProps {
  verdict: VerdictPayload;
  className?: string;
}

export function VerdictPills({ verdict, className }: VerdictPillsProps) {
  const getDirectionIcon = (direction: Direction) => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="w-3 h-3" />;
      case 'down':
        return <ArrowDown className="w-3 h-3" />;
      case 'neutral':
        return <ArrowRight className="w-3 h-3" />;
    }
  };

  const getDirectionColor = (direction: Direction) => {
    switch (direction) {
      case 'up':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'down':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'neutral':
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const coins = [
    { symbol: 'BTC', impact: verdict.coins.BTC },
    { symbol: 'SOL', impact: verdict.coins.SOL },
    { symbol: 'BNB', impact: verdict.coins.BNB }
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {coins.map(({ symbol, impact }) => (
        <Badge
          key={symbol}
          variant="outline"
          className={`flex items-center gap-1 px-2 py-1 ${getDirectionColor(impact.direction)}`}
        >
          {getDirectionIcon(impact.direction)}
          <span className="font-mono text-xs">{symbol}</span>
          <span className="text-xs">
            {Math.round(impact.confidence * 100)}%
          </span>
        </Badge>
      ))}
    </div>
  );
}
