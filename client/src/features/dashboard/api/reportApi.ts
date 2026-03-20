import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';

export interface DailyStats {
  totalSales: number;
  completedOrdersCount: number;
  activeOrdersCount: number;
  totalOrdersToday: number;
}

const getDailyStats = async (): Promise<DailyStats> => {
  const response = await api.get<{ success: boolean; data: DailyStats }>('/reports/daily');
  return response.data.data;
};

export const useDailyStats = () => {
  const currentRestaurantId = useAuthStore((s) => s.currentRestaurantId);

  return useQuery({
    queryKey: ['dailyStats', currentRestaurantId],
    queryFn: getDailyStats,
    enabled: !!currentRestaurantId,
    refetchInterval: 60_000, // Auto-refresh every 60 seconds
  });
};
