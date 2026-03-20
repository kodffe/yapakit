import { useState } from 'react';
import { Receipt, Clock, LogOut } from 'lucide-react';
import { useActiveOrders } from '../../orders/api/orderApi';
import { useRestaurantSettings } from '../../pos/api/restaurantApi';
import { useCurrentShift } from '../api/shiftApi';
import { Order } from '../../orders/api/orderApi';
import OrderCheckoutCard from '../components/OrderCheckoutCard';
import OpenShiftCard from '../components/OpenShiftCard';
import CloseShiftModal from '../components/CloseShiftModal';
import CheckoutModal from '../components/CheckoutModal';
import useHeaderStore from '../../../store/headerStore';
import { useEffect } from 'react';

const CashierDashboard = () => {
  const { data: activeOrders = [], isLoading: isOrdersLoading, error } = useActiveOrders();
  const { data: settings } = useRestaurantSettings();
  const { data: currentShift, isLoading: isShiftLoading } = useCurrentShift();

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const currency = settings?.currency || 'USD';

  if (isOrdersLoading || isShiftLoading) {
    return (
      <div className="p-8 flex justify-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold text-center">
        Error loading active orders.
      </div>
    );
  }

  const checkoutQueue = activeOrders.filter((o) => o.status === 'ready' || o.status === 'served');

  const setHeader = useHeaderStore((s) => s.setHeader);

  useEffect(() => {
    setHeader(
      'Checkout Terminal', 
      `${checkoutQueue.length} ${checkoutQueue.length === 1 ? 'order' : 'orders'} waiting for payment`
    );
  }, [setHeader, checkoutQueue.length]);

  // If there's no active shift, force the user to open one before showing the dashboard.
  if (!currentShift) {
    return <OpenShiftCard />;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      
      {/* Action Toolbar */}
      <div className="flex items-center justify-end px-6 pt-6 pb-2">
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-500 font-medium">
            <Clock className="w-4 h-4" />
            Shift Started: {new Date(currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          
          <button
            onClick={() => setIsCloseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl transition-colors border border-red-200/50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Close Shift</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="px-6 pb-6">
        {checkoutQueue.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-3xl bg-white/50">
            <Receipt className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">Queue is Empty</h3>
            <p className="text-gray-500 font-medium">No orders are currently waiting for checkout.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {checkoutQueue.map((order) => (
              <OrderCheckoutCard 
                key={order._id} 
                order={order} 
                currency={currency} 
                onCheckout={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isCloseModalOpen && (
        <CloseShiftModal onClose={() => setIsCloseModalOpen(false)} />
      )}
      {selectedOrder && (
        <CheckoutModal 
          order={selectedOrder} 
          currency={currency} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

export default CashierDashboard;
