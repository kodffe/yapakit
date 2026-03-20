import { useState, useMemo, useCallback, useEffect } from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  UtensilsCrossed,
  LayoutDashboard,
  ClipboardList,
  MapPin,
  BookOpen,
  Settings,
  Users,
  CreditCard,
  ChefHat,
  CalendarDays,
  LifeBuoy,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useRestaurantDetails } from '../../features/settings/api/settingsApi';
import { useSocket } from '../../services/socket';
import useAlertStore from '../../store/alertStore';
import AlertManager from '../ui/AlertManager';
import { Order } from '../../features/orders/api/orderApi';
import ThemeProvider from './ThemeProvider';
import TenantSidebar from './TenantSidebar';
import TopBar from './TopBar';

/**
 * Navigation configuration per tenant role.
 */
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  manager: [
    { label: 'Dashboard', path: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Reservations', path: 'reservations', icon: <CalendarDays className="w-5 h-5" /> },
    { label: 'Checkout', path: 'checkout', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Orders', path: 'orders', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Floor Plan', path: 'floor-plan', icon: <MapPin className="w-5 h-5" /> },
    { label: 'Menu', path: 'menu', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Staff', path: 'staff', icon: <Users className="w-5 h-5" /> },
    { label: 'Settings', path: 'settings', icon: <Settings className="w-5 h-5" /> },
    { label: 'Support', path: 'support', icon: <LifeBuoy className="w-5 h-5" /> },
  ],
  waiter: [
    { label: 'Dashboard', path: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Reservations', path: 'reservations', icon: <CalendarDays className="w-5 h-5" /> },
    { label: 'Menu', path: 'menu', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Orders', path: 'orders', icon: <ClipboardList className="w-5 h-5" /> },
  ],
  cashier: [
    { label: 'Checkout', path: 'checkout', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Payments history', path: 'payments', icon: <ClipboardList className="w-5 h-5" /> },
  ],
  kitchen: [
    { label: 'KDS', path: 'kds', icon: <ChefHat className="w-5 h-5" /> },
  ],
};

/**
 * B2B Tenant Layout with Sidebar Navigation.
 * Uses a flex container: Sidebar (left) + Main Content (right).
 * The entire layout is wrapped in ThemeProvider for dynamic branding.
 * Flat colors only — NO gradients, NO opacities, NO shadows.
 */
function TenantLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, memberships, currentRestaurantId, logout } = useAuthStore();
  const { data: restaurantDetails } = useRestaurantDetails();
  const socket = useSocket(currentRestaurantId);
  const { addAlert } = useAlertStore();

  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  // Derive the current tenant role from memberships
  const currentMembership = useMemo(
    () => memberships?.find((m) => m.restaurantId._id === currentRestaurantId),
    [memberships, currentRestaurantId]
  );

  const tenantRole = currentMembership?.tenantRole ?? 'waiter';
  const restaurantName = currentMembership?.restaurantId.name ?? 'Restaurant';
  const logoUrl = currentMembership?.restaurantId.settings?.logoUrl || '';
  const rawNavItems = NAV_BY_ROLE[tenantRole] ?? NAV_BY_ROLE.waiter;

  // Filter out 'Floor Plan' if dine-in is disabled in settings
  const enabledOrderTypes = restaurantDetails?.settings?.enabledOrderTypes || ['dine-in', 'takeaway', 'delivery'];
  const navItems = rawNavItems.filter((item) => {
    if (item.path === 'floor-plan' && !enabledOrderTypes.includes('dine-in')) {
      return false;
    }
    return true;
  });

  // Build user display name
  const userName = user ? `${user.firstName} ${user.lastName}` : '';

  // Waiter Order Notification Listener
  useEffect(() => {
    if (!socket || !user || tenantRole !== 'waiter') return;

    const onOrderUpdated = (order: Order) => {
      const orderWaiterId = typeof order.waiterId === 'object' ? order.waiterId._id : order.waiterId;

      if (orderWaiterId === user._id && order.status === 'ready') {
        let tableInfo = '';
        if (order.orderType === 'dine-in') {
          tableInfo = `for Table ${order.tableName} `;
        }

        try {
          const audioCtx = new AudioContext();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
          oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15);
          oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3);

          gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.5);
        } catch { /* silent fail */ }

        addAlert({
          title: 'Order Ready!',
          message: `Order #${order.orderNumber} ${tableInfo}is ready to be served.`,
          type: 'success',
          confirmText: 'Understood',
        });
      }
    };

    socket.on('order:updated', onOrderUpdated);

    return () => {
      socket.off('order:updated', onOrderUpdated);
    };
  }, [socket, user, tenantRole, addAlert]);

  const isKdsPage = pathname.endsWith('/kds');

  return (
    <ThemeProvider branding={restaurantDetails?.branding}>
      <AlertManager />
      <div className="flex h-screen w-full bg-gray-100 font-brand overflow-hidden">
        {/* Sidebar */}
        <TenantSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          navItems={navItems}
          slug={slug || ''}
          tenantRole={tenantRole}
          restaurantName={restaurantName}
          logoUrl={logoUrl}
          userName={userName}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* TopBar */}
          <TopBar
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            restaurantName={restaurantName}
            logoUrl={logoUrl}
          />

          {/* Scrollable Content */}
          <main className={`flex-1 overflow-y-auto ${isKdsPage ? '' : 'p-4 md:p-6'}`}>
            <Outlet />
          </main>

          {/* Mini Footer */}
          {!isKdsPage && (
            <footer className="bg-gray-100 border-t border-gray-200 py-3 flex-shrink-0">
              <div className="flex items-center justify-center gap-1.5 text-gray-400">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Powered by Yapakit</span>
              </div>
            </footer>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default TenantLayout;
