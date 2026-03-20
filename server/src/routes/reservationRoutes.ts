import { Router } from 'express';
import { requireAuth, requireTenantContext } from '../middleware/auth';
import { getStaffReservations, updateReservationStatus } from '../controllers/reservationController';

const router = Router();

// Only staff (managers, waiters) can view and update reservations
router.use(requireAuth);
router.use(requireTenantContext(['manager', 'waiter']));

/**
 * @route   GET /api/reservations
 * @desc    Get all reservations for the current restaurant
 * @access  Private (Manager, Waiter)
 */
router.get('/', getStaffReservations);

/**
 * @route   PUT /api/reservations/:id/status
 * @desc    Update reservation status (and assign table if approved)
 * @access  Private (Manager, Waiter)
 */
router.put('/:id/status', updateReservationStatus);

export default router;
