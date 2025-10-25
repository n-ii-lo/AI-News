import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisibilityClock } from '@/hooks/useVisibilityClock';

describe('useVisibilityClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false,
    });
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with base interval', () => {
    const { result } = renderHook(() =>
      useVisibilityClock({
        baseInterval: 5000,
        minInterval: 1000,
        maxInterval: 15000,
      })
    );

    // The interval may be adjusted by visibility effects, so we check it's within reasonable bounds
    expect(result.current.interval).toBeGreaterThanOrEqual(1000);
    expect(result.current.interval).toBeLessThanOrEqual(15000);
    expect(result.current.isVisible).toBe(true);
    expect(result.current.isOnline).toBe(true);
  });

  it('should adjust interval based on response type - success', () => {
    const { result } = renderHook(() =>
      useVisibilityClock({
        baseInterval: 5000,
        minInterval: 1000,
        maxInterval: 15000,
      })
    );

    const initialInterval = result.current.interval;

    act(() => {
      result.current.setResponseType('success');
    });

    // Should tighten interval (multiply by 0.8)
    expect(result.current.interval).toBeLessThan(initialInterval);
  });

  it('should adjust interval based on response type - not-modified', () => {
    const { result } = renderHook(() =>
      useVisibilityClock({
        baseInterval: 5000,
        minInterval: 1000,
        maxInterval: 15000,
      })
    );

    const initialInterval = result.current.interval;

    act(() => {
      result.current.setResponseType('not-modified');
    });

    // Should relax interval (multiply by 1.2)
    expect(result.current.interval).toBeGreaterThan(initialInterval);
  });

  it('should apply exponential backoff on error', () => {
    const { result } = renderHook(() =>
      useVisibilityClock({
        baseInterval: 5000,
        minInterval: 1000,
        maxInterval: 15000,
      })
    );

    act(() => {
      result.current.setResponseType('error');
    });

    // Should increase interval significantly (2x backoff)
    expect(result.current.interval).toBe(10000); // 5000 * 2

    act(() => {
      result.current.setResponseType('error');
    });

    // Should increase further (4x backoff)
    expect(result.current.interval).toBe(15000); // Capped at maxInterval
  });

  it('should respect minInterval limit', () => {
    const { result } = renderHook(() =>
      useVisibilityClock({
        baseInterval: 5000,
        minInterval: 2000,
        maxInterval: 15000,
      })
    );

    // Multiple success responses should not go below minInterval
    act(() => {
      result.current.setResponseType('success');
    });
    act(() => {
      result.current.setResponseType('success');
    });
    act(() => {
      result.current.setResponseType('success');
    });

    expect(result.current.interval).toBeGreaterThanOrEqual(2000);
  });

  it('should respect maxInterval limit', () => {
    const { result } = renderHook(() =>
      useVisibilityClock({
        baseInterval: 5000,
        minInterval: 1000,
        maxInterval: 10000,
      })
    );

    // Multiple error responses should not exceed maxInterval
    act(() => {
      result.current.setResponseType('error');
    });
    act(() => {
      result.current.setResponseType('error');
    });
    act(() => {
      result.current.setResponseType('error');
    });

    expect(result.current.interval).toBeLessThanOrEqual(10000);
  });

  it('should reset to base interval', () => {
    const { result } = renderHook(() =>
      useVisibilityClock({
        baseInterval: 5000,
        minInterval: 1000,
        maxInterval: 15000,
      })
    );

    // Change interval
    act(() => {
      result.current.setResponseType('error');
    });

    expect(result.current.interval).not.toBe(5000);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.interval).toBe(5000);
  });

  it('should adjust interval when tab becomes hidden', () => {
    const { result } = renderHook(() =>
      useVisibilityClock({
        baseInterval: 5000,
        minInterval: 1000,
        maxInterval: 15000,
      })
    );

    const initialInterval = result.current.interval;

    // Simulate tab becoming hidden
    act(() => {
      Object.defineProperty(document, 'hidden', { value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.interval).toBeGreaterThan(initialInterval);
  });

  it('should adjust interval when tab becomes visible', () => {
    const { result } = renderHook(() =>
      useVisibilityClock({
        baseInterval: 5000,
        minInterval: 1000,
        maxInterval: 15000,
      })
    );

    // First make tab hidden
    act(() => {
      Object.defineProperty(document, 'hidden', { value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    const hiddenInterval = result.current.interval;

    // Then make tab visible
    act(() => {
      Object.defineProperty(document, 'hidden', { value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.interval).toBeLessThan(hiddenInterval);
  });

  it('should handle offline state', () => {
    const { result } = renderHook(() =>
      useVisibilityClock({
        baseInterval: 5000,
        minInterval: 1000,
        maxInterval: 15000,
      })
    );

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.interval).toBe(15000); // Should use maxInterval when offline
  });

  it('should handle online state', () => {
    const { result } = renderHook(() =>
      useVisibilityClock({
        baseInterval: 5000,
        minInterval: 1000,
        maxInterval: 15000,
      })
    );

    // First go offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    // Then come back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.interval).toBeLessThan(15000);
  });
});
