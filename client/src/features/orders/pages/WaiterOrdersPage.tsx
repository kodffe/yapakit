import { useNavigate } from 'react-router-dom';
import { Clock, UtensilsCrossed, Package, Truck, Pencil, XCircle } from 'lucide-react';
import { useActiveOrders, useCancelOrder, Order } from '../api/orderApi';
import { useRestaurantSettings } from '../../pos/api/restaurantApi';
import useCartStore from '../../../store/cartStore';
import useAuthStore from '../../../store/authStore';
import useHeaderStore from '../../../store/headerStore';
import { useEffect } from 'react';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  sent: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Sent' },
  preparing: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Preparing' },
  ready: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Ready' },
  served: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Served' },
};

const ORDER_TYPE_ICONS: Record<string, React.ReactNode> = {
  'dine-in': <UtensilsCrossed className="w-3.5 h-3.5" />,
  takeaway: <Package className="w-3.5 h-3.5" />,
  delivery: <Truck className="w-3.5 h-3.5" />,
};

function WaiterOrdersPage() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useActiveOrders();
  const { data: settings } = useRestaurantSettings();
  const cancelOrder = useCancelOrder();
  const { loadOrder } = useCartStore();
  const { memberships, currentRestaurantId } = useAuthStore();

  const currency = settings?.currency || 'USD';

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);

  const activeOrders = orders.filter(
    (o) => !['completed', 'cancelled'].includes(o.status)
  );

  // Get the current restaurant slug for navigation
  const currentMembership = memberships?.find((m) => m.restaurantId._id === currentRestaurantId);
  const slug = currentMembership?.restaurantId.slug || 'tenant';

  const setHeader = useHeaderStore((s) => s.setHeader);

  useEffect(() => {
    setHeader('Active Orders', `${activeOrders.length} order${activeOrders.length !== 1 ? 's' : ''} in progress.`);
  }, [setHeader, activeOrders.length]);

  const handleEditOrder = (order: Order) => {
    loadOrder(order);
    navigate(`/${slug}/menu`);
  };

  const handleCancelOrder = (order: Order) => {
    const reason = window.prompt(`Reason for cancelling order #${order.orderNumber}:`);
    if (reason === null) return; // User clicked Cancel on the prompt
    cancelOrder.mutate({
      orderId: order._id,
      cancelReason: reason || 'No reason provided',
    });
  };

  const canModify = (status: string) => ['sent', 'preparing'].includes(status);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {activeOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No active orders right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeOrders.map((order: Order) => {
            const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.sent;
            const orderType = order.orderType || 'dine-in';

            return (
              <div
                key={order._id}
                className={`rounded-2xl border-2 p-5 transition-all ${style.bg}`}
              >
                {/* Revision Badge */}
                {order.revision > 0 && (
                  <div className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg mb-3 text-center">
                    ⚠️ MODIFIED (Rev: {order.revision})
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-black text-gray-900">
                    #{order.orderNumber}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-lg ${style.text} bg-white border border-gray-200`}
                  >
                    {style.label}
                  </span>
                </div>

                {/* Order Type & Table */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`flex items-center gap-1.5 text-xs font-bold capitalize ${style.text}`}>
                    {ORDER_TYPE_ICONS[orderType]}
                    {orderType}
                  </span>
                  {order.tableName && (
                    <span className="text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                      Table: {order.tableName}
                    </span>
                  )}
                </div>

                {/* Items summary */}
                <div className="space-y-1 mb-3">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <p key={idx} className="text-xs text-gray-600">
                      <span className="font-bold">{item.quantity}x</span> {item.name}
                    </p>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-gray-400 italic">
                      +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-gray-200 flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-sm font-black text-gray-900">
                    {formatPrice(order.total)}
                  </span>
                </div>

                {/* Action Buttons */}
                {canModify(order.status) && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-brand-primary text-white text-sm font-bold rounded-xl hover:brightness-90 active:scale-95 transition-all shadow-sm"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Order
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order)}
                      disabled={cancelOrder.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 active:bg-red-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WaiterOrdersPage;
