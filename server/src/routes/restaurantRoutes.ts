import { Router } from 'express';
import { requireAuth, requireTenantContext } from '../middleware/auth';
import {
  createRestaurant,
  getRestaurantSettings,
  updateRestaurantSettings,
  createInternalRestaurant,
  disableRestaurant,
} from '../controllers/restaurantController';


const router = Router();

const allOperationalRoles = ['manager', 'cashier', 'waiter', 'kitchen'];

/**
 * @route   POST /api/restaurants
 * @desc    Create a new restaurant (auto-assigns creator as Manager)
 * @access  Private (requires JWT)
 */
router.post('/', requireAuth, createRestaurant);

/**
 * @route   POST /api/restaurants/internal
 * @desc    Create a restaurant from the Multi-Tenant Hub (no OTP)
 * @access  Private (requires JWT)
 */
router.post('/internal', requireAuth, createInternalRestaurant);

/**
 * @route   GET /api/restaurants/:id/settings
 * @desc    Get restaurant settings (taxRate, currency)
 * @access  Private (requires JWT and Tenant Context)
 */
router.get('/:id/settings', requireAuth, requireTenantContext(allOperationalRoles), getRestaurantSettings);

/**
 * @route   PUT /api/restaurants/settings
 * @desc    Update restaurant settings (name, address, phone, taxes, currency)
 * @access  Private (Manager only)
 */
router.put('/settings', requireAuth, requireTenantContext(['manager']), updateRestaurantSettings);

/**
 * @route   PUT /api/restaurants/:id/disable
 * @desc    Soft-delete a restaurant (set isActive to false)
 * @access  Private (Manager only)
 */
router.put('/:id/disable', requireAuth, requireTenantContext(['manager']), disableRestaurant);

export default router;
