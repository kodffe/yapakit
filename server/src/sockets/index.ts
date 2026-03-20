import { Server, Socket } from 'socket.io';

/**
 * Initialize Socket.io hub and define global listeners.
 */
export const initializeSockets = (io: Server): void => {
  console.log('[Sockets] Initializing Socket.io hub...');

  io.on('connection', (socket: Socket) => {
    console.log(`[Sockets] Client connected: ${socket.id}`);

    /**
     * Join a restaurant-specific room for isolated tenant updates.
     */
    socket.on('join-restaurant-room', (restaurantId: string) => {
      if (!restaurantId) return;
      
      socket.join(restaurantId);
      console.log(`[Sockets] Client ${socket.id} joined room: ${restaurantId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Sockets] Client disconnected: ${socket.id}`);
    });
  });
};
