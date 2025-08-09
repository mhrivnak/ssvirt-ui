import axios from 'axios';
import { api } from '../api';
import type {
  ApiResponse,
  VCloudPaginatedResponse,
  Role,
  RoleQueryParams,
} from '../../types';

/**
 * CloudAPI Role Service - VMware Cloud Director compatible endpoints
 */
export class CloudApiRoleService {
  /**
   * Get all roles with optional query parameters
   */
  static async getRoles(
    params?: RoleQueryParams
  ): Promise<VCloudPaginatedResponse<Role>> {
    try {
      const response = await api.get<VCloudPaginatedResponse<Role>>(
        '/cloudapi/1.0.0/roles',
        { params }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to fetch roles';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Get all roles as a simple array (for dropdowns, etc.)
   */
  static async getAllRoles(): Promise<Role[]> {
    try {
      const response = await api.get<VCloudPaginatedResponse<Role>>(
        '/cloudapi/1.0.0/roles'
      );
      return response.data.values;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to fetch roles';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Get a specific role by ID (URN format)
   */
  static async getRole(id: string): Promise<ApiResponse<Role>> {
    try {
      const response = await api.get<ApiResponse<Role>>(
        `/cloudapi/1.0.0/roles/${encodeURIComponent(id)}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch role';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Get role by name (helper function for permission checking)
   */
  static async getRoleByName(name: string): Promise<ApiResponse<Role>> {
    try {
      const response = await api.get<ApiResponse<Role>>(
        '/cloudapi/1.0.0/roles',
        { params: { search: name } }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to fetch role by name';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Create a new role (only for System Administrators)
   */
  static async createRole(
    roleData: Omit<Role, 'id'>
  ): Promise<ApiResponse<Role>> {
    try {
      const response = await api.post<ApiResponse<Role>>(
        '/cloudapi/1.0.0/roles',
        roleData
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to create role';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Update an existing role (only for System Administrators)
   */
  static async updateRole(
    id: string,
    roleData: Partial<Role>
  ): Promise<ApiResponse<Role>> {
    try {
      const response = await api.put<ApiResponse<Role>>(
        `/cloudapi/1.0.0/roles/${encodeURIComponent(id)}`,
        roleData
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to update role';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Delete a role (only for System Administrators, cannot delete built-in roles)
   */
  static async deleteRole(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete<ApiResponse<void>>(
        `/cloudapi/1.0.0/roles/${encodeURIComponent(id)}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to delete role';
        throw new Error(message);
      }
      throw error;
    }
  }
}
