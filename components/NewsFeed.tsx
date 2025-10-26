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

  // State for pagination
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allNews, setAllNews] = useState<News[]>([]);

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

  // Update allNews when visible changes for pagination
  useEffect(() => {
    if (visible.length > 0) {
      setAllNews(visible);
    }
  }, [visible]);

  // Load more function for pagination
  const loadMore = async () => {
    if (isLoadingMore || !hasMore || allNews.length === 0) return;
    
    setIsLoadingMore(true);
    
    try {
      const lastItem = allNews[allNews.length - 1];
      const response = await fetch(`/api/news?cursor=${lastItem.published_at}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to load more news');
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        setAllNews(prev => [...prev, ...data.data]);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more news:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    // Observe the last item
    const observerTarget = document.querySelector('[data-last-item]');
    if (observerTarget) {
      observer.observe(observerTarget);
    }

    return () => {
      if (observerTarget) {
        observer.unobserve(observerTarget);
      }
    };
  }, [allNews.length, isLoadingMore, hasMore]);

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
    count: allNews.length,
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
            const news = allNews[virtualItem.index];
            if (!news) return null;

            const isLast = virtualItem.index === allNews.length - 1;

            return (
              <div
                key={news.id}
                data-last-item={isLast ? true : undefined}
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
                  {isLast && isLoadingMore && (
                    <div className="mt-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Loading more...</p>
                    </div>
                  )}
                  {isLast && !hasMore && allNews.length > 10 && (
                    <div className="mt-4 text-center text-muted-foreground">
                      <p className="text-sm">No more news to load</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-border bg-muted/50">
        <div className="text-xs text-muted-foreground">
          {allNews.length} items • {staged.length} staged
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
