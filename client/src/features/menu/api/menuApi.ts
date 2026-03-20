import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';

export interface Category {
  _id: string;
  restaurantId: string;
  name: string;
  color?: string;
  displayOrder: number;
}

export interface ModifierOption {
  name: string;
  price: number;
  isDefault: boolean;
}

export interface MenuItemModifier {
  name: string;
  widgetType: 'radio' | 'checkbox' | 'select' | 'number';
  minChoices: number;
  maxChoices: number;
  options: ModifierOption[];
}

export interface MenuItem {
  _id: string;
  restaurantId: string;
  categoryId: string | { _id: string; name: string; color?: string };
  name: string;
  description?: string;
  price: number;
  region: 'featured' | 'available' | 'unavailable';
  isAvailable: boolean;
  imageUrl?: string;
  trackInventory?: boolean;
  stockQuantity?: number;
  displayOrder?: number;
  modifiers?: MenuItemModifier[];
}

interface CategoriesResponse {
  success: boolean;
  count: number;
  categories: Category[];
}

interface MenuItemsResponse {
  success: boolean;
  count: number;
  items: MenuItem[];
}

// --- API Functions ---

const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<CategoriesResponse>('/menu/categories');
  return data.categories;
};

const getMenuItems = async (): Promise<MenuItem[]> => {
  const { data } = await api.get<MenuItemsResponse>('/menu/items');
  return data.items;
};

const createCategory = async (payload: { name: string; color?: string; displayOrder?: number }): Promise<Category> => {
  const { data } = await api.post<{ success: boolean; category: Category }>('/menu/categories', payload);
  return data.category;
};

const createMenuItem = async (payload: Omit<MenuItem, '_id' | 'restaurantId' | 'isAvailable'>): Promise<MenuItem> => {
  const { data } = await api.post<{ success: boolean; item: MenuItem }>('/menu/items', payload);
  return data.item;
};

const updateCategory = async (payload: { id: string; updates: Partial<Category> }): Promise<Category> => {
  const { data } = await api.put<{ success: boolean; category: Category }>(`/menu/categories/${payload.id}`, payload.updates);
  return data.category;
};

const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/menu/categories/${id}`);
};

const reorderCategories = async (orderedIds: string[]): Promise<void> => {
  await api.put('/menu/categories/reorder', { orderedIds });
};

const updateMenuItemAsync = async (payload: { id: string; updates: Partial<MenuItem> }): Promise<MenuItem> => {
  const { data } = await api.put<{ success: boolean; item: MenuItem }>(`/menu/items/${payload.id}`, payload.updates);
  return data.item;
};

const deleteMenuItemAsync = async (id: string): Promise<void> => {
  await api.delete(`/menu/items/${id}`);
};

const reorderMenuItemsAsync = async (items: { _id: string; displayOrder: number }[]): Promise<void> => {
  await api.put('/menu/items/reorder', { items });
};

// --- Hooks ---

export const useCategories = () => {
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useQuery({
    queryKey: ['categories', currentRestaurantId],
    queryFn: getCategories,
    enabled: !!currentRestaurantId,
  });
};

export const useMenuItems = () => {
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useQuery({
    queryKey: ['menuItems', currentRestaurantId],
    queryFn: getMenuItems,
    enabled: !!currentRestaurantId,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', currentRestaurantId] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', currentRestaurantId] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', currentRestaurantId] });
      queryClient.invalidateQueries({ queryKey: ['menuItems', currentRestaurantId] });
    },
  });
};

export const useReorderCategories = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: reorderCategories,
    onMutate: async (orderedIds) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['categories', currentRestaurantId] });
      const previousCategories = queryClient.getQueryData<Category[]>(['categories', currentRestaurantId]);
      
      if (previousCategories) {
         const newOrder = [...previousCategories].sort((a, b) => 
            orderedIds.indexOf(a._id) - orderedIds.indexOf(b._id)
         );
         queryClient.setQueryData(['categories', currentRestaurantId], newOrder);
      }
      return { previousCategories };
    },
    onError: (_err, _newOrder, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories', currentRestaurantId], context.previousCategories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', currentRestaurantId] });
    },
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', currentRestaurantId] });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: updateMenuItemAsync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', currentRestaurantId] });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: deleteMenuItemAsync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', currentRestaurantId] });
    },
  });
};

export const useReorderMenuItems = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: reorderMenuItemsAsync,
    onMutate: async (orderedItems) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['menuItems', currentRestaurantId] });
      const previousItems = queryClient.getQueryData<MenuItem[]>(['menuItems', currentRestaurantId]);
      
      if (previousItems) {
         // Create a map of the new orders
         const orderMap = new Map(orderedItems.map(item => [item._id, item.displayOrder]));
         
         const newOrder = previousItems.map(item => {
             if(orderMap.has(item._id)){
                 return { ...item, displayOrder: orderMap.get(item._id)! };
             }
             return item;
         }).sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0));
         
         queryClient.setQueryData(['menuItems', currentRestaurantId], newOrder);
      }
      return { previousItems };
    },
    onError: (_err, _newOrder, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['menuItems', currentRestaurantId], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', currentRestaurantId] });
    },
  });
};
