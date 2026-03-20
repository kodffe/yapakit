import { useState, useMemo, useEffect } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, RefreshCcw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import useAuthStore from '../../../store/authStore';
import { useDashboardStats } from '../../reports/api/reportApi';
import { useRestaurantSettings } from '../../pos/api/restaurantApi';
import useHeaderStore from '../../../store/headerStore';

function ManagerDashboard() {
  const { memberships, currentRestaurantId, user } = useAuthStore();
  
  // Date range state (default last 7 days)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: stats, isLoading, refetch, isFetching } = useDashboardStats(dateRange);
  const { data: settings } = useRestaurantSettings();

  const restaurantName = useMemo(() => {
    const membership = memberships?.find((m) => m.restaurantId._id === currentRestaurantId);
    return membership?.restaurantId.name || 'Restaurant';
  }, [memberships, currentRestaurantId]);

  const setHeader = useHeaderStore((s) => s.setHeader);

  useEffect(() => {
    setHeader('Manager Dashboard', `Welcome back, ${user?.firstName || 'Manager'}. Managing ${restaurantName}.`);
  }, [setHeader, user?.firstName, restaurantName]);

  const currency = settings?.currency || 'USD';

  const formatCurrency = (amount: number | undefined) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount || 0);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="space-y-6 flex flex-col h-full bg-gray-50 pb-16">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-end gap-4 px-6 pt-6">
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors"
              />
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 font-bold transition-colors disabled:bg-gray-400 mt-4 sm:mt-0"
          >
            <RefreshCcw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
        {/* Total Revenue */}
        <div className="bg-white border border-gray-200 p-6 flex items-start justify-between rounded-2xl">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-3xl font-black text-gray-900 mt-2 font-mono">
              {isLoading ? '...' : formatCurrency(stats?.totals.totalSales)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-brand-primary" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-200 p-6 flex items-start justify-between rounded-2xl">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Orders</p>
            <h3 className="text-3xl font-black text-gray-900 mt-2 font-mono">
              {isLoading ? '...' : stats?.totals.totalOrders}
            </h3>
          </div>
          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-gray-700" />
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white border border-gray-200 p-6 flex items-start justify-between rounded-2xl">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Avg Order Value</p>
            <h3 className="text-3xl font-black text-gray-900 mt-2 font-mono">
              {isLoading ? '...' : formatCurrency(stats?.totals.averageOrderValue)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-700" />
          </div>
        </div>
      </div>

      {/* Charts & Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
        
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 rounded-2xl">
          <h2 className="text-lg font-black text-gray-900 uppercase mb-6 flex justify-between items-center">
            Sales Trend
          </h2>
          <div className="h-80 w-full">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase">Loading Chart...</div>
            ) : stats?.salesTrend && stats.salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 'bold' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 'bold' }} 
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: 0, fontWeight: 'bold' }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                    labelStyle={{ color: '#111827', marginBottom: 4 }}
                  />
                  <Bar dataKey="totalSales" fill="var(--brand-primary)" radius={[2, 2, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-500 font-bold">
                No Sales Data For This Period
              </div>
            )}
          </div>
        </div>

        {/* Top Items Table */}
        <div className="bg-white border border-gray-200 p-0 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-black text-gray-900 uppercase">Top Selling Items</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
            {isLoading ? (
              <div className="p-6 text-center text-gray-400 font-bold uppercase">Loading Items...</div>
            ) : stats?.topItems && stats.topItems.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
                    <th className="px-6 py-3">Item Name</th>
                    <th className="px-6 py-3 text-right">Qty Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-900 text-right font-bold">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
               <div className="p-8 text-center text-gray-500 font-bold">
                 No items sold in this period.
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ManagerDashboard;
