import { api } from './api';
import type {
  DashboardStats,
  RecentActivity,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export class DashboardService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await api.get<ApiResponse<DashboardStats>>(
      '/api/v1/dashboard/stats'
    );
    return response.data;
  }

  /**
   * Get recent activity feed
   */
  static async getRecentActivity(
    limit: number = 10
  ): Promise<PaginatedResponse<RecentActivity>> {
    const response = await api.get<PaginatedResponse<RecentActivity>>(
      '/api/v1/dashboard/activity',
      {
        params: { per_page: limit },
      }
    );
    return response.data;
  }
}
