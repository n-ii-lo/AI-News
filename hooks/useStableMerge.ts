import { useCallback, useRef } from 'react';

interface AnchorInfo {
  key: string;
  offset: number;
}

interface UseStableMergeOptions {
  containerRef: React.RefObject<HTMLElement>;
  prefersReducedMotion?: boolean;
}

interface UseStableMergeReturn {
  captureAnchor: () => AnchorInfo | null;
  restoreAnchor: (anchor: AnchorInfo | null) => void;
  adjustForHeightDelta: (delta: number) => void;
}

export function useStableMerge({
  containerRef,
  prefersReducedMotion = false,
}: UseStableMergeOptions): UseStableMergeReturn {
  const anchorRef = useRef<AnchorInfo | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Capture current scroll position relative to topmost visible item
  const captureAnchor = useCallback((): AnchorInfo | null => {
    if (!containerRef.current) return null;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top;
    
    // Find the topmost visible item
    const items = container.querySelectorAll('[data-news-item]');
    let topmostItem: Element | null = null;
    let minDistance = Infinity;

    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      const distance = Math.abs(rect.top - containerTop);
      
      if (rect.top >= containerTop && distance < minDistance) {
        minDistance = distance;
        topmostItem = item;
      }
    });

    if (!topmostItem) return null;

    const itemKey = (topmostItem as Element).getAttribute('data-news-item');
    const itemRect = (topmostItem as Element).getBoundingClientRect();
    const offset = itemRect.top - containerTop;

    if (!itemKey) return null;

    const anchor: AnchorInfo = {
      key: itemKey,
      offset,
    };

    anchorRef.current = anchor;
    return anchor;
  }, [containerRef]);

  // Restore scroll position to maintain anchor
  const restoreAnchor = useCallback((anchor: AnchorInfo | null) => {
    if (!anchor || !containerRef.current || prefersReducedMotion) return;

    const container = containerRef.current;
    
    // Find the anchor item
    const anchorItem = container.querySelector(`[data-news-item="${anchor.key}"]`);
    if (!anchorItem) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = anchorItem.getBoundingClientRect();
    
    // Calculate where the item should be positioned
    const targetTop = containerRect.top + anchor.offset;
    const currentTop = itemRect.top;
    const scrollDelta = currentTop - targetTop;

    if (Math.abs(scrollDelta) > 1) { // Only scroll if difference is significant
      container.scrollTop += scrollDelta;
    }
  }, [containerRef, prefersReducedMotion]);

  // Adjust scroll position based on height delta
  const adjustForHeightDelta = useCallback((delta: number) => {
    if (!containerRef.current || Math.abs(delta) < 1) return;

    const container = containerRef.current;
    container.scrollTop += delta;
  }, [containerRef]);

  // Setup ResizeObserver for automatic height adjustment
  const setupResizeObserver = useCallback(() => {
    if (!containerRef.current || resizeObserverRef.current) return;

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const delta = entry.contentRect.height - (entry.target as any)._previousHeight;
        if (Math.abs(delta) > 1) {
          adjustForHeightDelta(delta);
        }
        (entry.target as any)._previousHeight = entry.contentRect.height;
      }
    });

    resizeObserverRef.current.observe(containerRef.current);
  }, [containerRef, adjustForHeightDelta]);

  // Cleanup ResizeObserver
  const cleanupResizeObserver = useCallback(() => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
  }, []);

  return {
    captureAnchor,
    restoreAnchor,
    adjustForHeightDelta,
  };
}
