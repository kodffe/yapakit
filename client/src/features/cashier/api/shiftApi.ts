import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';

export interface Shift {
  _id: string;
  restaurantId: string;
  cashierId: string;
  startTime: string;
  endTime?: string;
  startingCash: number;
  expectedCash?: number;
  actualCash?: number;
  status: 'open' | 'closed';
}

/**
 * Fetch the current open shift for the acting cashier/manager
 */
const getCurrentShift = async (restaurantId: string): Promise<Shift | null> => {
  const { data } = await api.get<{ success: boolean; data: Shift | null }>('/shifts/current', {
    headers: { 'x-restaurant-id': restaurantId },
  });
  return data.data;
};

export const useCurrentShift = () => {
  const { currentRestaurantId } = useAuthStore();

  return useQuery({
    queryKey: ['currentShift', currentRestaurantId],
    queryFn: () => getCurrentShift(currentRestaurantId!),
    enabled: !!currentRestaurantId,
  });
};

/**
 * Open a new shift
 */
const openShift = async (params: { restaurantId: string; startingCash: number }): Promise<Shift> => {
  const { data } = await api.post<{ success: boolean; data: Shift }>(
    '/shifts/open',
    { startingCash: params.startingCash },
    { headers: { 'x-restaurant-id': params.restaurantId } }
  );
  return data.data;
};

export const useOpenShift = () => {
  const queryClient = useQueryClient();
  const { currentRestaurantId } = useAuthStore();

  return useMutation({
    mutationFn: (startingCash: number) => openShift({ restaurantId: currentRestaurantId!, startingCash }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentShift'] });
    },
  });
};

/**
 * Close the current shift
 */
const closeShift = async (params: { restaurantId: string; actualCash: number }): Promise<Shift> => {
  const { data } = await api.post<{ success: boolean; data: Shift }>(
    '/shifts/close',
    { actualCash: params.actualCash },
    { headers: { 'x-restaurant-id': params.restaurantId } }
  );
  return data.data;
};

export const useCloseShift = () => {
  const queryClient = useQueryClient();
  const { currentRestaurantId } = useAuthStore();

  return useMutation({
    mutationFn: (actualCash: number) => closeShift({ restaurantId: currentRestaurantId!, actualCash }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentShift'] });
    },
  });
};
