import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Configurations & Middleware
import connectDB from './config/db';
import errorHandler from './middleware/errorHandler';
import { initializeSockets } from './sockets';

// Routes
import authRoutes from './routes/authRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import orderRoutes from './routes/orderRoutes';
import menuRoutes from './routes/menuRoutes';
import zoneRoutes from './routes/zoneRoutes';
import reportRoutes from './routes/reportRoutes';
import staffRoutes from './routes/staffRoutes';
import promotionRoutes from './routes/promotionRoutes';
import shiftRoutes from './routes/shiftRoutes';
import adminRoutes from './routes/adminRoutes';
import adminUserRoutes from './routes/adminUserRoutes';
import uploadRoutes from './routes/uploadRoutes';
import publicRoutes from './routes/publicRoutes';
import reservationRoutes from './routes/reservationRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import ticketRoutes from './routes/ticketRoutes';

// Connect to Database
connectDB();

const app = express();
const httpServer = createServer(app);

// Socket.io initialization
const io = new Server(httpServer, {
  cors: {
    origin: (origin: any, callback: any) => {
      // Allow any origin in development or specify your frontend URL
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

initializeSockets(io);

// Make Socket.io instance accessible from controllers via req.app.get('io')
app.set('io', io);

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static Routes & Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/tickets', ticketRoutes);

// Error Handling Middleware (must be registered last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`[Server] Yapakit running on port ${PORT}`);
  console.log(`[Environment] Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Database] Connected to MongoDB`);
});

