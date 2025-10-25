'use client';

import { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery } from '@tanstack/react-query';
import { useBackgroundFeed } from '@/hooks/useBackgroundFeed';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { useStableMerge } from '@/hooks/useStableMerge';
import { useVisibilityClock } from '@/hooks/useVisibilityClock';
import { NewItemsBanner } from '@/components/NewItemsBanner';
import { NewsFeedItem } from '@/components/NewsFeedItem';
import { Skeletons } from '@/components/Skeletons';
import { ErrorState } from '@/components/ErrorState';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { News } from '@/lib/schemas';

interface NewsFeedProps {
  className?: string;
}

export function NewsFeed({ className = '' }: NewsFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Get initial data
  const { data: initialData, isLoading, error } = useQuery({
    queryKey: ['news', 'initial'],
    queryFn: async () => {
      const response = await fetch('/api/news?limit=50');
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json();
    },
  });

  const initialItems = initialData?.data || [];
  const initialCursor = initialItems.length > 0 ? initialItems[0].published_at : new Date().toISOString();

  // Background feed management
  const {
    visible,
    staged,
    cursor,
    newCount,
    bannerVisible,
    isLive,
    mergeNow,
    addItems,
    setLive,
  } = useBackgroundFeed({
    initialItems,
    initialCursor,
    threshold: 3,
    maxBuffer: 200,
    maxVisible: 500,
  });

  // Stable merge for scroll preservation
  const { captureAnchor, restoreAnchor } = useStableMerge({
    containerRef: parentRef as React.RefObject<HTMLElement>,
    prefersReducedMotion,
  });

  // Visibility-aware clock
  const { interval, isVisible, isOnline } = useVisibilityClock({
    minInterval: 1000,
    maxInterval: 15000,
    baseInterval: 5000,
  });

  // Realtime feed connection
  const { isConnected, connectionType, reconnect } = useRealtimeFeed({
    initialCursor: cursor,
    onItems: (items, newCursor) => {
      addItems(items, newCursor);
    },
    onError: (error) => {
      console.error('Realtime feed error:', error);
    },
    enabled: isOnline,
  });

  // Update live status
  useEffect(() => {
    setLive(isConnected);
  }, [isConnected, setLive]);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Virtualization setup
  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Estimated item height
    overscan: 5,
  });

  // Handle merge with scroll preservation
  const handleMerge = () => {
    const anchor = captureAnchor();
    mergeNow();
    
    // Restore scroll position after a brief delay to allow DOM updates
    setTimeout(() => {
      restoreAnchor(anchor);
    }, 100);
  };

  // Connection status badge
  const getConnectionStatus = () => {
    if (!isOnline) {
      return (
        <Badge variant="outline" className="text-red-500 border-red-500">
          <WifiOff className="w-3 h-3 mr-1" />
          Offline
        </Badge>
      );
    }
    
    if (isConnected) {
      return (
        <Badge variant="outline" className="text-green-500 border-green-500">
          <Wifi className="w-3 h-3 mr-1" />
          Live ({connectionType})
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-yellow-500 border-yellow-500">
        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
        Syncing...
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <Skeletons />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <ErrorState 
          message="Failed to load news"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 text-center ${className}`}>
        <h2 className="text-xl font-semibold mb-2">No News</h2>
        <p className="text-muted-foreground">
          News will appear here after loading
        </p>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">News Feed</h2>
        <div className="flex items-center gap-2">
          {getConnectionStatus()}
          <div className="text-xs text-muted-foreground">
            {isVisible ? `${Math.round(interval / 1000)}s` : 'paused'}
          </div>
        </div>
      </div>

      {/* New Items Banner */}
      {bannerVisible && (
        <NewItemsBanner
          count={newCount}
          onClick={handleMerge}
          isLive={isLive}
        />
      )}

      {/* Virtualized List */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{
          height: '100%',
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const news = visible[virtualItem.index];
            if (!news) return null;

            return (
              <div
                key={news.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="p-4">
                  <NewsFeedItem news={news} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-border bg-muted/50">
        <div className="text-xs text-muted-foreground">
          {visible.length} items • {staged.length} staged
        </div>
        {!isConnected && isOnline && (
          <button
            onClick={reconnect}
            className="text-xs text-primary hover:underline"
          >
            Reconnect
          </button>
        )}
      </div>
    </div>
  );
}
