import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllRestaurants, useAllManagers, AdminRestaurant, AdminManager, AdminRestaurantsParams } from '../api/adminApi';
import useAuthStore from '../../../store/authStore';
import { LogIn, Building2, Loader2, Users, LayoutDashboard, Info, ShieldCheck } from 'lucide-react';
import { AdminTableFilters } from '../components/AdminTableFilters';
import { AdminTablePagination } from '../components/AdminTablePagination';
import { RestaurantDetailModal } from '../components/RestaurantDetailModal';
import { UserDetailModal } from '../components/UserDetailModal';

type ActiveTab = 'tenants' | 'managers';

function RestaurantsListPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tenants');
  const navigate = useNavigate();
  const setRestaurantContext = useAuthStore((s) => s.setRestaurantContext);

  // Filters & Pagination State
  const [tenantParams, setTenantParams] = useState<AdminRestaurantsParams>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
  });

  const [managerParams, setManagerParams] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  // Queries
  const { data: tenantResponse, isLoading: isLoadingTenants } = useAllRestaurants(tenantParams);
  const { data: managerResponse, isLoading: isLoadingManagers } = useAllManagers(managerParams);

  // Modals State
  const [selectedRestaurant, setSelectedRestaurant] = useState<AdminRestaurant | null>(null);
  const [selectedManager, setSelectedManager] = useState<AdminManager | null>(null);
  const [isRestaurantDetailOpen, setIsRestaurantDetailOpen] = useState(false);
  const [isManagerDetailOpen, setIsManagerDetailOpen] = useState(false);

  const handleImpersonate = (restaurantId: string, slug: string) => {
    setRestaurantContext(restaurantId);
    navigate(`/${slug}/dashboard`);
  };

  const handleTenantSearch = (search: string) => {
    setTenantParams(prev => ({ ...prev, search, page: 1 }));
  };

  const handleTenantStatus = (status: string) => {
    setTenantParams(prev => ({ ...prev, status, page: 1 }));
  };

  const handleManagerSearch = (search: string) => {
    setManagerParams(prev => ({ ...prev, search, page: 1 }));
  };

  const tenantFilters = useMemo(() => [
    {
      label: 'Status',
      key: 'status',
      value: tenantParams.status || '',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Trial', value: 'trial' },
        { label: 'Past Due', value: 'past_due' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      onChange: handleTenantStatus,
    }
  ], [tenantParams.status]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 text-[10px] font-black bg-green-600 text-white uppercase tracking-tighter">ACTIVE</span>;
      case 'trial':
        return <span className="px-2 py-0.5 text-[10px] font-black bg-amber-600 text-white uppercase tracking-tighter">TRIAL</span>;
      case 'past_due':
        return <span className="px-2 py-0.5 text-[10px] font-black bg-red-600 text-white uppercase tracking-tighter">PAST DUE</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 text-[10px] font-black bg-gray-600 text-white uppercase tracking-tighter">CANCELLED</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-black bg-gray-600 text-white uppercase tracking-tighter">{status}</span>;
    }
  };

  const isLoading = activeTab === 'tenants' ? isLoadingTenants : isLoadingManagers;

  return (
    <div className="flex flex-col h-full bg-gray-950 p-6 space-y-6">
      {/* Header & Tabs */}
      <div className="bg-gray-900 border border-gray-800 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-blue-500" />
              Tenant Directory
            </h1>
            <p className="text-gray-400 text-sm font-bold mt-1 uppercase tracking-wider">
              Centralized management of restaurant accounts and their administrators.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-t border-gray-800 pt-6">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'tenants'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Restaurants
          </button>
          <button
            onClick={() => setActiveTab('managers')}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'managers'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Managers
          </button>
        </div>
      </div>

      {/* Filters Area */}
      {activeTab === 'tenants' ? (
        <AdminTableFilters
          searchPlaceholder="Search by name or slug..."
          searchValue={tenantParams.search || ''}
          onSearchChange={handleTenantSearch}
          filters={tenantFilters}
        />
      ) : (
        <AdminTableFilters
          searchPlaceholder="Search managers by name or email..."
          searchValue={managerParams.search || ''}
          onSearchChange={handleManagerSearch}
        />
      )}

      {/* Main Content Area */}
      <div className="bg-gray-900 border border-gray-800 overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            {activeTab === 'tenants' ? (
              <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                <thead className="bg-gray-800 border-b border-gray-700 text-xs font-black text-gray-400 uppercase tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Restaurant</th>
                    <th className="px-6 py-4">Linked Managers</th>
                    <th className="px-6 py-4">Subscription</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {tenantResponse?.restaurants.map((res) => (
                    <tr key={res._id} className="hover:bg-gray-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedRestaurant(res);
                            setIsRestaurantDetailOpen(true);
                          }}
                          className="font-black text-white hover:text-blue-400 flex items-center gap-2 uppercase tracking-tight text-left"
                        >
                          {res.name}
                          <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <span className="text-[10px] text-gray-500 font-mono mt-0.5 font-bold block uppercase tracking-tighter">/p/{res.slug}</span>
                      </td>
                      <td className="px-6 py-4">
                        {res.managers && res.managers.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {res.managers.map(m => (
                              <button 
                                key={m._id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Find in manager list to show full detail
                                  const fullManager = managerResponse?.data.find(fm => fm._id === m._id);
                                  setSelectedManager((fullManager as any) || { ...m, restaurants: [] });
                                  setIsManagerDetailOpen(true);
                                }}
                                className="text-[10px] font-bold text-gray-400 hover:text-blue-400 uppercase tracking-wider flex items-center gap-1.5"
                              >
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                {m.firstName} {m.lastName}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-600 uppercase italic">No manager</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(res.subscription?.status || 'trial')}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-bold text-xs">
                        {new Date(res.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleImpersonate(res._id, res.slug)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-black uppercase tracking-widest transition-colors active:scale-95"
                        >
                          <LogIn className="w-4 h-4" />
                          Enter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                <thead className="bg-gray-800 border-b border-gray-700 text-xs font-black text-gray-400 uppercase tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Manager Name</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Assigned Restaurants</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {managerResponse?.data.map((manager) => (
                    <tr key={manager._id} className="hover:bg-gray-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedManager(manager);
                            setIsManagerDetailOpen(true);
                          }}
                          className="font-black text-white hover:text-blue-400 flex items-center gap-2 uppercase tracking-tight text-left"
                        >
                          {manager.firstName} {manager.lastName}
                          <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-400 text-xs uppercase tracking-tighter">
                        {manager.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {manager.restaurants.map(res => (
                            <button
                              key={res._id}
                              onClick={() => {
                                setSelectedRestaurant(res as any);
                                setIsRestaurantDetailOpen(true);
                              }}
                              className="px-2 py-1 bg-gray-800 border border-gray-700 text-[10px] text-gray-300 font-black uppercase tracking-widest hover:border-blue-500 transition-colors"
                            >
                              {res.name}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {manager.isActive ? (
                          <span className="text-[10px] font-black text-green-500 uppercase tracking-widest px-2 py-0.5 border border-green-500/20 bg-green-500/5">Active</span>
                        ) : (
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2 py-0.5 border border-red-500/20 bg-red-500/5">Disabled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Pagination Area */}
      {activeTab === 'tenants' && tenantResponse && (
        <AdminTablePagination
          currentPage={tenantResponse.page}
          totalPages={tenantResponse.pages}
          totalResults={tenantResponse.total}
          resultsPerPage={tenantParams.limit || 10}
          onPageChange={(page) => setTenantParams(p => ({ ...p, page }))}
        />
      )}
      {activeTab === 'managers' && managerResponse && (
        <AdminTablePagination
          currentPage={managerResponse.page}
          totalPages={managerResponse.pages}
          totalResults={managerResponse.total}
          resultsPerPage={managerParams.limit || 10}
          onPageChange={(page) => setManagerParams(p => ({ ...p, page }))}
        />
      )}

      {/* Modals */}
      <RestaurantDetailModal
        restaurant={selectedRestaurant}
        isOpen={isRestaurantDetailOpen}
        onClose={() => setIsRestaurantDetailOpen(false)}
      />
      
      <UserDetailModal
        user={selectedManager}
        isOpen={isManagerDetailOpen}
        onClose={() => setIsManagerDetailOpen(false)}
      />
    </div>
  );
}

export default RestaurantsListPage;
