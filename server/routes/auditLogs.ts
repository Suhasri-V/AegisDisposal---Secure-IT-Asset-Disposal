import { Router, Response } from 'express';
import { db } from '../db/store';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireRole,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);
// Audit log review restricted to Admin, Auditor, and Compliance Officer
router.use(requireRole(['Admin', 'Auditor', 'Compliance Officer']));

// GET /api/audit-logs - Read-only immutable ledger
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const { search, action, result } = req.query;
  let logs = db.getAuditLogs();

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.id.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.assetId.toLowerCase().includes(q) ||
        (l.details && l.details.toLowerCase().includes(q))
    );
  }

  if (action && typeof action === 'string' && action !== 'All') {
    logs = logs.filter((l) => l.action.toLowerCase().includes(action.toLowerCase()));
  }

  if (result && typeof result === 'string' && result !== 'All') {
    logs = logs.filter((l) => l.result === result);
  }

  res.json({
    success: true,
    count: logs.length,
    logs,
  });
});

export default router;
