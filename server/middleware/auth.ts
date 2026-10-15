import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/store';
import { User, UserRole } from '../db/types';

const configuredJwtSecret = process.env.JWT_SECRET?.trim();
if (configuredJwtSecret && configuredJwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}
if (!configuredJwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be configured in the environment before starting in production.');
}
if (!configuredJwtSecret && process.env.NODE_ENV !== 'test') {
  console.warn('JWT_SECRET is unset; using a temporary development-only signing key.');
}
export const JWT_SECRET = configuredJwtSecret || crypto.randomBytes(32).toString('hex');

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'AuthenticationRequired',
      message: 'Access token required. Please sign in.',
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(401).json({
        success: false,
        error: 'InvalidToken',
        message: 'Invalid or expired session. Please sign in again.',
      });
      return;
    }

    const user = db.getUserById(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'UserNotFound',
        message: 'Account no longer exists.',
      });
      return;
    }

    if (user.status !== 'Active') {
      res.status(403).json({
        success: false,
        error: 'AccountDeactivated',
        message: 'Account has been deactivated. Contact an administrator.',
      });
      return;
    }

    if (user.role === 'Admin' && user.googleId) {
      res.status(403).json({
        success: false,
        error: 'GoogleAdminAccessDenied',
        message: 'Google-authenticated accounts cannot access Admin APIs.',
      });
      return;
    }

    req.user = user;
    next();
  });
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'AuthenticationRequired',
        message: 'Please authenticate first.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Authorized roles: ${allowedRoles.join(', ')}. Your role is ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole(['Admin']);
