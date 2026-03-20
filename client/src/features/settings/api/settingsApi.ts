import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import useCartStore from '../../../store/cartStore';

export interface OperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface PaymentMethod {
  _id?: string;
  name: string;
  isExactAmountOnly: boolean;
  isActive: boolean;
}

export interface RestaurantSettings {
  taxRate: number;
  currency: string;
  enabledOrderTypes: ('dine-in' | 'takeaway' | 'delivery')[];
  defaultDeliveryFee: number;
  defaultTakeawayFee: number;
  logoUrl: string;
  heroImageUrl: string;
  reservationDuration: number;
  operatingHours: OperatingHour[];
  paymentMethods: PaymentMethod[];
}

export interface RestaurantDetails {
  name: string;
  address: string;
  phone: string;
  branding: {
    palette: 'spicy-red' | 'sunset-orange' | 'earthy-green' | 'warm-mustard' | 'coffee-brown' | 'custom';
    primaryColor: string;
    fontFamily: 'modern' | 'elegant' | 'casual';
    publicLayout: 'classic-tabs' | 'visual-grid' | 'minimal-list';
  };
  settings: RestaurantSettings;
  subscription?: {
    plan: string;
    status: string;
    trialEndsAt: string;
    expiresAt: string;
    features: Record<string, boolean>;
  };
}

// ─── Fetchers ───

const getRestaurantDetails = async (restaurantId: string): Promise<RestaurantDetails> => {
  const response = await api.get<{ success: boolean; name: string; address: string; phone: string; branding: any; settings: RestaurantSettings; subscription?: any }>(
    `/restaurants/${restaurantId}/settings`
  );
  return {
    name: response.data.name,
    address: response.data.address || '',
    phone: response.data.phone || '',
    branding: response.data.branding || { palette: 'custom', primaryColor: '#2563EB', fontFamily: 'modern', publicLayout: 'classic-tabs' },
    settings: {
      ...response.data.settings,
      taxRate: response.data.settings?.taxRate ?? 10,
      currency: response.data.settings?.currency || 'USD',
      enabledOrderTypes: response.data.settings?.enabledOrderTypes || ['dine-in', 'takeaway', 'delivery'],
      defaultDeliveryFee: response.data.settings?.defaultDeliveryFee ?? 0,
      defaultTakeawayFee: response.data.settings?.defaultTakeawayFee ?? 0,
      logoUrl: response.data.settings?.logoUrl || '',
      heroImageUrl: response.data.settings?.heroImageUrl || '',
      reservationDuration: response.data.settings?.reservationDuration ?? 90,
      operatingHours: response.data.settings?.operatingHours || [
        { dayOfWeek: 0, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 1, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 6, openTime: '09:00', closeTime: '22:00', isClosed: false },
      ],
      paymentMethods: response.data.settings?.paymentMethods || [
        { name: 'Cash', isExactAmountOnly: false, isActive: true },
        { name: 'Card', isExactAmountOnly: true, isActive: true }
      ],
    },
    subscription: response.data.subscription,
  };
};

const updateRestaurantSettings = async (data: Partial<RestaurantDetails>): Promise<RestaurantDetails> => {
  const payload = {
    name: data.name,
    address: data.address,
    phone: data.phone,
    taxRate: data.settings?.taxRate,
    currency: data.settings?.currency,
    enabledOrderTypes: data.settings?.enabledOrderTypes,
    defaultDeliveryFee: data.settings?.defaultDeliveryFee,
    defaultTakeawayFee: data.settings?.defaultTakeawayFee,
    logoUrl: data.settings?.logoUrl,
    heroImageUrl: data.settings?.heroImageUrl,
    branding: data.branding,
    reservationDuration: data.settings?.reservationDuration,
    operatingHours: data.settings?.operatingHours,
    paymentMethods: data.settings?.paymentMethods,
  };
  const response = await api.put<{ success: boolean; data: RestaurantDetails }>('/restaurants/settings', payload);
  return response.data.data;
};

// ─── Hooks ───

export const useRestaurantDetails = () => {
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);

  return useQuery({
    queryKey: ['restaurantSettings', currentRestaurantId],
    queryFn: () => getRestaurantDetails(currentRestaurantId!),
    enabled: !!currentRestaurantId,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  const currentRestaurantId = useAuthStore((state) => state.currentRestaurantId);
  const setTaxRate = useCartStore((state) => state.setTaxRate);
  const setCurrency = useCartStore((state) => state.setCurrency);

  return useMutation({
    mutationFn: updateRestaurantSettings,
    onSuccess: (data) => {
      // Invalidate the cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['restaurantSettings', currentRestaurantId] });

      // Live update the POS cart store if tax or currency changed
      if (data.settings.taxRate !== undefined) {
        setTaxRate(data.settings.taxRate);
      }
      if (data.settings.currency !== undefined) {
        setCurrency(data.settings.currency);
      }
    },
  });
};
