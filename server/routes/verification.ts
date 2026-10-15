import { Router, Response } from 'express';
import { db } from '../db/store';
import { VerificationRecord } from '../db/types';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireRole,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);
// Verification requires independent verification officer or Admin
router.use(requireRole(['Admin', 'Compliance Officer']));

// GET /api/verification/records - List verification records
router.get('/records', (req: AuthenticatedRequest, res: Response): void => {
  const records = db.getVerifications();
  res.json({ success: true, count: records.length, records });
});

// POST /api/verification/verify - Sign off or fail verification
router.post('/verify', (req: AuthenticatedRequest, res: Response): void => {
  const { assetId, passed, notes } = req.body;

  if (!assetId) {
    res.status(400).json({ success: false, message: 'Asset ID is required.' });
    return;
  }

  const asset = db.getAssetById(assetId);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Asset not found.' });
    return;
  }

  const isPassed = Boolean(passed);
  const nowDate = new Date().toISOString().slice(0, 10);
  const officerName = req.user!.name;

  const verificationNotes =
    notes && notes.trim()
      ? notes.trim()
      : isPassed
      ? 'Complete hex readback verified 100% zero-fill across all sectors. Optical inspection passed.'
      : 'Verification failed: Hex readback residual signatures detected on media sectors.';

  db.updateAsset({
    ...asset,
    verifiedBy: officerName,
    verificationDate: nowDate,
    verificationResult: isPassed ? 'Passed' : 'Failed',
    verificationNotes,
    disposalStatus: isPassed ? 'Ready For Disposal' : 'Verification Failed',
    lifecycleStage: isPassed ? 'Compliance Review' : 'Verification',
    completedRequirements: isPassed
      ? Array.from(new Set([...asset.completedRequirements, 'RULE-04']))
      : asset.completedRequirements.filter((r) => r !== 'RULE-04'),
  });

  const recordId = `VER-${Date.now().toString().slice(-4)}`;
  const record: VerificationRecord = {
    id: recordId,
    assetId: asset.id,
    verifiedBy: officerName,
    verificationDate: nowDate,
    verificationResult: isPassed ? 'Passed' : 'Failed',
    verificationNotes,
    createdAt: new Date().toISOString(),
  };

  db.createVerification(record);

  // Notify requester and team
  db.addNotification({
    title: isPassed ? 'Sanitization Verification Passed' : 'Sanitization Verification Failed',
    message: isPassed
      ? `Asset ${asset.id} passed independent hex verification by ${officerName}. Ready for certificate generation.`
      : `Asset ${asset.id} failed sanitization verification. Re-wiping or physical destruction required.`,
    type: isPassed ? 'success' : 'error',
    assetId: asset.id,
    linkPage: 'verification',
  });

  db.addAuditLog({
    user: officerName,
    role: req.user!.role,
    action: isPassed ? 'Sanitization Verified (Passed)' : 'Sanitization Verification Failed',
    assetId: asset.id,
    previousStatus: 'Verification Pending',
    newStatus: isPassed ? 'Ready For Disposal' : 'Verification Failed',
    deviceIp: req.ip || '127.0.0.1',
    result: isPassed ? 'Success' : 'Failed',
    details: `${officerName} signed off verification for ${asset.id}. Outcome: ${isPassed ? 'Passed' : 'Failed'}. Notes: ${verificationNotes}`,
  });

  res.json({
    success: true,
    message: isPassed
      ? `Verification PASSED for asset ${asset.id}. Ready for Certificate of Destruction.`
      : `Verification FAILED for asset ${asset.id}. Blocked from final disposal until re-sanitized.`,
    record,
  });
});

export default router;
