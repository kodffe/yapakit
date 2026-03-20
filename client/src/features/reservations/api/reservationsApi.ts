import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';

export interface Reservation {
  _id: string;
  restaurantId: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  tableId?: {
    _id: string;
    name: string;
    capacity: number;
  };
  specialRequests?: string;
  createdAt: string;
}

export const useStaffReservations = () => {
  return useQuery({
    queryKey: ['staffReservations'],
    queryFn: async (): Promise<Reservation[]> => {
      const { data } = await api.get<{ success: boolean; data: Reservation[] }>('/reservations');
      return data.data;
    },
  });
};

export const useUpdateReservationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, tableId }: { id: string; status: string; tableId?: string }) => {
      const { data } = await api.put<{ success: boolean; data: Reservation }>(`/reservations/${id}/status`, {
        status,
        tableId,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffReservations'] });
    },
  });
};
