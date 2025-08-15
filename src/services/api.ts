import axios, {
  type AxiosInstance,
  type AxiosResponse,
  AxiosError,
} from 'axios';
import { getConfig } from '../utils/constants';
import type { LoginRequest, SessionResponse, User } from '../types';
import { ROLE_NAMES } from '../types';

// Session storage key for VMware Cloud Director session data
const VCD_SESSION_KEY = 'vcd-session';
const VCD_ACCESS_TOKEN_KEY = 'vcd-access-token';
const VCD_TOKEN_TYPE_KEY = 'vcd-token-type';

/**
 * Safely encode credentials to Base64, handling Unicode characters properly
 */
function safeBase64Encode(str: string): string {
  // Use TextEncoder to convert string to UTF-8 bytes, then encode to Base64
  const encoder = new TextEncoder();
  const data = encoder.encode(str);

  // Convert Uint8Array to string for btoa()
  let binaryString = '';
  for (let i = 0; i < data.length; i++) {
    binaryString += String.fromCharCode(data[i]);
  }

  return btoa(binaryString);
}

// Create axios instance with base configuration
const createApiInstance = (apiPath = '/api'): AxiosInstance => {
  const config = getConfig();

  // Normalize baseURL to prevent double slashes
  const normalizedBaseURL = config.API_BASE_URL.replace(/\/+$/, '');
  const normalizedApiPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;

  const instance = axios.create({
    baseURL: `${normalizedBaseURL}${normalizedApiPath}`,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor to add VMware Cloud Director Bearer token
  instance.interceptors.request.use(
    (config) => {
      const accessToken = getAccessToken();
      const tokenType = getTokenType();

      if (accessToken && tokenType) {
        // Use Bearer token for authenticated requests (CloudAPI standard)
        config.headers['Authorization'] = `${tokenType} ${accessToken}`;
      }

      // Add tenant context header for organization-scoped API calls
      const sessionData = getSessionData();
      if (sessionData?.operatingOrg?.id) {
        config.headers['X-VMWARE-VCLOUD-TENANT-CONTEXT'] =
          sessionData.operatingOrg.id;
      } else if (sessionData?.org?.id) {
        config.headers['X-VMWARE-VCLOUD-TENANT-CONTEXT'] = sessionData.org.id;
      }

      // Ensure withCredentials is not set for CloudAPI compatibility
      config.withCredentials = false;

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle errors and session expiration
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401) {
        removeSessionData();
        removeAccessToken();
        removeTokenType();
        // Redirect to login will be handled by the auth context
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Session management utilities
export function getSessionData(): SessionResponse | null {
  const stored = sessionStorage.getItem(VCD_SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function setSessionData(sessionData: SessionResponse): void {
  sessionStorage.setItem(VCD_SESSION_KEY, JSON.stringify(sessionData));
}

export function removeSessionData(): void {
  sessionStorage.removeItem(VCD_SESSION_KEY);
}

// Token management utilities
export function getAccessToken(): string | null {
  return sessionStorage.getItem(VCD_ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  sessionStorage.setItem(VCD_ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken(): void {
  sessionStorage.removeItem(VCD_ACCESS_TOKEN_KEY);
}

export function getTokenType(): string | null {
  return sessionStorage.getItem(VCD_TOKEN_TYPE_KEY);
}

export function setTokenType(tokenType: string): void {
  sessionStorage.setItem(VCD_TOKEN_TYPE_KEY, tokenType);
}

export function removeTokenType(): void {
  sessionStorage.removeItem(VCD_TOKEN_TYPE_KEY);
}

// Create the API instances lazily (only when first accessed)
let legacyApiInstance: AxiosInstance | null = null;
let cloudApiInstance: AxiosInstance | null = null;

/**
 * Reset the API instances to force recreation with updated tokens
 */
export function resetApiInstance(): void {
  legacyApiInstance = null;
  cloudApiInstance = null;
}

// Legacy API instance for /api/ endpoints
export const api = new Proxy({} as AxiosInstance, {
  get(_target, prop: keyof AxiosInstance) {
    if (!legacyApiInstance) {
      console.log('🚀 Creating legacy API instance (first access)');
      legacyApiInstance = createApiInstance('/api');
    }
    return legacyApiInstance[prop];
  },
});

// CloudAPI instance for /cloudapi/ endpoints
export const cloudApi = new Proxy({} as AxiosInstance, {
  get(_target, prop: keyof AxiosInstance) {
    if (!cloudApiInstance) {
      console.log('🚀 Creating CloudAPI instance (first access)');
      cloudApiInstance = createApiInstance('/cloudapi');
    }
    return cloudApiInstance[prop];
  },
});

// API service functions
export class AuthService {
  /**
   * Login with VMware Cloud Director credentials
   */
  static async login(credentials: LoginRequest): Promise<SessionResponse> {
    try {
      // Create a temporary CloudAPI instance without interceptors for login
      const config = getConfig();
      const loginInstance = axios.create({
        baseURL: `${config.API_BASE_URL}/cloudapi`,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        // Ensure withCredentials is not set for CloudAPI compatibility
        withCredentials: false,
      });

      // Use safe Base64 encoding for Unicode credentials
      const basicAuthToken = safeBase64Encode(
        `${credentials.username}:${credentials.password}`
      );

      const response = await loginInstance.post<SessionResponse>(
        '/1.0.0/sessions',
        {},
        {
          headers: {
            Authorization: `Basic ${basicAuthToken}`,
          },
        }
      );

      const sessionData = response.data;

      // Extract VMware Cloud Director authentication tokens from response headers
      const authorizationHeader = response.headers['authorization'];
      let accessToken: string | undefined;
      let tokenType = 'Bearer';

      if (authorizationHeader) {
        // Parse the Authorization header robustly (format: "Bearer <token>" or "<type> <token>")
        const authParts = authorizationHeader
          .trim()
          .split(/\s+/)
          .filter((part: string) => part.length > 0);

        if (authParts.length >= 2) {
          // Normalize token type (case-insensitive comparison, set to 'Bearer' for bearer tokens)
          const firstPart = authParts[0].toLowerCase();
          tokenType = firstPart === 'bearer' ? 'Bearer' : authParts[0];
          // Join remaining parts in case token has multiple segments
          accessToken = authParts.slice(1).join(' ').trim();
        }
      }

      // Fallback to legacy header names if Authorization header not found
      if (!accessToken) {
        accessToken = response.headers['x-vmware-vcloud-access-token'];
        tokenType = response.headers['x-vmware-vcloud-token-type'] || 'Bearer';
      }

      if (!accessToken) {
        throw new Error(
          'Authentication failed: No access token received from VMware Cloud Director'
        );
      }

      // Store session data and authentication tokens
      setSessionData(sessionData);
      setAccessToken(accessToken);
      setTokenType(tokenType);

      // Reset API instance to pick up the new authentication tokens
      resetApiInstance();

      // Dispatch a custom event to notify components of session update
      window.dispatchEvent(new CustomEvent('session-updated'));

      // Notify other tabs of session change via localStorage
      localStorage.setItem('vcd-session-updated', Date.now().toString());

      return sessionData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.status === 401
            ? 'Invalid username or password'
            : error.response?.data?.message || 'Login failed';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Logout current session
   */
  static async logout(): Promise<void> {
    try {
      const sessionData = getSessionData();
      if (sessionData) {
        await cloudApi.delete(`/1.0.0/sessions/${sessionData.id}`);
      }
    } catch (error) {
      // Log error but don't throw - logout should always work locally
      console.error('Error during server logout:', error);
    } finally {
      // Clear all authentication data
      removeSessionData();
      removeAccessToken();
      removeTokenType();

      // Reset API instance to remove authentication headers
      resetApiInstance();

      // Dispatch a custom event to notify components of session update
      window.dispatchEvent(new CustomEvent('session-updated'));

      // Notify other tabs of session change via localStorage
      localStorage.setItem('vcd-session-updated', Date.now().toString());
    }
  }

  /**
   * Get current session information from stored data
   */
  static getSession(): SessionResponse | null {
    return getSessionData();
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const session = getSessionData();
    return session !== null;
  }

  /**
   * Get current user profile information (extracted from session)
   */
  static async getUserProfile(): Promise<User> {
    const sessionData = getSessionData();
    if (!sessionData) {
      throw new Error('No active session');
    }

    // Convert session data to User object format
    return {
      id: sessionData.user.id,
      username: sessionData.user.name,
      fullName: sessionData.user.name,
      email: `${sessionData.user.name}@${sessionData.org.name}`, // Placeholder
      roleEntityRefs: sessionData.roleRefs,
      orgEntityRef: {
        name: sessionData.org.name,
        id: sessionData.org.id,
      },
      deployedVmQuota: 0, // Will be fetched from actual API if needed
      storedVmQuota: 0,
      enabled: true,
      isGroupRole: false,
      providerType: 'INTEGRATED',
      locked: false,
      stranded: false,
    };
  }

  /**
   * Update user profile information (placeholder - implement as needed)
   */
  static async updateUserProfile(): Promise<User> {
    // This would integrate with actual VMware Cloud Director user management APIs
    throw new Error('User profile updates not implemented yet');
  }

  /**
   * Get current user permissions for role-based access control
   */
  static async getCurrentUserPermissions(): Promise<
    import('../types').UserPermissions
  > {
    const sessionData = getSessionData();
    if (!sessionData) {
      throw new Error('No active session');
    }

    // Check if user has system admin role
    const isSystemAdmin = sessionData.roles.some(
      (role) => role === ROLE_NAMES.SYSTEM_ADMIN
    );

    // Check if user has organization admin role
    const isOrgAdmin = sessionData.roles.some(
      (role) => role === ROLE_NAMES.ORG_ADMIN
    );

    // Extract user's organizations
    // [] means all organizations / global scope
    const accessibleOrganizations = isSystemAdmin
      ? [] // System admins have access to all organizations
      : sessionData.operatingOrg
        ? [
            {
              id: sessionData.operatingOrg.id,
              name: sessionData.operatingOrg.name,
            },
          ]
        : [{ id: sessionData.org.id, name: sessionData.org.name }];

    return {
      canCreateOrganizations: isSystemAdmin,
      canManageUsers: isSystemAdmin || isOrgAdmin,
      canManageSystem: isSystemAdmin,
      canManageOrganizations: isSystemAdmin,
      canViewVDCs: true, // All authenticated users can view VDCs
      canManageVDCs: isSystemAdmin,
      canCreateVApps: isSystemAdmin || isOrgAdmin, // Organization Admins can create vApps
      accessibleOrganizations,
    };
  }

  /**
   * Check if current user is a system administrator
   */
  static isSystemAdmin(): boolean {
    const sessionData = getSessionData();
    if (!sessionData) {
      return false;
    }

    return sessionData.roles.some((role) => role === ROLE_NAMES.SYSTEM_ADMIN);
  }

  /**
   * Get user's accessible organizations
   */
  static getUserOrganizations(): Array<{ id: string; name: string }> {
    const sessionData = getSessionData();
    if (!sessionData) {
      return [];
    }

    return sessionData.operatingOrg
      ? [
          {
            id: sessionData.operatingOrg.id,
            name: sessionData.operatingOrg.name,
          },
        ]
      : [{ id: sessionData.org.id, name: sessionData.org.name }];
  }
}

// Export the configured API instance for other services
export default api;
