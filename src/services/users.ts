import { cloudApi } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  User,
  UserQueryParams,
  CreateUserRequest,
  UpdateUserRequest,
  ApiResponse,
  PaginatedResponse,
  VCloudPaginatedResponse,
} from '../types';

/**
 * Helper function to build filter query strings safely
 */
function buildFilter(field: string, value: string): string {
  return `${field}==${value}`;
}

export class UserService {
  /**
   * Get all users with optional pagination and filtering
   */
  static async getUsers(
    params?: UserQueryParams
  ): Promise<PaginatedResponse<User>> {
    try {
      const response = await cloudApi.get<VCloudPaginatedResponse<User>>(
        API_ENDPOINTS.CLOUDAPI.USERS,
        {
          params,
        }
      );
      // Convert VCloudPaginatedResponse to our PaginatedResponse format
      return {
        data: response.data.values || [],
        pagination: {
          page: response.data.page,
          per_page: response.data.pageSize,
          total: response.data.resultTotal,
          total_pages: response.data.pageCount,
        },
        success: true,
      };
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          per_page: 0,
          total: 0,
          total_pages: 0,
        },
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get a single user by ID
   */
  static async getUser(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await cloudApi.get<User>(
        API_ENDPOINTS.CLOUDAPI.USER_BY_ID(id)
      );
      // Convert direct response to wrapped format for compatibility
      return {
        data: response.data,
        success: true,
        message: 'User retrieved successfully',
      };
    } catch (error) {
      console.error('Failed to get user:', error);
      return {
        data: null as unknown as User,
        success: false,
        message: 'Failed to get user',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await cloudApi.get<User>(
        API_ENDPOINTS.CLOUDAPI.CURRENT_USER
      );
      // Convert direct response to wrapped format for compatibility
      return {
        data: response.data,
        success: true,
        message: 'Current user retrieved successfully',
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return {
        data: null as unknown as User,
        success: false,
        message: 'Failed to get current user',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      // Transform data to match VMware Cloud Director API format
      // Explicitly exclude any 'roles' field and only include expected fields
      const {
        username,
        name,
        fullName,
        description,
        email,
        password,
        roleEntityRefs,
        orgEntityRef,
        deployedVmQuota,
        storedVmQuota,
        enabled,
      } = data;
      
      const apiData = {
        username,
        FullName: name || fullName || username, // API expects FullName (capital F) as required field
        description,
        email,
        password,
        roleEntityRefs,
        orgEntityRef,
        // Add organizationID field if orgEntityRef is provided
        ...(orgEntityRef ? { organizationID: orgEntityRef.id } : {}),
        deployedVmQuota,
        storedVmQuota,
        enabled,
      };

      const response = await cloudApi.post<User>(
        API_ENDPOINTS.CLOUDAPI.USERS,
        apiData
      );
      // Convert direct response to wrapped format for compatibility
      return {
        data: response.data,
        success: true,
        message: 'User created successfully',
      };
    } catch (error) {
      console.error('Failed to create user:', error);
      return {
        data: null as unknown as User,
        success: false,
        message: 'Failed to create user',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(data: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      // Transform data to match VMware Cloud Director API format
      // Explicitly exclude id and any unwanted fields, only include expected fields
      const {
        id,
        username,
        name,
        fullName,
        description,
        email,
        password,
        roleEntityRefs,
        orgEntityRef,
        deployedVmQuota,
        storedVmQuota,
        nameInSource,
        enabled,
        isGroupRole,
        providerType,
      } = data;
      
      const apiData = {
        username,
        description,
        email,
        password,
        roleEntityRefs,
        orgEntityRef,
        // Add organizationID field if orgEntityRef is provided
        ...(orgEntityRef ? { organizationID: orgEntityRef.id } : {}),
        deployedVmQuota,
        storedVmQuota,
        nameInSource,
        enabled,
        isGroupRole,
        providerType,
        // Only include FullName if name or fullName is provided
        ...(name || fullName ? { FullName: name || fullName } : {}),
      };

      const response = await cloudApi.put<User>(
        API_ENDPOINTS.CLOUDAPI.USER_BY_ID(id),
        apiData
      );
      // Convert direct response to wrapped format for compatibility
      return {
        data: response.data,
        success: true,
        message: 'User updated successfully',
      };
    } catch (error) {
      console.error('Failed to update user:', error);
      return {
        data: null as unknown as User,
        success: false,
        message: 'Failed to update user',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: string): Promise<ApiResponse<null>> {
    try {
      await cloudApi.delete(API_ENDPOINTS.CLOUDAPI.USER_BY_ID(id));
      // CloudAPI delete returns no content, create success response
      return {
        data: null,
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      console.error('Failed to delete user:', error);
      return {
        data: null,
        success: false,
        message: 'Failed to delete user',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Enable/disable a user
   */
  static async toggleUserStatus(
    id: string,
    enabled: boolean
  ): Promise<ApiResponse<User>> {
    try {
      const response = await cloudApi.patch<User>(
        API_ENDPOINTS.CLOUDAPI.USER_BY_ID(id),
        { enabled }
      );
      // Convert direct response to wrapped format for compatibility
      return {
        data: response.data,
        success: true,
        message: `User ${enabled ? 'enabled' : 'disabled'} successfully`,
      };
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      return {
        data: null as unknown as User,
        success: false,
        message: 'Failed to toggle user status',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get users by organization ID
   */
  static async getUsersByOrganization(
    organizationId: string
  ): Promise<PaginatedResponse<User>> {
    try {
      const response = await cloudApi.get<VCloudPaginatedResponse<User>>(
        API_ENDPOINTS.CLOUDAPI.USERS,
        {
          params: {
            filter: buildFilter('orgEntityRef.id', organizationId),
          },
        }
      );
      return {
        data: response.data.values || [],
        pagination: {
          page: response.data.page,
          per_page: response.data.pageSize,
          total: response.data.resultTotal,
          total_pages: response.data.pageCount,
        },
        success: true,
      };
    } catch (error) {
      console.error('Failed to get users by organization:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          per_page: 0,
          total: 0,
          total_pages: 0,
        },
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get users by role ID
   */
  static async getUsersByRole(
    roleId: string
  ): Promise<PaginatedResponse<User>> {
    try {
      const response = await cloudApi.get<VCloudPaginatedResponse<User>>(
        API_ENDPOINTS.CLOUDAPI.USERS,
        {
          params: {
            filter: buildFilter('roleEntityRefs.id', roleId),
          },
        }
      );
      return {
        data: response.data.values || [],
        pagination: {
          page: response.data.page,
          per_page: response.data.pageSize,
          total: response.data.resultTotal,
          total_pages: response.data.pageCount,
        },
        success: true,
      };
    } catch (error) {
      console.error('Failed to get users by role:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          per_page: 0,
          total: 0,
          total_pages: 0,
        },
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update user roles
   */
  static async updateUserRoles(
    userId: string,
    roleEntityRefs: Array<{ id: string; name: string }>
  ): Promise<ApiResponse<User>> {
    try {
      const response = await cloudApi.patch<User>(
        API_ENDPOINTS.CLOUDAPI.USER_BY_ID(userId),
        { roleEntityRefs }
      );
      // Convert direct response to wrapped format for compatibility
      return {
        data: response.data,
        success: true,
        message: 'User roles updated successfully',
      };
    } catch (error) {
      console.error('Failed to update user roles:', error);
      return {
        data: null as unknown as User,
        success: false,
        message: 'Failed to update user roles',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update user organization
   */
  static async updateUserOrganization(
    userId: string,
    orgEntityRef: { id: string; name: string }
  ): Promise<ApiResponse<User>> {
    try {
      const response = await cloudApi.patch<User>(
        API_ENDPOINTS.CLOUDAPI.USER_BY_ID(userId),
        { orgEntityRef }
      );
      // Convert direct response to wrapped format for compatibility
      return {
        data: response.data,
        success: true,
        message: 'User organization updated successfully',
      };
    } catch (error) {
      console.error('Failed to update user organization:', error);
      return {
        data: null as unknown as User,
        success: false,
        message: 'Failed to update user organization',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
