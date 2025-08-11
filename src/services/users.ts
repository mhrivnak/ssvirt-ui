import { cloudApi } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  User,
  UserQueryParams,
  CreateUserRequest,
  UpdateUserRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';

/**
 * Helper function to build filter query strings safely
 */
function buildFilter(field: string, value: string): string {
  return `${field}==${value}`;
}

/**
 * Helper function to convert array responses to paginated format
 */
function convertArrayToPaginatedResponse<T>(
  data: T[],
  params?: UserQueryParams
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page: params?.page || 1,
      per_page: params?.per_page || data.length,
      total: data.length,
      total_pages: 1,
    },
    success: true,
  };
}

export class UserService {
  /**
   * Get all users with optional pagination and filtering
   */
  static async getUsers(
    params?: UserQueryParams
  ): Promise<PaginatedResponse<User>> {
    try {
      const response = await cloudApi.get<User[]>(
        API_ENDPOINTS.CLOUDAPI.USERS,
        {
          params,
        }
      );
      // Convert array response to paginated format for compatibility
      return {
        data: response.data,
        pagination: {
          page: 1,
          per_page: response.data.length,
          total: response.data.length,
          total_pages: 1,
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
    const response = await cloudApi.get<User>(
      API_ENDPOINTS.CLOUDAPI.USER_BY_ID(id)
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'User retrieved successfully',
    };
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await cloudApi.get<User>(
      API_ENDPOINTS.CLOUDAPI.CURRENT_USER
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'Current user retrieved successfully',
    };
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    const response = await cloudApi.post<User>(
      API_ENDPOINTS.CLOUDAPI.USERS,
      data
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'User created successfully',
    };
  }

  /**
   * Update an existing user
   */
  static async updateUser(data: UpdateUserRequest): Promise<ApiResponse<User>> {
    const { id, ...updateData } = data;
    const response = await cloudApi.put<User>(
      API_ENDPOINTS.CLOUDAPI.USER_BY_ID(id),
      updateData
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'User updated successfully',
    };
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: string): Promise<ApiResponse<null>> {
    await cloudApi.delete(API_ENDPOINTS.CLOUDAPI.USER_BY_ID(id));
    // CloudAPI delete returns no content, create success response
    return {
      data: null,
      success: true,
      message: 'User deleted successfully',
    };
  }

  /**
   * Enable/disable a user
   */
  static async toggleUserStatus(
    id: string,
    enabled: boolean
  ): Promise<ApiResponse<User>> {
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
  }

  /**
   * Get users by organization ID
   */
  static async getUsersByOrganization(
    organizationId: string
  ): Promise<PaginatedResponse<User>> {
    const response = await cloudApi.get<User[]>(API_ENDPOINTS.CLOUDAPI.USERS, {
      params: {
        filter: buildFilter('orgEntityRef.id', organizationId),
      },
    });
    return convertArrayToPaginatedResponse(response.data);
  }

  /**
   * Get users by role ID
   */
  static async getUsersByRole(
    roleId: string
  ): Promise<PaginatedResponse<User>> {
    const response = await cloudApi.get<User[]>(API_ENDPOINTS.CLOUDAPI.USERS, {
      params: {
        filter: buildFilter('roleEntityRefs.id', roleId),
      },
    });
    return convertArrayToPaginatedResponse(response.data);
  }

  /**
   * Update user roles
   */
  static async updateUserRoles(
    userId: string,
    roleEntityRefs: Array<{ id: string; name: string }>
  ): Promise<ApiResponse<User>> {
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
  }

  /**
   * Update user organization
   */
  static async updateUserOrganization(
    userId: string,
    orgEntityRef: { id: string; name: string }
  ): Promise<ApiResponse<User>> {
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
  }
}
