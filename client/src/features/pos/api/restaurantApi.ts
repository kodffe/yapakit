import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';

export interface RestaurantSettings {
  taxRate: number;
  currency: string;
}

interface SettingsResponse {
  success: boolean;
  settings: RestaurantSettings;
}

const getRestaurantSettings = async (restaurantId: string): Promise<RestaurantSettings> => {
  const response = await api.get<SettingsResponse>(`/restaurants/${restaurantId}/settings`);
  const settings = response.data.settings || {};
  return {
    taxRate: settings.taxRate ?? 10,
    currency: settings.currency || 'USD',
  };
};

export const useRestaurantSettings = () => {
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useQuery({
    queryKey: ['posRestaurantSettings', currentRestaurantId],
    queryFn: () => getRestaurantSettings(currentRestaurantId!),
    enabled: !!currentRestaurantId,
  });
};
