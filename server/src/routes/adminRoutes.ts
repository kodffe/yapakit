import { Router } from 'express';
import { requireAuth, requireGlobalRole } from '../middleware/auth';
import { getAllRestaurants, getGlobalStats, getAllManagers } from '../controllers/adminController';
import { getAllTickets, updateTicketStatus } from '../controllers/adminTicketController';
import { getAllTenants, updateTenantSubscription } from '../controllers/adminTenantController';

const router = Router();

// Only superadmin, support, and sales can access these routes
router.use(requireAuth);
router.use(requireGlobalRole(['superadmin', 'support', 'sales']));

router.get('/restaurants', getAllRestaurants);
router.get('/managers', getAllManagers);
router.get('/stats', getGlobalStats);

// Tenant/Subscription Management
router.get('/tenants', getAllTenants);
router.put('/tenants/:id/subscription', updateTenantSubscription);

// Ticket Management
router.get('/tickets', getAllTickets);
router.put('/tickets/:id/status', updateTicketStatus);

export default router;
