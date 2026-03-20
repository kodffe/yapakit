import { Router } from 'express';
import { requireAuth, requireTenantContext } from '../middleware/auth';
import { getStaff, addStaff } from '../controllers/staffController';

const router = Router();

// All staff routes require authentication and manager role
router.use(requireAuth, requireTenantContext(['manager']));

router.get('/', getStaff);
router.post('/', addStaff);

export default router;
