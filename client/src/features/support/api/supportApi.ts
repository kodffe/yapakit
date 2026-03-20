import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';

interface CreateTicketData {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export const useSupportApi = () => {
  const { token, currentRestaurantId } = useAuthStore();
  const queryClient = useQueryClient();

  const getTenantTickets = async () => {
    const { data } = await api.get('/tickets');
    return data;
  };

  const createTicket = async (ticketData: CreateTicketData) => {
    const { data } = await api.post('/tickets', ticketData);
    return data;
  };

  return {
    useTenantTickets: () =>
      useQuery({
        queryKey: ['tenant-tickets', currentRestaurantId],
        queryFn: getTenantTickets,
        enabled: !!token && !!currentRestaurantId,
      }),

    useCreateTicket: () =>
      useMutation({
        mutationFn: createTicket,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['tenant-tickets', currentRestaurantId] });
        },
      }),
  };
};
