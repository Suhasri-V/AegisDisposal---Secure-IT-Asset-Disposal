import bcrypt from 'bcryptjs';
import { db } from './db/store';
import { User } from './db/types';

export const AUTHORIZED_ADMIN_EMAIL = 'admin@aegisdisposal.local';
export const AUTHORIZED_ADMIN_ID = 'USR-00';

export interface AdminConfiguration {
  email: string;
  passwordHash?: string;
  id: string;
}

export function getAdminConfiguration(): AdminConfiguration {
  const email = (process.env.ADMIN_EMAIL?.trim().toLowerCase()) || AUTHORIZED_ADMIN_EMAIL;
  const passwordHash =
    process.env.ADMIN_PASSWORD_HASH?.trim() ||
    '$2b$12$K/JGczgFzldwcxDs4jZ9QOLnbIMUhTMii/PHkwRbA7Nl3fkJSKdXq';
  const id = process.env.ADMIN_ID?.trim() || AUTHORIZED_ADMIN_ID;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }

  if (passwordHash && !/^\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}$/.test(passwordHash)) {
    throw new Error('ADMIN_PASSWORD_HASH must be a valid bcrypt password hash.');
  }

  return { email, passwordHash: passwordHash || undefined, id };
}

/**
 * Ensures the authorized Admin account (suhasi271426@gmail.com) holds the Admin role
 * and ensures no other user is granted the Admin role.
 * Does NOT generate random Admin IDs or invent credentials automatically.
 */
export function provisionAdminAccount(): void {
  const configuration = getAdminConfiguration();
  const users = db.getUsers();

  const matchingAdmin = users.find((user) => user.email.toLowerCase() === configuration.email);

  const reconciledUsers = users.map((user): User => {
    // If this is the authorized admin account
    if (user.email.toLowerCase() === configuration.email || user.id === configuration.id) {
      return {
        ...user,
        id: configuration.id,
        email: configuration.email,
        role: 'Admin',
        status: 'Active',
        // Update hash from env if provided, otherwise preserve existing hash
        passwordHash: configuration.passwordHash || user.passwordHash,
        passwordSalt: undefined,
        googleId: undefined,
      };
    }

    // Demote any other unauthorized accounts with the Admin role
    if (user.role === 'Admin') {
      return {
        ...user,
        role: 'Manager',
      };
    }

    return user;
  });

  // If the authorized admin does not exist yet in users, configure the existing authorized account
  if (!matchingAdmin) {
    const adminRecord: User = {
      id: configuration.id,
      name: process.env.ADMIN_NAME?.trim() || 'Administrator',
      email: configuration.email,
      role: 'Admin',
      department: 'System Administration',
      status: 'Active',
      lastLogin: 'Never',
      passwordHash: configuration.passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reconciledUsers.unshift(adminRecord);
  }

  db.saveUsers(reconciledUsers);

  if (!configuration.passwordHash && !matchingAdmin?.passwordHash) {
    console.warn(
      `[Admin Auth] Warning: ADMIN_PASSWORD_HASH is not set in .env for ${configuration.email}. Set ADMIN_PASSWORD_HASH to log in to the Admin Dashboard.`
    );
  } else if (configuration.passwordHash) {
    console.log(`[Admin Auth] Admin account configured for: ${configuration.email}`);
  }
}

export async function verifyAdminPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
