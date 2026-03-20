import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import OnboardingWizard from './features/onboarding/pages/OnboardingWizard';
import RestaurantSelector from './pages/RestaurantSelector';
import ManagerDashboard from './features/dashboard/pages/ManagerDashboard';
import MenuManagerPage from './features/menu/pages/MenuManagerPage';
import WaiterPosPage from './features/pos/pages/WaiterPosPage';
import ProtectedRoute from './components/ProtectedRoute';
import TenantLayout from './components/layout/TenantLayout';
import SuperadminLayout from './components/layout/SuperadminLayout';
import useAuthStore from './store/authStore';
import CashierDashboard from './features/cashier/pages/CashierDashboard';
import KitchenKdsPage from './features/kds/pages/KitchenKdsPage';
import StaffManagementPage from './features/staff/pages/StaffManagementPage';
import FloorPlanManagerPage from './features/floor-plan/pages/FloorPlanManagerPage';
import WaiterOrdersPage from './features/orders/pages/WaiterOrdersPage';
import GlobalDashboardPage from './features/admin/pages/GlobalDashboardPage';
import RestaurantsListPage from './features/admin/pages/RestaurantsListPage';
import AdminUsersPage from './features/admin/pages/AdminUsersPage';
import AdminSupportPage from './features/admin/pages/AdminSupportPage';
import AdminSalesPage from './features/admin/pages/AdminSalesPage';
import SettingsPage from './features/settings/pages/SettingsPage';
import StaffReservationsPage from './features/reservations/pages/StaffReservationsPage';
import PublicLandingPage from './features/public/pages/PublicLandingPage';
import PublicMenuPage from './features/public/pages/PublicMenuPage';
import PaymentsHistoryPage from './features/cashier/pages/PaymentsHistoryPage';
import ManagerSupportPage from './features/support/pages/ManagerSupportPage';

// ─── Role-Based Route Guards ───

const RoleBasedGuard = ({ allowedRoles, children }: { allowedRoles: string[], children: React.ReactNode }) => {
  const { memberships, currentRestaurantId } = useAuthStore();
  const currentMembership = memberships?.find((m) => m.restaurantId._id === currentRestaurantId);
  const role = currentMembership?.tenantRole ?? '';

  if (!allowedRoles.includes(role)) {
    return <Navigate to="dashboard" replace />;
  }

  return <>{children}</>;
};

const MenuRoute = () => {
  const { memberships, currentRestaurantId } = useAuthStore();
  const currentMembership = memberships?.find((m) => m.restaurantId._id === currentRestaurantId);
  const role = currentMembership?.tenantRole ?? 'waiter';

  if (role === 'manager') return <MenuManagerPage />;
  return <WaiterPosPage />;
};


// Superadmin placeholders
const AdminUsers = () => <AdminUsersPage />;
const AdminSupport = () => <AdminSupportPage />;
const AdminSales = () => <AdminSalesPage />;

/**
 * RootRedirect: Handles the index path '/'
 * Showing LandingPage to guests, and routing authenticated users correctly.
 */
const RootRedirect = () => {
  const { user, memberships } = useAuthStore();

  if (!user) return <LandingPage />;

  if (user.systemRole && ['superadmin', 'support', 'sales'].includes(user.systemRole)) {
    return <Navigate to="/admin" replace />;
  }

  if (memberships && memberships.length === 1) {
    return <Navigate to={`/${memberships[0].restaurantId.slug || 'tenant'}`} replace />;
  }

  return <Navigate to="/select-restaurant" replace />;
};

/**
 * Main Application with role-based routing.
 */
function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<OnboardingWizard />} />
      <Route path="/p/:slug" element={<PublicLandingPage />} />
      <Route path="/p/:slug/menu" element={<PublicMenuPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Restaurant Selector (multi-membership) */}
        <Route path="/select-restaurant" element={<RestaurantSelector />} />

        {/* Superadmin Panel */}
        <Route element={<ProtectedRoute allowedSystemRoles={['superadmin', 'support', 'sales']} />}>
          <Route path="/admin" element={<SuperadminLayout />}>
            <Route index element={<GlobalDashboardPage />} />
            <Route path="tenants" element={<RestaurantsListPage />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="sales" element={<AdminSales />} />
          </Route>
        </Route>

        {/* Tenant Routes (slug-scoped) */}
        <Route path="/:slug" element={<TenantLayout />}>
          {/* Index redirect to dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="floor-plan" element={<FloorPlanManagerPage />} />
          <Route path="orders" element={<WaiterOrdersPage />} />
          <Route path="menu" element={<MenuRoute />} />
          <Route path="reservations" element={<RoleBasedGuard allowedRoles={['manager', 'waiter']}><StaffReservationsPage /></RoleBasedGuard>} />
          {/* Cashier Routes */}
          <Route path="checkout" element={<RoleBasedGuard allowedRoles={['cashier', 'manager']}><CashierDashboard /></RoleBasedGuard>} />

          {/* Manager Protected Pages */}
          <Route path="staff" element={<RoleBasedGuard allowedRoles={['manager']}><StaffManagementPage /></RoleBasedGuard>} />
          <Route path="settings" element={<RoleBasedGuard allowedRoles={['manager']}><SettingsPage /></RoleBasedGuard>} />
          <Route path="support" element={<RoleBasedGuard allowedRoles={['manager']}><ManagerSupportPage /></RoleBasedGuard>} />
          
          <Route path="payments" element={<RoleBasedGuard allowedRoles={['cashier', 'manager']}><PaymentsHistoryPage /></RoleBasedGuard>} />
          <Route path="kds" element={<KitchenKdsPage />} />
        </Route>
      </Route>

      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
