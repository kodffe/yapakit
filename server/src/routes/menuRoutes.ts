import { Router } from 'express';
import { requireAuth, requireTenantContext } from '../middleware/auth';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,
} from '../controllers/menuController';

const router = Router();

const allOperationalRoles = ['manager', 'cashier', 'waiter', 'kitchen'];

// Categories
router.get('/categories', requireAuth, requireTenantContext(allOperationalRoles), getCategories);
router.post('/categories', requireAuth, requireTenantContext(allOperationalRoles), createCategory);
router.put('/categories/reorder', requireAuth, requireTenantContext(['manager']), reorderCategories);
router.put('/categories/:id', requireAuth, requireTenantContext(['manager']), updateCategory);
router.delete('/categories/:id', requireAuth, requireTenantContext(['manager']), deleteCategory);

// Menu Items
router.get('/items', requireAuth, requireTenantContext(allOperationalRoles), getMenuItems);
router.post('/items', requireAuth, requireTenantContext(['manager']), createMenuItem);
router.put('/items/reorder', requireAuth, requireTenantContext(['manager']), reorderMenuItems);
router.put('/items/:id', requireAuth, requireTenantContext(['manager']), updateMenuItem);
router.delete('/items/:id', requireAuth, requireTenantContext(['manager']), deleteMenuItem);

export default router;
