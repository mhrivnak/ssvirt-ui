import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CloudApiRoleService } from '../services/cloudapi/RoleService';
import type { Role, RoleQueryParams } from '../types';

/**
 * Hook to fetch all roles
 */
export const useRoles = (params?: RoleQueryParams) => {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => CloudApiRoleService.getRoles(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch all roles as a simple array (for dropdowns)
 */
export const useAllRoles = () => {
  return useQuery({
    queryKey: ['all-roles'],
    queryFn: () => CloudApiRoleService.getAllRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a specific role by ID
 */
export const useRole = (id: string) => {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => CloudApiRoleService.getRole(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a role by name
 */
export const useRoleByName = (name: string) => {
  return useQuery({
    queryKey: ['role-by-name', name],
    queryFn: () => CloudApiRoleService.getRoleByName(name),
    enabled: !!name,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create a new role
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleData: Omit<Role, 'id'>) =>
      CloudApiRoleService.createRole(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
    },
  });
};

/**
 * Hook to update a role
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, roleData }: { id: string; roleData: Partial<Role> }) =>
      CloudApiRoleService.updateRole(id, roleData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', id] });
    },
  });
};

/**
 * Hook to delete a role
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => CloudApiRoleService.deleteRole(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
      queryClient.removeQueries({ queryKey: ['role', id] });
    },
  });
};
