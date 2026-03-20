import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';

export interface StaffMember {
  _id: string;
  membershipId: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  };
  tenantRole: 'manager' | 'cashier' | 'waiter' | 'kitchen';
  isActive: boolean;
  joinedAt: string;
}

export interface AddStaffPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  tenantRole: 'manager' | 'cashier' | 'waiter' | 'kitchen';
}

const getStaff = async (): Promise<StaffMember[]> => {
  const response = await api.get<{ success: boolean; data: StaffMember[] }>('/staff');
  return response.data.data;
};

const addStaff = async (payload: AddStaffPayload): Promise<StaffMember> => {
  const response = await api.post<{ success: boolean; data: StaffMember }>('/staff', payload);
  return response.data.data;
};

export const useStaff = () => {
  const currentRestaurantId = useAuthStore((s) => s.currentRestaurantId);

  return useQuery({
    queryKey: ['staff', currentRestaurantId],
    queryFn: getStaff,
    enabled: !!currentRestaurantId,
  });
};

export const useAddStaff = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((s) => s.currentRestaurantId);

  return useMutation({
    mutationFn: addStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', currentRestaurantId] });
    },
  });
};
