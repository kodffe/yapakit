import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';

export interface AdminRestaurant {
  _id: string;
  name: string;
  slug: string;
  subscription: {
    plan: 'basic' | 'pro' | 'plus' | 'custom';
    status: 'trial' | 'active' | 'past_due' | 'expired';
    trialEndsAt: string;
    expiresAt: string;
    features: {
      reservations: boolean;
      advancedAnalytics: boolean;
      kds: boolean;
      splitPayments: boolean;
      staffManagement: boolean;
      prioritySupport: boolean;
      floorPlan: boolean;
    };
  };
  createdAt: string;
  managers?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
}

export interface AdminTicket {
  _id: string;
  restaurantId: {
    _id: string;
    name: string;
    slug: string;
  };
  reportedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface GlobalStats {
  totalRestaurants: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  pastDueSubscriptions: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
}

export interface AdminRestaurantResponse {
  success: boolean;
  total: number;
  page: number;
  pages: number;
  restaurants: AdminRestaurant[];
}

export interface AdminRestaurantsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface AdminManager {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  restaurants: {
    _id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  }[];
}

export interface AdminManagersResponse {
  success: boolean;
  total: number;
  page: number;
  pages: number;
  data: AdminManager[];
}

export interface AdminTicketsResponse {
  success: boolean;
  count: number;
  data: AdminTicket[];
}

/**
 * Fetch all restaurants for the global admin dashboard with pagination
 */
const getAllRestaurants = async (params?: AdminRestaurantsParams): Promise<AdminRestaurantResponse> => {
  const { data } = await api.get<AdminRestaurantResponse>('/admin/restaurants', { params });
  return data;
};

export const useAllRestaurants = (params?: AdminRestaurantsParams) => {
  const { user } = useAuthStore();
  const isGlobalAdmin = user && ['superadmin', 'support', 'sales'].includes(user.systemRole);

  return useQuery({
    queryKey: ['admin', 'restaurants', params],
    queryFn: () => getAllRestaurants(params),
    enabled: !!isGlobalAdmin,
  });
};

/**
 * Fetch all managers
 */
const getAllManagers = async (params?: { page?: number; limit?: number; search?: string }): Promise<AdminManagersResponse> => {
  const { data } = await api.get<AdminManagersResponse>('/admin/managers', { params });
  return data;
};

export const useAllManagers = (params?: { page?: number; limit?: number; search?: string }) => {
  const { user } = useAuthStore();
  const isGlobalAdmin = user && ['superadmin', 'support', 'sales'].includes(user.systemRole);

  return useQuery({
    queryKey: ['admin', 'managers', params],
    queryFn: () => getAllManagers(params),
    enabled: !!isGlobalAdmin,
  });
};

/**
 * Admin: Fetch all support tickets
 */
const getAdminTickets = async (): Promise<AdminTicketsResponse> => {
  const { data } = await api.get<AdminTicketsResponse>('/admin/tickets');
  return data;
};

export const useAdminTickets = () => {
  const { user } = useAuthStore();
  const isEligible = user && ['superadmin', 'support'].includes(user.systemRole);

  return useQuery({
    queryKey: ['admin', 'tickets'],
    queryFn: getAdminTickets,
    enabled: !!isEligible,
  });
};

/**
 * Admin: Update ticket status
 */
const updateTicketStatus = async ({ id, status }: { id: string; status: string }) => {
  const { data } = await api.put(`/admin/tickets/${id}/status`, { status });
  return data;
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTicketStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

/**
 * Admin: Fetch all tenants for Sales/Support
 */
const getAllTenants = async (params?: AdminRestaurantsParams): Promise<AdminRestaurantResponse> => {
  const { data } = await api.get<AdminRestaurantResponse>('/admin/tenants', { params });
  return data;
};

export const useAdminTenants = (params?: AdminRestaurantsParams) => {
  const { user } = useAuthStore();
  const isEligible = user && ['superadmin', 'sales', 'support'].includes(user.systemRole);

  return useQuery({
    queryKey: ['admin', 'tenants', params],
    queryFn: () => getAllTenants(params),
    enabled: !!isEligible,
  });
};

/**
 * Admin: Update Tenant Subscription
 */
export interface UpdateSubscriptionProps {
  id: string;
  plan: string;
  status: string;
  expiresAt: string;
  features: Record<string, boolean>;
}

const updateSubscription = async ({ id, ...payload }: UpdateSubscriptionProps) => {
  const { data } = await api.put(`/admin/tenants/${id}/subscription`, payload);
  return data;
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
};



export interface GlobalStatsResponse {
  success: boolean;
  stats: GlobalStats;
  recentRestaurants: AdminRestaurant[];
  expiringSoonRestaurants: AdminRestaurant[];
  recentTickets: AdminTicket[];
}

/**
 * Fetch global SaaS metrics
 */
const getGlobalStats = async (): Promise<GlobalStatsResponse> => {
  const { data } = await api.get<GlobalStatsResponse>('/admin/stats');
  return data;
};

export const useGlobalStats = () => {
  const { user } = useAuthStore();
  const isGlobalAdmin = user && ['superadmin', 'support', 'sales'].includes(user.systemRole);

  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getGlobalStats,
    enabled: !!isGlobalAdmin,
  });
};
