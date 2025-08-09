import axios, {
  type AxiosInstance,
  type AxiosResponse,
  AxiosError,
} from 'axios';
import { getConfig, API_ENDPOINTS } from '../utils/constants';
import { getStoredToken, removeStoredToken } from '../utils/auth';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  SessionInfo,
  User,
} from '../types';

// Create axios instance with base configuration
const createApiInstance = (): AxiosInstance => {
  const config = getConfig();
  const instance = axios.create({
    baseURL: config.API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle errors and token expiration
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401) {
        removeStoredToken();
        // Redirect to login will be handled by the auth context
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

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
   * Login with username and password
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>(
        API_ENDPOINTS.LOGIN,
        credentials
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Login failed';
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
      await api.delete(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Log error but don't throw - logout should always work locally
      console.error('Error during server logout:', error);
    }
  }

  /**
   * Get current session information (returns User object in CloudAPI format)
   */
  static async getSession(): Promise<SessionInfo> {
    try {
      const response = await api.get<ApiResponse<SessionInfo>>(
        API_ENDPOINTS.SESSION
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Session check failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Session check failed';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Get current user profile from CloudAPI
   */
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>(
        API_ENDPOINTS.CLOUDAPI_CURRENT_USER
      );
      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to get current user: Invalid response');
      }
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to get current user';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Get user profile information
   */
  static async getUserProfile(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>(
        API_ENDPOINTS.USER_PROFILE
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get user profile');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to get user profile';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Update user profile information
   */
  static async updateUserProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await api.put<ApiResponse<User>>(
        API_ENDPOINTS.USER_PROFILE,
        userData
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || 'Failed to update user profile'
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to update user profile';
        throw new Error(message);
      }
      throw error;
    }
  }
}

// Export the configured API instance for other services
export default api;
