import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  TicketCheck,
  CreditCard,
  LogOut,
  Shield,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const ADMIN_NAV = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
  { label: 'Tenants', path: '/admin/tenants', icon: <Building2 className="w-5 h-5" />, end: false },
  { label: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" />, end: false },
  { label: 'Sales', path: '/admin/sales', icon: <CreditCard className="w-5 h-5" />, end: false },
  { label: 'Support', path: '/admin/support', icon: <TicketCheck className="w-5 h-5" />, end: false },
];

/**
 * Superadmin Layout with a distinct dark color scheme
 * to visually remind the user they are in Global Admin mode.
 */
function SuperadminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Dark Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="font-black text-white text-lg tracking-tighter uppercase">Yapakit</span>
            <span className="text-[10px] text-white bg-blue-600 px-2 py-0.5 font-black uppercase tracking-widest">
              SUPERADMIN
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {ADMIN_NAV.filter(item => {
              if (item.label === 'Users') return user?.systemRole === 'superadmin';
              if (item.label === 'Support') return ['superadmin', 'support'].includes(user?.systemRole || '');
              return true;
            }).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-400 hidden lg:inline">
                {user.firstName} {user.lastName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <Outlet />
      </main>
    </div>
  );
}

export default SuperadminLayout;
