import { Router } from 'express';
import { requireAuth, requireTenantContext } from '../middleware/auth';
import { openShift, getCurrentShift, closeShift } from '../controllers/shiftController';

const router = Router();

router.use(requireAuth, requireTenantContext(['cashier', 'manager']));

router.post('/open', openShift);
router.get('/current', getCurrentShift);
router.post('/close', closeShift);

export default router;
