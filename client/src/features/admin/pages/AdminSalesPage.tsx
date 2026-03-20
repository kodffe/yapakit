import { useState } from 'react';
import { CreditCard, Loader2, Edit, Calendar } from 'lucide-react';
import { useAdminTenants, useUpdateSubscription, AdminRestaurant } from '../../admin/api/adminApi';
import { X } from 'lucide-react';

const PLAN_FEATURES: Record<string, Record<string, boolean>> = {
  basic: {
    reservations: false,
    advancedAnalytics: false,
    kds: false,
    splitPayments: false,
    staffManagement: false,
    prioritySupport: false,
    floorPlan: false,
  },
  pro: {
    reservations: true,
    advancedAnalytics: false,
    kds: true,
    splitPayments: true,
    staffManagement: false,
    prioritySupport: true,
    floorPlan: true,
  },
  plus: {
    reservations: true,
    advancedAnalytics: true,
    kds: true,
    splitPayments: true,
    staffManagement: true,
    prioritySupport: true,
    floorPlan: true,
  },
};

export default function AdminSalesPage() {
  const { data, isLoading } = useAdminTenants();
  const updateMutation = useUpdateSubscription();

  const [selectedTenant, setSelectedTenant] = useState<AdminRestaurant | null>(null);

  // Modal State
  const [formData, setFormData] = useState({
    plan: 'plus',
    status: 'trial',
    expiresAt: '',
    features: PLAN_FEATURES.plus,
  });

  const handleManageClick = (tenant: AdminRestaurant) => {
    setSelectedTenant(tenant);
    setFormData({
      plan: tenant.subscription?.plan || 'plus',
      status: tenant.subscription?.status || 'trial',
      expiresAt: tenant.subscription?.expiresAt ? new Date(tenant.subscription.expiresAt).toISOString().split('T')[0] : '',
      features: tenant.subscription?.features || PLAN_FEATURES.plus,
    });
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlan = e.target.value;
    setFormData((prev) => ({
      ...prev,
      plan: newPlan,
      features: PLAN_FEATURES[newPlan] || prev.features, // Auto-toggle features if standard plan
    }));
  };

  const handleFeatureToggle = (featureKey: string) => {
    setFormData((prev) => {
      const newFeatures = { ...prev.features, [featureKey]: !prev.features[featureKey as keyof typeof prev.features] };
      // If manually changing features, ensure plan is set to 'custom' unless it exactly matches a predefined plan
      return {
        ...prev,
        plan: 'custom',
        features: newFeatures,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    updateMutation.mutate(
      {
        id: selectedTenant._id,
        plan: formData.plan,
        status: formData.status,
        expiresAt: formData.expiresAt,
        features: formData.features,
      },
      {
        onSuccess: () => {
          setSelectedTenant(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const tenants = data?.restaurants || [];

  return (
    <div className="p-6 bg-gray-900 text-white min-h-full">
      <div className="mb-6 flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-black tracking-tight">Sales & Subscriptions</h1>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400 font-bold">
                <th className="p-4">Tenant Name</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Expiration / Trial End</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tenants.map((tenant: AdminRestaurant) => (
                <tr key={tenant._id} className="hover:bg-gray-750 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-100">{tenant.name}</div>
                    <div className="text-xs text-gray-500 lowercase">@{tenant.slug}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2.5 py-1 bg-gray-700 text-gray-200 text-xs font-black uppercase tracking-widest rounded">
                      {tenant.subscription?.plan || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-black uppercase tracking-widest rounded ${
                        tenant.subscription?.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : tenant.subscription?.status === 'trial'
                          ? 'bg-blue-500/20 text-blue-400'
                          : tenant.subscription?.status === 'past_due'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {tenant.subscription?.status || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-300 font-medium">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {tenant.subscription?.expiresAt
                        ? new Date(tenant.subscription.expiresAt).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleManageClick(tenant)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-1.5 ml-auto transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Manage Plan
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-medium tracking-wide">
                    No tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedTenant(null)} />
          <div className="relative bg-gray-800 w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Manage Subscription
              </h2>
              <button 
                onClick={() => setSelectedTenant(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <p className="text-sm text-gray-400 font-semibold mb-1">Editing Tenant:</p>
                <p className="text-lg text-white font-black">{selectedTenant.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Base Plan</label>
                  <select
                    value={formData.plan}
                    onChange={handlePlanChange}
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 font-medium outline-none"
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="plus">Plus</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 font-medium outline-none"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expiration / Trial End</label>
                <input
                  type="date"
                  required
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 font-medium outline-none [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-700">
                  Feature Flags
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(formData.features).map(([key, isEnabled]: [string, any]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isEnabled ? 'bg-blue-600 border-blue-600' : 'bg-gray-800 border-gray-600 group-hover:border-gray-500'}`}>
                        {isEnabled && <svg className="w-3.5 h-3.5 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={`text-sm font-semibold capitalize transition-colors ${isEnabled ? 'text-white' : 'text-gray-400'}`}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isEnabled}
                        onChange={() => handleFeatureToggle(key)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setSelectedTenant(null)}
                  className="px-4 py-2 font-bold text-sm text-gray-300 hover:text-white transition-colors"
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
