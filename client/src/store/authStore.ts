import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Membership type returned by the login API.
 */
interface Membership {
  _id: string;
  userId: string;
  restaurantId: {
    _id: string;
    name: string;
    slug: string;
    status: string;
    settings?: {
      logoUrl?: string;
    };
  };
  tenantRole: string;
  isActive: boolean;
}

/**
 * Authenticated user profile.
 */
interface AuthUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  systemRole: string;
}

/**
 * Auth store state interface.
 */
interface AuthState {
  token: string | null;
  user: AuthUser | null;
  memberships: Membership[] | null;
  currentRestaurantId: string | null;

  setAuth: (token: string, user: AuthUser, memberships: Membership[]) => void;
  setRestaurantContext: (restaurantId: string) => void;
  addMembership: (membership: Membership) => void;
  logout: () => void;
}

/**
 * Global authentication store with localStorage persistence.
 * Manages JWT tokens, user profile, memberships, and the active restaurant context.
 */
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      memberships: null,
      currentRestaurantId: null,

      setAuth: (token, user, memberships) => {
        set({ token, user, memberships });
      },

      setRestaurantContext: (restaurantId) => {
        set({ currentRestaurantId: restaurantId });
      },

      addMembership: (membership) => {
        set((state) => ({
          memberships: [...(state.memberships || []), membership],
        }));
      },

      logout: () => {
        set({
          token: null,
          user: null,
          memberships: null,
          currentRestaurantId: null,
        });
      },
    }),
    {
      name: 'yapakit-auth',
    }
  )
);

export default useAuthStore;
