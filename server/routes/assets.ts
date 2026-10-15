import { Router, Response } from 'express';
import { db } from '../db/store';
import { ITAsset, DeviceType, ComplianceStatus, LifecycleStage, DisposalStatus } from '../db/types';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireAdmin,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

function userCanAccessAsset(user: any, asset: ITAsset): boolean {
  if (user.role === 'Admin' || user.role === 'IT Technician' || user.role === 'Compliance Officer' || user.role === 'Manager' || user.role === 'Auditor') {
    return true;
  }
  const userName = user.name.toLowerCase();
  return Boolean(
    asset.userId === user.id ||
    asset.assignedEmployee.toLowerCase() === userName ||
    (asset.requestedBy && asset.requestedBy.toLowerCase() === userName)
  );
}

// GET /api/assets - List assets (Scoper: Admin gets all, User gets only their own)
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  let assets = db.getAssets();

  // Role scoping
  if (user.role === 'User') {
    assets = assets.filter((a) => userCanAccessAsset(user, a));
  }

  const { search, deviceType, status, department, condition } = req.query;

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    assets = assets.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q) ||
        a.brand.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        a.assignedEmployee.toLowerCase().includes(q)
    );
  }

  if (deviceType && typeof deviceType === 'string' && deviceType !== 'All') {
    assets = assets.filter((a) => a.deviceType === deviceType);
  }

  if (status && typeof status === 'string' && status !== 'All') {
    assets = assets.filter((a) => a.disposalStatus === status);
  }

  if (department && typeof department === 'string' && department !== 'All') {
    assets = assets.filter((a) => a.department === department);
  }

  if (condition && typeof condition === 'string' && condition !== 'All') {
    assets = assets.filter((a) => a.assetCondition === condition);
  }

  res.json({
    success: true,
    count: assets.length,
    assets,
  });
});

// GET /api/assets/:id - Get specific asset (with ownership validation to prevent IDOR)
router.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  const asset = db.getAssetById(req.params.id);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Asset not found.' });
    return;
  }

  if (!userCanAccessAsset(req.user!, asset)) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You are not authorized to access this asset.',
    });
    return;
  }

  res.json({ success: true, asset });
});

// POST /api/assets - Register a new IT asset
router.post('/', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const {
    deviceType,
    brand,
    model,
    serialNumber,
    assignedEmployee,
    department,
    location,
    purchaseDate,
    capacity,
    assetCondition,
  } = req.body;

  if (!brand || !model || !serialNumber) {
    res.status(400).json({
      success: false,
      message: 'Brand, model, and serial number are required.',
    });
    return;
  }

  // Prevent duplicate serial numbers
  const existingAssets = db.getAssets();
  const duplicate = existingAssets.find(
    (a) => a.serialNumber.trim().toLowerCase() === serialNumber.trim().toLowerCase()
  );
  if (duplicate) {
    res.status(409).json({
      success: false,
      message: `An asset with serial number "${serialNumber}" is already registered (Asset ID: ${duplicate.id}).`,
    });
    return;
  }

  // Generate ID prefix based on device type
  let prefix = 'AST';
  const typeStr = (deviceType || 'Laptop').toLowerCase();
  if (typeStr.includes('lap')) prefix = 'LAP';
  else if (typeStr.includes('desk')) prefix = 'DSK';
  else if (typeStr.includes('serv')) prefix = 'SRV';
  else if (typeStr.includes('hard') || typeStr.includes('ssd')) prefix = 'STR';
  else if (typeStr.includes('mob') || typeStr.includes('tab')) prefix = 'MOB';

  const newId = `${prefix}-${1000 + existingAssets.length + 1}`;

  const newAsset: ITAsset = {
    id: newId,
    deviceType: (deviceType as DeviceType) || 'Laptop',
    brand: brand.trim(),
    model: model.trim(),
    serialNumber: serialNumber.trim().toUpperCase(),
    assignedEmployee: user.role === 'User' ? user.name : (assignedEmployee ? assignedEmployee.trim() : user.name),
    userId: user.role === 'User' ? user.id : undefined,
    department: user.role === 'User' ? user.department : (department ? department.trim() : user.department),
    location: location ? location.trim() : 'Central Corporate Facility',
    purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
    capacity: capacity ? capacity.trim() : undefined,
    assetCondition: assetCondition || 'Working',
    lifecycleStage: 'Registered',
    disposalStatus: 'Active',
    complianceStatus: 'Review Required',
    completedRequirements: ['RULE-01'],
    missingRequirements: ['RULE-02', 'RULE-03', 'RULE-04', 'RULE-05'],
    riskLevel: 'Low',
    lastComplianceCheck: new Date().toISOString().slice(0, 10),
  };

  db.createAsset(newAsset);

  db.addAuditLog({
    user: user.name,
    role: user.role,
    action: 'Asset Registered',
    assetId: newAsset.id,
    previousStatus: 'None',
    newStatus: 'Registered (Active)',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `${user.role} ${user.name} registered asset ${newAsset.id} (${newAsset.brand} ${newAsset.model}, SN: ${newAsset.serialNumber})`,
  });

  res.status(201).json({
    success: true,
    asset: newAsset,
    message: `Asset ${newAsset.id} registered successfully.`,
  });
});

