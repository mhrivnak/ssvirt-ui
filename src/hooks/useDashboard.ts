import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../services';
import { QUERY_KEYS } from '../types';

/**
 * Hook to fetch dashboard statistics
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: () => DashboardService.getDashboardStats(),
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes - refresh stats more frequently
  });
};

/**
 * Hook to fetch recent activity
 */
export const useRecentActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.recentActivity, limit],
    queryFn: () => DashboardService.getRecentActivity(limit),
    enabled: true,
    staleTime: 1 * 60 * 1000, // 1 minute - refresh activity more frequently
  });
};
