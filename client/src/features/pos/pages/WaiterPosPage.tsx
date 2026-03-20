import { useEffect, useState } from 'react';
import PosMenuGrid from '../components/PosMenuGrid';
import PosCart from '../components/PosCart';
import { useRestaurantSettings } from '../api/restaurantApi';
import useCartStore from '../../../store/cartStore';
import useHeaderStore from '../../../store/headerStore';
import { ShoppingCart, X } from 'lucide-react';

function WaiterPosPage() {
  const { data: settings } = useRestaurantSettings();
  const setRestaurantSettings = useCartStore((state) => state.setRestaurantSettings);
  const { getTotals, orderItems } = useCartStore();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const setHeader = useHeaderStore((s) => s.setHeader);

  useEffect(() => {
    setHeader('Point of Sale', 'Take orders and manage carts.');
  }, [setHeader]);

  useEffect(() => {
    if (settings) {
      setRestaurantSettings(settings.taxRate, settings.currency);
    }
  }, [settings, setRestaurantSettings]);

  const { total } = getTotals();
  const itemCount = orderItems.reduce((acc, item) => acc + item.quantity, 0);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: settings?.currency || 'USD',
    }).format(amount);
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 h-[calc(100vh-10rem)] w-full overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-200 relative">
      
      {/* Left/Center Area: Menu (Categories + List) */}
      <div className="flex-1 min-w-0 w-full lg:w-auto overflow-hidden flex flex-col pb-20 lg:pb-0 relative z-0">
        <PosMenuGrid />
      </div>

      {/* Right Sidebar - Desktop Cart (350px) */}
      <div className="hidden lg:flex flex-col w-[350px] bg-white border-l border-gray-200 flex-shrink-0 relative z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] h-full overflow-hidden">
        <PosCart />
      </div>

      {/* Mobile Fixed Bottom Cart Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-primary border-t border-black/10 p-4 z-40 flex justify-between items-center shadow-[0_-4px_15px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center bg-white/20 w-12 h-12 rounded-xl border border-white/30 text-white">
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-brand-primary shadow-sm">
                {itemCount}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Current Order</span>
            <span className="text-white font-black text-xl leading-none">{formatPrice(total)}</span>
          </div>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="bg-white text-brand-primary px-6 py-3 rounded-xl font-black uppercase tracking-wider active:scale-95 transition-transform flex items-center gap-2 shadow-sm"
        >
          View Cart
        </button>
      </div>

      {/* Mobile Cart Modal Overlay */}
      {isCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gray-900/40 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white h-[90vh] rounded-t-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white flex-shrink-0">
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase">Checkout</h2>
                <p className="text-sm font-bold text-gray-500 mt-0.5">{itemCount} items</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden relative bg-gray-50 pb-safe">
              <PosCart />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default WaiterPosPage;
