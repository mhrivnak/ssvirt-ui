import { cloudApi } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  Role,
  RoleQueryParams,
  CreateRoleRequest,
  UpdateRoleRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export class RoleService {
  /**
   * Get all roles with optional pagination and filtering
   */
  static async getRoles(
    params?: RoleQueryParams
  ): Promise<PaginatedResponse<Role>> {
    const response = await cloudApi.get<Role[]>(
      API_ENDPOINTS.CLOUDAPI.ROLES,
      {
        params,
      }
    );
    // Convert array response to paginated format for compatibility
    return {
      data: response.data,
      total: response.data.length,
      page: 1,
      per_page: response.data.length,
      success: true
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
      message: 'Role retrieved successfully'
    };
  }

  /**
   * Create a new role (if allowed - most roles are read-only in VMware Cloud Director)
   */
  static async createRole(
    data: CreateRoleRequest
  ): Promise<ApiResponse<Role>> {
    const response = await cloudApi.post<Role>(
      API_ENDPOINTS.CLOUDAPI.ROLES,
      data
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'Role created successfully'
    };
  }

  /**
   * Update an existing role (if allowed - most roles are read-only in VMware Cloud Director)
   */
  static async updateRole(
    data: UpdateRoleRequest
  ): Promise<ApiResponse<Role>> {
    const { id, ...updateData } = data;
    const response = await cloudApi.put<Role>(
      API_ENDPOINTS.CLOUDAPI.ROLE_BY_ID(id),
      updateData
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'Role updated successfully'
    };
  }

  /**
   * Delete a role (if allowed - most roles are read-only in VMware Cloud Director)
   */
  static async deleteRole(id: string): Promise<ApiResponse<null>> {
    await cloudApi.delete(
      API_ENDPOINTS.CLOUDAPI.ROLE_BY_ID(id)
    );
    // CloudAPI delete returns no content, create success response
    return {
      data: null,
      success: true,
      message: 'Role deleted successfully'
    };
  }

  /**
   * Get predefined system roles
   */
  static async getSystemRoles(): Promise<PaginatedResponse<Role>> {
    const response = await cloudApi.get<Role[]>(
      API_ENDPOINTS.CLOUDAPI.ROLES,
      {
        params: {
          filter: 'readOnly==true'
        }
      }
    );
    // Convert array response to paginated format for compatibility
    return {
      data: response.data,
      total: response.data.length,
      page: 1,
      per_page: response.data.length,
      success: true
    };
  }

  /**
   * Get custom organization roles
   */
  static async getCustomRoles(): Promise<PaginatedResponse<Role>> {
    const response = await cloudApi.get<Role[]>(
      API_ENDPOINTS.CLOUDAPI.ROLES,
      {
        params: {
          filter: 'readOnly==false'
        }
      }
    );
    // Convert array response to paginated format for compatibility
    return {
      data: response.data,
      total: response.data.length,
      page: 1,
      per_page: response.data.length,
      success: true
    };
  }

  /**
   * Get role by name (helper method for common role lookups)
   */
  static async getRoleByName(name: string): Promise<ApiResponse<Role | null>> {
    const response = await cloudApi.get<Role[]>(
      API_ENDPOINTS.CLOUDAPI.ROLES,
      {
        params: {
          filter: `name==${encodeURIComponent(name)}`
        }
      }
    );
    
    const role = response.data.length > 0 ? response.data[0] : null;
    
    return {
      data: role,
      success: true,
      message: role ? 'Role found' : 'Role not found'
    };
  }

  /**
   * Check if a role exists by name
   */
  static async roleExists(name: string): Promise<boolean> {
    try {
      const result = await this.getRoleByName(name);
      return result.data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get predefined role constants
   */
  static getPredefinedRoles(): Array<{ name: string; description: string; bundleKey: string }> {
    return [
      {
        name: 'System Administrator',
        description: 'Full system access and organization management',
        bundleKey: 'com.vmware.vcloud.system.admin'
      },
      {
        name: 'Organization Administrator', 
        description: 'Full access within assigned organization',
        bundleKey: 'com.vmware.vcloud.organization.admin'
      },
      {
        name: 'vApp User',
        description: 'Basic user access to assigned vApps',
        bundleKey: 'com.vmware.vcloud.vapp.user'
      }
    ];
  }
}