import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackgroundFeed } from '@/hooks/useBackgroundFeed';
import type { News } from '@/lib/schemas';

// Mock news data
const mockNews: News[] = [
  {
    id: '1',
    published_at: '2024-01-01T10:00:00Z',
    source: 'Test Source',
    title: 'Test News 1',
    summary: 'Test summary 1',
    url: 'https://test.com/1',
    image_url: null,
    video_url: null,
    tickers: ['BTC'],
    status: 'done',
    inserted_at: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    published_at: '2024-01-01T11:00:00Z',
    source: 'Test Source',
    title: 'Test News 2',
    summary: 'Test summary 2',
    url: 'https://test.com/2',
    image_url: null,
    video_url: null,
    tickers: ['SOL'],
    status: 'done',
    inserted_at: '2024-01-01T11:00:00Z',
  },
];

describe('useBackgroundFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with provided items', () => {
    const { result } = renderHook(() =>
      useBackgroundFeed({
        initialItems: mockNews,
        initialCursor: '2024-01-01T10:00:00Z',
      })
    );

    expect(result.current.visible).toEqual(mockNews);
    expect(result.current.cursor).toBe('2024-01-01T10:00:00Z');
    expect(result.current.newCount).toBe(0);
    expect(result.current.bannerVisible).toBe(false);
  });

  it('should stage new items without changing visible', () => {
    const { result } = renderHook(() =>
      useBackgroundFeed({
        initialItems: [mockNews[0]],
        initialCursor: '2024-01-01T10:00:00Z',
        threshold: 1,
      })
    );

    const newItem = mockNews[1];

    act(() => {
      result.current.addItems([newItem], '2024-01-01T11:00:00Z');
    });

    // Visible should not change immediately
    expect(result.current.visible).toEqual([mockNews[0]]);
    expect(result.current.staged).toEqual([]);
    expect(result.current.newCount).toBe(0);

    // Fast-forward batching timeout
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Now staged should have the new item
    expect(result.current.staged).toEqual([newItem]);
    expect(result.current.newCount).toBe(1);
    expect(result.current.bannerVisible).toBe(true);
  });

  it('should dedupe items by id', () => {
    const { result } = renderHook(() =>
      useBackgroundFeed({
        initialItems: [mockNews[0]],
        initialCursor: '2024-01-01T10:00:00Z',
      })
    );

    // Try to add the same item
    act(() => {
      result.current.addItems([mockNews[0]], '2024-01-01T10:00:00Z');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should not be added to staged
    expect(result.current.staged).toEqual([]);
    expect(result.current.newCount).toBe(0);
  });

  it('should merge staged items into visible', () => {
    const { result } = renderHook(() =>
      useBackgroundFeed({
        initialItems: [mockNews[0]],
        initialCursor: '2024-01-01T10:00:00Z',
      })
    );

    // Add new item
    act(() => {
      result.current.addItems([mockNews[1]], '2024-01-01T11:00:00Z');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.staged).toEqual([mockNews[1]]);

    // Merge staged items
    act(() => {
      result.current.mergeNow();
    });

    expect(result.current.visible).toEqual([mockNews[1], mockNews[0]]); // Sorted by published_at desc
    expect(result.current.staged).toEqual([]);
    expect(result.current.newCount).toBe(0);
    expect(result.current.bannerVisible).toBe(false);
  });

  it('should respect maxBuffer limit', () => {
    const { result } = renderHook(() =>
      useBackgroundFeed({
        initialItems: [],
        initialCursor: '2024-01-01T10:00:00Z',
        maxBuffer: 2,
      })
    );

    const manyItems = Array.from({ length: 5 }, (_, i) => ({
      ...mockNews[0],
      id: `item-${i}`,
      published_at: `2024-01-01T${10 + i}:00:00Z`,
    }));

    act(() => {
      result.current.addItems(manyItems, '2024-01-01T15:00:00Z');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should only keep the last 2 items (most recent first due to sorting)
    expect(result.current.staged).toHaveLength(2);
    expect(result.current.staged[0].id).toBe('item-3');
    expect(result.current.staged[1].id).toBe('item-4');
  });

  it('should respect maxVisible limit', () => {
    const { result } = renderHook(() =>
      useBackgroundFeed({
        initialItems: [],
        initialCursor: '2024-01-01T10:00:00Z',
        maxVisible: 3,
      })
    );

    const manyItems = Array.from({ length: 5 }, (_, i) => ({
      ...mockNews[0],
      id: `item-${i}`,
      published_at: `2024-01-01T${10 + i}:00:00Z`,
    }));

    act(() => {
      result.current.addItems(manyItems, '2024-01-01T15:00:00Z');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.mergeNow();
    });

    // Should only keep the first 3 items (most recent)
    expect(result.current.visible).toHaveLength(3);
    expect(result.current.visible[0].id).toBe('item-4');
    expect(result.current.visible[1].id).toBe('item-3');
    expect(result.current.visible[2].id).toBe('item-2');
  });

  it('should show banner when staged count >= threshold', () => {
    const { result } = renderHook(() =>
      useBackgroundFeed({
        initialItems: [],
        initialCursor: '2024-01-01T10:00:00Z',
        threshold: 2,
      })
    );

    // Add 1 item - banner should not show
    act(() => {
      result.current.addItems([mockNews[0]], '2024-01-01T10:00:00Z');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.bannerVisible).toBe(false);

    // Add 1 more item - banner should show
    act(() => {
      result.current.addItems([mockNews[1]], '2024-01-01T11:00:00Z');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.bannerVisible).toBe(true);
  });

  it('should flush pending items immediately', () => {
    const { result } = renderHook(() =>
      useBackgroundFeed({
        initialItems: [],
        initialCursor: '2024-01-01T10:00:00Z',
      })
    );

    act(() => {
      result.current.addItems([mockNews[0]], '2024-01-01T10:00:00Z');
    });

    // Don't advance timers, flush immediately
    act(() => {
      result.current.flush();
    });

    expect(result.current.staged).toEqual([mockNews[0]]);
    expect(result.current.cursor).toBe('2024-01-01T10:00:00Z');
  });

  it('should disconnect and cleanup', () => {
    const { result } = renderHook(() =>
      useBackgroundFeed({
        initialItems: mockNews,
        initialCursor: '2024-01-01T10:00:00Z',
      })
    );

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.isLive).toBe(false);
  });
});
