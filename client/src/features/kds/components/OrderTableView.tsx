import { formatDistanceToNow } from 'date-fns';
import { ChefHat, CheckCircle, UtensilsCrossed, Package, Truck, Eye } from 'lucide-react';
import { Order, useUpdateOrderStatus } from '../../orders/api/orderApi';

interface OrderTableViewProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
}

export default function OrderTableView({ orders, onViewDetails }: OrderTableViewProps) {
  const updateStatus = useUpdateOrderStatus();

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      sent:      { bg: 'bg-amber-100', text: 'text-amber-700', label: 'New' },
      preparing: { bg: 'bg-blue-100',  text: 'text-blue-700',  label: 'Preparing' },
      ready:     { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Ready' },
      completed: { bg: 'bg-gray-100',  text: 'text-gray-600',  label: 'Completed' },
    };
    const s = map[status] || map['sent'];
    return (
      <span className={`${s.bg} ${s.text} text-xs font-bold uppercase px-2 py-1 rounded-full tracking-wider`}>
        {s.label}
      </span>
    );
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine-in': return <UtensilsCrossed className="w-4 h-4 text-gray-400" />;
      case 'takeaway': return <Package className="w-4 h-4 text-gray-400" />;
      case 'delivery': return <Truck className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  const getLocationLabel = (order: Order) => {
    if (order.orderType === 'dine-in') return order.tableName ? `Table ${order.tableName}` : 'Dine-in';
    if (order.orderType === 'takeaway') return 'Takeaway';
    if (order.orderType === 'delivery') return 'Delivery';
    return '-';
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg font-medium">No orders in this category.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-700/50 bg-gray-800/50">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
            <th className="px-5 py-4 font-bold">Order #</th>
            <th className="px-5 py-4 font-bold">Type</th>
            <th className="px-5 py-4 font-bold">Location</th>
            <th className="px-5 py-4 font-bold">Items</th>
            <th className="px-5 py-4 font-bold">Waiter</th>
            <th className="px-5 py-4 font-bold">Time</th>
            <th className="px-5 py-4 font-bold">Status</th>
            <th className="px-5 py-4 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {orders.map((order) => {
            const waiterName = typeof order.waiterId === 'object' ? `${order.waiterId.firstName} ${order.waiterId.lastName}` : 'Staff';
            const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });
            const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <tr 
                key={order._id} 
                className="text-gray-200 hover:bg-gray-700/40 transition-colors cursor-pointer"
                onClick={() => onViewDetails(order)}
              >
                <td className="px-5 py-4">
                  <span className="font-black text-white text-base">#{order.orderNumber}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 capitalize font-medium">
                    {getOrderTypeIcon(order.orderType)}
                    {order.orderType}
                  </div>
                </td>
                <td className="px-5 py-4 font-medium">{getLocationLabel(order)}</td>
                <td className="px-5 py-4">
                  <span className="font-bold text-white">{totalItems}</span>
                  <span className="text-gray-500 ml-1">{totalItems === 1 ? 'item' : 'items'}</span>
                </td>
                <td className="px-5 py-4 font-medium text-gray-300">{waiterName}</td>
                <td className="px-5 py-4 text-gray-400 font-medium">{timeAgo}</td>
                <td className="px-5 py-4">{getStatusBadge(order.status)}</td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {order.status === 'sent' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus.mutate({ orderId: order._id, status: 'preparing' });
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        Start
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus.mutate({ orderId: order._id, status: 'ready' });
                        }}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Ready
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(order);
                      }}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
