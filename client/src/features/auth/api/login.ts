import api from '../../../services/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    systemRole: string;
  };
  memberships: Array<{
    _id: string;
    userId: string;
    restaurantId: {
      _id: string;
      name: string;
      slug: string;
      status: string;
    };
    tenantRole: string;
    isActive: boolean;
  }>;
}

/**
 * Calls the login endpoint and returns the JWT, user profile, and memberships.
 */
export const loginApi = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials);
  return data;
};
