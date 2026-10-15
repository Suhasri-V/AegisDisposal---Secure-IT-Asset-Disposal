import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/store';
import { User, UserRole } from '../db/types';
import {
  authenticateToken,
  AuthenticatedRequest,
  requireAdmin,
} from '../middleware/auth';
import { getAdminConfiguration } from '../adminSetup';

const router = Router();
const VALID_ROLES: UserRole[] = ['Admin', 'User', 'IT Technician', 'Compliance Officer', 'Manager', 'Auditor'];

function sanitizeUser(user: User): Omit<User, 'passwordHash' | 'passwordSalt' | 'googleId'> {
  const { passwordHash, passwordSalt, googleId, ...safeUser } = user;
  return safeUser;
}

// All user management routes require Admin authorization
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/users - List users with search and filter
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const { search, role, status } = req.query;
  let users = db.getUsers();

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
    );
  }

  if (role && typeof role === 'string' && role !== 'All') {
    users = users.filter((u) => u.role === role);
  }

  if (status && typeof status === 'string' && status !== 'All') {
    users = users.filter((u) => u.status === status);
  }

  res.json({
    success: true,
    users: users.map(sanitizeUser),
  });
});

// GET /api/users/:id - Get specific user details
router.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, user: sanitizeUser(user) });
});

// POST /api/users - Create new user account (Admin only)
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email) {
    res.status(400).json({ success: false, message: 'Name and email are required.' });
    return;
  }
  if (role !== undefined && !VALID_ROLES.includes(role)) {
    res.status(400).json({ success: false, message: 'A valid account role is required.' });
    return;
  }
  if (role === 'Admin') {
    res.status(400).json({
      success: false,
      message: 'Admin account creation is disabled. The administrator account is authorized through system configuration only.',
    });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.getUserByEmail(normalizedEmail);
  if (existing) {
    res.status(409).json({ success: false, message: 'Email address already registered.' });
    return;
  }

  const configuredAdmin = getAdminConfiguration();
  if (normalizedEmail === configuredAdmin?.email) {
    res.status(409).json({ success: false, message: 'Email address is reserved for the configured Admin account.' });
    return;
  }
  if (password !== undefined && (typeof password !== 'string' || password.length < 8)) {
    res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    return;
  }
  const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
  const newUserId = `USR-${Date.now().toString().slice(-4)}`;

  const newUser: User = {
    id: newUserId,
    name: name.trim(),
    email: normalizedEmail,
    role: (role as UserRole) || 'User',
    department: department ? department.trim() : 'General',
    status: 'Active',
    lastLogin: 'Never',
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createUser(newUser);

  db.addAuditLog({
    user: req.user!.name,
    role: req.user!.role,
    action: 'Admin Created User',
    assetId: 'N/A',
    previousStatus: 'None',
    newStatus: `Active (${newUser.role})`,
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `Admin created user account for ${newUser.name} (${newUser.email}) with role: ${newUser.role}`,
  });

  res.status(201).json({
    success: true,
    user: sanitizeUser(newUser),
    message: 'User account created successfully.',
  });
});

