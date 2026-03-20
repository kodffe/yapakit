import { useState, useMemo } from 'react';
import { Plus, Minus, CheckCircle2, Printer } from 'lucide-react';
import Checkbox from '../../../components/ui/Checkbox';
import { Order, useAddPayment } from '../../orders/api/orderApi';
import { useReactToPrint } from 'react-to-print';
import { useRef, useEffect } from 'react';
import ReceiptTicket from './ReceiptTicket';
import { useRestaurantDetails } from '../../settings/api/settingsApi';

interface SplitPaymentViewProps {
  order: Order;
  currency: string;
  onClose: () => void;
}

export default function SplitPaymentView({ order, currency, onClose }: SplitPaymentViewProps) {
  const addPayment = useAddPayment();
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Track selected quantities per cartItemId (using menuItemId + name as fallback)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  
  const { data: details } = useRestaurantDetails();
  const paymentMethods = details?.settings?.paymentMethods || [
    { name: 'Cash', isExactAmountOnly: false, isActive: true },
    { name: 'Card', isExactAmountOnly: true, isActive: true }
  ];
  const activeMethods = paymentMethods.filter(m => m.isActive);

  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!paymentMethod && activeMethods.length > 0) {
      setPaymentMethod(activeMethods[0].name);
    }
  }, [activeMethods, paymentMethod]);
  
  // Customer Data State
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: order.customer?.name || '',
    taxId: order.customer?.taxId || '',
    address: order.customer?.address || '',
    email: order.customer?.email || '',
  });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt_Split_${order.orderNumber}`,
  });

  // Derived state for the Stepper List
  const availableItems = useMemo(() => {
    return order.items.map((item, index) => {
      // Use cartItemId if it exists; otherwise use an index-based composite key
      const key = item.cartItemId || `${item.menuItemId}-${item.name}-${index}`;
      const remainingQty = item.quantity - (item.paidQuantity || 0);
      
      const modifiersTotal = item.selectedModifiers?.reduce((sum, mod) => sum + mod.extraPrice, 0) || 0;
      const pricePerUnit = item.basePrice + modifiersTotal;

      return {
        ...item,
        key,
        remainingQty,
        pricePerUnit,
        selectedQty: selectedItems[key] || 0,
      };
    });
  }, [order.items, selectedItems]);

  const hasUnpaidItems = availableItems.some((item) => item.remainingQty > 0);

  // Math capabilities
  const splitSubtotal = useMemo(() => {
    return availableItems.reduce((sum, item) => sum + (item.pricePerUnit * item.selectedQty), 0);
  }, [availableItems]);

  // Tax math: Prorate the original order's tax based on the subtotal proportion
  const splitTax = useMemo(() => {
    if (order.subtotal === 0) return 0;
    const proportion = splitSubtotal / order.subtotal;
    return order.taxAmount * proportion;
  }, [splitSubtotal, order.subtotal, order.taxAmount]);

  const splitTotal = splitSubtotal + splitTax;

  const handleQuantityChange = (key: string, delta: number, maxQty: number) => {
    setSelectedItems((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      return { ...prev, [key]: next };
    });
  };

  const selectAll = () => {
    const allSelections: Record<string, number> = {};
    availableItems.forEach((item) => {
      if (item.remainingQty > 0) {
        allSelections[item.key] = item.remainingQty;
      }
    });
    setSelectedItems(allSelections);
  };

  const clearAll = () => {
    setSelectedItems({});
  };

  const handleAddPayment = () => {
    if (splitTotal <= 0) return;

    // Build the itemsPaid payload format
    const itemsPaidPayload = availableItems
      .filter((item) => item.selectedQty > 0)
      .map((item) => ({
        cartItemId: item.cartItemId,
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.selectedQty,
        price: item.pricePerUnit,
      }));

    addPayment.mutate(
      {
        orderId: order._id,
        payload: {
          amount: splitTotal,
          method: paymentMethod,
          itemsPaid: itemsPaidPayload,
          ...(showCustomerForm && { customerData }),
        },
      },
      {
        onSuccess: () => {
          // If the order is fully completed by this payment (or logic otherwise says so)
          setPaymentSuccess(true);
        },
      }
    );
  };

  if (paymentSuccess) {
    return (
      <div className="flex flex-col flex-1 h-full animate-in fade-in duration-300">
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white border border-gray-200 m-4">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2 font-mono uppercase">Payment Approved</h3>
          <p className="text-gray-500 mb-8 max-w-sm text-center">
            The split payment of {formatPrice(splitTotal)} has been applied to this order.
          </p>

          <div className="w-full max-w-sm space-y-4">
            <button
              onClick={() => handlePrint()}
              className="w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold transition-all flex items-center justify-center gap-3 text-lg"
            >
              <Printer className="w-6 h-6" />
              Print Split Receipt
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 font-bold transition-all"
            >
              Close Order
            </button>
          </div>

          <div className="hidden">
            <ReceiptTicket ref={componentRef} order={order} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-white">
      {/* Scrollable Setup */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Item Selection List */}
        <div>
          <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
            <h3 className="text-lg font-black text-gray-900 uppercase">Select Items</h3>
            {hasUnpaidItems && (
              <div className="flex gap-2">
                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 text-sm font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
                >
                  Select All
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {!hasUnpaidItems ? (
              <div className="p-6 text-center bg-gray-50 border border-gray-200 text-gray-500 font-bold">
                All items in this order have been fully paid.
              </div>
            ) : null}

            {availableItems.map((item) => {
              if (item.remainingQty === 0) return null; // Don't show fully paid items here

              return (
                <div key={item.key} className="flex justify-between items-center p-4 bg-gray-50 border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-mono text-gray-500">{formatPrice(item.pricePerUnit)}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs font-bold text-gray-400">
                        {item.remainingQty} of {item.quantity} remaining
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-amber-600 mt-1 italic">📝 {item.notes}</p>
                    )}
                  </div>
                  
                  {/* Stepper */}
                  <div className="flex items-center gap-4 bg-white border border-gray-200 p-1 ml-3 flex-shrink-0">
                    <button
                      onClick={() => handleQuantityChange(item.key, -1, item.remainingQty)}
                      disabled={item.selectedQty <= 0}
                      className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-900 transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="w-12 text-center font-bold text-lg text-gray-900 font-mono">
                      {item.selectedQty}
                    </div>
                    <button
                      onClick={() => handleQuantityChange(item.key, 1, item.remainingQty)}
                      disabled={item.selectedQty >= item.remainingQty}
                      className="w-10 h-10 flex items-center justify-center bg-brand-primary text-white disabled:opacity-50 active:scale-95 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Detail Form (Invoicing) */}
        <div className="border-t border-gray-200 pt-6">
          <div className="mb-4">
            <Checkbox
              id="showCustomerForm"
              checked={showCustomerForm}
              onChange={(e) => setShowCustomerForm(e.target.checked)}
              label="Add Customer Invoice Details (Optional)"
            />
          </div>

          {showCustomerForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company / Name</label>
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tax ID / RUC</label>
                <input
                  type="text"
                  value={customerData.taxId}
                  onChange={(e) => setCustomerData({ ...customerData, taxId: e.target.value })}
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-primary outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                <input
                  type="text"
                  value={customerData.address}
                  onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-primary outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  className="w-full bg-white border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-primary outline-none"
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Sticky Bottom Actions */}
      <div className="bg-gray-50 border-t border-gray-200 p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-end mb-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-gray-500">Subtotal: {formatPrice(splitSubtotal)}</div>
            <div className="text-sm font-bold text-gray-500">Tax: {formatPrice(splitTax)}</div>
          </div>
          <div className="text-right">
            <span className="block text-sm font-bold text-gray-500 uppercase">Payment Due</span>
            <span className="text-3xl font-black text-brand-primary font-mono">{formatPrice(splitTotal)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Method Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {activeMethods.map((m) => (
              <button
                key={m.name}
                onClick={() => setPaymentMethod(m.name)}
                className={`py-3 px-4 font-bold transition-colors text-sm truncate ${
                  paymentMethod === m.name ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleAddPayment}
            disabled={addPayment.isPending || splitTotal <= 0}
            className="w-full py-4 px-6 bg-brand-primary transition-all hover:brightness-90 active:scale-95 text-white font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-3 disabled:opacity-50 text-lg"
          >
            {addPayment.isPending ? (
              <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
            ) : (
              `Charge ${formatPrice(splitTotal)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
