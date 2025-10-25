'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, Wifi, WifiOff } from 'lucide-react';

interface NewItemsBannerProps {
  count: number;
  onClick: () => void;
  isLive: boolean;
  className?: string;
}

export function NewItemsBanner({ count, onClick, isLive, className = '' }: NewItemsBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  // Show banner when count > 0
  useEffect(() => {
    if (count > 0) {
      setIsVisible(true);
    }
  }, [count]);

  // Hide banner when count becomes 0
  useEffect(() => {
    if (count === 0 && prevCount > 0) {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount]);

  // Announce new items for screen readers
  useEffect(() => {
    if (count > prevCount && count > 0) {
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `${count} new items available`;
      document.body.appendChild(announcement);
      
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  }, [count, prevCount]);

  if (!isVisible) return null;

  return (
    <div 
      className={`sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border ${className}`}
      role="banner"
      aria-live="polite"
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={onClick}
            variant="default"
            size="sm"
            className="animate-pulse hover:animate-none"
            aria-label={`Show ${count} new items`}
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            New ({count})
          </Button>
          
          <Badge 
            variant="outline" 
            className={`flex items-center gap-1 ${
              isLive ? 'text-green-500 border-green-500' : 'text-muted-foreground'
            }`}
          >
            {isLive ? (
              <>
                <Wifi className="w-3 h-3" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Offline
              </>
            )}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground">
          Press Enter or Space to load new items
        </div>
      </div>
    </div>
  );
}
