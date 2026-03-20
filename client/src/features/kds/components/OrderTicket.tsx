import { formatDistanceToNow } from 'date-fns';
import { Clock, CheckCircle, ChefHat, UtensilsCrossed, Package, Truck } from 'lucide-react';
import { Order, useUpdateOrderStatus } from '../../orders/api/orderApi';

interface OrderTicketProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

const OrderTicket = ({ order, onViewDetails }: OrderTicketProps) => {
  const updateStatus = useUpdateOrderStatus();
  
  const isPreparing = order.status === 'preparing';
  const isSent = order.status === 'sent';

  const handleStatusChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSent) updateStatus.mutate({ orderId: order._id, status: 'preparing' });
    else if (isPreparing) updateStatus.mutate({ orderId: order._id, status: 'ready' });
  };

  const getStatusColor = () => {
    if (order.revision > 0) return 'border-red-600 bg-red-50';
    switch (order.status) {
      case 'sent': return 'border-amber-500 bg-amber-50';
      case 'preparing': return 'border-blue-500 bg-blue-50';
      case 'ready': return 'border-emerald-500 bg-emerald-50';
      case 'completed': return 'border-gray-300 bg-gray-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getHeaderColor = () => {
    switch (order.status) {
      case 'sent': return 'bg-amber-500 text-white';
      case 'preparing': return 'bg-blue-600 text-white';
      case 'ready': return 'bg-emerald-500 text-white';
      case 'completed': return 'bg-gray-600 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const getOrderTypeLabel = () => {
    switch (order.orderType) {
      case 'dine-in': return order.tableName ? `Table ${order.tableName}` : 'Dine-in';
      case 'takeaway': return 'Takeaway';
      case 'delivery': return 'Delivery';
      default: return order.tableName || 'Order';
    }
  };

  const getOrderTypeIcon = () => {
    switch (order.orderType) {
      case 'dine-in': return <UtensilsCrossed className="w-4 h-4" />;
      case 'takeaway': return <Package className="w-4 h-4" />;
      case 'delivery': return <Truck className="w-4 h-4" />;
      default: return null;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });
  const waiterName = typeof order.waiterId === 'object' ? `${order.waiterId.firstName} ${order.waiterId.lastName}` : 'Staff';

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden border-2 shadow-lg transition-all hover:shadow-xl ${getStatusColor()} ${order.revision > 0 ? 'border-4 border-red-600' : ''}`}>
      
      {/* Revision Badge */}
      {order.revision > 0 && (
        <div className="bg-red-600 text-white text-sm font-black px-4 py-2.5 text-center">
          ⚠️ URGENT: MODIFIED (Rev: {order.revision})
        </div>
      )}
      
      {/* Header — clickable for detail modal */}
      <div 
        className={`p-4 flex items-center justify-between cursor-pointer hover:brightness-110 transition-all ${getHeaderColor()}`}
        onClick={() => onViewDetails(order)}
      >
        <div className="flex flex-col">
          <span className="text-xl font-black leading-tight">
            {getOrderTypeLabel()}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium max-w-[120px] truncate">
              {waiterName}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded capitalize text-gray-700">
              {getOrderTypeIcon()}
              {order.orderType}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold bg-gray-800 text-white px-2 py-1 rounded-md">
            #{order.orderNumber}
          </span>
          <div className="flex items-center gap-1.5 mt-1 text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Body / Items */}
      <div className="flex-1 p-4 bg-white overflow-y-auto min-h-[120px] max-h-[300px]">
        <ul className="space-y-3">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex flex-col border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center bg-gray-100 text-gray-800 font-bold rounded min-w-[28px] h-7 text-sm">
                  {item.quantity}x
                </span>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 leading-tight">{item.name}</h4>
                  
                  {/* Modifiers */}
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <div className="mt-1.5 border-l-2 border-gray-200 pl-3 py-0.5 space-y-1">
                      {item.selectedModifiers.map((mod, modIdx) => (
                        <p key={modIdx} className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                          <span className="opacity-70">{mod.modifierName}:</span> 
                          <span className="text-gray-900">{mod.optionName}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm font-bold text-amber-700 italic">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer / Actions */}
      <div className="p-4 bg-white border-t border-gray-100">
        {isSent && (
          <button
            onClick={handleStatusChange}
            disabled={updateStatus.isPending}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-lg shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <ChefHat className="w-6 h-6" />
            START PREPARING
          </button>
        )}
        
        {isPreparing && (
          <button
            onClick={handleStatusChange}
            disabled={updateStatus.isPending}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black rounded-xl text-lg shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-6 h-6" />
            MARK AS READY
          </button>
        )}

        {(order.status === 'ready' || order.status === 'completed') && (
          <div className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-center items-center justify-center flex gap-2">
            <CheckCircle className="w-5 h-5" />
            {order.status === 'ready' ? 'READY FOR PICKUP' : 'COMPLETED'}
          </div>
        )}
      </div>
      
    </div>
  );
};

export default OrderTicket;
