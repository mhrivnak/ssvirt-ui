import { describe, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

// Mock MSW
vi.mock('../mocks/browser', () => ({
  worker: {
    start: vi.fn(),
  },
}));

// Mock the CONFIG constant
vi.mock('../utils/constants', () => ({
  CONFIG: {
    DEV_MODE: false,
    API_BASE_URL: 'http://localhost:8080/api',
    APP_TITLE: 'SSVIRT Web UI',
    APP_VERSION: '0.0.1',
    JWT_TOKEN_KEY: 'ssvirt_token',
    LOGO_URL: '/vite.svg',
  },
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    ORGANIZATIONS: '/organizations',
    ORGANIZATION_CREATE: '/organizations/create',
    ORGANIZATION_DETAIL: '/organizations/:id',
    ORGANIZATION_EDIT: '/organizations/:id/edit',
    ORGANIZATION_USERS: '/organizations/:id/users',
    VDCS: '/vdcs',
    VDC_DETAIL: '/vdcs/:id',
    VMS: '/vms',
    VM_DETAIL: '/vms/:id',
    CATALOGS: '/catalogs',
    CATALOG_DETAIL: '/catalogs/:id',
    PROFILE: '/profile',
  },
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
  });
});