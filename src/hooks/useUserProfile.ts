import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfileService } from '../services';
import { QUERY_KEYS } from '../types';
import type {
  UpdatePreferencesRequest,
  ChangePasswordRequest,
  UpdateSecuritySettingRequest,
  SecuritySetting,
} from '../types';

/**
 * Hook to fetch user preferences
 */
export const useUserPreferences = () => {
  return useQuery({
    queryKey: QUERY_KEYS.userPreferences,
    queryFn: () => UserProfileService.getUserPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to update user preferences
 */
export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdatePreferencesRequest) =>
      UserProfileService.updateUserPreferences(request),
    onSuccess: (data) => {
      // Update the cached preferences data
      queryClient.setQueryData(QUERY_KEYS.userPreferences, data);
    },
    onError: (error) => {
      console.error('Failed to update user preferences:', error);
    },
  });
};

/**
 * Hook to change password
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (request: ChangePasswordRequest) =>
      UserProfileService.changePassword(request),
    onError: (error) => {
      console.error('Failed to change password:', error);
    },
  });
};

/**
 * Hook to fetch security settings
 */
export const useSecuritySettings = () => {
  return useQuery({
    queryKey: QUERY_KEYS.securitySettings,
    queryFn: () => UserProfileService.getSecuritySettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to update a security setting
 */
export const useUpdateSecuritySetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateSecuritySettingRequest) =>
      UserProfileService.updateSecuritySetting(request),
    onSuccess: (updatedSetting, variables) => {
      // Update the security settings cache
      queryClient.setQueryData(QUERY_KEYS.securitySettings, (oldData: SecuritySetting[] | undefined) => {
        if (!oldData) return [updatedSetting];
        
        return oldData.map((setting: SecuritySetting) =>
          setting.id === variables.setting_id ? updatedSetting : setting
        );
      });
    },
    onError: (error) => {
      console.error('Failed to update security setting:', error);
    },
  });
};