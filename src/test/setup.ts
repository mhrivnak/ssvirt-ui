import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch for config loading (only needed for runtime config tests)
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({
    apiBaseUrl: 'http://localhost:8080/api',
    appTitle: 'SSVIRT Web UI',
    appVersion: '0.0.1',
    logoUrl: '/vite.svg',
  }),
});

// Mock window.matchMedia for PatternFly components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for PatternFly components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock HTMLElement methods that might be used by PatternFly
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});
