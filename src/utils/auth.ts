import { CONFIG } from './constants';

export interface TokenInfo {
  token: string;
  expiresAt: string;
}

/**
 * Get the stored JWT token from localStorage
 */
export const getStoredToken = (): string | null => {
  try {
    const tokenData = localStorage.getItem(CONFIG.JWT_TOKEN_KEY);
    if (!tokenData) return null;

    const { token, expiresAt }: TokenInfo = JSON.parse(tokenData);

    // Check if token is expired
    if (new Date() >= new Date(expiresAt)) {
      removeStoredToken();
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error retrieving stored token:', error);
    removeStoredToken();
    return null;
  }
};

/**
 * Store JWT token in localStorage with expiration
 */
export const storeToken = (token: string, expiresAt: string): void => {
  try {
    const tokenInfo: TokenInfo = { token, expiresAt };
    localStorage.setItem(CONFIG.JWT_TOKEN_KEY, JSON.stringify(tokenInfo));
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

/**
 * Remove JWT token from localStorage
 */
export const removeStoredToken = (): void => {
  try {
    localStorage.removeItem(CONFIG.JWT_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing stored token:', error);
  }
};

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = (): boolean => {
  return getStoredToken() !== null;
};

/**
 * Decode JWT token to get user information (without verification)
 * Note: This is for client-side display only, server should always verify
 */
export const decodeToken = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Get user information from stored token
 */
export const getCurrentUser = (): Record<string, unknown> | null => {
  const token = getStoredToken();
  if (!token) return null;

  return decodeToken(token);
};
