import React, { useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  X,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  LogOut,
  Store,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface TenantSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  navItems: NavItem[];
  slug: string;
  tenantRole: string;
  restaurantName: string;
  logoUrl: string;
  userName: string;
  onLogout: () => void;
}

/**
 * Standard B2B Sidebar for Tenant Navigation.
 * Responsive: off-canvas drawer on mobile, collapsible rail on desktop.
 * Flat colors only — NO gradients, NO opacities, NO glassmorphism.
 * Active links use bg-brand-primary for dynamic tenant branding.
 */
const TenantSidebar: React.FC<TenantSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  navItems,
  slug,
  tenantRole,
  restaurantName,
  logoUrl,
  userName,
  onLogout,
}) => {
  const navigate = useNavigate();

  const handleSwitchBusiness = useCallback(() => {
    onCloseMobile();
    navigate('/select-restaurant');
  }, [onCloseMobile, navigate]);

  const handleLinkClick = useCallback(() => {
    onCloseMobile();
  }, [onCloseMobile]);

  const handleLogoutClick = useCallback(() => {
    onCloseMobile();
    onLogout();
  }, [onCloseMobile, onLogout]);

  // ─── Sidebar Content (shared between desktop and mobile) ────────
  const renderContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full">
      {/* Top: Logo + Restaurant Name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={restaurantName}
            className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5" />
          </div>
        )}
        {(!isCollapsed || isMobile) && (
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-gray-900 truncate">{restaurantName}</h2>
            <p className="text-xs text-gray-400 font-medium truncate">{userName}</p>
          </div>
        )}
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors ml-auto flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={`/${slug}/${item.path}`}
            onClick={handleLinkClick}
          >
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-brand-primary text-white font-bold'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                } ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
                title={isCollapsed && !isMobile ? item.label : undefined}
              >
                {React.cloneElement(item.icon as React.ReactElement, {
                  className: 'w-5 h-5 flex-shrink-0',
                })}
                {(!isCollapsed || isMobile) && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section: Global Actions */}
      <div className="border-t border-gray-200 px-3 py-3 space-y-1">
        {/* Switch Business — Manager only */}
        {tenantRole === 'manager' && (
          <button
            onClick={handleSwitchBusiness}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors ${
              isCollapsed && !isMobile ? 'justify-center' : ''
            }`}
            title={isCollapsed && !isMobile ? 'Switch Business' : undefined}
          >
            <Building2 className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || isMobile) && (
              <span className="text-sm font-medium">Switch Business</span>
            )}
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogoutClick}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors ${
            isCollapsed && !isMobile ? 'justify-center' : ''
          }`}
          title={isCollapsed && !isMobile ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>

        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <div className="flex justify-end pt-2">
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronsRight className="w-5 h-5" />
              ) : (
                <ChevronsLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderContent(true)}
      </aside>
    </>
  );
};

export default TenantSidebar;
