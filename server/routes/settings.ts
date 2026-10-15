import { Router, Response } from 'express';
import { db } from '../db/store';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireAdmin,
} from '../middleware/auth';
import { provisionAdminAccount } from '../adminSetup';

const router = Router();
router.use(authenticateToken);

// GET /api/settings
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const settings = db.getSettings();
  res.json({ success: true, settings });
});

// PUT /api/settings - Admin only
router.put('/', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const updated = db.updateSettings(req.body);

  db.addAuditLog({
    user: req.user!.name,
    role: req.user!.role,
    action: 'Platform Settings Updated',
    assetId: 'N/A',
    previousStatus: 'Active',
    newStatus: 'Active',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `Admin updated organization governance settings`,
  });

  res.json({ success: true, settings: updated, message: 'Settings saved successfully.' });
});

// POST /api/settings/reset - Admin only
router.post('/reset', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  db.resetToDemoData();
  provisionAdminAccount();

  db.addAuditLog({
    user: req.user!.name,
    role: req.user!.role,
    action: 'Platform Data Reset to Demo',
    assetId: 'N/A',
    previousStatus: 'Modified',
    newStatus: 'Initial Seed',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Warning',
    details: `Admin reset platform database to initial demonstration dataset`,
  });

  res.json({ success: true, message: 'Platform data reset to default demo seed.' });
});

export default router;
