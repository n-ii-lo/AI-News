import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { News, StreamInsertEvent, StreamHeartbeat } from '@/lib/schemas';

interface UseRealtimeFeedOptions {
  initialCursor?: string;
  onItems: (items: News[], cursor: string) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface UseRealtimeFeedReturn {
  isConnected: boolean;
  connectionType: 'realtime' | 'sse' | 'polling' | 'none';
  reconnect: () => void;
  disconnect: () => void;
}

export function useRealtimeFeed({
  initialCursor = new Date().toISOString(),
  onItems,
  onError,
  enabled = true,
}: UseRealtimeFeedOptions): UseRealtimeFeedReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'realtime' | 'sse' | 'polling' | 'none'>('none');
  
  const cursorRef = useRef(initialCursor);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const eventSourceRef = useRef<EventSource | undefined>(undefined);
  const channelRef = useRef<any>(undefined);
  const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const connectSSERef = useRef<() => void>(() => {});
  const connectPollingRef = useRef<() => void>(() => {});
  
  const backoffCountRef = useRef(0);
  const lastHeartbeatRef = useRef(Date.now());
  const isReconnectingRef = useRef(false);

  // Exponential backoff calculation
  const getBackoffDelay = useCallback(() => {
    const baseDelay = 500; // 0.5s
    const maxDelay = 30000; // 30s
    const delay = Math.min(baseDelay * Math.pow(2, backoffCountRef.current), maxDelay);
    return delay;
  }, []);

  // Reset backoff on successful connection
  const resetBackoff = useCallback(() => {
    backoffCountRef.current = 0;
    isReconnectingRef.current = false;
  }, []);

  // Increment backoff for next attempt
  const incrementBackoff = useCallback(() => {
    backoffCountRef.current++;
    isReconnectingRef.current = true;
  }, []);

  // Heartbeat watchdog
  const setupHeartbeatWatchdog = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setTimeout(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
      if (timeSinceLastHeartbeat > 20000) { // 20s timeout
        console.warn('Heartbeat timeout, reconnecting...');
        window.location.reload(); // Reload page as fallback
      }
    }, 25000); // Check every 25s
  }, []);

  // Update heartbeat timestamp
  const updateHeartbeat = useCallback(() => {
    lastHeartbeatRef.current = Date.now();
    setupHeartbeatWatchdog();
  }, [setupHeartbeatWatchdog]);

  // Disconnect all connections
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setConnectionType('none');

    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Close connections
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = undefined;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = undefined;
    }
  }, []);

  // Polling fallback
  const connectPolling = useCallback(() => {
    if (!enabled) return;

    disconnect();

    const poll = async () => {
      try {
        const response = await fetch(`/api/news?after=${encodeURIComponent(cursorRef.current)}&limit=50`);
        
        if (response.status === 304) {
          // No changes
          updateHeartbeat();
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
          onItems(data.data, data.data[0].published_at);
          cursorRef.current = data.data[0].published_at;
          updateHeartbeat();
        }
      } catch (error) {
        console.error('Polling error:', error);
        onError?.(error as Error);
      }
    };

    // Start polling immediately
    poll();

    // Set up interval polling
    const interval = setInterval(poll, 5000); // Poll every 5s
    pollingIntervalRef.current = interval;

    setConnectionType('polling');
    setIsConnected(true);
    resetBackoff();
    updateHeartbeat();
    console.log('Polling connected');
  }, [enabled, onItems, onError, updateHeartbeat, resetBackoff, disconnect]);

  // Update polling ref
  connectPollingRef.current = connectPolling;

  // SSE connection
  const connectSSE = useCallback(() => {
    if (!enabled) return;

    disconnect();

    try {
      const url = `/api/news/stream?after=${encodeURIComponent(cursorRef.current)}`;
      const eventSource = new EventSource(url);

      eventSource.addEventListener('insert', (event) => {
        try {
          const data = JSON.parse(event.data) as StreamInsertEvent;
          onItems(data.items, data.cursor);
          cursorRef.current = data.cursor;
          updateHeartbeat();
        } catch (error) {
          console.error('SSE insert parse error:', error);
          onError?.(error as Error);
        }
      });

      eventSource.addEventListener('heartbeat', (event) => {
        try {
          const data = JSON.parse(event.data) as StreamHeartbeat;
          lastHeartbeatRef.current = data.ts;
          updateHeartbeat();
        } catch (error) {
          console.error('SSE heartbeat parse error:', error);
        }
      });

      eventSource.addEventListener('connected', () => {
        setConnectionType('sse');
        setIsConnected(true);
        resetBackoff();
        updateHeartbeat();
        console.log('SSE connected');
      });

      eventSource.onerror = () => {
        console.error('SSE error, falling back to polling');
        eventSource.close();
        connectPollingRef.current();
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('SSE connection error:', error);
      connectPollingRef.current();
    }
  }, [enabled, onItems, onError, updateHeartbeat, resetBackoff, disconnect]);

  // Update SSE ref
  connectSSERef.current = connectSSE;

  // Supabase Realtime connection
  const connectRealtime = useCallback(() => {
    if (!enabled) return;

    disconnect();

    try {
      const channel = supabase
        .channel('news-inserts')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'news',
        }, (payload) => {
          const newItem = payload.new as News;
          
          // Filter by cursor to only get newer items
          if (new Date(newItem.published_at) > new Date(cursorRef.current)) {
            onItems([newItem], newItem.published_at);
            cursorRef.current = newItem.published_at;
            updateHeartbeat();
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionType('realtime');
            setIsConnected(true);
            resetBackoff();
            updateHeartbeat();
            console.log('Supabase Realtime connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('Supabase Realtime failed, falling back to SSE');
            connectSSERef.current();
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('Supabase Realtime error:', error);
      connectSSERef.current();
    }
  }, [enabled, onItems, updateHeartbeat, resetBackoff, disconnect]);

  // Main reconnect function
  const reconnect = useCallback(() => {
    if (isReconnectingRef.current) return;

    disconnect();
    incrementBackoff();

    const delay = getBackoffDelay();
    console.log(`Reconnecting in ${delay}ms (attempt ${backoffCountRef.current})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      // Try connections in order of preference
      if (backoffCountRef.current === 1) {
        connectRealtime();
      } else if (backoffCountRef.current <= 3) {
        connectSSE();
      } else {
        connectPolling();
      }
    }, delay);
  }, [disconnect, incrementBackoff, getBackoffDelay, connectRealtime, connectSSE, connectPolling]);

  // Initialize connection
  useEffect(() => {
    if (enabled) {
      connectRealtime();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connectRealtime, disconnect]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - pause SSE, keep heartbeat
        if (connectionType === 'sse' && eventSourceRef.current) {
          eventSourceRef.current.close();
          setIsConnected(false);
        }
      } else {
        // Tab visible - reconnect if needed
        if (!isConnected) {
          reconnect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connectionType, isConnected, reconnect]);

  // Handle online/offline
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected) {
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
  }, [isConnected, reconnect, disconnect]);

  return {
    isConnected,
    connectionType,
    reconnect,
    disconnect,
  };
}
