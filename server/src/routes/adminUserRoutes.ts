import { Router } from 'express';
import { requireAuth, requireSuperAdmin } from '../middleware/auth';
import { 
  getAllAdminUsers, 
  createAdminUser, 
  updateAdminUser, 
  removeAdminUser 
} from '../controllers/adminUserController';

const router = Router();

// All routes here require full authentication and superadmin role
router.use(requireAuth, requireSuperAdmin);

router.get('/', getAllAdminUsers);
router.post('/', createAdminUser);
router.put('/:id', updateAdminUser);
router.delete('/:id', removeAdminUser);

export default router;
