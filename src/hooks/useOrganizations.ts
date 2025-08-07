import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrganizationService } from '../services';
import { QUERY_KEYS } from '../types';
import type {
  OrganizationQueryParams,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  InviteUserRequest,
  UpdateUserRoleRequest,
} from '../types';

/**
 * Hook to fetch all organizations
 */
export const useOrganizations = (params?: OrganizationQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.organizations, params],
    queryFn: () => OrganizationService.getOrganizations(params),
    enabled: true,
  });
};

/**
 * Hook to fetch a single organization
 */
export const useOrganization = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.organization(id),
    queryFn: () => OrganizationService.getOrganization(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new organization
 */
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationRequest) =>
      OrganizationService.createOrganization(data),
    onSuccess: () => {
      // Invalidate and refetch organizations list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
    },
    onError: (error) => {
      console.error('Failed to create organization:', error);
    },
  });
};

/**
 * Hook to update an organization
 */
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOrganizationRequest) =>
      OrganizationService.updateOrganization(data),
    onSuccess: (response, variables) => {
      // Update the specific organization in cache
      queryClient.setQueryData(QUERY_KEYS.organization(variables.id), response);

      // Invalidate organizations list to refresh
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
    },
    onError: (error) => {
      console.error('Failed to update organization:', error);
    },
  });
};

/**
 * Hook to delete an organization
 */
export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => OrganizationService.deleteOrganization(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.organization(deletedId),
      });

      // Invalidate organizations list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });

      // Also invalidate VDCs that might be associated with this organization
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.vdcsByOrg(deletedId),
      });
    },
    onError: (error) => {
      console.error('Failed to delete organization:', error);
    },
  });
};

/**
 * Hook to toggle organization status (enable/disable)
 */
export const useToggleOrganizationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      OrganizationService.toggleOrganizationStatus(id, enabled),
    onSuccess: (response, variables) => {
      // Update the specific organization in cache
      queryClient.setQueryData(QUERY_KEYS.organization(variables.id), response);

      // Invalidate organizations list to refresh
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
    },
    onError: (error) => {
      console.error('Failed to toggle organization status:', error);
    },
  });
};

/**
 * Hook to fetch organization users
 */
export const useOrganizationUsers = (organizationId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.organizationUsers(organizationId),
    queryFn: () => OrganizationService.getOrganizationUsers(organizationId),
    enabled: !!organizationId,
  });
};

/**
 * Hook to invite a user to an organization
 */
export const useInviteUserToOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, data }: { organizationId: string; data: InviteUserRequest }) =>
      OrganizationService.inviteUserToOrganization(organizationId, data),
    onSuccess: (_, variables) => {
      // Invalidate organization users list to refresh
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.organizationUsers(variables.organizationId),
      });
    },
    onError: (error) => {
      console.error('Failed to invite user to organization:', error);
    },
  });
};

/**
 * Hook to update a user's role in an organization
 */
export const useUpdateOrganizationUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, data }: { organizationId: string; data: UpdateUserRoleRequest }) =>
      OrganizationService.updateOrganizationUserRole(organizationId, data),
    onSuccess: (_, variables) => {
      // Invalidate organization users list to refresh
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.organizationUsers(variables.organizationId),
      });
    },
    onError: (error) => {
      console.error('Failed to update organization user role:', error);
    },
  });
};

/**
 * Hook to remove a user from an organization
 */
export const useRemoveUserFromOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      OrganizationService.removeUserFromOrganization(organizationId, userId),
    onSuccess: (_, variables) => {
      // Invalidate organization users list to refresh
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.organizationUsers(variables.organizationId),
      });
    },
    onError: (error) => {
      console.error('Failed to remove user from organization:', error);
    },
  });
};
