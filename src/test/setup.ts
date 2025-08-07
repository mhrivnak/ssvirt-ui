import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Set test environment variables for fallback configuration
process.env.VITE_API_BASE_URL = 'http://localhost:8080/api';
process.env.VITE_APP_TITLE = 'SSVIRT Web UI';
process.env.VITE_APP_VERSION = '0.0.1';
process.env.VITE_LOGO_URL = '/vite.svg';
process.env.VITE_JWT_TOKEN_KEY = 'ssvirt_token';

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
