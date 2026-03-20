import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';

interface ProtectedRouteProps {
  allowedSystemRoles?: string[];
}

/**
 * Smart protected route wrapper.
 * Acts as a traffic controller for unauthenticated users, global admins, and tenants.
 */
function ProtectedRoute({ allowedSystemRoles }: ProtectedRouteProps) {
  const { token, user, memberships, currentRestaurantId, setRestaurantContext } = useAuthStore();
  const location = useLocation();

  // 1. Auto-select for single-membership users if they have no context yet
  useEffect(() => {
    if (token && !currentRestaurantId && memberships?.length === 1) {
      setRestaurantContext(memberships[0].restaurantId._id);
    }
  }, [token, currentRestaurantId, memberships, setRestaurantContext]);

  // 2. Not authenticated → redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Global System Role restriction (e.g. for /admin routes)
  if (allowedSystemRoles && !allowedSystemRoles.includes(user.systemRole)) {
    return <Navigate to="/" replace />;
  }

  const isSelectingRestaurant = location.pathname === '/select-restaurant';
  const isAdminPath = location.pathname.startsWith('/admin');
  const isGlobalAdmin = ['superadmin', 'support', 'sales'].includes(user.systemRole);

  // 4. Bypasses for specific paths
  if (isSelectingRestaurant || isAdminPath) {
    return <Outlet />;
  }

  // 5. Tenant Routes: Check if context is established
  if (!currentRestaurantId) {
    if (isGlobalAdmin) {
      return <Navigate to="/admin" replace />;
    }

    if (memberships && memberships.length > 1) {
      return <Navigate to="/select-restaurant" replace />;
    }

    // Still trying to resolve single membership or load
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  // 6. Context is set -> Proceed
  return <Outlet />;
}

export default ProtectedRoute;
