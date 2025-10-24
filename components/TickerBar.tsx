'use client';

import { useEffect, useState } from 'react';
import { fetchPrices } from '@/lib/news';
import { formatPrice, formatPercent } from '@/lib/utils';
import type { PriceData } from '@/lib/schemas';

export function TickerBar() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updatePrices = async () => {
      try {
        const data = await fetchPrices();
        setPrices(data);
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      } finally {
        setLoading(false);
      }
    };

    updatePrices();
    const interval = setInterval(updatePrices, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-center h-12 px-4">
          <div className="animate-pulse text-muted-foreground">Loading prices...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="flex items-center h-12 px-4 overflow-x-auto">
        <div className="flex items-center space-x-6 min-w-max">
          {prices.map((price) => (
            <div key={price.symbol} className="flex items-center space-x-2">
              <span className="font-mono font-semibold text-foreground">
                {price.symbol}
              </span>
              <span className="font-mono text-sm">
                {formatPrice(price.price)}
              </span>
              <span 
                className={`font-mono text-xs ${
                  price.changePercent24h >= 0 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}
              >
                {formatPercent(price.changePercent24h)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
