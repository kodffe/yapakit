import { Router } from 'express';
import { requireAuth, requireTenantContext } from '../middleware/auth';
import { createTicket, getTenantTickets } from '../controllers/adminTicketController';

const router = Router();

/**
 * Handle Ticket creation by Restaurant Managers.
 * POST /api/tickets
 * Access: manager (enforced via requireTenantContext)
 */
router.post(
  '/',
  requireAuth,
  requireTenantContext(['manager']),
  createTicket
);

/**
 * Get all tickets for a specific tenant.
 * GET /api/tickets
 * Access: manager (enforced via requireTenantContext)
 */
router.get(
  '/',
  requireAuth,
  requireTenantContext(['manager']),
  getTenantTickets
);

export default router;
