import { useState, useCallback, useRef, useEffect } from 'react';
import type { News } from '@/lib/schemas';

interface UseBackgroundFeedOptions {
  initialItems?: News[];
  initialCursor?: string;
  threshold?: number;
  maxBuffer?: number;
  maxVisible?: number;
}

interface UseBackgroundFeedReturn {
  visible: News[];
  staged: News[];
  cursor: string;
  newCount: number;
  bannerVisible: boolean;
  isLive: boolean;
  mergeNow: () => void;
  flush: () => void;
  disconnect: () => void;
  addItems: (items: News[], newCursor: string) => void;
  appendToVisible: (items: News[]) => void;
  setLive: (live: boolean) => void;
}

export function useBackgroundFeed({
  initialItems = [],
  initialCursor = new Date().toISOString(),
  threshold = 3,
  maxBuffer = 200,
  maxVisible = 500,
}: UseBackgroundFeedOptions = {}): UseBackgroundFeedReturn {
  const [visible, setVisible] = useState<News[]>(initialItems);
  const [staged, setStaged] = useState<News[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLive, setIsLive] = useState(false);
  
  const batchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pendingItemsRef = useRef<News[]>([]);
  const pendingCursorRef = useRef<string>(initialCursor);

  // Computed values
  const newCount = staged.length;
  const bannerVisible = newCount >= threshold;

  // Dedupe function
  const dedupeItems = useCallback((items: News[], existing: News[]): News[] => {
    const existingIds = new Set(existing.map(item => item.id));
    return items.filter(item => !existingIds.has(item.id));
  }, []);

  // Add items to staging buffer with batching
  const addItems = useCallback((items: News[], newCursor: string) => {
    console.log(`[BackgroundFeed] 🔄 Adding ${items.length} items to buffer`);
    
    // Clear existing batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Add to pending items
    pendingItemsRef.current.push(...items);
    pendingCursorRef.current = newCursor;

    // Set up new batch timeout
    batchTimeoutRef.current = setTimeout(() => {
      console.log(`[BackgroundFeed] ⚙️  Processing ${pendingItemsRef.current.length} pending items`);
      
      const itemsToStage = dedupeItems(pendingItemsRef.current, [...visible, ...staged]);
      
      console.log(`[BackgroundFeed] ✨ ${itemsToStage.length} unique items to stage (was ${pendingItemsRef.current.length}, ${pendingItemsRef.current.length - itemsToStage.length} duplicates)`);
      
      if (itemsToStage.length > 0) {
        setStaged(prev => {
          const combined = [...prev, ...itemsToStage];
          // Cap staged items at maxBuffer
          const capped = combined.slice(-maxBuffer);
          console.log(`[BackgroundFeed] 📦 Staged: ${capped.length} items (buffer limit: ${maxBuffer})`);
          return capped;
        });
        
        setCursor(pendingCursorRef.current);
      }

      // Clear pending
      pendingItemsRef.current = [];
    }, 200); // 200ms batching window
  }, [visible, staged, dedupeItems, maxBuffer]);

  // Merge staged items into visible
  const mergeNow = useCallback(() => {
    if (staged.length === 0) {
      console.log('[BackgroundFeed] ℹ️  Merge called but no staged items');
      return;
    }

    console.log(`[BackgroundFeed] ⬆️  Merging ${staged.length} staged items into visible`);

    setVisible(prev => {
      const merged = [...staged, ...prev];
      // Cap visible items at maxVisible and maintain order by published_at descending
      const sorted = merged
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(0, maxVisible);
      
      console.log(`[BackgroundFeed] ✅ Visible: ${sorted.length} items (limit: ${maxVisible})`);
      
      return sorted;
    });

    setStaged([]);
  }, [staged, maxVisible]);

  // Append items directly to visible (for pagination)
  const appendToVisible = useCallback((items: News[]) => {
    console.log(`[BackgroundFeed] 📄 Appending ${items.length} items for pagination`);
    
    setVisible(prev => {
      const deduped = dedupeItems(items, prev);
      const beforeCount = prev.length;
      console.log(`[BackgroundFeed] 🔤 ${deduped.length} unique items to append (${items.length - deduped.length} duplicates filtered)`);
      
      const merged = [...prev, ...deduped];
      // Sort by published_at descending and cap at maxVisible
      const sorted = merged
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(0, maxVisible);
      
      console.log(`[BackgroundFeed] 📊 Pagination: ${beforeCount} → ${sorted.length} items`);
      
      return sorted;
    });
  }, [dedupeItems, maxVisible]);

  // Force flush (admin/debug)
  const flush = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    const itemsToStage = dedupeItems(pendingItemsRef.current, [...visible, ...staged]);
    
    if (itemsToStage.length > 0) {
      setStaged(prev => {
        const combined = [...prev, ...itemsToStage];
        return combined.slice(-maxBuffer);
      });
      setCursor(pendingCursorRef.current);
    }

    pendingItemsRef.current = [];
  }, [visible, staged, dedupeItems, maxBuffer]);

  // Disconnect cleanup
  const disconnect = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    pendingItemsRef.current = [];
    setIsLive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    visible,
    staged,
    cursor,
    newCount,
    bannerVisible,
    isLive,
    mergeNow,
    flush,
    disconnect,
    addItems,
    appendToVisible,
    setLive: setIsLive,
  };
}
