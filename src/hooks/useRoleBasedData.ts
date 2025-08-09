import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useRole } from './useRole';
import { OrganizationService } from '../services/cloudapi/OrganizationService';
import { UserService } from '../services/cloudapi/UserService';
import { VMService } from '../services/vms';
import { VDCService } from '../services/vdcs';
import type {
  Organization,
  User,
  VM,
  VDC,
  VMQueryParams,
  VCloudPaginatedResponse,
  ApiResponse,
} from '../types';
import { ROLE_NAMES, QUERY_KEYS } from '../types';

/**
 * Get organizations based on user role capabilities
 */
export const useRoleBasedOrganizations = (): UseQueryResult<
  VCloudPaginatedResponse<Organization>
> => {
  const { capabilities, sessionData } = useRole();

  return useQuery({
    queryKey: [...QUERY_KEYS.organizations, capabilities.primaryOrganization],
    queryFn: async () => {
      if (capabilities.canManageSystem) {
        // System admin can see all organizations
        return OrganizationService.getOrganizations();
      } else if (capabilities.canManageOrganizations) {
        // Org admin sees only their organization(s)
        const orgIds = [capabilities.primaryOrganization];
        if (capabilities.operatingOrganization) {
          orgIds.push(capabilities.operatingOrganization);
        }

        // Get specific organizations
        const organizations: Organization[] = [];
        for (const orgId of orgIds) {
          try {
            const orgResponse =
              await OrganizationService.getOrganization(orgId);
            organizations.push(orgResponse.data);
          } catch (error) {
            console.warn(`Could not fetch organization ${orgId}:`, error);
          }
        }

        return {
          resultTotal: organizations.length,
          pageCount: 1,
          page: 1,
          pageSize: organizations.length,
          values: organizations,
        };
      }

      // vApp users don't typically manage organizations
      return {
        resultTotal: 0,
        pageCount: 0,
        page: 1,
        pageSize: 0,
        values: [],
      };
    },
    enabled: capabilities.canManageOrganizations && !!sessionData,
  });
};

/**
 * Get VMs based on user role and scope
 */
export const useRoleBasedVMs = (
  queryParams?: VMQueryParams
): UseQueryResult<ApiResponse<VM[]>> => {
  const { capabilities, activeRole, sessionData } = useRole();

  return useQuery({
    queryKey: [...QUERY_KEYS.vms, activeRole, capabilities, queryParams],
    queryFn: async () => {
      let params = { ...queryParams };

      if (activeRole === ROLE_NAMES.VAPP_USER) {
        // Filter to only user's VMs
        params = {
          ...params,
          organization_id: capabilities.primaryOrganization,
        };
        // In a real implementation, you'd also filter by user ownership
      } else if (activeRole === ROLE_NAMES.ORG_ADMIN) {
        // Filter to organization's VMs
        const orgId =
          capabilities.operatingOrganization ||
          capabilities.primaryOrganization;
        params = { ...params, organization_id: orgId };
      }
      // System admin sees all VMs (no additional filtering)

      return VMService.getVMs(params);
    },
    enabled: capabilities.canManageVMs && !!sessionData,
  });
};

/**
 * Get VDCs based on user role and scope
 */
export const useRoleBasedVDCs = (): UseQueryResult<ApiResponse<VDC[]>> => {
  const { capabilities, activeRole, sessionData } = useRole();

  return useQuery({
    queryKey: [...QUERY_KEYS.vdcs, activeRole, capabilities],
    queryFn: async () => {
      if (activeRole === ROLE_NAMES.SYSTEM_ADMIN) {
        // System admin sees all VDCs
        return VDCService.getVDCs();
      } else if (activeRole === ROLE_NAMES.ORG_ADMIN) {
        // Org admin sees only their organization's VDCs
        const orgId =
          capabilities.operatingOrganization ||
          capabilities.primaryOrganization;
        return VDCService.getVDCsByOrganization(orgId);
      }

      // vApp users might see VDCs they have access to
      const orgId = capabilities.primaryOrganization;
      return VDCService.getVDCsByOrganization(orgId);
    },
    enabled: capabilities.canManageOrganizations && !!sessionData,
  });
};

/**
 * Get users based on role and scope
 */
