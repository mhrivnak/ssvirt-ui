import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the runtime configuration system for tests
vi.mock('../utils/config', () => ({
  loadRuntimeConfig: vi.fn().mockResolvedValue({
    apiBaseUrl: 'http://localhost:8080/api',
    appTitle: 'SSVIRT Web UI',
    appVersion: '0.0.1',
    logoUrl: '/vite.svg',
  }),
  getRuntimeConfig: vi.fn().mockReturnValue({
    apiBaseUrl: 'http://localhost:8080/api',
    appTitle: 'SSVIRT Web UI',
    appVersion: '0.0.1',
    logoUrl: '/vite.svg',
  }),
  resetRuntimeConfig: vi.fn(),
}));

// Mock the constants module to prevent CONFIG proxy issues
vi.mock('../utils/constants', async () => {
  const actual = await vi.importActual('../utils/constants') as any;
  return {
    ...actual,
    CONFIG: {
      API_BASE_URL: 'http://localhost:8080/api',
      APP_TITLE: 'SSVIRT Web UI',
      APP_VERSION: '0.0.1',
      DEV_MODE: false,
      JWT_TOKEN_KEY: 'ssvirt_token',
      LOGO_URL: '/vite.svg',
    },
    getConfig: vi.fn().mockReturnValue({
      API_BASE_URL: 'http://localhost:8080/api',
      APP_TITLE: 'SSVIRT Web UI',
      APP_VERSION: '0.0.1',
      DEV_MODE: false,
      JWT_TOKEN_KEY: 'ssvirt_token',
      LOGO_URL: '/vite.svg',
    }),
  };
});

// Mock fetch for config loading
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
