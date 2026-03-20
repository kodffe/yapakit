import { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CheckCircle2, X, Printer, Plus } from 'lucide-react';
import { Order, useAddPayment } from '../../orders/api/orderApi';
import ReceiptTicket from './ReceiptTicket';
import SplitPaymentView from './SplitPaymentView';
import { useRestaurantDetails } from '../../settings/api/settingsApi';
import { useParams, useNavigate } from 'react-router-dom';
import useCartStore from '../../../store/cartStore';
import { Edit2 } from 'lucide-react';

interface CheckoutModalProps {
  order: Order;
  currency: string;
  onClose: () => void;
}

export default function CheckoutModal({ order, currency, onClose }: CheckoutModalProps) {
  const addPayment = useAddPayment();
  const componentRef = useRef<HTMLDivElement>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'full' | 'split'>('full');
  
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const loadOrder = useCartStore(state => state.loadOrder);
  const setManualDiscountStore = useCartStore(state => state.setManualDiscount);

  // Partial Payment State
  const totalPaid = order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = Math.max(0, order.total - totalPaid);
  
  const { data: details } = useRestaurantDetails();
  const paymentMethods = details?.settings?.paymentMethods || [
    { name: 'Cash', isExactAmountOnly: false, isActive: true },
    { name: 'Card', isExactAmountOnly: true, isActive: true }
  ];
  const activeMethods = paymentMethods.filter(m => m.isActive);

  const [paymentAmount, setPaymentAmount] = useState<number | ''>(balanceDue);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [manualDiscount, setManualDiscount] = useState<number | ''>('');

  useEffect(() => {
    if (!paymentMethod && activeMethods.length > 0) {
      setPaymentMethod(activeMethods[0].name);
    }
  }, [activeMethods, paymentMethod]);

  const selectedMethodConfig = activeMethods.find(m => m.name === paymentMethod) || activeMethods[0];
  const isExact = selectedMethodConfig?.isExactAmountOnly;

  useEffect(() => {
    if (isExact && balanceDue > 0) {
      setPaymentAmount(balanceDue);
    }
  }, [paymentMethod, balanceDue, isExact]);

  useEffect(() => {
    // Keep internal input mapped to remaining balance when external order updates
    if (balanceDue > 0) {
      if (isExact) {
        setPaymentAmount(balanceDue);
      }
    } else {
      setPaymentSuccess(true);
    }
  }, [balanceDue, order.payments, isExact]);

  const changeDue = !isExact && paymentAmount !== '' && Number(paymentAmount) > balanceDue 
    ? Number(paymentAmount) - balanceDue 
    : 0;

  // Calculate sensible Quick Cash buttons based on balance
  const generateQuickCash = (balance: number) => {
    if (balance <= 0) return [];
    
    // Always include exact amount
    const options = new Set<number>([balance]);
    
    // Standard bills depending on balance size
    const standardBills = [5, 10, 20, 50, 100];
    
    for (const bill of standardBills) {
      if (bill >= balance) {
        options.add(bill);
        if (options.size >= 4) break;
      }
    }
    
    // If we need more options, add next tens
    if (options.size < 4) {
      const nextTen = Math.ceil(balance / 10) * 10;
      options.add(nextTen);
      options.add(nextTen + 10);
    }
    
    return Array.from(options).sort((a, b) => a - b).slice(0, 4);
  };
  const quickCashOptions = generateQuickCash(balanceDue);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt_${order.orderNumber}`,
  });

  const handleAddPayment = () => {
    if (!paymentAmount || paymentAmount <= 0) return;
    
    addPayment.mutate(
      { 
        orderId: order._id, 
        payload: { 
          amount: Number(paymentAmount), 
          method: paymentMethod,
          ...(manualDiscount !== '' && Number(manualDiscount) > 0 ? { manualDiscount: Number(manualDiscount) } : {})
        } 
      },
      {
        onSuccess: (updatedOrder) => {
          // If the API returns it as completed, or if local math says balance is 0
          const newTotalPaid = updatedOrder.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
          if (updatedOrder.total - newTotalPaid <= 0.01) {
            setPaymentSuccess(true);
          }
        },
      }
    );
  };

  const handleEditOrder = () => {
    loadOrder(order);
    if (order.manualDiscount) {
      setManualDiscountStore(order.manualDiscount);
    }
    onClose();
    navigate(`/${slug}/menu`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-70">
      <div className="bg-white rounded-none border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[90vh] md:h-auto md:max-h-[85vh]">
        {/* Header & Tabs */}
        <div className="flex flex-col border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center p-6 pb-2">
            <h2 className="text-xl font-black text-gray-900 uppercase">
              {paymentSuccess ? 'Order Completed' : 'Checkout Form'}
            </h2>
            {!paymentSuccess && (
              <button
                onClick={onClose}
                disabled={addPayment.isPending}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
          
          {/* Tabs */}
          {!paymentSuccess && (
            <div className="flex mt-2 px-6 gap-6">
              <button
                onClick={() => setActiveTab('full')}
                className={`pb-3 text-sm font-bold uppercase transition-colors border-b-2 ${
                  activeTab === 'full' 
                    ? 'border-brand-primary text-brand-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Pay Full Balance
              </button>
              <button
                onClick={() => setActiveTab('split')}
                className={`pb-3 text-sm font-bold uppercase transition-colors border-b-2 ${
                  activeTab === 'split' 
                    ? 'border-brand-primary text-brand-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Split by Item
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'split' && !paymentSuccess ? (
            <SplitPaymentView order={order} currency={currency} onClose={onClose} />
          ) : (
            <div className="p-8 flex flex-col items-stretch flex-1 overflow-y-auto">
              {!paymentSuccess ? (
                <>
                  {/* Full Order Breakdown */}
                  <div className="mb-6 bg-gray-50 border border-gray-200">
                    {/* Items List */}
                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Order Items</h4>
                      {order.items.map((item, idx) => {
                        const modTotal = item.selectedModifiers?.reduce((s, m) => s + m.extraPrice, 0) || 0;
                        const lineTotal = (item.basePrice + modTotal) * item.quantity;
                        return (
                          <div key={idx} className="text-sm">
                            <div className="flex justify-between text-gray-700">
                              <span>
                                <span className="font-bold">{item.quantity}×</span> {item.name}
                              </span>
                              <span className="font-medium">{formatPrice(lineTotal)}</span>
                            </div>
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="pl-6 mt-0.5">
                                {item.selectedModifiers.map((mod, mi) => (
                                  <p key={mi} className="text-xs text-gray-400">+ {mod.optionName}{mod.extraPrice > 0 ? ` (${formatPrice(mod.extraPrice)})` : ''}</p>
                                ))}
                              </div>
                            )}
                            {item.notes && (
                              <p className="text-xs text-amber-600 pl-6 mt-0.5 italic">📝 {item.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Financial Breakdown */}
                    <div className="border-t border-gray-200 p-4 space-y-1.5">
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
                      <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                        <span>Order Total</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </div>

                    {/* Paid / Balance */}
                    {totalPaid > 0 && (
                      <div className="border-t border-gray-200 p-4 space-y-1.5">
                        <div className="flex justify-between text-sm text-green-600 font-bold">
                          <span>Amount Paid</span>
                          <span>{formatPrice(totalPaid)}</span>
                        </div>
                      </div>
                    )}
                    <div className="border-t-2 border-gray-300 p-4">
                      <div className="flex justify-between text-xl font-black text-red-600">
                        <span>Balance Due</span>
                        <span>{formatPrice(balanceDue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Existing Payments List */}
                  {order.payments && order.payments.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2 uppercase text-sm">Payment History</h4>
                      <ul className="space-y-2">
                        {order.payments.map((p, i) => (
                          <li key={i} className="flex justify-between text-sm text-gray-600 font-bold bg-white p-3 border border-gray-200">
                            <span className="capitalize">{p.method} Payment</span>
                            <span>{formatPrice(p.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Payment Form */}
                  {balanceDue > 0 && (
                    <div className="space-y-4 bg-white p-6 border border-gray-200 mt-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Manual Discount ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={manualDiscount}
                            onChange={(e) => setManualDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="0.00"
                            className="w-full bg-gray-50 border-2 border-gray-300 px-4 py-3 text-gray-900 font-bold text-lg focus:border-brand-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Method</label>
                          <div className="grid grid-cols-2 gap-2">
                            {activeMethods.map((m) => (
                              <button
                                key={m.name}
                                type="button"
                                onClick={() => setPaymentMethod(m.name)}
                                className={`py-3 px-4 font-bold transition-colors text-sm truncate border-2 ${
                                  paymentMethod === m.name 
                                    ? 'bg-gray-900 border-gray-900 text-white' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                                }`}
                              >
                                {m.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase">Payment Amount</label>
                          {changeDue > 0 && (
                            <span className="text-sm font-black text-rose-600 bg-rose-50 px-2 py-1 rounded">
                              Change Due: {formatPrice(changeDue)}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min={isExact ? balanceDue : "0"}
                          max={isExact ? balanceDue : undefined}
                          step="0.01"
                          readOnly={isExact}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          className={`w-full border-2 px-4 py-4 text-gray-900 font-black text-xl outline-none transition-colors ${
                            isExact ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'bg-gray-50 border-gray-300 focus:border-brand-primary'
                          }`}
                        />
                        
                        {/* Quick Cash Buttons */}
                        {!isExact && quickCashOptions.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {quickCashOptions.map((amt, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPaymentAmount(amt)}
                                className={`flex-1 py-2 rounded font-bold text-sm border-2 transition-colors ${
                                  paymentAmount === amt 
                                    ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-brand-primary/50'
                                }`}
                              >
                                {idx === 0 ? 'Exact' : formatPrice(amt)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleEditOrder}
                          className="py-5 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 flex-shrink-0 text-lg border border-gray-300"
                          title="Edit Order in Menu"
                        >
                          <Edit2 className="w-6 h-6" />
                        </button>
                        <button
                          onClick={handleAddPayment}
                          disabled={addPayment.isPending || paymentAmount === '' || Number(paymentAmount) <= 0}
                          className="flex-1 py-5 px-6 bg-brand-primary hover:opacity-90 text-white font-black uppercase tracking-wider transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xl"
                        >
                          {addPayment.isPending ? (
                            <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
                          ) : (
                            <>
                              <Plus className="w-6 h-6" />
                              Apply Payment
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center">
                  <div className="w-full bg-green-600 text-white p-8 text-center mb-8 border border-green-700">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-3xl font-black uppercase">Fully Paid</h3>
                  </div>

                  <div className="w-full space-y-4 max-w-sm">
                    <button
                      onClick={() => handlePrint()}
                      className="w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold transition-all flex items-center justify-center gap-3 text-lg"
                    >
                      <Printer className="w-6 h-6" />
                      Print Final Receipt
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 font-bold transition-all"
                    >
                      Close Back to Orders
                    </button>
                  </div>

                  {/* Hidden Print Container */}
                  <div className="hidden">
                    <ReceiptTicket ref={componentRef} order={order} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
