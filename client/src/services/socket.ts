import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Keep a single socket instance for the app
// We strip /api from the URL if it exists, as Socket.io connects to the root by default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'], // Faster connection bootstrap
});

/**
 * Custom hook to manage the Socket.io connection for a specific restaurant room.
 * It connects on mount, joins the room, and disconnects on unmount.
 */
export const useSocket = (restaurantId: string | null) => {
  useEffect(() => {
    if (!restaurantId) return;

    const onConnect = () => {
      console.log('[Socket] Connected, joining room:', restaurantId);
      socket.emit('join-restaurant-room', restaurantId);
    };

    socket.on('connect', onConnect);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      // We don't disconnect here to keep the singleton connection active for other components
      // unless you strictly want one connection per page.
    };
  }, [restaurantId]);

  return socket;
};