// PUT /api/users/:id - Edit permitted user details
router.put('/:id', (req: AuthenticatedRequest, res: Response): void => {
  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const { name, department, role, status } = req.body;
  if (role !== undefined && !VALID_ROLES.includes(role)) {
    res.status(400).json({ success: false, message: 'A valid account role is required.' });
    return;
  }
  if (role === 'Admin' && targetUser.email.toLowerCase() !== getAdminConfiguration().email) {
    res.status(400).json({
      success: false,
      message: 'Promoting accounts to Admin is disabled. Only the designated administrator holds this role.',
    });
    return;
  }
  if (role === 'Admin' && targetUser.googleId) {
    res.status(400).json({
      success: false,
      message: 'Google-authenticated accounts cannot be assigned the Admin role.',
    });
    return;
  }
  if (status !== undefined && status !== 'Active' && status !== 'Inactive') {
    res.status(400).json({ success: false, message: 'A valid account status is required.' });
    return;
  }

  // Protect against privilege escalation: prevent self-demotion or self-deactivation
  if (req.user!.id === targetUser.id) {
    if (role && role !== 'Admin') {
      res.status(400).json({
        success: false,
        message: 'Cannot demote your own administrator account.',
      });
      return;
    }
    if (status && status === 'Inactive') {
      res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own administrator account.',
      });
      return;
    }
  }

  const updated = db.updateUser({
    ...targetUser,
    name: name !== undefined ? name.trim() : targetUser.name,
    department: department !== undefined ? department.trim() : targetUser.department,
    role: role !== undefined ? (role as UserRole) : targetUser.role,
    status: status !== undefined ? status : targetUser.status,
  });

  db.addAuditLog({
    user: req.user!.name,
    role: req.user!.role,
    action: 'Admin Updated User',
    assetId: 'N/A',
    previousStatus: targetUser.status,
    newStatus: updated.status,
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `Admin updated details for user ${updated.email}. Role: ${updated.role}, Status: ${updated.status}`,
  });

  res.json({
    success: true,
    user: sanitizeUser(updated),
    message: 'User updated successfully.',
  });
});

// PUT /api/users/:id/status - Toggle active/inactive
router.put('/:id/status', (req: AuthenticatedRequest, res: Response): void => {
  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  if (req.user!.id === targetUser.id) {
    res.status(400).json({
      success: false,
      message: 'Cannot deactivate your own administrator account.',
    });
    return;
  }

  const newStatus = targetUser.status === 'Active' ? 'Inactive' : 'Active';
  const updated = db.updateUser({
    ...targetUser,
    status: newStatus,
  });

  db.addAuditLog({
    user: req.user!.name,
    role: req.user!.role,
    action: 'User Status Toggled',
    assetId: 'N/A',
    previousStatus: targetUser.status,
    newStatus,
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `Admin toggled status for ${updated.email} to ${newStatus}`,
  });

  res.json({
    success: true,
    user: sanitizeUser(updated),
    message: `Account status updated to ${newStatus}.`,
  });
});

// PUT /api/users/:id/role - Change user role
router.put('/:id/role', (req: AuthenticatedRequest, res: Response): void => {
  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const { role } = req.body;
  if (!VALID_ROLES.includes(role)) {
    res.status(400).json({ success: false, message: 'A valid account role is required.' });
    return;
  }
  if (role === 'Admin' && targetUser.googleId) {
    res.status(400).json({
      success: false,
      message: 'Google-authenticated accounts cannot be assigned the Admin role.',
    });
    return;
  }

  if (req.user!.id === targetUser.id && role !== 'Admin') {
    res.status(400).json({
      success: false,
      message: 'Cannot demote your own administrator account.',
    });
    return;
  }

  const prevRole = targetUser.role;
  const updated = db.updateUser({
    ...targetUser,
    role: role as UserRole,
  });

  db.addAuditLog({
    user: req.user!.name,
    role: req.user!.role,
    action: 'User Role Changed',
    assetId: 'N/A',
    previousStatus: prevRole,
    newStatus: role,
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `Admin changed role for ${updated.email} from ${prevRole} to ${role}`,
  });

  res.json({
    success: true,
    user: sanitizeUser(updated),
    message: `Role updated to ${role}.`,
  });
});

// GET /api/users/:id/activity - View a user's asset submissions and disposal requests
router.get('/:id/activity', (req: AuthenticatedRequest, res: Response): void => {
  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const allAssets = db.getAssets();
  const userAssets = allAssets.filter(
    (a) =>
      a.userId === targetUser.id ||
      a.assignedEmployee.toLowerCase() === targetUser.name.toLowerCase() ||
      (a.requestedBy && a.requestedBy.toLowerCase() === targetUser.name.toLowerCase())
  );

  const allRequests = db.getDisposalRequests();
  const userRequests = allRequests.filter(
    (r) =>
      r.userId === targetUser.id ||
      r.requestedBy.toLowerCase() === targetUser.name.toLowerCase()
  );

  res.json({
    success: true,
    user: sanitizeUser(targetUser),
    assets: userAssets,
    disposalRequests: userRequests,
  });
});

export default router;
