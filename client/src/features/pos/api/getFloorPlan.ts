import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';

/**
 * Table interface matching the backend Table model.
 */
export interface FloorTable {
  _id: string;
  restaurantId: string;
  zoneId: string;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'out_of_service';
  createdAt: string;
  updatedAt: string;
}

/**
 * Zone interface matching the backend Zone model.
 */
export interface FloorZone {
  _id: string;
  restaurantId: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ZonesResponse {
  success: boolean;
  count: number;
  zones: FloorZone[];
}

interface TablesResponse {
  success: boolean;
  count: number;
  tables: FloorTable[];
}

/**
 * Fetches all zones and tables for the current restaurant.
 */
const getFloorPlan = async (): Promise<{ zones: FloorZone[]; tables: FloorTable[] }> => {
  const [zonesRes, tablesRes] = await Promise.all([
    api.get<ZonesResponse>('/zones'),
    api.get<TablesResponse>('/zones/tables'),
  ]);

  return {
    zones: zonesRes.data.zones,
    tables: tablesRes.data.tables,
  };
};

/**
 * TanStack Query hook for the floor plan (zones + tables).
 */
export const useFloorPlan = () => {
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useQuery({
    queryKey: ['floorPlan', currentRestaurantId],
    queryFn: getFloorPlan,
    enabled: !!currentRestaurantId,
  });
};

// ─── Helper to get invalidation key ───

const useFloorPlanKey = () => {
  const currentRestaurantId = useAuthStore((s) => s.currentRestaurantId);
  return ['floorPlan', currentRestaurantId];
};

// ─── Zone Mutations ───

export const useCreateZone = () => {
  const queryClient = useQueryClient();
  const key = useFloorPlanKey();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      api.post<{ success: boolean; zone: FloorZone }>('/zones', payload).then((r) => r.data.zone),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};

export const useUpdateZone = () => {
  const queryClient = useQueryClient();
  const key = useFloorPlanKey();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; description?: string; isActive?: boolean }) =>
      api.put<{ success: boolean; zone: FloorZone }>(`/zones/${id}`, data).then((r) => r.data.zone),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};

export const useDeleteZone = () => {
  const queryClient = useQueryClient();
  const key = useFloorPlanKey();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/zones/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};

// ─── Table Mutations ───

export const useCreateTable = () => {
  const queryClient = useQueryClient();
  const key = useFloorPlanKey();
  return useMutation({
    mutationFn: (payload: { zoneId: string; name: string; capacity?: number }) =>
      api.post<{ success: boolean; table: FloorTable }>('/zones/tables', payload).then((r) => r.data.table),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();
  const key = useFloorPlanKey();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; capacity?: number; status?: string }) =>
      api.put<{ success: boolean; table: FloorTable }>(`/zones/tables/${id}`, data).then((r) => r.data.table),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();
  const key = useFloorPlanKey();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/zones/tables/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};
