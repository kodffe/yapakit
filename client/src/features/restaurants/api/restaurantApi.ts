import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';

// ─── Types ───

export interface CreateInternalRestaurantPayload {
  name: string;
  type: string;
  phone: string;
  address: string;
}

interface CreateInternalRestaurantResponse {
  success: boolean;
  restaurant: {
    _id: string;
    name: string;
    slug: string;
  };
  membership: {
    _id: string;
    restaurantId: {
      _id: string;
      name: string;
      slug: string;
    };
    tenantRole: string;
  };
}

interface DisableRestaurantResponse {
  success: boolean;
  message: string;
}

// ─── API Calls ───

const createInternalRestaurant = async (
  payload: CreateInternalRestaurantPayload
): Promise<CreateInternalRestaurantResponse> => {
  const response = await api.post<CreateInternalRestaurantResponse>(
    '/restaurants/internal',
    payload
  );
  return response.data;
};

const disableRestaurant = async (restaurantId: string): Promise<DisableRestaurantResponse> => {
  const response = await api.put<DisableRestaurantResponse>(
    `/restaurants/${restaurantId}/disable`
  );
  return response.data;
};

// ─── Hooks ───

export const useCreateInternalRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInternalRestaurant,
    onSuccess: () => {
      // Invalidate any cached membership/restaurant lists
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
};

export const useDisableRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disableRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
};
