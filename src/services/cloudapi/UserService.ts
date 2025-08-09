import axios from 'axios';
import { api } from '../api';
import type {
  ApiResponse,
  VCloudPaginatedResponse,
  User,
  UserQueryParams,
} from '../../types';

/**
 * CloudAPI User Service - VMware Cloud Director compatible endpoints
 */
export class CloudApiUserService {
  /**
   * Get all users with optional query parameters
   */
  static async getUsers(
    params?: UserQueryParams
  ): Promise<VCloudPaginatedResponse<User>> {
    try {
      const response = await api.get<VCloudPaginatedResponse<User>>(
        '/cloudapi/1.0.0/users',
        { params }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to fetch users';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Get a specific user by ID (URN format)
   */
  static async getUser(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await api.get<ApiResponse<User>>(
        `/cloudapi/1.0.0/users/${encodeURIComponent(id)}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch user';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async createUser(
    userData: Omit<User, 'id'>
  ): Promise<ApiResponse<User>> {
    try {
      const response = await api.post<ApiResponse<User>>(
        '/cloudapi/1.0.0/users',
        userData
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to create user';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(
    id: string,
    userData: Partial<User>
  ): Promise<ApiResponse<User>> {
    try {
      const response = await api.put<ApiResponse<User>>(
        `/cloudapi/1.0.0/users/${encodeURIComponent(id)}`,
        userData
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to update user';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete<ApiResponse<void>>(
        `/cloudapi/1.0.0/users/${encodeURIComponent(id)}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to delete user';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Enable or disable a user
   */
  static async toggleUserStatus(
    id: string,
    enabled: boolean
  ): Promise<ApiResponse<User>> {
    try {
      const response = await api.patch<ApiResponse<User>>(
        `/cloudapi/1.0.0/users/${encodeURIComponent(id)}`,
        { enabled }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to toggle user status';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Update user roles
   */
  static async updateUserRoles(
    id: string,
    roleEntityRefs: Array<{ id: string; name: string }>
  ): Promise<ApiResponse<User>> {
    try {
      const response = await api.patch<ApiResponse<User>>(
        `/cloudapi/1.0.0/users/${encodeURIComponent(id)}`,
        { roleEntityRefs }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to update user roles';
        throw new Error(message);
      }
      throw error;
    }
  }
}

// Export alias for backward compatibility
export const UserService = CloudApiUserService;
