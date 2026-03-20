import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';

export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  systemRole: 'superadmin' | 'support' | 'sales' | 'none';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminUsersResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: AdminUser[];
}

export interface AdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

// --- API Functions ---

const getAdminUsers = async (params?: AdminUsersParams): Promise<AdminUsersResponse> => {
  const { data } = await api.get<AdminUsersResponse>('/admin/users', { params });
  return data;
};

const createAdminUser = async (payload: Partial<AdminUser> & { password?: string }): Promise<AdminUser> => {
  const { data } = await api.post<AdminUserResponse>('/admin/users', payload);
  return data.data;
};

const updateAdminUser = async (payload: { id: string; updates: Partial<AdminUser> }): Promise<AdminUser> => {
  const { data } = await api.put<AdminUserResponse>(`/admin/users/${payload.id}`, payload.updates);
  return data.data;
};

const removeAdminUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

interface AdminUserResponse {
  success: boolean;
  data: AdminUser;
}

// --- Hooks ---

export const useAdminUsers = (params?: AdminUsersParams) => {
  return useQuery({
    queryKey: ['adminUsers', params],
    queryFn: () => getAdminUsers(params),
  });
};

export const useCreateAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
};

export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
};

export const useRemoveAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
};
