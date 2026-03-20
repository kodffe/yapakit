import { Router } from 'express';
import { requireAuth, requireTenantContext } from '../middleware/auth';
import { validatePromotion } from '../controllers/promotionController';

const router = Router();

router.use(requireAuth, requireTenantContext());

router.get('/validate/:code', validatePromotion);

export default router;
