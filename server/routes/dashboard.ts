import { Router, Response } from 'express';
import { db } from '../db/store';
import {
  authenticateToken,
  AuthenticatedRequest,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/dashboard/stats - Real database-backed statistics
router.get('/stats', (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  const allAssets = db.getAssets();
  const allUsers = db.getUsers();
  const allRequests = db.getDisposalRequests();
  const allCertificates = db.getCertificates();
  const allNotifications = db.getNotifications();
  const allLogs = db.getAuditLogs();

  if (user.role === 'Admin') {
    // Admin full enterprise metrics computed directly from database
    const totalAssets = allAssets.length;
    const totalUsers = allUsers.length;
    const pendingRequests = allRequests.filter((r) => r.status === 'Pending Approval').length;
    const approvedRequests = allRequests.filter((r) => r.status === 'Approved').length;
    const rejectedRequests = allRequests.filter((r) => r.status === 'Rejected').length;
    const wipingInProgress = allAssets.filter((a) => a.disposalStatus === 'Wiping In Progress').length;
    const successfullyWiped = allAssets.filter((a) => a.wipingStatus === 'Completed').length;
    const pendingVerification = allAssets.filter(
      (a) => a.disposalStatus === 'Verification Pending' || a.disposalStatus === 'Verification Failed'
    ).length;
    const verifiedAssets = allAssets.filter((a) => a.verificationResult === 'Passed').length;
    const complianceIssues = allAssets.filter((a) => a.complianceStatus === 'Non-Compliant').length;
    const certificatesGenerated = allCertificates.length;
    const awaitingFinalDisposal = allAssets.filter((a) => a.disposalStatus === 'Ready For Disposal').length;

    // Status breakdown
    const statusDistribution: Record<string, number> = {};
    allAssets.forEach((a) => {
      statusDistribution[a.disposalStatus] = (statusDistribution[a.disposalStatus] || 0) + 1;
    });

    res.json({
      success: true,
      role: 'Admin',
      stats: {
        totalAssets,
        totalUsers,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        wipingInProgress,
        successfullyWiped,
        pendingVerification,
        verifiedAssets,
        complianceIssues,
        certificatesGenerated,
        awaitingFinalDisposal,
      },
      statusDistribution,
      recentActivity: allLogs.slice(0, 8),
      pendingApprovals: allRequests.filter((r) => r.status === 'Pending Approval').slice(0, 5),
    });
    return;
  }

  // Non-Admin / User metrics (strictly scoped to current user)
  const userName = user.name.toLowerCase();
  const userAssets = allAssets.filter(
    (a) =>
      a.userId === user.id ||
      a.assignedEmployee.toLowerCase() === userName ||
      (a.requestedBy && a.requestedBy.toLowerCase() === userName)
  );

  const userRequests = allRequests.filter(
    (r) =>
      r.userId === user.id ||
      r.requestedBy.toLowerCase() === userName
  );

  const userAssetIds = new Set(userAssets.map((a) => a.id));
  const userCertificates = allCertificates.filter((c) => userAssetIds.has(c.assetId));

  const userPendingRequests = userRequests.filter((r) => r.status === 'Pending Approval').length;
  const userApprovedRequests = userRequests.filter((r) => r.status === 'Approved').length;
  const userRejectedRequests = userRequests.filter((r) => r.status === 'Rejected').length;
  const userWipingInProgress = userAssets.filter((a) => a.disposalStatus === 'Wiping In Progress').length;
  const userVerifiedAssets = userAssets.filter((a) => a.verificationResult === 'Passed').length;

  res.json({
    success: true,
    role: user.role,
    stats: {
      myTotalAssets: userAssets.length,
      myRequests: userRequests.length,
      pendingRequests: userPendingRequests,
      approvedRequests: userApprovedRequests,
      rejectedRequests: userRejectedRequests,
      wipingInProgress: userWipingInProgress,
      verifiedAssets: userVerifiedAssets,
      availableCertificates: userCertificates.length,
      unreadNotifications: allNotifications.filter((n) => !n.read).length,
    },
    myAssets: userAssets,
    myRequests: userRequests,
    myCertificates: userCertificates,
  });
});

export default router;
