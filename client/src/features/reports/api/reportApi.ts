import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';

export interface DashboardTotals {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface SalesTrend {
  date: string;
  totalSales: number;
  orderCount: number;
}

export interface TopItem {
  name: string;
  quantity: number;
}

export interface DashboardStats {
  totals: DashboardTotals;
  salesTrend: SalesTrend[];
  topItems: TopItem[];
}

export interface DashboardStatsParams {
  startDate?: string;
  endDate?: string;
}

const getDashboardStats = async (params: DashboardStatsParams = {}): Promise<DashboardStats> => {
  const response = await api.get<{ success: boolean; data: DashboardStats }>('/reports/dashboard', {
    params,
  });
  return response.data.data;
};

export const useDashboardStats = (params: DashboardStatsParams = {}) => {
  const currentRestaurantId = useAuthStore((s: any) => s.currentRestaurantId);

  return useQuery({
    queryKey: ['dashboardStats', currentRestaurantId, params.startDate, params.endDate],
    queryFn: () => getDashboardStats(params),
    enabled: !!currentRestaurantId,
    refetchInterval: 60_000, // Optional: auto-refresh
  });
};
