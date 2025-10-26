import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchJSON } from '@/lib/fetchJSON';
import type { News } from '@/lib/schemas';

interface UseRealtimeFeedOptions {
  initialCursor?: string;
  onItems: (items: News[], cursor: string) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface UseRealtimeFeedReturn {
  isConnected: boolean;
  connectionType: 'polling' | 'none';
  reconnect: () => void;
  disconnect: () => void;
}

interface NewsApiResponse {
  data: News[];
  hasMore?: boolean;
  total?: number;
}

export function useRealtimeFeed({
  initialCursor = new Date().toISOString(),
  onItems,
  onError,
  enabled = true,
}: UseRealtimeFeedOptions): UseRealtimeFeedReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'polling' | 'none'>('none');
  
  const cursorRef = useRef(initialCursor);
  const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const backoffCountRef = useRef(0);
  const lastSuccessRef = useRef(Date.now());

  // Sync cursor when initialCursor prop changes
  useEffect(() => {
    if (initialCursor && cursorRef.current !== initialCursor) {
      console.log('[useRealtimeFeed] Cursor updated:', {
        old: cursorRef.current,
        new: initialCursor
      });
      cursorRef.current = initialCursor;
    }
  }, [initialCursor]);

  // Log initialization - ALWAYS log, even in production
  useEffect(() => {
    console.log('[useRealtimeFeed] Initialized with:', {
      initialCursor,
      enabled,
      isConnected,
      connectionType,
    });
  }, []); // Only on mount

  // Log enabled changes - ALWAYS log
  useEffect(() => {
    console.log('[useRealtimeFeed] Enabled changed:', enabled);
    if (!enabled) {
      console.warn('[useRealtimeFeed] ⚠️ Polling DISABLED - will not start');
    } else {
      console.log('[useRealtimeFeed] ✅ Polling ENABLED - will start soon');
    }
  }, [enabled]);

  // Exponential backoff calculation: 10s → 20s → 40s → 80s → 120s (max)
  const getBackoffDelay = useCallback(() => {
    const baseDelay = 10000; // 10s
    const maxDelay = 120000; // 2min
    const delay = Math.min(baseDelay * Math.pow(2, backoffCountRef.current), maxDelay);
    return delay;
  }, []);

  // Reset backoff on successful fetch
  const resetBackoff = useCallback(() => {
    backoffCountRef.current = 0;
    lastSuccessRef.current = Date.now();
  }, []);

  // Increment backoff for next poll
  const incrementBackoff = useCallback(() => {
    backoffCountRef.current = Math.min(backoffCountRef.current + 1, 5); // Cap at 5 (2min max)
  }, []);

  // Core polling function
  const poll = useCallback(async () => {
    if (!enabled || document.hidden) return;

    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const url = `/api/news?after=${encodeURIComponent(cursorRef.current)}&limit=50`;
    
    try {
      console.log('[Polling] 📡 Fetching news after:', cursorRef.current);
      console.log('[Polling] 🔗 URL:', url);

      const data = await fetchJSON<NewsApiResponse>(
        url,
        { 
          signal,
          headers: {
            'Cache-Control': 'no-cache',
          }
        }
      );

      if (signal.aborted) {
        console.log('[Polling] ⏹️  Request aborted');
        return;
      }

      if (data.data && data.data.length > 0) {
        console.log(`[Polling] ✅ Received ${data.data.length} new items`);
        console.log('[Polling] 🆔 Item IDs:', data.data.map(item => item.id).slice(0, 5));
        
        // Update cursor to the most recent item
        const newCursor = data.data[0].published_at;
        console.log('[Polling] 📍 New cursor:', newCursor);
        
        onItems(data.data, newCursor);
        cursorRef.current = newCursor;
        
        // Reset backoff on success
        if (backoffCountRef.current > 0) {
          console.log('[Polling] 🔄 Resetting backoff');
        }
        resetBackoff();
      } else {
        console.log('[Polling] ℹ️  No new items (empty response)');
        resetBackoff();
      }
    } catch (error) {
      if (signal.aborted) return;

      console.error('[Polling] ❌ Error:', error);
      console.error('[Polling] 📊 Backoff count:', backoffCountRef.current + 1);
      
      onError?.(error as Error);
      
      // Increment backoff for next poll
      incrementBackoff();
      console.log('[Polling] ⬆️  Incremented backoff, next delay:', getBackoffDelay());
    }
  }, [enabled, onItems, onError, resetBackoff, incrementBackoff, getBackoffDelay]);

  // Start polling with current interval
  const startPolling = useCallback(() => {
    if (!enabled) return;

    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
    }

    // First poll immediately
    console.log('[Polling] 🚀 Starting polling...');
    poll();

    // Schedule next poll AFTER the first one
    const scheduleNext = () => {
      const delay = backoffCountRef.current > 0 ? getBackoffDelay() : 10000; // 10s normal, backoff on error

      console.log(`[Polling] ⏰ Scheduling next poll in ${delay}ms (backoff: ${backoffCountRef.current})`);

      pollingIntervalRef.current = setTimeout(() => {
        poll().then(() => {
          scheduleNext(); // Only reschedule after poll completes
        }).catch(() => {
          scheduleNext(); // Reschedule even on error
        });
      }, delay);
    };

    // Wait a bit before scheduling to let first poll complete
    setTimeout(scheduleNext, 1000);

    setIsConnected(true);
    setConnectionType('polling');

    console.log('[Polling] ✅ Started with 10s interval');
  }, [enabled, poll, getBackoffDelay]);

  // Disconnect
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setConnectionType('none');

    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = undefined;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Polling] Disconnected');
    }
  }, []);

  // Reconnect
  const reconnect = useCallback(() => {
    disconnect();
    resetBackoff();
    startPolling();
  }, [disconnect, resetBackoff, startPolling]);

  // Handle visibility change - pause/resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling when tab is hidden
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Polling] Tab hidden, pausing');
        }
        if (pollingIntervalRef.current) {
          clearTimeout(pollingIntervalRef.current);
        }
        setIsConnected(false);
      } else {
        // Resume polling when tab becomes visible
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Polling] Tab visible, resuming');
        }
        if (enabled && !isConnected) {
          startPolling();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, isConnected, startPolling]);

  // Handle online/offline
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected && enabled) {
        reconnect();
      }
    };

    const handleOffline = () => {
      disconnect();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, enabled, reconnect, disconnect]);

  // Initialize
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, startPolling, disconnect]);

  return {
    isConnected,
    connectionType,
    reconnect,
    disconnect,
  };
}