export const useRoleBasedUsers = (): UseQueryResult<
  VCloudPaginatedResponse<User>
> => {
  const { capabilities, activeRole, sessionData } = useRole();

  return useQuery({
    queryKey: [...QUERY_KEYS.users, activeRole, capabilities],
    queryFn: async () => {
      if (activeRole === ROLE_NAMES.SYSTEM_ADMIN) {
        // System admin sees all users
        return UserService.getUsers();
      } else if (activeRole === ROLE_NAMES.ORG_ADMIN) {
        // Org admin sees only their organization's users
        const orgId =
          capabilities.operatingOrganization ||
          capabilities.primaryOrganization;
        return UserService.getUsers({ orgId });
      }

      // vApp users typically don't manage other users
      return {
        resultTotal: 0,
        pageCount: 0,
        page: 1,
        pageSize: 0,
        values: [],
      };
    },
    enabled: capabilities.canManageUsers && !!sessionData,
  });
};

/**
 * Get current user's VMs (for vApp users)
 */
export const useUserVMs = (): UseQueryResult<ApiResponse<VM[]>> => {
  const { sessionData, capabilities } = useRole();

  return useQuery({
    queryKey: [...QUERY_KEYS.vms, 'user', sessionData?.user.id],
    queryFn: async () => {
      // Filter VMs to only those owned by the current user
      return VMService.getVMs({
        organization_id: capabilities.primaryOrganization,
        // In real implementation, add user filtering here
      });
    },
    enabled: !!sessionData,
  });
};

/**
 * Get organization statistics for dashboard
 */
export const useOrganizationStats = (
  organizationId?: string
): UseQueryResult<unknown> => {
  const { capabilities, sessionData } = useRole();

  return useQuery({
    queryKey: ['org-stats', organizationId],
    queryFn: async () => {
      // Mock implementation - in real app, this would call actual stats API
      return {
        vdcCount: 3,
        vmCount: 42,
        userCount: 15,
        catalogCount: 8,
      };
    },
    enabled:
      !!organizationId && capabilities.canManageOrganizations && !!sessionData,
  });
};

/**
 * Get system-wide statistics for system admin dashboard
 */
export const useSystemStats = (): UseQueryResult<unknown> => {
  const { capabilities, sessionData } = useRole();

  return useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      // Mock implementation - in real app, this would call actual system stats API
      return {
        organizationCount: 15,
        userCount: 347,
        activeVMCount: 1248,
        resourceUtilization: 67,
        organizationGrowth: 12,
        userGrowth: 8,
        vmGrowth: 23,
        resourceTrend: 5,
      };
    },
    enabled: capabilities.canManageSystem && !!sessionData,
  });
};

/**
 * Get organization resource usage
 */
export const useOrganizationResourceUsage = (
  organizationId?: string
): UseQueryResult<unknown> => {
  const { capabilities, sessionData } = useRole();

  return useQuery({
    queryKey: ['org-resource-usage', organizationId],
    queryFn: async () => {
      // Mock implementation - in real app, this would call actual resource usage API
      return {
        cpu: { used: 24, allocated: 48, percentage: 50 },
        memory: { used: 64, allocated: 128, percentage: 50 },
        storage: { used: 2.5, allocated: 10, percentage: 25 },
      };
    },
    enabled:
      !!organizationId && capabilities.canManageOrganizations && !!sessionData,
  });
};

/**
 * Get available templates for user
 */
export const useAvailableTemplates = (): UseQueryResult<unknown> => {
  const { sessionData } = useRole();

  return useQuery({
    queryKey: ['available-templates'],
    queryFn: async () => {
      // Mock implementation - in real app, this would call catalog API
      return [
        {
          id: 'template-1',
          name: 'Ubuntu 20.04 LTS',
          description: 'Standard Ubuntu development environment',
          os_type: 'Linux',
          cpu_count: 2,
          memory_mb: 4096,
        },
        {
          id: 'template-2',
          name: 'Windows Server 2019',
          description: 'Windows Server for development and testing',
          os_type: 'Windows',
          cpu_count: 2,
          memory_mb: 8192,
        },
      ];
    },
    enabled: !!sessionData,
  });
};
