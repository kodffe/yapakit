import axios from 'axios';

/**
 * Axios instance pre-configured for the Yapakit API.
 * Automatically attaches JWT token and restaurant context headers
 * from the Zustand persisted auth store in localStorage.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5005/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper to read Zustand persisted state from localStorage.
 */
function getPersistedAuth(): { token: string | null; currentRestaurantId: string | null } {
  try {
    const raw = localStorage.getItem('yapakit-auth');

    if (!raw) {
      return { token: null, currentRestaurantId: null };
    }

    const parsed = JSON.parse(raw);
    return {
      token: parsed?.state?.token ?? null,
      currentRestaurantId: parsed?.state?.currentRestaurantId ?? null,
    };
  } catch {
    return { token: null, currentRestaurantId: null };
  }
}

/**
 * Request Interceptor:
 * 1. Reads the JWT token from the persisted Zustand store and attaches it to Authorization.
 * 2. Reads the active restaurantId and attaches it to x-restaurant-id.
 */
api.interceptors.request.use(
  (config) => {
    const { token, currentRestaurantId } = getPersistedAuth();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (currentRestaurantId) {
      config.headers['x-restaurant-id'] = currentRestaurantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * Handles 401 (Unauthorized) responses by clearing auth state and redirecting to login.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('yapakit-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
