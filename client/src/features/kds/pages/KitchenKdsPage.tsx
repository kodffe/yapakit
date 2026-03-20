import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChefHat, Wifi, WifiOff, LayoutGrid, List, Bell, BellOff } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import { useSocket } from '../../../services/socket';
import { useActiveOrders, useCompletedOrders, Order } from '../../orders/api/orderApi';
import OrderTicket from '../components/OrderTicket';
import OrderDetailModal from '../components/OrderDetailModal';
import OrderTableView from '../components/OrderTableView';
import useHeaderStore from '../../../store/headerStore';

type ViewMode = 'cards' | 'table';
type StatusTab = 'new' | 'preparing' | 'completed';

/**
 * Generates a short notification chime using the Web Audio API.
 */
const playNotificationSound = () => {
  try {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // First tone
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    oscillator.frequency.setValueAtTime(1046.5, audioCtx.currentTime + 0.15); // C6
    oscillator.frequency.setValueAtTime(1318.5, audioCtx.currentTime + 0.3); // E6

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

    oscillator.type = 'sine';
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.6);
  } catch {
    // AudioContext may fail in some browsers; fail silently
  }
};

const KitchenKdsPage = () => {
  const queryClient = useQueryClient();
  const { currentRestaurantId } = useAuthStore();
  const socket = useSocket(currentRestaurantId);
  const { data: activeOrders = [], isLoading, error } = useActiveOrders();
  const { data: completedOrders = [] } = useCompletedOrders();
  
  const [isConnected, setIsConnected] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [activeTab, setActiveTab] = useState<StatusTab>('new');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Notification state
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const setHeader = useHeaderStore((s) => s.setHeader);

  useEffect(() => {
    setHeader('Kitchen Display', 'Real-time Order Management');
  }, [setHeader]);

  // ─── Socket Event Listeners ───
  useEffect(() => {
    if (!socket || !currentRestaurantId) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onNewOrder = (newOrder: Order) => {
      queryClient.setQueryData<Order[]>(['activeOrders', currentRestaurantId], (oldOrders = []) => {
        if (oldOrders.find((o) => o._id === newOrder._id)) return oldOrders;
        return [...oldOrders, newOrder];
      });

      // Trigger audio notification
      if (soundEnabled) {
        playNotificationSound();
      }
      setNewOrderCount((prev) => prev + 1);
    };

    const onOrderUpdated = (updatedOrder: Order) => {
      queryClient.setQueryData<Order[]>(['activeOrders', currentRestaurantId], (oldOrders = []) => {
        return oldOrders.map((o) => (o._id === updatedOrder._id ? updatedOrder : o));
      });
      // Also invalidate completed orders if status changed
      if (updatedOrder.status === 'ready' || updatedOrder.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['completedOrders'] });
      }
    };

    const onOrderModified = (modifiedOrder: Order) => {
      queryClient.setQueryData<Order[]>(['activeOrders', currentRestaurantId], (oldOrders = []) => {
        const exists = oldOrders.find((o) => o._id === modifiedOrder._id);
        if (exists) {
          return oldOrders.map((o) => (o._id === modifiedOrder._id ? modifiedOrder : o));
        }
        return [...oldOrders, modifiedOrder];
      });
      // Play urgent notification sound for modified orders
      if (soundEnabled) {
        playNotificationSound();
      }
      setNewOrderCount((prev) => prev + 1);
    };

    const onOrderCancelled = ({ orderId }: { orderId: string }) => {
      queryClient.setQueryData<Order[]>(['activeOrders', currentRestaurantId], (oldOrders = []) => {
        return oldOrders.filter((o) => o._id !== orderId);
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('order:new', onNewOrder);
    socket.on('order:updated', onOrderUpdated);
    socket.on('order:modified', onOrderModified);
    socket.on('order:cancelled', onOrderCancelled);

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('order:new', onNewOrder);
      socket.off('order:updated', onOrderUpdated);
      socket.off('order:modified', onOrderModified);
      socket.off('order:cancelled', onOrderCancelled);
    };
  }, [socket, queryClient, currentRestaurantId, soundEnabled]);

  // Dismiss notification banner on any user interaction (click anywhere)
  const dismissNotification = useCallback(() => {
    if (newOrderCount > 0) {
      setNewOrderCount(0);
    }
  }, [newOrderCount]);

  // Filter orders by tab
  const newOrders = activeOrders.filter((o) => o.status === 'sent');
  const preparingOrders = activeOrders.filter((o) => o.status === 'preparing');

  const getDisplayOrders = (): Order[] => {
    switch (activeTab) {
      case 'new': return newOrders;
      case 'preparing': return preparingOrders;
      case 'completed': return completedOrders;
      default: return newOrders;
    }
  };

  const displayOrders = getDisplayOrders();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <ChefHat className="w-12 h-12 animate-bounce opacity-50" />
          <p className="font-medium text-gray-400 tracking-widest text-sm uppercase">Loading Kitchen Display...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-xl p-8 max-w-lg text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-red-200/80">Failed to load active orders. Please check your connection and refresh.</p>
        </div>
      </div>
    );
  }

  const tabs: { key: StatusTab; label: string; count: number; color: string }[] = [
    { key: 'new', label: 'New', count: newOrders.length, color: 'amber' },
    { key: 'preparing', label: 'Preparing', count: preparingOrders.length, color: 'blue' },
    { key: 'completed', label: 'Completed', count: completedOrders.length, color: 'gray' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6 lg:p-8" onClick={dismissNotification}>
      
      {/* New Order Notification Banner */}
      {newOrderCount > 0 && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-amber-500 text-gray-900 px-6 py-3 flex items-center justify-center gap-3 shadow-lg animate-pulse cursor-pointer" onClick={dismissNotification}>
          <Bell className="w-6 h-6" />
          <span className="text-lg font-black">
            🔔 {newOrderCount} new {newOrderCount === 1 ? 'order' : 'orders'}! Tap anywhere to dismiss.
          </span>
        </div>
      )}

      {/* KDS Toolbar */}
      <header className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-6 pb-6 border-b border-gray-800">

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
                : 'bg-red-900/30 border-red-700/50 text-red-400'
            }`}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2.5 transition-colors ${viewMode === 'cards' ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white'}`}
              title="Card View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2.5 transition-colors ${viewMode === 'table' ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white'}`}
              title="Table View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Connection Status & Summary */}
          <div className="flex items-center gap-6 bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
            <div className="flex items-center gap-4 px-4 border-r border-gray-700">
               <div className="text-center">
                  <p className="text-2xl font-black text-amber-500 leading-none">{newOrders.length}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">New</p>
               </div>
               <div className="text-center">
                  <p className="text-2xl font-black text-brand-primary leading-none">{preparingOrders.length}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Preparing</p>
               </div>
            </div>
            
            <div className="flex items-center gap-2 pr-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-500">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-bold text-red-500 animate-pulse">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? tab.key === 'new'
                  ? 'bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/20'
                  : tab.key === 'preparing'
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                  : 'bg-gray-600 text-white shadow-lg shadow-gray-600/20'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'
            }`}
          >
            {tab.label}
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-black/20' : 'bg-gray-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Board */}
      {displayOrders.length === 0 ? (
        <div className="h-[50vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl">
          <ChefHat className="w-20 h-20 text-gray-700 mb-6" />
          <h3 className="text-2xl font-bold text-gray-500">
            {activeTab === 'new' && 'No New Orders'}
            {activeTab === 'preparing' && 'Nothing Preparing'}
            {activeTab === 'completed' && 'No Completed Orders (last 24h)'}
          </h3>
          <p className="text-gray-600 mt-2 font-medium">
            {activeTab === 'new' ? 'Waiting for new orders...' : activeTab === 'preparing' ? 'Start preparing a new order!' : 'Completed orders will appear here.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
          {displayOrders.map((order) => (
            <OrderTicket key={order._id} order={order} onViewDetails={setSelectedOrder} />
          ))}
        </div>
      ) : (
        <OrderTableView orders={displayOrders} onViewDetails={setSelectedOrder} />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

    </div>
  );
};

export default KitchenKdsPage;
