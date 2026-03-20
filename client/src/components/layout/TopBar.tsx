import { Menu, Store } from 'lucide-react';
import NetworkBadge from '../ui/NetworkBadge';
import useHeaderStore from '../../store/headerStore';

interface TopBarProps {
  onOpenMobileMenu: () => void;
  restaurantName: string;
  logoUrl: string;
}

/**
 * Minimal TopBar for the Tenant Layout.
 * Shows a hamburger on mobile, restaurant name, and network badge.
 * Desktop view displays the dynamic page header (title & helpText).
 * Flat colors only — NO shadows, NO gradients.
 */
function TopBar({ onOpenMobileMenu, restaurantName, logoUrl }: TopBarProps) {
  const { title, helpText } = useHeaderStore();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left: Hamburger (mobile) + Restaurant Name + Dynamic Header */}
        <div className="flex items-center gap-3 md:gap-6">
          <button
            onClick={onOpenMobileMenu}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors md:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Restaurant Name */}
          <div className="flex items-center gap-2 md:hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurantName}
                className="w-7 h-7 rounded-md object-cover"
              />
            ) : (
              <div className="w-7 h-7 bg-gray-100 text-gray-500 rounded-md flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
            )}
            <span className="font-bold text-gray-900 text-lg">{restaurantName}</span>
          </div>

          {/* Desktop/Tablet: Dynamic Page Header */}
          <div className="hidden md:flex flex-col">
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">
              {title}
            </h1>
            {helpText && (
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">
                {helpText}
              </p>
            )}
          </div>
        </div>

        {/* Right: Network Badge */}
        <div className="flex items-center gap-2">
          <NetworkBadge />
        </div>
      </div>
    </header>
  );
}

export default TopBar;