// PUT /api/assets/:id - Edit permitted asset details
router.put('/:id', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const asset = db.getAssetById(req.params.id);

  if (!asset) {
    res.status(404).json({ success: false, message: 'Asset not found.' });
    return;
  }

  if (!userCanAccessAsset(user, asset)) {
    res.status(403).json({ success: false, message: 'Unauthorized to modify this asset.' });
    return;
  }

  // If regular User, can only edit their own asset before it has been approved for disposal
  if (user.role === 'User') {
    if (asset.disposalStatus !== 'Active' && asset.lifecycleStage !== 'Registered') {
      res.status(400).json({
        success: false,
        message: 'Cannot edit asset once disposal authorization workflow has commenced.',
      });
      return;
    }
  }

  const {
    brand,
    model,
    department,
    location,
    capacity,
    assetCondition,
    assignedEmployee,
    deviceType,
  } = req.body;

  const updated = db.updateAsset({
    ...asset,
    brand: brand ? brand.trim() : asset.brand,
    model: model ? model.trim() : asset.model,
    deviceType: deviceType || asset.deviceType,
    department: department ? department.trim() : asset.department,
    location: location ? location.trim() : asset.location,
    capacity: capacity !== undefined ? capacity : asset.capacity,
    assetCondition: assetCondition || asset.assetCondition,
    assignedEmployee: user.role === 'Admin' && assignedEmployee ? assignedEmployee.trim() : asset.assignedEmployee,
  });

  db.addAuditLog({
    user: user.name,
    role: user.role,
    action: 'Asset Updated',
    assetId: updated.id,
    previousStatus: asset.disposalStatus,
    newStatus: updated.disposalStatus,
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `${user.name} updated asset details for ${updated.id}.`,
  });

  res.json({
    success: true,
    asset: updated,
    message: 'Asset updated successfully.',
  });
});

// POST /api/assets/:id/finalize - Final disposal to certified recycler (Admin only)
router.post('/:id/finalize', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const asset = db.getAssetById(req.params.id);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Asset not found.' });
    return;
  }

  if (asset.verificationResult !== 'Passed' && asset.disposalStatus !== 'Ready For Disposal') {
    res.status(400).json({
      success: false,
      message: 'Asset cannot be finalized for disposal without verified sanitization completion.',
    });
    return;
  }

  const { vendor, methodDetail } = req.body;
  const settings = db.getSettings();

  const updated = db.updateAsset({
    ...asset,
    lifecycleStage: 'Disposed',
    disposalStatus: 'Disposed',
    finalDisposalDate: new Date().toISOString().slice(0, 10),
    disposalVendor: vendor || settings.certifiedRecyclerPartner,
    disposalMethodDetail: methodDetail || 'Transferred to R2v3 Certified Recycler facility for physical material recovery',
    completedRequirements: Array.from(new Set([...asset.completedRequirements, 'RULE-06', 'RULE-07'])),
  });

  db.addAuditLog({
    user: req.user!.name,
    role: req.user!.role,
    action: 'Asset Final Disposal Completed',
    assetId: updated.id,
    previousStatus: 'Ready For Disposal',
    newStatus: 'Disposed',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `Admin finalized disposal of ${updated.id} with partner ${updated.disposalVendor}`,
  });

  res.json({
    success: true,
    asset: updated,
    message: `Asset ${updated.id} marked as officially disposed with partner ${updated.disposalVendor}.`,
  });
});

export default router;
