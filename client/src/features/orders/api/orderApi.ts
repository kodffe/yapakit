import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';

export interface OrderItemModifier {
  modifierName: string;
  optionName: string;
  extraPrice: number;
}

export interface OrderItem {
  cartItemId?: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  paidQuantity?: number;
  selectedModifiers: OrderItemModifier[];
  notes?: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  requestsInvoice: boolean;
}

export interface OrderPayment {
  amount: number;
  method: 'cash' | 'card' | 'other';
  date: string;
  itemsPaid?: {
    cartItemId?: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  customerData?: OrderCustomer;
}

export interface OrderCreatePayload {
  restaurantId: string;
  orderType?: 'dine-in' | 'takeaway' | 'delivery';
  tableId?: string;
  items: OrderItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount?: number;
  deliveryFee?: number;
  takeawayFee?: number;
  taxAmount: number;
  total: number;
  currency: string;
  customer?: OrderCustomer;
}

export interface Order {
  _id: string;
  restaurantId: string;
  orderNumber: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableName?: string;
  tableId?: string;
  status: 'sent' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  manualDiscount?: number;
  deliveryFee: number;
  takeawayFee: number;
  taxAmount: number;
  total: number;
  currency: string;
  customer?: OrderCustomer;
  payments?: OrderPayment[];
  revision: number;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  waiterId: { _id: string; firstName: string; lastName: string } | string;
}

// ─── Fetchers ───

const getActiveOrders = async (): Promise<Order[]> => {
  const response = await api.get<{ success: boolean; data: Order[] }>('/orders');
  return response.data.data;
};

const createOrder = async (payload: OrderCreatePayload): Promise<Order> => {
  const response = await api.post<{ success: boolean; data: Order }>('/orders', payload);
  return response.data.data;
};

const updateOrderStatus = async ({ orderId, status }: { orderId: string; status: Order['status'] }): Promise<Order> => {
  const response = await api.patch<{ success: boolean; data: Order }>(`/orders/${orderId}/status`, { status });
  return response.data.data;
};

const updateOrder = async ({ orderId, payload }: { orderId: string; payload: Partial<OrderCreatePayload> }): Promise<Order> => {
  const response = await api.put<{ success: boolean; data: Order }>(`/orders/${orderId}`, payload);
  return response.data.data;
};

const cancelOrderApi = async ({ orderId, cancelReason }: { orderId: string; cancelReason: string }): Promise<Order> => {
  const response = await api.put<{ success: boolean; data: Order }>(`/orders/${orderId}/cancel`, { cancelReason });
  return response.data.data;
};

const addOrderPayment = async ({ orderId, payload }: { orderId: string; payload: { amount: number; method: string; itemsPaid?: any[]; customerData?: any } }): Promise<Order> => {
  const response = await api.post<{ success: boolean; data: Order }>(`/orders/${orderId}/payments`, payload);
  return response.data.data;
};

// ─── Hooks ───

export const useActiveOrders = () => {
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useQuery({
    queryKey: ['activeOrders', currentRestaurantId],
    queryFn: getActiveOrders,
    enabled: !!currentRestaurantId,
  });
};

const getCompletedOrders = async (): Promise<Order[]> => {
  const response = await api.get<{ success: boolean; data: Order[] }>('/orders/completed');
  return response.data.data;
};

export const useCompletedOrders = () => {
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useQuery({
    queryKey: ['completedOrders', currentRestaurantId],
    queryFn: getCompletedOrders,
    enabled: !!currentRestaurantId,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // Invalidate active orders to refetch
      queryClient.invalidateQueries({ queryKey: ['activeOrders', currentRestaurantId] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders', currentRestaurantId] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders', currentRestaurantId] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: cancelOrderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders', currentRestaurantId] });
    },
  });
};

export const useAddPayment = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: addOrderPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders', currentRestaurantId] });
    },
  });
};

export interface PaymentHistoryItem {
  orderId: string;
  orderNumber: string;
  tableName?: string;
  orderType: string;
  paymentId: string;
  amount: number;
  method: string;
  status: 'completed' | 'refunded';
  date: string;
  customerData?: OrderCustomer;
}

const getPaymentsHistory = async (params: { startDate?: string; endDate?: string; method?: string }): Promise<PaymentHistoryItem[]> => {
  const query = new URLSearchParams();
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.method && params.method !== 'all') query.append('method', params.method);
  
  const response = await api.get<{ success: boolean; data: PaymentHistoryItem[] }>(`/orders/payments/history?${query.toString()}`);
  return response.data.data;
};

export const usePaymentsHistory = (params: { startDate?: string; endDate?: string; method?: string }) => {
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useQuery({
    queryKey: ['paymentsHistory', currentRestaurantId, params],
    queryFn: () => getPaymentsHistory(params),
    enabled: !!currentRestaurantId,
  });
};

const voidPayment = async ({ orderId, paymentId }: { orderId: string; paymentId: string }): Promise<Order> => {
  const response = await api.put<{ success: boolean; data: Order }>(`/orders/${orderId}/payments/${paymentId}/void`);
  return response.data.data;
};

export const useVoidPayment = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useMutation({
    mutationFn: voidPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentsHistory', currentRestaurantId] });
      queryClient.invalidateQueries({ queryKey: ['activeOrders', currentRestaurantId] });
      queryClient.invalidateQueries({ queryKey: ['completedOrders', currentRestaurantId] });
    },
  });
};

const getOrderById = async (orderId: string): Promise<Order> => {
  const response = await api.get<{ success: boolean; data: Order }>(`/orders/${orderId}`);
  return response.data.data;
};

export const useOrderById = (orderId: string | null) => {
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useQuery({
    queryKey: ['order', currentRestaurantId, orderId],
    queryFn: () => getOrderById(orderId as string),
    enabled: !!currentRestaurantId && !!orderId,
  });
};
