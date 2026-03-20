import { Router } from 'express';
import { requireAuth, requireTenantContext } from '../middleware/auth';
import {
  getZones,
  createZone,
  updateZone,
  deleteZone,
  getTables,
  createTable,
  updateTable,
  deleteTable,
} from '../controllers/zoneController';

const router = Router();

const allOperationalRoles = ['manager', 'cashier', 'waiter', 'kitchen'];
const managerOnly = ['manager'];

// ─── Zone CRUD ───

router.get('/', requireAuth, requireTenantContext(allOperationalRoles), getZones);
router.post('/', requireAuth, requireTenantContext(managerOnly), createZone);
router.put('/:id', requireAuth, requireTenantContext(managerOnly), updateZone);
router.delete('/:id', requireAuth, requireTenantContext(managerOnly), deleteZone);

// ─── Table CRUD ───

router.get('/tables', requireAuth, requireTenantContext(allOperationalRoles), getTables);
router.post('/tables', requireAuth, requireTenantContext(managerOnly), createTable);
router.put('/tables/:id', requireAuth, requireTenantContext(managerOnly), updateTable);
router.delete('/tables/:id', requireAuth, requireTenantContext(managerOnly), deleteTable);

export default router;
