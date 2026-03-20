import { formatDistanceToNow } from 'date-fns';
import { X, Clock, CheckCircle, ChefHat, UtensilsCrossed, Package, Truck, User } from 'lucide-react';
import { Order, useUpdateOrderStatus } from '../../orders/api/orderApi';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const updateStatus = useUpdateOrderStatus();

  const isPreparing = order.status === 'preparing';
  const isSent = order.status === 'sent';

  const handleStatusChange = () => {
    if (isSent) updateStatus.mutate({ orderId: order._id, status: 'preparing' }, { onSuccess: onClose });
    else if (isPreparing) updateStatus.mutate({ orderId: order._id, status: 'ready' }, { onSuccess: onClose });
  };

  const getOrderTypeLabel = () => {
    switch (order.orderType) {
      case 'dine-in': return order.tableName ? `Table ${order.tableName}` : 'Dine-in';
      case 'takeaway': return 'Takeaway';
      case 'delivery': return 'Delivery';
      default: return 'Order';
    }
  };

  const getOrderTypeIcon = () => {
    switch (order.orderType) {
      case 'dine-in': return <UtensilsCrossed className="w-5 h-5" />;
      case 'takeaway': return <Package className="w-5 h-5" />;
      case 'delivery': return <Truck className="w-5 h-5" />;
      default: return null;
    }
  };

  const getStatusBadge = () => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      sent:      { bg: 'bg-amber-100', text: 'text-amber-700', label: 'New' },
      preparing: { bg: 'bg-blue-100',  text: 'text-blue-700',  label: 'Preparing' },
      ready:     { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Ready' },
      completed: { bg: 'bg-gray-100',  text: 'text-gray-600',  label: 'Completed' },
    };
    const s = map[order.status] || map['sent'];
    return (
      <span className={`${s.bg} ${s.text} text-xs font-bold uppercase px-2.5 py-1 rounded-full tracking-wider`}>
        {s.label}
      </span>
    );
  };

  const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });
  const waiterName = typeof order.waiterId === 'object' ? `${order.waiterId.firstName} ${order.waiterId.lastName}` : 'Staff';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-black tracking-tight">#{order.orderNumber}</div>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {getOrderTypeIcon()}
              <div>
                <p className="text-gray-400 text-xs font-medium uppercase">Type</p>
                <p className="font-bold capitalize">{order.orderType}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-400 text-xs font-medium uppercase">Location</p>
                <p className="font-bold">{getOrderTypeLabel()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-gray-400 text-xs font-medium uppercase">Time</p>
                <p className="font-bold">{timeAgo}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 text-sm text-gray-300">
            <User className="w-4 h-4" />
            <span>Waiter: <strong className="text-white">{waiterName}</strong></span>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Items</h3>
          <ul className="space-y-5">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex gap-4">
                <span className="inline-flex items-center justify-center bg-gray-900 text-white font-bold rounded-lg min-w-[36px] h-9 text-sm shadow-sm">
                  {item.quantity}x
                </span>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                  
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <div className="mt-1 space-y-1 ml-1">
                      {item.selectedModifiers.map((mod, modIdx) => (
                        <p key={modIdx} className="text-sm text-gray-600 font-medium">
                          <span className="text-gray-400">{mod.modifierName}:</span>{' '}
                          <span className="text-gray-800">{mod.optionName}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {item.notes && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-sm font-bold text-amber-700 italic">
                      📝 {item.notes}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Footer */}
        {(isSent || isPreparing) && (
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            {isSent && (
              <button
                onClick={handleStatusChange}
                disabled={updateStatus.isPending}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <ChefHat className="w-6 h-6" />
                START PREPARING
              </button>
            )}
            {isPreparing && (
              <button
                onClick={handleStatusChange}
                disabled={updateStatus.isPending}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-lg shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <CheckCircle className="w-6 h-6" />
                MARK AS READY
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
