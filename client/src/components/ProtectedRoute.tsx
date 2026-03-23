import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
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
  const { slug } = useParams<{ slug: string }>();
  const { token, user, memberships, currentRestaurantId, setRestaurantContext } = useAuthStore();
  const location = useLocation();

  // 1. Auto-select or sync for single-membership users or deep-links
  useEffect(() => {
    if (!token || !memberships) return;

    // A. If no context yet and only one restaurant, auto-select it
    if (!currentRestaurantId && memberships.length === 1) {
      setRestaurantContext(memberships[0].restaurantId._id);
      return;
    }

    // B. SLUG SYNC: If we are in a tenant route (/:slug/...)
    // Ensure currentRestaurantId matches the slug in the URL
    if (slug && memberships.length > 0) {
      const matchingMembership = memberships.find(m => m.restaurantId.slug === slug);
      if (matchingMembership && matchingMembership.restaurantId._id !== currentRestaurantId) {
        setRestaurantContext(matchingMembership.restaurantId._id);
      }
    }
  }, [token, currentRestaurantId, memberships, setRestaurantContext, slug]);

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

    // Still trying to resolve membership context
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Setting up Workspace</h2>
          <p className="text-gray-500 font-medium text-sm mt-1 uppercase tracking-widest">Preparing your environment...</p>
        </div>
      </div>
    );
  }

  // 6. Context is set -> Proceed
  return <Outlet />;
}

export default ProtectedRoute;
