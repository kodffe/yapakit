import { Router } from 'express';
import { requireAuth, requireTenantContext } from '../middleware/auth';
import { getDailyStats, getDashboardStats } from '../controllers/reportController';

const router = Router();

// All report routes require authentication and tenant context (manager only)
router.use(requireAuth, requireTenantContext(['manager']));

router.get('/daily', getDailyStats);
router.get('/dashboard', getDashboardStats);

export default router;
