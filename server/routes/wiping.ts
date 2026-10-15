import { Router, Response } from 'express';
import { db } from '../db/store';
import { WipingMethod, WipingRecord } from '../db/types';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireRole,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);
// Wiping operations permitted for Admin and IT Technician
router.use(requireRole(['Admin', 'IT Technician']));

// GET /api/wiping/records - List all wiping records
router.get('/records', (req: AuthenticatedRequest, res: Response): void => {
  const records = db.getWipingRecords();
  res.json({ success: true, count: records.length, records });
});

// POST /api/wiping/start - Begin sanitization run
router.post('/start', (req: AuthenticatedRequest, res: Response): void => {
  const { assetId, method, technician, tool } = req.body;

  if (!assetId) {
    res.status(400).json({ success: false, message: 'Asset ID is required.' });
    return;
  }

  const asset = db.getAssetById(assetId);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Asset not found.' });
    return;
  }

  if (!['Approved', 'Wiping In Progress'].includes(asset.disposalStatus)) {
    res.status(400).json({
      success: false,
      message: `Asset cannot start wiping from status '${asset.disposalStatus}'. Must be Approved.`,
    });
    return;
  }

  const startTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const selectedMethod: WipingMethod = method || 'NIST 800-88 Rev 1 Purge';
  const assignedTech = technician || req.user!.name;
  const wipingTool = tool || 'Blancco Drive Eraser v7.14 (NIST Purge Compliant)';

  db.updateAsset({
    ...asset,
    lifecycleStage: 'Data Wiping',
    disposalStatus: 'Wiping In Progress',
    wipingMethod: selectedMethod,
    technician: assignedTech,
    wipingTool,
    wipingStartTime: startTime,
    wipingStatus: 'In Progress',
  });

  const recordId = `WIPE-${Date.now().toString().slice(-4)}`;
  const record: WipingRecord = {
    id: recordId,
    assetId: asset.id,
    wipingMethod: selectedMethod,
    wipingTool,
    technician: assignedTech,
    startTime,
    passes: 3,
    status: 'In Progress',
    logs: [
      `[${startTime}] Clean-bay station initialized on controller target port.`,
      `[SIMULATION NOTICE] Laboratory simulation execution of standard: ${selectedMethod}`,
      `Starting 3-pass cryptographic/hex overwrite sequence...`,
    ],
    createdAt: new Date().toISOString(),
  };

  db.createWipingRecord(record);

  db.addAuditLog({
    user: req.user!.name,
    role: req.user!.role,
    action: 'Sanitization Run Initiated',
    assetId: asset.id,
    previousStatus: asset.disposalStatus,
    newStatus: 'Wiping In Progress',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `Technician ${assignedTech} commenced ${selectedMethod} using ${wipingTool} on asset ${asset.id}`,
  });

  res.json({
    success: true,
    message: `Data sanitization protocol initiated for asset ${asset.id}.`,
    record,
  });
});

// POST /api/wiping/complete - Finish sanitization run
router.post('/complete', (req: AuthenticatedRequest, res: Response): void => {
  const { assetId, passed, logs } = req.body;

  if (!assetId) {
    res.status(400).json({ success: false, message: 'Asset ID is required.' });
    return;
  }

  const asset = db.getAssetById(assetId);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Asset not found.' });
    return;
  }

  const endTime = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const isPassed = Boolean(passed);

  const simulationNotice =
    '[SIMULATION] Data sanitization simulated in laboratory environment. Hardware verification required prior to physical recycling.';

  const finalLogs: string[] = Array.isArray(logs) && logs.length > 0 ? logs : [
    `Sanitization procedure concluded at ${endTime}.`,
    isPassed
      ? '100% sector readback confirmed zero residuals. All verification blocks validated.'
      : 'Unrecoverable bad sector read error on sector 0x4F18A. Wiping protocol marked Failed.',
    simulationNotice,
  ];

  db.updateAsset({
    ...asset,
    wipingStatus: isPassed ? 'Completed' : 'Failed',
    disposalStatus: isPassed ? 'Verification Pending' : 'Wiping In Progress',
    lifecycleStage: isPassed ? 'Verification' : 'Data Wiping',
    wipingEndTime: endTime,
    wipeLogOutput: finalLogs,
    completedRequirements: isPassed
      ? Array.from(new Set([...asset.completedRequirements, 'RULE-03']))
      : asset.completedRequirements.filter((r) => r !== 'RULE-03'),
  });

  const existingRecords = db.getWipingRecords().filter((r) => r.assetId === asset.id);
  if (existingRecords.length > 0) {
    const latest = existingRecords[0];
    db.updateWipingRecord({
      ...latest,
      status: isPassed ? 'Completed' : 'Failed',
      endTime,
      logs: finalLogs,
      errorRemarks: isPassed ? undefined : 'Sector I/O timeout during multi-pass verification.',
    });
  }

  if (isPassed) {
    db.addNotification({
      title: 'Asset Ready for Verification',
      message: `Asset ${asset.id} completed certified data wiping. Awaiting independent verification sign-off.`,
      type: 'info',
      assetId: asset.id,
      linkPage: 'verification',
    });
  }

  db.addAuditLog({
    user: req.user!.name,
    role: req.user!.role,
    action: isPassed ? 'Data Sanitization Completed' : 'Data Sanitization Failed',
    assetId: asset.id,
    previousStatus: 'Wiping In Progress',
    newStatus: isPassed ? 'Verification Pending' : 'Wiping Failed',
    deviceIp: req.ip || '127.0.0.1',
    result: isPassed ? 'Success' : 'Failed',
    details: `${req.user!.name} finished wiping procedure on ${asset.id}. Outcome: ${isPassed ? 'Passed' : 'Failed'}`,
  });

  res.json({
    success: true,
    message: isPassed
      ? `Data wiping passed successfully for asset ${asset.id}. Queued for independent verification.`
      : `Data wiping reported a failure for asset ${asset.id}. Re-run or physical destruction required.`,
  });
});

export default router;
