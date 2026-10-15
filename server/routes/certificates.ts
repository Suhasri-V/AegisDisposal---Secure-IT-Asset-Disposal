import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { CertificateOfDestruction, ITAsset } from '../db/types';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireAdmin,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

function userCanAccessCertificate(user: any, cert: CertificateOfDestruction): boolean {
  if (user.role === 'Admin' || user.role === 'IT Technician' || user.role === 'Compliance Officer' || user.role === 'Manager' || user.role === 'Auditor') {
    return true;
  }
  const asset = db.getAssetById(cert.assetId);
  if (!asset) return false;

  const userName = user.name.toLowerCase();
  return Boolean(
    asset.userId === user.id ||
    asset.assignedEmployee.toLowerCase() === userName ||
    (asset.requestedBy && asset.requestedBy.toLowerCase() === userName)
  );
}

// GET /api/certificates - List certificates with role-based scoping
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  let certificates = db.getCertificates();

  // If regular User, scope only to their own assets (preventing IDOR)
  if (user.role === 'User') {
    certificates = certificates.filter((c) => userCanAccessCertificate(user, c));
  }

  const { search } = req.query;
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    certificates = certificates.filter(
      (c) =>
        c.certificateId.toLowerCase().includes(q) ||
        c.assetId.toLowerCase().includes(q) ||
        c.serialNumber.toLowerCase().includes(q) ||
        c.technicianName.toLowerCase().includes(q) ||
        c.verificationOfficer.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    count: certificates.length,
    certificates,
  });
});

// GET /api/certificates/:id - Get specific certificate (IDOR protected)
router.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const cert = db.getCertificateById(req.params.id);

  if (!cert) {
    res.status(404).json({ success: false, message: 'Certificate not found.' });
    return;
  }

  if (!userCanAccessCertificate(user, cert)) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Access denied: You are not authorized to view this certificate.',
    });
    return;
  }

  const linkedAsset = db.getAssetById(cert.assetId);
  res.json({
    success: true,
    certificate: cert,
    asset: linkedAsset,
  });
});

// POST /api/certificates/generate - Generate Certificate of Data Destruction (Admin only)
router.post('/generate', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const { assetId, notes } = req.body;

  if (!assetId) {
    res.status(400).json({ success: false, message: 'Asset ID is required.' });
    return;
  }

  const asset = db.getAssetById(assetId);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Target asset not found.' });
    return;
  }

  // Workflow condition 1: Wiping must be completed
  if (asset.wipingStatus !== 'Completed') {
    res.status(400).json({
      success: false,
      message: `Cannot generate certificate: Media data wiping is not marked as Completed (Status: ${asset.wipingStatus || 'Not Started'}).`,
    });
    return;
  }

  // Workflow condition 2: Independent verification must be Passed
  if (asset.verificationResult !== 'Passed') {
    res.status(400).json({
      success: false,
      message: `Cannot generate certificate: Independent sanitization verification has not Passed (Status: ${asset.verificationResult || 'Pending'}).`,
    });
    return;
  }

  // Workflow condition 3: Prevent duplicate certificate generation
  if (asset.certificateId) {
    const existing = db.getCertificateById(asset.certificateId);
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Certificate has already been generated for this asset (${existing.certificateId}).`,
        certificate: existing,
      });
      return;
    }
  }

  const settings = db.getSettings();
  const issueDate = new Date().toISOString().slice(0, 10);
  const certId = `CERT-2026-${asset.id}`;

  const certDataToHash = `${certId}:${asset.serialNumber}:${asset.wipingMethod || 'NIST 800-88'}:${asset.technician}:${asset.verifiedBy}:${issueDate}`;
  const sha256Hash = crypto.createHash('sha256').update(certDataToHash).digest('hex');

  const newCertificate: CertificateOfDestruction = {
    certificateId: certId,
    assetId: asset.id,
    deviceType: asset.deviceType,
    brand: asset.brand,
    model: asset.model,
    serialNumber: asset.serialNumber,
    sanitizationMethod: asset.wipingMethod || settings.defaultWipingStandard,
    wipingTool: asset.wipingTool || 'Blancco Drive Eraser v7.14',
    technicianName: asset.technician || req.user!.name,
    verificationOfficer: asset.verifiedBy || req.user!.name,
    issueDate,
    sha256Hash,
    status: 'Valid',
    organization: settings.orgName,
    facilityLocation: settings.facilityName,
    notes:
      notes && notes.trim()
        ? notes.trim()
        : 'Sanitization and zero-fill verification completed in accordance with NIST SP 800-88 Rev 1 requirements.',
  };

  db.createCertificate(newCertificate);

  db.updateAsset({
    ...asset,
    certificateId: certId,
    certificateHash: sha256Hash,
    certificateIssuedDate: issueDate,
    lifecycleStage: 'Certificate Generated',
    completedRequirements: Array.from(new Set([...asset.completedRequirements, 'RULE-05'])),
  });

  // Notify requester
  db.addNotification({
    title: 'Destruction Certificate Generated',
    message: `Digital Certificate of Destruction ${certId} generated with SHA-256 digital seal for asset ${asset.id}.`,
    type: 'success',
    assetId: asset.id,
    linkPage: 'certificates',
  });

  db.addAuditLog({
    user: req.user!.name,
    role: req.user!.role,
    action: 'Certificate of Destruction Generated',
    assetId: asset.id,
    previousStatus: asset.disposalStatus,
    newStatus: 'Certificate Generated',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `Admin ${req.user!.name} issued Certificate ${certId} with SHA-256 seal ${sha256Hash.slice(0, 16)}...`,
  });

  res.status(201).json({
    success: true,
    certificate: newCertificate,
    message: `Certificate of Data Destruction ${certId} issued successfully.`,
  });
});

export default router;
