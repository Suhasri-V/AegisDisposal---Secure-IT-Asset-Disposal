import { Router, Response } from 'express';
import { db } from '../db/store';
import { DisposalRequest, Priority } from '../db/types';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireAdmin,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/disposal-requests - List disposal requests (scoper by role)
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  let requests = db.getDisposalRequests();

  if (user.role === 'User') {
    const userName = user.name.toLowerCase();
    requests = requests.filter(
      (r) =>
        r.userId === user.id ||
        r.requestedBy.toLowerCase() === userName
    );
  }

  const { status, priority, search } = req.query;

  if (status && typeof status === 'string' && status !== 'All') {
    requests = requests.filter((r) => r.status === status);
  }

  if (priority && typeof priority === 'string' && priority !== 'All') {
    requests = requests.filter((r) => r.priority === priority);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    requests = requests.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.assetId.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.requestedBy.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    count: requests.length,
    requests,
  });
});

// POST /api/disposal-requests - Submit a disposal request
router.post('/', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const { assetId, reason, condition, priority, notes } = req.body;

  if (!assetId || !reason) {
    res.status(400).json({
      success: false,
      message: 'Asset ID and disposal reason are required.',
    });
    return;
  }

  const asset = db.getAssetById(assetId);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Target asset not found.' });
    return;
  }

  // If regular user, ensure asset belongs to user
  if (user.role === 'User') {
    const userName = user.name.toLowerCase();
    const isOwner =
      asset.userId === user.id ||
      asset.assignedEmployee.toLowerCase() === userName;

    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'You can only submit disposal requests for assets assigned to you.',
      });
      return;
    }
  }

  // Check valid transition: cannot request disposal if already in disposal/wiping/disposed
  if (['Pending Approval', 'Approved', 'Wiping In Progress', 'Ready For Disposal', 'Disposed'].includes(asset.disposalStatus)) {
    res.status(400).json({
      success: false,
      message: `Asset ${assetId} is already in disposal workflow (Status: ${asset.disposalStatus}).`,
    });
    return;
  }

  const nowIso = new Date().toISOString();
  const nowDate = nowIso.slice(0, 10);
  const newReqId = `REQ-${Date.now().toString().slice(-4)}`;

  const newRequest: DisposalRequest = {
    id: newReqId,
    assetId: asset.id,
    userId: user.id,
    requestedBy: user.name,
    department: user.department || asset.department,
    reason: reason.trim(),
    condition: condition || asset.assetCondition || 'Working',
    priority: (priority as Priority) || 'Medium',
    notes: notes ? notes.trim() : undefined,
    status: 'Pending Approval',
    requestedDate: nowDate,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.createDisposalRequest(newRequest);

  // Update asset status
  db.updateAsset({
    ...asset,
    lifecycleStage: 'Disposal Requested',
    disposalStatus: 'Pending Approval',
    disposalReason: reason.trim(),
    assetCondition: condition || asset.assetCondition,
    priority: (priority as Priority) || 'Medium',
    requestedBy: user.name,
    requestedDate: nowDate,
    completedRequirements: Array.from(new Set([...asset.completedRequirements, 'RULE-01'])),
  });

  // Notify Admins
  db.addNotification({
    title: 'New Asset Decommission Request',
    message: `${user.name} submitted disposal request for ${asset.brand} ${asset.model} (${asset.id}). Reason: ${reason}`,
    type: 'warning',
    assetId: asset.id,
    linkPage: 'disposal-requests',
  });

  // Audit log
  db.addAuditLog({
    user: user.name,
    role: user.role,
    action: 'Disposal Request Submitted',
    assetId: asset.id,
    previousStatus: asset.disposalStatus,
    newStatus: 'Pending Approval',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `${user.name} submitted disposal request ${newReqId} for ${asset.id} (${reason}). Priority: ${priority || 'Medium'}`,
  });

  res.status(201).json({
    success: true,
    request: newRequest,
    message: `Disposal request ${newReqId} submitted and queued for executive approval.`,
  });
});

// POST /api/disposal-requests/:id/approve - Approve request (Admin only)
router.post('/:id/approve', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const request = db.getDisposalRequestById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Disposal request not found.' });
    return;
  }

  const asset = db.getAssetById(request.assetId);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Linked asset not found.' });
    return;
  }

  const nowIso = new Date().toISOString();
  const nowDate = nowIso.slice(0, 10);
  const adminUser = req.user!;

  const updatedReq = db.updateDisposalRequest({
    ...request,
    status: 'Approved',
    approvedBy: adminUser.name,
    approvalDate: nowDate,
  });

  db.updateAsset({
    ...asset,
    lifecycleStage: 'Approved',
    disposalStatus: 'Approved',
    approvedBy: adminUser.name,
    approvalDate: nowDate,
    completedRequirements: Array.from(new Set([...asset.completedRequirements, 'RULE-02'])),
  });

  // Notify the user who requested it
  db.addNotification({
    title: 'Disposal Request Approved',
    message: `Your decommission request for ${asset.brand} ${asset.model} (${asset.id}) was approved by ${adminUser.name}. Routed to sanitization clean-bay.`,
    type: 'success',
    assetId: asset.id,
    linkPage: 'disposal-requests',
  });

  db.addAuditLog({
    user: adminUser.name,
    role: adminUser.role,
    action: 'Disposal Request Approved',
    assetId: asset.id,
    previousStatus: 'Pending Approval',
    newStatus: 'Approved',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `Admin ${adminUser.name} authorized decommission of ${asset.id} (Request: ${request.id})`,
  });

  res.json({
    success: true,
    request: updatedReq,
    message: `Disposal request for ${asset.id} approved and routed for data wiping.`,
  });
});

// POST /api/disposal-requests/:id/reject - Reject request with reason (Admin only)
router.post('/:id/reject', requireAdmin, (req: AuthenticatedRequest, res: Response): void => {
  const request = db.getDisposalRequestById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, message: 'Disposal request not found.' });
    return;
  }

  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    res.status(400).json({
      success: false,
      message: 'A specific rejection reason is required.',
    });
    return;
  }

  const asset = db.getAssetById(request.assetId);
  if (!asset) {
    res.status(404).json({ success: false, message: 'Linked asset not found.' });
    return;
  }

  const adminUser = req.user!;
  const updatedReq = db.updateDisposalRequest({
    ...request,
    status: 'Rejected',
    rejectionReason: reason.trim(),
  });

  db.updateAsset({
    ...asset,
    disposalStatus: 'Rejected',
    rejectionReason: reason.trim(),
  });

  // Notify requester
  db.addNotification({
    title: 'Disposal Request Rejected',
    message: `Your decommission request for ${asset.brand} ${asset.model} (${asset.id}) was rejected by ${adminUser.name}. Reason: ${reason.trim()}`,
    type: 'error',
    assetId: asset.id,
    linkPage: 'disposal-requests',
  });

  db.addAuditLog({
    user: adminUser.name,
    role: adminUser.role,
    action: 'Disposal Request Rejected',
    assetId: asset.id,
    previousStatus: 'Pending Approval',
    newStatus: 'Rejected',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Warning',
    details: `Admin ${adminUser.name} rejected decommission of ${asset.id}. Reason: ${reason.trim()}`,
  });

  res.json({
    success: true,
    request: updatedReq,
    message: `Disposal request for ${asset.id} rejected. Reason logged in audit trail.`,
  });
});

export default router;
