import { api } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  ApiResponse,
  UserPreferences,
  UpdatePreferencesRequest,
  ChangePasswordRequest,
  SecuritySetting,
  UpdateSecuritySettingRequest,
} from '../types';

/**
 * User Profile Service
 * Handles user preferences, password changes, and security settings
 */
export class UserProfileService {
  /**
   * Get user preferences
   */
  static async getUserPreferences(): Promise<UserPreferences> {
    try {
      const response = await api.get<ApiResponse<UserPreferences>>(
        API_ENDPOINTS.USER_PREFERENCES
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get user preferences');
      }
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    request: UpdatePreferencesRequest
  ): Promise<UserPreferences> {
    try {
      const response = await api.put<ApiResponse<UserPreferences>>(
        API_ENDPOINTS.USER_PREFERENCES,
        request
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update user preferences');
      }
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(request: ChangePasswordRequest): Promise<void> {
    try {
      const response = await api.put<ApiResponse<void>>(
        API_ENDPOINTS.USER_PASSWORD,
        request
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Get user security settings
   */
  static async getSecuritySettings(): Promise<SecuritySetting[]> {
    try {
      const response = await api.get<ApiResponse<SecuritySetting[]>>(
        API_ENDPOINTS.USER_SECURITY_SETTINGS
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get security settings');
      }
    } catch (error) {
      console.error('Failed to get security settings:', error);
      throw error;
    }
  }

  /**
   * Update a specific security setting
   */
  static async updateSecuritySetting(
    request: UpdateSecuritySettingRequest
  ): Promise<SecuritySetting> {
    try {
      const response = await api.put<ApiResponse<SecuritySetting>>(
        API_ENDPOINTS.USER_SECURITY_SETTING(request.setting_id),
        { enabled: request.enabled }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update security setting');
      }
    } catch (error) {
      console.error('Failed to update security setting:', error);
      throw error;
    }
  }
}