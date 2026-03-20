import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Settings, ChevronRight, Users, X, Loader2, UtensilsCrossed } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useCreateInternalRestaurant, CreateInternalRestaurantPayload } from '../features/restaurants/api/restaurantApi';

/**
 * Role badge color mapping.
 */
const ROLE_COLORS: Record<string, string> = {
  manager: 'bg-purple-100 text-purple-700',
  cashier: 'bg-blue-100 text-blue-700',
  waiter: 'bg-emerald-100 text-emerald-700',
  kitchen: 'bg-amber-100 text-amber-700',
};

/**
 * Initial empty form state for the creation modal.
 */
const EMPTY_FORM: CreateInternalRestaurantPayload = {
  name: '',
  type: '',
  phone: '',
  address: '',
};

/**
 * Multi-Tenant Hub: Restaurant Selector with internal creation.
 */
function RestaurantSelector() {
  const navigate = useNavigate();
  const { memberships, setRestaurantContext } = useAuthStore();
  const createMutation = useCreateInternalRestaurant();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateInternalRestaurantPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const handleSelect = useCallback(
    (restaurantId: string, slug: string) => {
      setRestaurantContext(restaurantId);
      navigate(`/${slug}/dashboard`, { replace: true });
    },
    [setRestaurantContext, navigate]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError('');

      if (!form.name.trim()) {
        setFormError('Restaurant name is required.');
        return;
      }

      createMutation.mutate(form, {
        onSuccess: (data) => {
          setShowModal(false);
          setForm(EMPTY_FORM);
          // Navigate directly to the new restaurant
          if (data.restaurant?.slug) {
            setRestaurantContext(data.restaurant._id);
            // Add the new membership to the local store so it appears immediately
            if (data.membership) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              useAuthStore.getState().addMembership(data.membership as any);
            }
            navigate(`/${data.restaurant.slug}/dashboard`, { replace: true });
          }
        },
        onError: (err: Error) => {
          setFormError(err.message || 'Failed to create restaurant.');
        },
      });
    },
    [form, createMutation, setRestaurantContext, navigate]
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Yapakit</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-10">
        {/* Header */}
        <div className="w-full max-w-2xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Your Restaurants</h1>
              <p className="text-sm text-gray-500 mt-1">
                Select a restaurant to manage, or create a new one.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Restaurant
            </button>
          </div>
        </div>

        {/* Restaurant Grid */}
        <div className="w-full max-w-2xl space-y-3">
          {!memberships || memberships.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-600">No Restaurants Yet</h3>
              <p className="text-gray-400 text-sm mt-1">
                Click "Add Restaurant" to create your first one.
              </p>
            </div>
          ) : (
            memberships.map((membership) => (
              <div
                key={membership._id}
                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 transition-colors"
              >
                {/* Clickable name area */}
                <button
                  onClick={() =>
                    handleSelect(
                      membership.restaurantId._id,
                      membership.restaurantId.slug
                    )
                  }
                  className="flex items-center gap-4 flex-1 min-w-0 text-left"
                >
                  {membership.restaurantId.settings?.logoUrl ? (
                    <img
                      src={membership.restaurantId.settings.logoUrl}
                      alt={membership.restaurantId.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 leading-tight truncate">
                      {membership.restaurantId.name}
                    </p>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-md mt-1 inline-block ${
                        ROLE_COLORS[membership.tenantRole] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {membership.tenantRole}
                    </span>
                  </div>
                </button>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {membership.tenantRole === 'manager' && (
                    <button
                      onClick={() => {
                        setRestaurantContext(membership.restaurantId._id);
                        navigate(`/${membership.restaurantId.slug}/settings`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  )}
                  <button
                    onClick={() =>
                      handleSelect(
                        membership.restaurantId._id,
                        membership.restaurantId.slug
                      )
                    }
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ─── Create Restaurant Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-black text-gray-900">New Restaurant</h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded-lg font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="My Awesome Restaurant"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Type / Category
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                >
                  <option value="">Select a type...</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Café</option>
                  <option value="bar">Bar</option>
                  <option value="bakery">Bakery</option>
                  <option value="food-truck">Food Truck</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City, Country"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormError('');
                  }}
                  className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Restaurant'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantSelector;
