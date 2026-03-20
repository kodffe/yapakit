import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireTenantContext } from '../middleware/auth';
import {
  createOrder,
  updateOrderStatus,
  getActiveOrders,
  getCompletedOrders,
  updateOrder,
  cancelOrder,
  addOrderPayment,
  getPaymentsHistory,
  voidPayment,
  getOrderById,
} from '../controllers/orderController';

const router = Router();

// All order routes require authentication and an active tenant context
const allOperationalRoles = ['waiter', 'kitchen', 'manager', 'cashier'];

/**
 * @route   GET /api/orders
 * @desc    Get all active orders for the current restaurant
 * @access  Private (Waiter, Kitchen, Manager, Cashier)
 */
router.get('/', requireAuth, requireTenantContext(allOperationalRoles), getActiveOrders);

/**
 * @route   GET /api/orders/payments/history
 * @desc    Get all payments history for the current restaurant
 * @access  Private (Manager, Cashier)
 */
router.get('/payments/history', requireAuth, requireTenantContext(['manager', 'cashier']), getPaymentsHistory);

/**
 * @route   GET /api/orders/completed
 * @desc    Get completed/ready orders (last 24h)
 * @access  Private (Waiter, Kitchen, Manager, Cashier)
 */
router.get('/completed', requireAuth, requireTenantContext(allOperationalRoles), getCompletedOrders);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private (Waiter, Kitchen, Manager, Cashier)
 */
router.post('/', requireAuth, requireTenantContext(allOperationalRoles), createOrder);

/**
 * @route   GET /api/orders/:id
 * @desc    Get a specific order by ID
 * @access  Private (Waiter, Kitchen, Manager, Cashier)
 */
router.get('/:id', requireAuth, requireTenantContext(allOperationalRoles), getOrderById);

/**
 * @route   PUT /api/orders/:id
 * @desc    Update/modify an existing order (items, totals, etc.)
 * @access  Private (Waiter, Manager)
 */
router.put('/:id', requireAuth, requireTenantContext(['waiter', 'manager']), updateOrder);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel an existing order with a reason
 * @access  Private (Waiter, Manager)
 */
router.put('/:id/cancel', requireAuth, requireTenantContext(['waiter', 'manager']), cancelOrder);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update the status of an existing order
 * @access  Private (Waiter, Kitchen, Manager, Cashier)
 */
router.patch('/:id/status', requireAuth, requireTenantContext(allOperationalRoles), updateOrderStatus);

/**
 * @route   POST /api/orders/:id/payments
 * @desc    Add a partial payment to an order
 * @access  Private (Manager, Cashier)
 */
router.post('/:id/payments', requireAuth, requireTenantContext(['manager', 'cashier']), addOrderPayment);

/**
 * @route   PUT /api/orders/:id/payments/:paymentId/void
 * @desc    Void an existing payment and recalculate order status
 * @access  Private (Manager, Cashier)
 */
router.put('/:id/payments/:paymentId/void', requireAuth, requireTenantContext(['manager', 'cashier']), voidPayment);

export default router;
