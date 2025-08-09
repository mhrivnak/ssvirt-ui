import axios, {
  type AxiosInstance,
  type AxiosResponse,
  AxiosError,
} from 'axios';
import { getConfig } from '../utils/constants';
import type {
  LoginRequest,
  SessionResponse,
  User,
} from '../types';

// Session storage key for VMware Cloud Director session data
const VCD_SESSION_KEY = 'vcd-session';

// Create axios instance with base configuration
const createApiInstance = (): AxiosInstance => {
  const config = getConfig();
  const instance = axios.create({
    baseURL: config.API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
  });

  // Request interceptor to add VMware Cloud Director session
  instance.interceptors.request.use(
    (config) => {
      const sessionData = getSessionData();
      if (sessionData) {
        // Use session ID for authenticated requests
        config.headers['X-VCD-Session'] = sessionData.id;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle errors and session expiration
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      // Handle 401 Unauthorized - session expired or invalid
      if (error.response?.status === 401) {
        removeSessionData();
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

// Create the API instance lazily (only when first accessed)
let apiInstance: AxiosInstance | null = null;

export const api = new Proxy({} as AxiosInstance, {
  get(_target, prop: keyof AxiosInstance) {
    if (!apiInstance) {
      console.log('🚀 Creating API instance (first access)');
      apiInstance = createApiInstance();
    }
    return apiInstance[prop];
  },
});

// API service functions
export class AuthService {
  /**
   * Login with VMware Cloud Director credentials
   */
  static async login(credentials: LoginRequest): Promise<SessionResponse> {
    try {
      // Create a temporary instance without interceptors for login
      const config = getConfig();
      const loginInstance = axios.create({
        baseURL: config.API_BASE_URL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      const response = await loginInstance.post<SessionResponse>(
        '/cloudapi/1.0.0/sessions',
        {},
        {
          headers: {
            'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
          }
        }
      );

      const sessionData = response.data;
      
      // Store session data for role-based routing
      setSessionData(sessionData);
      
      return sessionData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.status === 401 
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
        await api.delete(`/cloudapi/1.0.0/sessions/${sessionData.id}`);
      }
    } catch (error) {
      // Log error but don't throw - logout should always work locally
      console.error('Error during server logout:', error);
    } finally {
      removeSessionData();
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
        id: sessionData.org.id
      },
      deployedVmQuota: 0, // Will be fetched from actual API if needed
      storedVmQuota: 0,
      enabled: true,
      isGroupRole: false,
      providerType: 'INTEGRATED',
      locked: false,
      stranded: false
    };
  }

  /**
   * Update user profile information (placeholder - implement as needed)
   */
  static async updateUserProfile(): Promise<User> {
    // This would integrate with actual VMware Cloud Director user management APIs
    throw new Error('User profile updates not implemented yet');
  }
}

// Export the configured API instance for other services
export default api;
