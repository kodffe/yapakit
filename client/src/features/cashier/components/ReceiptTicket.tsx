import { forwardRef } from 'react';
import { Order } from '../../orders/api/orderApi';
import useAuthStore from '../../../store/authStore';

interface ReceiptTicketProps {
  order: Order;
}

const ReceiptTicket = forwardRef<HTMLDivElement, ReceiptTicketProps>(({ order }, ref) => {
  const { memberships, user, currentRestaurantId } = useAuthStore();
  
  // Find the restaurant info
  const membership = memberships?.find(m => m.restaurantId._id === currentRestaurantId);
  const restaurantName = membership?.restaurantId.name || 'Yapakit POS';
  const cashierName = user ? `${user.firstName} ${user.lastName}` : 'Cashier';

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Hardcoded fallback if needed, or pass via props
    }).format(amount);
  };

  return (
    <div 
      ref={ref} 
      className="p-4 bg-white text-black font-mono text-sm mx-auto receipt-container"
      style={{ width: '80mm', minHeight: '100%', boxSizing: 'border-box' }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold uppercase">{restaurantName}</h1>
        <p className="text-xs mt-1">Receipt for Order</p>
        <div className="text-xs mt-2 flex justify-between">
          <span>{new Date().toLocaleDateString()}</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="text-xs text-left mt-1">Cashier: {cashierName}</div>
      </div>

      <div className="border-b border-dashed border-black my-2"></div>

      {/* Subheader */}
      <div className="mb-4">
        <div className="flex justify-between font-bold text-lg mb-1">
          <span>Order: #{order.orderNumber}</span>
          <span>{order.orderType === 'dine-in' ? `Table ${order.tableName}` : 'Takeaway'}</span>
        </div>
        <div className="text-xs uppercase">{order.orderType}</div>
      </div>

      <div className="border-b border-dashed border-black my-2"></div>

      {/* Customer / Invoice Details (from latest payment if split) */}
      {order.payments && order.payments.length > 0 && order.payments[order.payments.length - 1].customerData?.name && (
        <div className="mb-4 text-xs">
          <div className="font-bold border-b border-black inline-block mb-1">Invoice Details</div>
          <div>Name: {order.payments[order.payments.length - 1].customerData?.name}</div>
          {order.payments[order.payments.length - 1].customerData?.taxId && (
            <div>Tax ID: {order.payments[order.payments.length - 1].customerData?.taxId}</div>
          )}
          {order.payments[order.payments.length - 1].customerData?.address && (
            <div>Address: {order.payments[order.payments.length - 1].customerData?.address}</div>
          )}
          {order.payments[order.payments.length - 1].customerData?.email && (
            <div>Email: {order.payments[order.payments.length - 1].customerData?.email}</div>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-xs font-bold border-b border-black pb-1">
          <span className="w-8">Qty</span>
          <span className="flex-1">Item</span>
          <span className="w-16 text-right">Total</span>
        </div>
        
        {(() => {
          const latestPayment = order.payments && order.payments.length > 0 ? order.payments[order.payments.length - 1] : null;
          
          if (latestPayment && latestPayment.itemsPaid && latestPayment.itemsPaid.length > 0) {
            // Print only the items paid in this specific split
            return latestPayment.itemsPaid.map((item, idx) => {
              const lineTotal = item.price * item.quantity;
              return (
                <div key={`split-${idx}`} className="text-xs flex justify-between items-start">
                  <span className="w-8">{item.quantity}</span>
                  <span className="flex-1 pr-2">{item.name}</span>
                  <span className="w-16 text-right">{formatPrice(lineTotal)}</span>
                </div>
              );
            });
          }

          // Otherwise print full order
          return order.items.map((item, idx) => {
            const modifiersTotal = item.selectedModifiers?.reduce((sum, mod) => sum + mod.extraPrice, 0) || 0;
            const lineTotal = (item.basePrice + modifiersTotal) * item.quantity;
            
            return (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-start">
                  <span className="w-8">{item.quantity}</span>
                  <span className="flex-1 pr-2">{item.name}</span>
                  <span className="w-16 text-right">{formatPrice(lineTotal)}</span>
                </div>
                
                {/* Modifiers */}
                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                  <div className="pl-8 mt-0.5 text-[0.65rem] text-gray-700">
                    {item.selectedModifiers.map((mod, mIdx) => (
                      <div key={mIdx} className="flex justify-between">
                        <span>+ {mod.optionName}</span>
                        {mod.extraPrice > 0 && <span>{formatPrice(mod.extraPrice)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>

      <div className="border-b border-dashed border-black my-2"></div>

      {/* Totals */}
      <div className="space-y-1 mt-4 mb-6 text-sm font-bold">
        <div className="flex justify-between font-normal">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between font-normal">
          <span>Tax</span>
          <span>{formatPrice(order.taxAmount)}</span>
        </div>
        <div className="flex justify-between text-lg mt-2 pt-2 border-t border-black">
          <span>TOTAL</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Footer */}
      {(order.payments && order.payments.length > 0) && (
        <div className="space-y-1 mb-6 text-xs border-t border-black pt-2">
          <p className="font-bold mb-1">Payments Received:</p>
          {order.payments.map((p, i) => (
            <div key={i} className="flex justify-between">
              <span className="capitalize">{p.method}</span>
              <span>{formatPrice(p.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold mt-1 pt-1 border-t border-dashed border-gray-400">
            <span>Balance Due</span>
            <span>{formatPrice(Math.max(0, order.total - order.payments.reduce((s, payment) => s + payment.amount, 0)))}</span>
          </div>
        </div>
      )}

      <div className="text-center mt-6">
        <p className="font-bold text-sm">Thank you for your visit!</p>
        <p className="text-xs mt-1">Powered by Yapakit POS</p>
      </div>
      
      {/* Small padding at bottom for printer cutting */}
      <div className="h-8"></div>
    </div>
  );
});

ReceiptTicket.displayName = 'ReceiptTicket';

export default ReceiptTicket;
