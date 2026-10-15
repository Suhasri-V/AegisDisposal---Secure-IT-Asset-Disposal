import { Router, Response } from 'express';
import { db } from '../db/store';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireAdmin,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/compliance/rules
router.get('/rules', (req: AuthenticatedRequest, res: Response): void => {
  const rules = db.getComplianceRules();
  res.json({ success: true, count: rules.length, rules });
});

// POST /api/compliance/toggle - Admin only
router.post('/toggle', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { ruleId, active } = req.body;
  if (!ruleId || typeof active !== 'boolean') {
    res.status(400).json({ success: false, message: 'ruleId and active (boolean) are required.' });
    return;
  }

  const updated = db.updateComplianceRule(ruleId, active);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Rule not found.' });
    return;
  }

  db.addAuditLog({
    user: req.user!.name,
    role: req.user!.role,
    action: 'Compliance Rule Configured',
    assetId: 'N/A',
    previousStatus: active ? 'Disabled' : 'Enabled',
    newStatus: active ? 'Enabled' : 'Disabled',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `Admin changed active state of compliance rule ${ruleId} to ${active}`,
  });

  res.json({ success: true, rule: updated });
});

export default router;
