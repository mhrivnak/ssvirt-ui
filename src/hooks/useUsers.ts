import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserService } from '../services/users';
import type {
  UserQueryParams,
  CreateUserRequest,
  UpdateUserRequest,
} from '../types';
import { QUERY_KEYS } from '../types';

/**
 * Get all users with pagination and filtering
 */
export const useUsers = (params?: UserQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.users, params],
    queryFn: () => UserService.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get a single user by ID
 */
export const useUser = (id: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.users, id],
    queryFn: () => UserService.getUser(id),
    enabled: !!id,
  });
};

/**
 * Get current user information
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: [...QUERY_KEYS.users, 'current'],
    queryFn: () => UserService.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Create a new user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => UserService.createUser(data),
    onSuccess: () => {
      // Invalidate users queries to refresh the list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
  });
};

/**
 * Update an existing user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => UserService.updateUser(data),
    onSuccess: (_, variables) => {
      // Invalidate users queries and specific user query
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.users, variables.id],
      });
    },
  });
};

/**
 * Delete a user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onSuccess: () => {
      // Invalidate users queries to refresh the list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
  });
};

/**
 * Toggle user status (enable/disable)
 */
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      UserService.toggleUserStatus(id, enabled),
    onSuccess: (_, variables) => {
      // Invalidate users queries and specific user query
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.users, variables.id],
      });
    },
  });
};

/**
 * Get users by organization ID
 */
export const useUsersByOrganization = (organizationId: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.users, 'by-organization', organizationId],
    queryFn: () => UserService.getUsersByOrganization(organizationId),
    enabled: !!organizationId,
  });
};

/**
 * Get users by role ID
 */
export const useUsersByRole = (roleId: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.users, 'by-role', roleId],
    queryFn: () => UserService.getUsersByRole(roleId),
    enabled: !!roleId,
  });
};

/**
 * Update user roles
 */
export const useUpdateUserRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      roleEntityRefs,
    }: {
      userId: string;
      roleEntityRefs: Array<{ id: string; name: string }>;
    }) => UserService.updateUserRoles(userId, roleEntityRefs),
    onSuccess: (_, variables) => {
      // Invalidate users queries and specific user query
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.users, variables.userId],
      });
    },
  });
};

/**
 * Update user organization
 */
export const useUpdateUserOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      orgEntityRef,
    }: {
      userId: string;
      orgEntityRef: { id: string; name: string };
    }) => UserService.updateUserOrganization(userId, orgEntityRef),
    onSuccess: (_, variables) => {
      // Invalidate users queries and specific user query
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.users, variables.userId],
      });
    },
  });
};

/**
 * Bulk operations for users
 */
export const useBulkUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userIds,
      enabled,
    }: {
      userIds: string[];
      enabled: boolean;
    }) => {
      // Execute all updates concurrently
      const promises = userIds.map((id) =>
        UserService.toggleUserStatus(id, enabled)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidate users queries to refresh the list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
  });
};

/**
 * Bulk delete users
 */
export const useBulkDeleteUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      // Execute all deletions concurrently
      const promises = userIds.map((id) => UserService.deleteUser(id));
      return Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidate users queries to refresh the list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
  });
};
