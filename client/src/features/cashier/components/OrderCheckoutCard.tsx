import { Banknote, Eye, X } from 'lucide-react';
import { Order } from '../../orders/api/orderApi';
import { useState } from 'react';

interface OrderCheckoutCardProps {
  order: Order;
  currency: string;
  onCheckout: () => void;
}

const OrderCheckoutCard = ({ order, currency, onCheckout }: OrderCheckoutCardProps) => {
  const [showDetail, setShowDetail] = useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const isReady = order.status === 'ready';

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition-all overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-4 flex justify-between items-start border-b ${isReady ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-gray-900 leading-none">
                {order.tableName === 'Takeaway' ? 'Walk-in' : `Table ${order.tableName}`}
              </h3>
              <span className="bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                {order.orderNumber}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500 mt-1">
              {typeof order.waiterId === 'object' ? `${order.waiterId.firstName} ${order.waiterId.lastName}` : 'Staff'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetail(true)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-primary hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              aria-label="View order details"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isReady ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-800'
            }`}>
              {order.status}
            </div>
          </div>
        </div>

        {/* Body: Order Summary */}
        <div className="p-4 flex-1">
          <ul className="space-y-2 mb-4">
            {order.items.map((item, idx) => {
               const modifiersTotal = item.selectedModifiers?.reduce((sum, mod) => sum + mod.extraPrice, 0) || 0;
               const lineTotal = (item.basePrice + modifiersTotal) * item.quantity;
               return (
                <li key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex gap-2 text-gray-700">
                    <span className="font-bold">{item.quantity}x</span>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{formatPrice(lineTotal)}</span>
                </li>
               );
            })}
          </ul>

          {/* Financials Breakdowns */}
          <div className="pt-3 border-t border-gray-100 space-y-1">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>Tax</span>
              <span>{formatPrice(order.taxAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer: Total & Action */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Grand Total</p>
            <p className="text-2xl font-black text-gray-900 leading-none mt-0.5">{formatPrice(order.total)}</p>
          </div>
          
          <button
            onClick={onCheckout}
            className="flex-1 max-w-[160px] bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Banknote className="w-5 h-5" />
            CHECKOUT
          </button>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-70">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Order #{order.orderNumber}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {order.tableName === 'Takeaway' ? 'Takeaway' : `Table ${order.tableName}`}
                  {' · '}
                  {typeof order.waiterId === 'object' ? `${order.waiterId.firstName} ${order.waiterId.lastName}` : 'Staff'}
                </p>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Items */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Items</h4>
                <div className="space-y-3">
                  {order.items.map((item, idx) => {
                    const modTotal = item.selectedModifiers?.reduce((s, m) => s + m.extraPrice, 0) || 0;
                    const lineTotal = (item.basePrice + modTotal) * item.quantity;
                    return (
                      <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2 items-start">
                            <span className="bg-gray-200 text-gray-700 text-xs font-black px-2 py-0.5 rounded-md mt-0.5">
                              {item.quantity}×
                            </span>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                              {/* Modifiers */}
                              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.selectedModifiers.map((mod, mi) => (
                                    <p key={mi} className="text-xs text-gray-500">
                                      + {mod.optionName}
                                      {mod.extraPrice > 0 && (
                                        <span className="text-gray-400 ml-1">({formatPrice(mod.extraPrice)})</span>
                                      )}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {/* Notes */}
                              {item.notes && (
                                <p className="text-xs text-amber-600 mt-1 italic bg-amber-50 px-2 py-1 rounded-md inline-block">
                                  📝 {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-gray-900 text-sm whitespace-nowrap ml-3">
                            {formatPrice(lineTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(order.subtotal)}</span>
                </div>
                {order.discountAmount && order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount{order.discountCode ? ` (${order.discountCode})` : ''}</span>
                    <span className="font-medium">-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span className="font-medium">{formatPrice(order.taxAmount)}</span>
                </div>
                {order.takeawayFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Takeaway Fee</span>
                    <span className="font-medium">{formatPrice(order.takeawayFee)}</span>
                  </div>
                )}
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-medium">{formatPrice(order.deliveryFee)}</span>
                  </div>
                )}
              </div>

              {/* Customer info if present */}
              {order.customer && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Customer</h4>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-sm space-y-0.5">
                    {order.customer.name && <p className="font-bold text-gray-900">{order.customer.name}</p>}
                    {order.customer.phone && <p className="text-gray-600">{order.customer.phone}</p>}
                    {order.customer.email && <p className="text-gray-600">{order.customer.email}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Grand Total</p>
                <p className="text-2xl font-black text-gray-900">{formatPrice(order.total)}</p>
              </div>
              <button
                onClick={() => { setShowDetail(false); onCheckout(); }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <Banknote className="w-5 h-5" />
                CHECKOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderCheckoutCard;
