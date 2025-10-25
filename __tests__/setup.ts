import '@testing-library/jest-dom'

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// Mock requestIdleCallback
global.requestIdleCallback = (callback: IdleRequestCallback) => {
  return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0) as any
}

global.cancelIdleCallback = (id: any) => {
  clearTimeout(id)
}
