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
    // Validate token format - JWT must have exactly 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format: token must have exactly 3 parts');
      return null;
    }

    const base64Url = parts[1];
    if (!base64Url) {
      console.error('Invalid token: missing payload section');
      return null;
    }

    // Convert base64url to standard base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if necessary
    const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    // Decode base64 to get JSON payload
    const jsonPayload = atob(paddedBase64);

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Type guard to validate if an object matches the User interface
 */
const isValidUser = (obj: unknown): obj is import('../types').User => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    typeof (obj as Record<string, unknown>).username === 'string' &&
    typeof (obj as Record<string, unknown>).email === 'string' &&
    typeof (obj as Record<string, unknown>).fullName === 'string'
  );
};

/**
 * Get user information from stored token with type validation
 */
export const getCurrentUser = (): import('../types').User | null => {
  const token = getStoredToken();
  if (!token) return null;

  const decodedToken = decodeToken(token);
  if (!decodedToken) return null;

  // Validate that the decoded token contains valid user data
  if (isValidUser(decodedToken)) {
    return decodedToken;
  }

  console.error('Invalid user data in token:', decodedToken);
  return null;
};
