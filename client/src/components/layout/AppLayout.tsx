import { Outlet } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';

/**
 * Application shell layout with a top navbar and a main content area.
 * Used for non-tenant pages (e.g. global admin).
 * Renders child routes via <Outlet />.
 */
function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Yapakit</span>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
