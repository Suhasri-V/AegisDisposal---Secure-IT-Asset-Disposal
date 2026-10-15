import { Router, Response } from 'express';
import { db } from '../db/store';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireRole,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);
router.use(requireRole(['Admin', 'Auditor', 'Manager', 'Compliance Officer']));

// GET /api/reports/summary
router.get('/summary', (req: AuthenticatedRequest, res: Response): void => {
  const assets = db.getAssets();
  const certs = db.getCertificates();
  const wipes = db.getWipingRecords();
  const vers = db.getVerifications();
  const logs = db.getAuditLogs();

  res.json({
    success: true,
    data: {
      totalAssetsCount: assets.length,
      disposedCount: assets.filter((a) => a.disposalStatus === 'Disposed').length,
      certifiedCount: certs.length,
      wipingSuccessRate: wipes.length > 0
        ? Math.round((wipes.filter((w) => w.status === 'Completed').length / wipes.length) * 100)
        : 100,
      verificationPassRate: vers.length > 0
        ? Math.round((vers.filter((v) => v.verificationResult === 'Passed').length / vers.length) * 100)
        : 100,
      auditRecordsCount: logs.length,
    },
  });
});

export default router;
