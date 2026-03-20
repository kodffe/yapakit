import { useState, useMemo } from 'react';
import { CreditCard, Banknote, DollarSign, RefreshCcw, LayoutGrid, List } from 'lucide-react';
import { usePaymentsHistory, useVoidPayment, useOrderById, PaymentHistoryItem } from '../../orders/api/orderApi';
import { useRestaurantDetails } from '../../settings/api/settingsApi';
import ReprintModal from '../components/ReprintModal';
import useHeaderStore from '../../../store/headerStore';
import { useEffect } from 'react';

export default function PaymentsHistoryPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  const [reprintOrderId, setReprintOrderId] = useState<string | null>(null);

  const { data: details } = useRestaurantDetails();
  const currency = details?.settings?.currency || 'USD';
  const paymentMethods = details?.settings?.paymentMethods || [
    { name: 'Cash', isExactAmountOnly: false, isActive: true },
    { name: 'Card', isExactAmountOnly: true, isActive: true }
  ];

  const { data: payments, isLoading } = usePaymentsHistory({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    method: methodFilter,
  });

  const voidPayment = useVoidPayment();
  const { data: reprintOrder } = useOrderById(reprintOrderId);

  const setHeader = useHeaderStore((s) => s.setHeader);

  useEffect(() => {
    setHeader('Payments History', 'Ledger of all collected payments.');
  }, [setHeader]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    if (!payments) return { total: 0, cash: 0, card: 0, other: 0 };
    
    // Only count completed payments for metrics
    const validPayments = payments.filter((p) => p.status !== 'refunded');

    return validPayments.reduce((acc, p) => {
      acc.total += p.amount;
      if (p.method.toLowerCase() === 'cash') acc.cash += p.amount;
      else if (p.method.toLowerCase() === 'card') acc.card += p.amount;
      else acc.other += p.amount;
      return acc;
    }, { total: 0, cash: 0, card: 0, other: 0 });
  }, [payments]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleVoid = (payment: PaymentHistoryItem) => {
    if (window.confirm(`Are you sure you want to void this ${formatPrice(payment.amount)} payment? The order will be un-completed if it creates a balance due.`)) {
      voidPayment.mutate({ orderId: payment.orderId, paymentId: payment.paymentId });
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-16">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border-2 border-gray-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-brand-primary mb-2">
             <DollarSign className="w-6 h-6" />
             <h3 className="font-bold uppercase tracking-wider text-xs">Total Collected</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatPrice(metrics.total)}</p>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-green-600 mb-2">
             <Banknote className="w-6 h-6" />
             <h3 className="font-bold uppercase tracking-wider text-xs">Cash</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatPrice(metrics.cash)}</p>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-purple-600 mb-2">
             <CreditCard className="w-6 h-6" />
             <h3 className="font-bold uppercase tracking-wider text-xs">Card</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatPrice(metrics.card)}</p>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
             <RefreshCcw className="w-6 h-6" />
             <h3 className="font-bold uppercase tracking-wider text-xs">Custom Methods</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatPrice(metrics.other)}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-2 border-gray-200 p-4 mb-8 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
          <input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-50 border-2 border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-brand-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-50 border-2 border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-brand-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Method</label>
          <select 
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-gray-50 border-2 border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-brand-primary min-w-32"
          >
            <option value="all">All Methods</option>
            {paymentMethods.map(m => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>
        
        <div className="ml-auto flex border-2 border-gray-200 bg-gray-50 p-1">
          <button 
            onClick={() => setViewMode('table')}
            className={`px-4 py-1.5 flex items-center gap-2 text-sm font-bold ${viewMode === 'table' ? 'bg-white text-brand-primary shadow' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <List className="w-4 h-4" />
            Table
          </button>
          <button 
            onClick={() => setViewMode('cards')}
            className={`px-4 py-1.5 flex items-center gap-2 text-sm font-bold ${viewMode === 'cards' ? 'bg-white text-brand-primary shadow' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cards
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      ) : payments && payments.length > 0 ? (
        viewMode === 'table' ? (
          <div className="bg-white border-2 border-gray-200 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                   <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Date</th>
                   <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Order</th>
                   <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Method</th>
                   <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Amount</th>
                   <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                   <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                   <tr key={p.paymentId} className="border-b border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-colors">
                      <td className="p-4 text-sm font-bold text-gray-900">
                        {new Date(p.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-black text-gray-900">#{p.orderNumber}</div>
                        <div className="text-xs font-bold text-gray-500 capitalize">{p.tableName || p.orderType}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-1 text-xs font-bold uppercase tracking-widest bg-gray-200 text-gray-800">
                          {p.method}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-black text-gray-900">
                        {formatPrice(p.amount)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-bold uppercase tracking-widest ${
                          p.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        {p.status === 'completed' && (
                          <button 
                            onClick={() => handleVoid(p)}
                            disabled={voidPayment.isPending}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-bold uppercase transition-colors"
                          >
                            Void
                          </button>
                        )}
                        <button 
                           onClick={() => setReprintOrderId(p.orderId)}
                           className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 text-xs font-bold uppercase transition-colors"
                        >
                           Re-print
                        </button>
                      </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {payments.map(p => (
              <div key={p.paymentId} className="bg-white border-2 border-gray-200 p-5 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-black uppercase tracking-widest mb-2 ${
                      p.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {p.status}
                    </span>
                    <h3 className="font-black text-gray-900 text-lg">#{p.orderNumber}</h3>
                    <p className="text-xs font-bold text-gray-500">{new Date(p.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-2xl text-gray-900">{formatPrice(p.amount)}</p>
                    <span className="inline-flex px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-gray-200 text-gray-800 mt-1">
                      {p.method}
                    </span>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 flex gap-2 border-t-2 border-gray-100">
                   {p.status === 'completed' && (
                     <button 
                       onClick={() => handleVoid(p)}
                       disabled={voidPayment.isPending}
                       className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 text-xs font-bold uppercase transition-colors"
                     >
                       Void
                     </button>
                   )}
                   <button 
                       onClick={() => setReprintOrderId(p.orderId)}
                       className={`${p.status === 'completed' ? 'flex-1' : 'w-full'} bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 text-xs font-bold uppercase transition-colors`}
                   >
                     Re-print
                   </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white border-2 border-dashed border-gray-300 p-12 text-center">
           <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
           <p className="text-gray-500 font-bold uppercase">No payments found</p>
        </div>
      )}

      {/* Re-print Modal */}
      {reprintOrderId && reprintOrder && (
        <ReprintModal order={reprintOrder} onClose={() => setReprintOrderId(null)} />
      )}
    </div>
  );
}
