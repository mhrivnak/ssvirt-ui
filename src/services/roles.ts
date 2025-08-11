import { cloudApi } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  Role,
  RoleQueryParams,
  CreateRoleRequest,
  UpdateRoleRequest,
  ApiResponse,
  PaginatedResponse,
  VCloudPaginatedResponse,
} from '../types';

export class RoleService {
  /**
   * Get all roles with optional pagination and filtering
   */
  static async getRoles(
    params?: RoleQueryParams
  ): Promise<PaginatedResponse<Role>> {
    const response = await cloudApi.get<VCloudPaginatedResponse<Role>>(
      API_ENDPOINTS.CLOUDAPI.ROLES,
      {
        params,
      }
    );

    // Handle VCloudPaginatedResponse format
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
  }

  /**
   * Get a single role by ID
   */
  static async getRole(id: string): Promise<ApiResponse<Role>> {
    const response = await cloudApi.get<Role>(
      API_ENDPOINTS.CLOUDAPI.ROLE_BY_ID(id)
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'Role retrieved successfully',
    };
  }

  /**
   * Create a new role (if allowed - most roles are read-only in VMware Cloud Director)
   */
  static async createRole(data: CreateRoleRequest): Promise<ApiResponse<Role>> {
    const response = await cloudApi.post<Role>(
      API_ENDPOINTS.CLOUDAPI.ROLES,
      data
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'Role created successfully',
    };
  }

  /**
   * Update an existing role (if allowed - most roles are read-only in VMware Cloud Director)
   */
  static async updateRole(data: UpdateRoleRequest): Promise<ApiResponse<Role>> {
    const { id, ...updateData } = data;
    const response = await cloudApi.put<Role>(
      API_ENDPOINTS.CLOUDAPI.ROLE_BY_ID(id),
      updateData
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'Role updated successfully',
    };
  }

  /**
   * Delete a role (if allowed - most roles are read-only in VMware Cloud Director)
   */
  static async deleteRole(id: string): Promise<ApiResponse<null>> {
    await cloudApi.delete(API_ENDPOINTS.CLOUDAPI.ROLE_BY_ID(id));
    // CloudAPI delete returns no content, create success response
    return {
      data: null,
      success: true,
      message: 'Role deleted successfully',
    };
  }

  /**
   * Get predefined system roles
   */
  static async getSystemRoles(): Promise<PaginatedResponse<Role>> {
    const response = await cloudApi.get<VCloudPaginatedResponse<Role>>(
      API_ENDPOINTS.CLOUDAPI.ROLES,
      {
        params: {
          filter: 'readOnly==true',
        },
      }
    );
    // Handle VCloudPaginatedResponse format
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
  }

  /**
   * Get custom organization roles
   */
  static async getCustomRoles(): Promise<PaginatedResponse<Role>> {
    const response = await cloudApi.get<VCloudPaginatedResponse<Role>>(
      API_ENDPOINTS.CLOUDAPI.ROLES,
      {
        params: {
          filter: 'readOnly==false',
        },
      }
    );
    // Handle VCloudPaginatedResponse format
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
  }

  /**
   * Get role by name (helper method for common role lookups)
   */
  static async getRoleByName(name: string): Promise<ApiResponse<Role | null>> {
    const response = await cloudApi.get<VCloudPaginatedResponse<Role>>(
      API_ENDPOINTS.CLOUDAPI.ROLES,
      {
        params: {
          filter: `name==${name}`,
        },
      }
    );

    const roles = response.data.values || [];
    const role = roles.length > 0 ? roles[0] : null;

    return {
      data: role,
      success: true,
      message: role ? 'Role found' : 'Role not found',
    };
  }

  /**
   * Check if a role exists by name
   */
  static async roleExists(name: string): Promise<boolean> {
    try {
      const result = await this.getRoleByName(name);
      return result.data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get predefined role constants
   */
  static getPredefinedRoles(): Array<{
    name: string;
    description: string;
    bundleKey: string;
  }> {
    return [
      {
        name: 'System Administrator',
        description: 'Full system access and organization management',
        bundleKey: 'com.vmware.vcloud.system.admin',
      },
      {
        name: 'Organization Administrator',
        description: 'Full access within assigned organization',
        bundleKey: 'com.vmware.vcloud.organization.admin',
      },
      {
        name: 'vApp User',
        description: 'Basic user access to assigned vApps',
        bundleKey: 'com.vmware.vcloud.vapp.user',
      },
    ];
  }
}
