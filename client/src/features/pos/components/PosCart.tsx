import { useState } from 'react';
import { Send, User, Tag, X, UtensilsCrossed, Package, Truck, MapPin, UserPlus, Check, RefreshCw } from 'lucide-react';
import useCartStore, { OrderType } from '../../../store/cartStore';
import useAuthStore from '../../../store/authStore';
import { useCreateOrder, useUpdateOrder } from '../../orders/api/orderApi';
import { useRestaurantDetails } from '../../settings/api/settingsApi';
import TablePickerModal from './TablePickerModal';
import PosCartItem from './PosCartItem';
import CustomerDataModal from './CustomerDataModal';
import api from '../../../services/api';

function PosCart() {
  const {
    orderItems,
    getTotals,
    selectedTableId,
    selectedTableName,
    currency,
    taxRate,
    orderType,
    setOrderType,
    discountCode,
    applyDiscount,
    removeDiscount,
    deliveryFee,
    setDeliveryFee,
    takeawayFee,
    setTakeawayFee,
    customer,
    clearCustomer,
    editingOrderId,
    clearCart,
  } = useCartStore();

  const { grossSubtotal, discountAmount, taxAmount, total } = getTotals();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const { currentRestaurantId } = useAuthStore();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();

  const isEditMode = !!editingOrderId;

  // Get RESTAURANT SETTINGS for the current tenant
  const { data: restaurantDetails } = useRestaurantDetails();
  const enabledOrderTypes = restaurantDetails?.settings?.enabledOrderTypes || ['dine-in', 'takeaway', 'delivery'];
  const defaultDeliveryFee = restaurantDetails?.settings?.defaultDeliveryFee || 0;
  const defaultTakeawayFee = restaurantDetails?.settings?.defaultTakeawayFee || 0;

  const handleValidatePromo = async () => {
    if (!promoInput.trim()) return;
    setPromoError('');
    setPromoLoading(true);

    try {
      const res = await api.get<{ success: boolean; data: { code: string; discountType: 'percentage' | 'fixed_amount'; value: number } }>(
        `/promotions/validate/${promoInput.trim()}`
      );
      const { code, discountType, value } = res.data.data;
      applyDiscount(code, discountType, value);
      setPromoInput('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setPromoError(error.response?.data?.message || 'Invalid promotion code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSendToKitchen = () => {
    if (!currentRestaurantId) return;

    // Snapshot current cart state before clearing
    const cartItems = [...orderItems];
    const cartSubtotal = grossSubtotal;
    const cartDiscount = discountCode;
    const cartDiscountAmt = discountAmount;
    const cartTax = taxAmount;
    const cartTotal = total;
    const cartCurrency = currency;
    const cartTableId = selectedTableId;
    const cartOrderType = orderType;
    const cartDeliveryFee = deliveryFee;
    const cartTakeawayFee = takeawayFee;
    const cartCustomer = customer;
    const editId = editingOrderId;

    useCartStore.getState().clearCart();
    useCartStore.getState().setTable(null, null);

    if (editId) {
      // UPDATE existing order
      updateOrder.mutate(
        {
          orderId: editId,
          payload: {
            restaurantId: currentRestaurantId,
            orderType: cartOrderType,
            tableId: cartTableId || undefined,
            items: cartItems,
            subtotal: cartSubtotal,
            discountCode: cartDiscount || undefined,
            discountAmount: cartDiscountAmt || 0,
            taxAmount: cartTax,
            deliveryFee: cartDeliveryFee,
            takeawayFee: cartTakeawayFee,
            total: cartTotal,
            currency: cartCurrency,
            customer: cartCustomer || undefined,
          },
        },
        {
          onSuccess: () => {
            alert('Order updated and sent back to kitchen!');
          },
          onError: (error) => {
            console.error('Failed to update order:', error);
            alert('Failed to update order. Please try again.');
          },
        }
      );
    } else {
      // CREATE new order
      createOrder.mutate(
        {
          restaurantId: currentRestaurantId,
          orderType: cartOrderType,
          tableId: cartTableId || undefined,
          items: cartItems,
          subtotal: cartSubtotal,
          discountCode: cartDiscount || undefined,
          discountAmount: cartDiscountAmt || 0,
          taxAmount: cartTax,
          deliveryFee: cartDeliveryFee,
          takeawayFee: cartTakeawayFee,
          total: cartTotal,
          currency: cartCurrency,
          customer: cartCustomer || undefined,
        },
        {
          onSuccess: () => {
            alert('Order sent to kitchen successfully!');
          },
          onError: (error) => {
            console.error('Failed to send order:', error);
            alert('Failed to send order. Please try again.');
          },
        }
      );
    }

    // If offline, the mutation is paused (not errored). Show a friendly message.
    if (!navigator.onLine) {
      alert('📡 You are offline. The order has been queued and will be sent automatically when the connection is restored.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 w-full relative z-20">

      {/* Top Edit Mode Banner — highly visible */}
      {isEditMode && (
        <div className="bg-yellow-400 text-black font-bold p-3 text-center text-sm">
          ✏️ Editing Order — Changes will be sent to kitchen
        </div>
      )}
      
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-gray-900">Current Order</h2>
            {orderType === 'dine-in' ? (
              <button
                onClick={() => setShowTablePicker(true)}
                className="flex items-center gap-1.5 mt-1 text-sm font-medium text-brand-primary hover:opacity-80"
              >
                <MapPin className="w-3.5 h-3.5" />
                {selectedTableId && selectedTableName ? (
                  <>
                    <span>Table {selectedTableName}</span>
                    <span className="text-xs text-brand-primary/60 ml-1 font-bold">(change)</span>
                  </>
                ) : (
                  <span className="underline underline-offset-2 decoration-dashed">Select a table</span>
                )}
              </button>
            ) : (
              <div className="flex items-center text-sm font-medium text-brand-primary mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                {orderType.charAt(0).toUpperCase() + orderType.slice(1)}
              </div>
            )}
          </div>

          {/* Customer Info Button */}
          <button
            onClick={() => setShowCustomerModal(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
              customer
                ? 'bg-brand-primary border-transparent text-white'
                : 'bg-white border-gray-200 text-gray-400 hover:border-brand-primary hover:text-brand-primary'
            }`}
            title={customer ? `Customer: ${customer.name}` : 'Add Customer Info'}
          >
            {customer ? <Check className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </button>
        </div>

        {/* Customer Badge */}
        {customer && (
          <div className="flex items-center justify-between bg-brand-primary/5 border border-brand-primary/20 rounded-lg px-3 py-2 mb-3">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-brand-primary" />
              <span className="text-xs font-bold text-gray-900">{customer.name}</span>
              {customer.requestsInvoice && (
                <span className="text-xs bg-brand-primary text-white px-1.5 py-0.5 rounded font-bold">Invoice</span>
              )}
            </div>
            <button onClick={clearCustomer} className="text-brand-primary/40 hover:text-red-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Order Type Selector */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1">
          {([
            { type: 'dine-in' as OrderType, icon: <UtensilsCrossed className="w-3.5 h-3.5" />, label: 'Dine-In' },
            { type: 'takeaway' as OrderType, icon: <Package className="w-3.5 h-3.5" />, label: 'Takeaway' },
            { type: 'delivery' as OrderType, icon: <Truck className="w-3.5 h-3.5" />, label: 'Delivery' },
          ])
            .filter(({ type }) => enabledOrderTypes.includes(type))
            .map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => {
                setOrderType(type);
                if (type === 'delivery') {
                  setDeliveryFee(defaultDeliveryFee);
                  setTakeawayFee(0);
                } else if (type === 'takeaway') {
                  setTakeawayFee(defaultTakeawayFee);
                  setDeliveryFee(0);
                } else {
                  setDeliveryFee(0);
                  setTakeawayFee(0);
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                orderType === type
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {orderItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🛒</span>
             </div>
             <p className="font-medium text-sm">Add items from the menu</p>
          </div>
        ) : (
          orderItems.map((item) => (
            <PosCartItem key={item.cartItemId} item={item} formatPrice={formatPrice} />
          ))
        )}
      </div>

      {/* Promo Code + Totals + Send */}
      <div className="bg-white border-t border-gray-200 p-5 space-y-4">

        {/* Promo Code Input */}
        {orderItems.length > 0 && (
          <div>
            {discountCode ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">{discountCode}</span>
                  <span className="text-xs text-emerald-600">applied</span>
                </div>
                <button onClick={removeDiscount} className="text-emerald-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidatePromo()}
                    placeholder="Promo code"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
                  />
                  <button
                    onClick={handleValidatePromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                  >
                    {promoLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {promoError && (
                  <p className="text-xs text-red-500 font-medium mt-1.5 pl-1">{promoError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Totals Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-gray-500">
            <span>Subtotal</span>
            <span>{formatPrice(grossSubtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm font-medium text-emerald-600">
              <span>Discount</span>
              <span>- {formatPrice(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-medium text-gray-500">
            <span>Tax ({taxRate}%)</span>
            <span>{formatPrice(taxAmount)}</span>
          </div>

          {/* Delivery Fee Row */}
          {orderType === 'delivery' && (
            <div className="flex justify-between items-center text-sm font-medium text-amber-700">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Delivery Fee
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  value={deliveryFee.toString()}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-right font-bold text-gray-900 bg-gray-100 border border-gray-200 rounded-md focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>
          )}

          {/* Takeaway Fee Row */}
          {orderType === 'takeaway' && (
            <div className="flex justify-between items-center text-sm font-medium text-amber-700">
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" /> Takeaway Fee
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  value={takeawayFee.toString()}
                  onChange={(e) => setTakeawayFee(parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-right font-bold text-gray-900 bg-gray-100 border border-gray-200 rounded-md focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-200 flex justify-between items-end">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-2xl font-black text-gray-900">
              {formatPrice(total)}
            </span>
          </div>
        </div>
        
        {/* Edit Mode Actions */}
        {isEditMode && (
          <button
            onClick={clearCart}
            className="w-full py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            Cancel Edit
          </button>
        )}

        <button
          onClick={handleSendToKitchen}
          disabled={orderItems.length === 0 || (orderType === 'dine-in' && !selectedTableId)}
          className={`w-full flex items-center justify-center gap-3 text-white font-bold py-4 rounded-2xl shadow-lg transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed ${
            isEditMode
              ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
              : 'bg-brand-primary hover:opacity-90 active:scale-95 transition-all'
          }`}
        >
          {isEditMode ? (
            <>
              <RefreshCw className="w-5 h-5" />
              UPDATE KITCHEN
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              SEND TO KITCHEN
            </>
          )}
        </button>
      </div>

      {/* Table Picker Modal */}
      {showTablePicker && (
        <TablePickerModal onClose={() => setShowTablePicker(false)} />
      )}

      {/* Customer Data Modal */}
      {showCustomerModal && (
        <CustomerDataModal onClose={() => setShowCustomerModal(false)} />
      )}
    </div>
  );
}

export default PosCart;
