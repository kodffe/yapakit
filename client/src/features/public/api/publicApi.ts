import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../services/api';

interface PublicRestaurant {
  _id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  logoUrl: string;
  heroImageUrl: string;
  branding: {
    primaryColor: string;
    fontFamily: 'modern' | 'elegant' | 'casual';
    publicLayout?: 'classic-tabs' | 'visual-grid' | 'minimal-list';
  };
  currency: string;
}

interface PublicMenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  region: string;
  trackInventory?: boolean;
  stockQuantity?: number;
}

interface PublicCategory {
  _id: string;
  name: string;
  displayOrder: number;
}

interface PublicMenuData {
  restaurantName: string;
  branding: {
    primaryColor: string;
    fontFamily: 'modern' | 'elegant' | 'casual';
    publicLayout?: 'classic-tabs' | 'visual-grid' | 'minimal-list';
  };
  currency: string;
  categories: PublicCategory[];
  items: PublicMenuItem[];
}

// ─── Fetchers ───

const getPublicRestaurant = async (slug: string): Promise<PublicRestaurant> => {
  const response = await api.get<{ success: boolean; data: PublicRestaurant }>(`/public/${slug}`);
  return response.data.data;
};

const getPublicMenu = async (slug: string): Promise<PublicMenuData> => {
  const response = await api.get<{ success: boolean; data: PublicMenuData }>(`/public/${slug}/menu`);
  return response.data.data;
};

// ─── Hooks ───

export const usePublicRestaurant = (slug: string) => {
  return useQuery({
    queryKey: ['publicRestaurant', slug],
    queryFn: () => getPublicRestaurant(slug),
    enabled: !!slug,
  });
};

export const usePublicMenu = (slug: string) => {
  return useQuery({
    queryKey: ['publicMenu', slug],
    queryFn: () => getPublicMenu(slug),
    enabled: !!slug,
  });
};

export const useAvailability = (slug: string, date: string) => {
  return useQuery({
    queryKey: ['publicAvailability', slug, date],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: { availableTimes: string[] } }>(
        `/public/${slug}/availability`,
        { params: { date } }
      );
      return data.data.availableTimes;
    },
    enabled: !!slug && !!date,
  });
};

export const useCreatePublicReservation = (slug: string) => {
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      name: string;
      phone: string;
      partySize: number;
      date: string;
      time: string;
      specialRequests?: string;
    }) => {
      const { data } = await api.post(`/public/${slug}/reservations`, payload);
      return data.data;
    },
  });
};

export type { PublicRestaurant, PublicMenuItem, PublicCategory, PublicMenuData };
