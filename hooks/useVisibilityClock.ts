import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVisibilityClockOptions {
  minInterval?: number;
  maxInterval?: number;
  baseInterval?: number;
}

interface UseVisibilityClockReturn {
  interval: number;
  isVisible: boolean;
  isOnline: boolean;
  setResponseType: (type: 'success' | 'not-modified' | 'error') => void;
  reset: () => void;
}

export function useVisibilityClock({
  minInterval = 1000,
  maxInterval = 15000,
  baseInterval = 5000,
}: UseVisibilityClockOptions = {}): UseVisibilityClockReturn {
  const [interval, setInterval] = useState(baseInterval);
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const backoffCountRef = useRef(0);
  const lastResponseTypeRef = useRef<'success' | 'not-modified' | 'error'>('success');

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      // Adjust interval based on visibility
      if (visible) {
        // Tab is visible - use tighter interval
        setInterval(prev => Math.max(minInterval, prev * 0.5));
      } else {
        // Tab is hidden - use looser interval
        setInterval(prev => Math.min(maxInterval, prev * 2));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [minInterval, maxInterval]);

  // Handle online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Adjust interval based on response type
  const setResponseType = useCallback((type: 'success' | 'not-modified' | 'error') => {
    lastResponseTypeRef.current = type;
    
    switch (type) {
      case 'success':
        // Got new data - tighten interval
        setInterval(prev => Math.max(minInterval, prev * 0.8));
        backoffCountRef.current = 0;
        break;
        
      case 'not-modified':
        // No changes - relax interval
        setInterval(prev => Math.min(maxInterval, prev * 1.2));
        backoffCountRef.current = 0;
        break;
        
      case 'error':
        // Error - exponential backoff
        backoffCountRef.current++;
        const backoffMultiplier = Math.pow(2, Math.min(backoffCountRef.current, 5)); // Cap at 32x
        setInterval(prev => Math.min(maxInterval, baseInterval * backoffMultiplier));
        break;
    }
  }, [minInterval, maxInterval, baseInterval]);

  // Reset to base interval
  const reset = useCallback(() => {
    setInterval(baseInterval);
    backoffCountRef.current = 0;
    lastResponseTypeRef.current = 'success';
  }, [baseInterval]);

  // Adjust interval based on visibility and online status
  useEffect(() => {
    if (!isOnline) {
      // When offline, use maximum interval
      setInterval(maxInterval);
    } else if (!isVisible) {
      // When hidden, use looser interval
      setInterval(prev => Math.min(maxInterval, prev * 1.5));
    } else {
      // When visible and online, use tighter interval
      setInterval(prev => Math.max(minInterval, prev * 0.7));
    }
  }, [isVisible, isOnline, minInterval, maxInterval]);

  return {
    interval,
    isVisible,
    isOnline,
    setResponseType,
    reset,
  };
}
