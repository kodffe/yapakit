import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  Activity 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useMemo } from 'react';

function ManagerDashboard() {
  const { memberships, currentRestaurantId, user } = useAuthStore();

  const restaurantName = useMemo(() => {
    const membership = memberships?.find(m => m.restaurantId._id === currentRestaurantId);
    return membership?.restaurantId.name || 'Restaurant';
  }, [memberships, currentRestaurantId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user?.firstName}! Here's what's happening at {restaurantName} today.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Gross Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">$2,459.50</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
            <span className="text-emerald-500 font-medium">+12.5%</span>
            <span className="text-gray-400 ml-2">vs yesterday</span>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">142</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
            <span className="text-emerald-500 font-medium">+5.2%</span>
            <span className="text-gray-400 ml-2">vs yesterday</span>
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Staff</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">8</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <span>2 Waiters, 4 Kitchen, 2 Cashiers</span>
          </div>
        </div>

        {/* Avg Prep Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Prep Time</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">14m</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <Activity className="w-4 h-4 mr-1" />
            <span>Optimal</span>
          </div>
        </div>
      </div>

      {/* Main Content Area placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px] flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg bg-gray-50">
             <p className="text-gray-400 text-sm">Activity feed will appear here</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px] flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top Selling Items</h2>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg bg-gray-50">
             <p className="text-gray-400 text-sm">Top items list will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;
