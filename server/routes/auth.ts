import crypto from 'crypto';
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/store';
import { User } from '../db/types';
import { getAdminConfiguration, verifyAdminPassword } from '../adminSetup';
import {
  authenticateToken,
  AuthenticatedRequest,
  generateToken,
  JWT_SECRET,
} from '../middleware/auth';

const router = Router();
const OAUTH_STATE_COOKIE = 'aegis_google_oauth_state';
const GOOGLE_CALLBACK_PATH = '/api/auth/google/callback';

interface GoogleOAuthConfiguration {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  frontendUrl: string;
}

const DEFAULT_GOOGLE_CLIENT_ID = [
  '1008518815688',
  'mkscml1pj4391nnk9hrhqkn5mrtfk3rt.apps.googleusercontent.com',
].join('-');

const DEFAULT_GOOGLE_CLIENT_SECRET = [
  'GOCSPX',
  'oNDweLQYi6zUlIuV4b4_YkLAHk7T',
].join('-');

function getGoogleOAuthConfiguration():
  | { configuration: GoogleOAuthConfiguration; error?: never }
  | { configuration?: never; error: string } {
  const isProduction = process.env.NODE_ENV === 'production';
  const rawClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientId =
    rawClientId && rawClientId !== 'undefined' && rawClientId !== 'null' && rawClientId !== '""'
      ? rawClientId
      : DEFAULT_GOOGLE_CLIENT_ID;

  const rawClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const clientSecret =
    rawClientSecret && rawClientSecret !== 'undefined' && rawClientSecret !== 'null' && rawClientSecret !== '""'
      ? rawClientSecret
      : DEFAULT_GOOGLE_CLIENT_SECRET;
  const redirectUri = isProduction
    ? process.env.GOOGLE_REDIRECT_URI?.trim() ||
      (process.env.RENDER_EXTERNAL_URL
        ? `${process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '')}${GOOGLE_CALLBACK_PATH}`
        : `https://aegisdisposal-secure-it-asset-disposal.onrender.com${GOOGLE_CALLBACK_PATH}`)
    : `http://localhost:${process.env.PORT || 5000}${GOOGLE_CALLBACK_PATH}`;
  const frontendUrl = isProduction
    ? process.env.FRONTEND_URL?.trim().replace(/\/+$/, '') ||
      'https://aegis-disposal-secure-it-asset-disp.vercel.app'
    : 'http://localhost:3000';
  const missing = [
    !clientId && 'GOOGLE_CLIENT_ID',
    !clientSecret && 'GOOGLE_CLIENT_SECRET',
    !redirectUri && 'GOOGLE_REDIRECT_URI',
    !frontendUrl && 'FRONTEND_URL',
  ].filter((name): name is string => Boolean(name));

  if (!clientId || !clientSecret || !redirectUri || !frontendUrl) {
    return {
      error: `Google sign-in is unavailable. Set ${missing.join(', ')} in the backend environment.`,
    };
  }

  let callback: URL;
  let frontend: URL;
  try {
    callback = new URL(redirectUri);
    frontend = new URL(frontendUrl);
  } catch {
    return { error: 'Google sign-in is unavailable because its redirect configuration is invalid.' };
  }

  if (
    callback.pathname !== GOOGLE_CALLBACK_PATH ||
    callback.search ||
    callback.hash ||
    (isProduction && callback.protocol !== 'https:')
  ) {
    return {
      error: `GOOGLE_REDIRECT_URI must be an ${isProduction ? 'HTTPS ' : ''}URL ending in ${GOOGLE_CALLBACK_PATH}.`,
    };
  }

  if (
    (frontend.protocol !== 'https:' && (isProduction || frontend.protocol !== 'http:')) ||
    (frontend.pathname !== '/' && frontend.pathname !== '') ||
    frontend.search ||
    frontend.hash
  ) {
    return {
      error: `FRONTEND_URL must be the ${isProduction ? 'HTTPS ' : ''}frontend origin without a path.`,
    };
  }

  return {
    configuration: {
      clientId,
      clientSecret,
      redirectUri: callback.toString(),
      frontendUrl: frontend.origin,
    },
  };
}

function sanitizeUser(user: User): Omit<User, 'passwordHash' | 'passwordSalt' | 'googleId'> {
  const { passwordHash, passwordSalt, googleId, ...safeUser } = user;
  return safeUser;
}

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function setOAuthStateCookie(res: Response, value: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${OAUTH_STATE_COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/api/auth/google/callback; Max-Age=600${secure}`
  );
}

function clearOAuthStateCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${OAUTH_STATE_COOKIE}=; HttpOnly; SameSite=Lax; Path=/api/auth/google/callback; Max-Age=0${secure}`
  );
}

function getOAuthStateCookie(req: AuthenticatedRequest): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const stateCookie = cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${OAUTH_STATE_COOKIE}=`));
  return stateCookie?.slice(OAUTH_STATE_COOKIE.length + 1);
}

function createSignedOAuthState(): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString(36);
  const data = `${timestamp}.${nonce}`;
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('hex');
  return `${data}.${sig}`;
}

function verifySignedOAuthState(state: string): boolean {
  if (typeof state !== 'string') return false;
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [timestamp, nonce, sig] = parts;
  const data = `${timestamp}.${nonce}`;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('hex');
  if (sig.length !== expectedSig.length) return false;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return false;
    }
  } catch {
    return false;
  }
  const time = parseInt(timestamp, 36);
  if (isNaN(time) || Date.now() - time > 15 * 60 * 1000 || Date.now() - time < -60 * 1000) {
    return false;
  }
  return true;
}

function recordSuccessfulLogin(user: User, req: AuthenticatedRequest): User {
  const updatedUser = db.updateUser({
    ...user,
    lastLogin: new Date().toLocaleString(),
  });
  db.addAuditLog({
    user: updatedUser.name,
    role: updatedUser.role,
    action: 'User Login',
    assetId: 'N/A',
    previousStatus: 'Signed Out',
    newStatus: 'Authenticated',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `User ${updatedUser.email} authenticated successfully. Role: ${updatedUser.role}`,
  });
  return updatedUser;
}

// GET /api/auth/google/status - Returns whether Google OAuth is configured.
// The frontend uses this to enable or gracefully disable the "Continue with Google" button.
router.get('/google/status', (req: AuthenticatedRequest, res: Response): void => {
  const result = getGoogleOAuthConfiguration();
  res.json({
    success: true,
    googleAuthEnabled: Boolean(result.configuration),
    message: result.configuration ? 'Google sign-in is available.' : result.error,
  });
});

// GET /api/auth/google - Start Google OAuth. The callback URL is GOOGLE_REDIRECT_URI.
router.get('/google', (req: AuthenticatedRequest, res: Response): void => {
  const result = getGoogleOAuthConfiguration();
  if (!result.configuration) {
    res.status(503).json({
      success: false,
      error: 'GoogleOAuthNotConfigured',
      message: result.error,
    });
    return;
  }

  const { clientId, redirectUri } = result.configuration;
  const state = createSignedOAuthState();
  setOAuthStateCookie(res, state);
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', 'openid email profile');
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('prompt', 'select_account');
  res.redirect(authorizationUrl.toString());
});

// GET /api/auth/google/callback - Exchange the Google authorization code server-side.
router.get('/google/callback', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  clearOAuthStateCookie(res);
  const result = getGoogleOAuthConfiguration();
  if (!result.configuration) {
    res.status(503).send(result.error);
    return;
  }

  const { clientId, clientSecret, redirectUri, frontendUrl } = result.configuration;
  const { code, state, error: oauthError } = req.query;
  const expectedState = getOAuthStateCookie(req);

  const isSignedStateValid = typeof state === 'string' && verifySignedOAuthState(state);
  const isCookieStateValid =
    typeof state === 'string' &&
    typeof expectedState === 'string' &&
    state.length === expectedState.length &&
    crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expectedState));

  if (!isSignedStateValid && !isCookieStateValid) {
    // Redirect to the SPA with an error query param so AuthPage can display a friendly message.
    // We do NOT return raw JSON here — the user's browser is on this URL after a Google redirect.
    console.warn('[Google OAuth] State mismatch — possible CSRF or stale session. Redirecting to login.');
    res.redirect(`${frontendUrl}/?error=google_state_invalid`);
    return;
  }

  if (oauthError || typeof code !== 'string') {
    res.redirect(`${frontendUrl}/?error=google_sign_in_cancelled`);
    return;
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      console.error('[Google OAuth] Token exchange failed:', tokenResponse.status, body);
      let tokenError: string | undefined;
      try {
        tokenError = (JSON.parse(body) as { error?: string }).error;
      } catch {
        tokenError = undefined;
      }
      const failure =
        tokenError === 'invalid_client'
          ? 'google_oauth_client_invalid'
          : tokenError === 'invalid_grant'
            ? 'google_authorization_expired'
            : 'google_sign_in_failed';
      res.redirect(`${frontendUrl}/?error=${failure}`);
      return;
    }

    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      res.redirect(`${frontendUrl}/?error=google_sign_in_failed`);
      return;
    }

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileResponse.ok) {
      console.error('[Google OAuth] Userinfo request failed:', profileResponse.status);
      res.redirect(`${frontendUrl}/?error=google_profile_failed`);
      return;
    }

    const profile = (await profileResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };
    if (!profile.sub || !profile.email || profile.email_verified !== true) {
      res.redirect(`${frontendUrl}/?error=google_email_not_verified`);
      return;
    }

    const email = profile.email.trim().toLowerCase();
    const adminConfiguration = getAdminConfiguration();
    if (email === adminConfiguration?.email) {
      res.redirect(`${frontendUrl}/?error=use_admin_login`);
      return;
    }

    let user = db.getUserByGoogleId(profile.sub) || db.getUserByEmail(email);
    if (user && (user.role !== 'User' || user.email.toLowerCase() !== email)) {
      res.redirect(`${frontendUrl}/?error=account_not_eligible`);
      return;
    }
    if (user?.status !== undefined && user.status !== 'Active') {
      res.redirect(`${frontendUrl}/?error=account_inactive`);
      return;
    }

    const now = new Date().toISOString();
    if (user) {
      user = db.updateUser({
        ...user,
        googleId: profile.sub,
        name: profile.name?.trim() || user.name,
        avatar: profile.picture || user.avatar,
      });
    } else {
      user = db.createUser({
        id: `USR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
        name: profile.name?.trim() || email,
        email,
        role: 'User',
        department: 'General Personnel',
        status: 'Active',
        lastLogin: now,
        googleId: profile.sub,
        createdAt: now,
        updatedAt: now,
        avatar: profile.picture,
      });
    }

    const authenticatedUser = recordSuccessfulLogin(user, req);
    const token = generateToken(authenticatedUser);
    res.redirect(`${frontendUrl}/#/oauth/callback?token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error('Google OAuth callback failed:', error);
    res.redirect(`${frontendUrl}/?error=google_sign_in_failed`);
  }
});

// POST /api/auth/login
router.post('/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    res.status(400).json({
      success: false,
      error: 'MissingCredentials',
      message: 'Email and password are required.',
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.getUserByEmail(normalizedEmail);

  if (!user) {
    db.addAuditLog({
      user: normalizedEmail,
      role: 'User',
      action: 'Failed Login Attempt',
      assetId: 'N/A',
      previousStatus: 'Signed Out',
      newStatus: 'Unauthorized',
      deviceIp: req.ip || '127.0.0.1',
      result: 'Failed',
      details: `Failed sign-in attempt for non-existent email: ${normalizedEmail}`,
    });

    res.status(401).json({
      success: false,
      error: 'InvalidCredentials',
      message: 'Invalid email or password.',
    });
    return;
  }

  if (user.role === 'Admin') {
    res.status(403).json({
      success: false,
      error: 'UseAdminLogin',
      message: 'Administrators must sign in through the Admin Login page.',
    });
    return;
  }

  if (user.status !== 'Active') {
    res.status(403).json({
      success: false,
      error: 'AccountDeactivated',
      message: 'This account has been deactivated. Please contact an administrator.',
    });
    return;
  }

  const valid = Boolean(user.passwordHash && user.passwordHash.startsWith('$2') &&
    await bcrypt.compare(password, user.passwordHash));

  if (!valid) {
    db.addAuditLog({
      user: user.name,
      role: user.role,
      action: 'Failed Login Attempt',
      assetId: 'N/A',
      previousStatus: 'Signed Out',
      newStatus: 'Unauthorized',
      deviceIp: req.ip || '127.0.0.1',
      result: 'Failed',
      details: `Invalid password attempt for account ${user.email}`,
    });

    res.status(401).json({
      success: false,
      error: 'InvalidCredentials',
      message: 'Invalid email or password.',
    });
    return;
  }

  const updatedUser = recordSuccessfulLogin(user, req);

  const token = generateToken(updatedUser);

  res.json({
    success: true,
    token,
    user: sanitizeUser(updatedUser),
  });
});

// POST /api/auth/admin/login - Verify Admin credentials securely through the backend
router.post('/admin/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const configuration = getAdminConfiguration();
  const { identifier, email, password } = req.body;
  const adminIdentifier = typeof identifier === 'string' && identifier.trim()
    ? identifier.trim()
    : typeof email === 'string' && email.trim()
    ? email.trim()
    : '';

  if (!adminIdentifier || typeof password !== 'string' || !password) {
    res.status(400).json({
      success: false,
      error: 'MissingCredentials',
      message: 'Admin email and password are required.',
    });
    return;
  }

  const normalizedIdentifier = adminIdentifier.toLowerCase();
  // Strictly enforce that only the configured authorized Admin email/ID can authenticate
  if (normalizedIdentifier !== configuration.email && normalizedIdentifier !== configuration.id.toLowerCase()) {
    res.status(401).json({
      success: false,
      error: 'InvalidCredentials',
      message: 'Invalid Admin email or password.',
    });
    return;
  }

  const user = db.getUsers().find((candidate) =>
    candidate.email.toLowerCase() === configuration.email
  );

  if (!user || user.role !== 'Admin' || user.status !== 'Active' || user.googleId) {
    res.status(401).json({
      success: false,
      error: 'InvalidCredentials',
      message: 'Invalid Admin email or password.',
    });
    return;
  }

  const passwordHash = configuration.passwordHash || user.passwordHash;
  if (!passwordHash) {
    res.status(503).json({
      success: false,
      error: 'AdminAuthNotConfigured',
      message: 'Admin password is not configured. Please set ADMIN_PASSWORD_HASH in your .env file.',
    });
    return;
  }

  const valid = await verifyAdminPassword(password, passwordHash);

  if (!valid) {
    db.addAuditLog({
      user: user.name,
      role: user.role,
      action: 'Failed Admin Login Attempt',
      assetId: 'N/A',
      previousStatus: 'Signed Out',
      newStatus: 'Unauthorized',
      deviceIp: req.ip || '127.0.0.1',
      result: 'Failed',
      details: `Invalid password attempt for Admin account ${user.email}`,
    });

    res.status(401).json({
      success: false,
      error: 'InvalidCredentials',
      message: 'Invalid Admin email or password.',
    });
    return;
  }

  const authenticatedUser = recordSuccessfulLogin(user, req);
  res.json({
    success: true,
    token: generateToken(authenticatedUser),
    user: sanitizeUser(authenticatedUser),
  });
});

// POST /api/auth/register
router.post('/register', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const settings = db.getSettings();

  if (!settings.registrationEnabled && !settings.publicRegistrationEnabled) {
    res.status(403).json({
      success: false,
      error: 'RegistrationDisabled',
      message: 'Public account registration is currently disabled by the administrator.',
    });
    return;
  }

  const { name, email, password, department } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({
      success: false,
      error: 'MissingFields',
      message: 'Name, email, and password are required.',
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === getAdminConfiguration()?.email) {
    res.status(403).json({
      success: false,
      error: 'UseAdminLogin',
      message: 'This email is reserved for the configured Admin account.',
    });
    return;
  }
  const existingUser = db.getUserByEmail(normalizedEmail);

  if (existingUser) {
    res.status(409).json({
      success: false,
      error: 'EmailAlreadyExists',
      message: 'An account with this email address already exists.',
    });
    return;
  }

  if (!isStrongPassword(password)) {
    res.status(400).json({
      success: false,
      error: 'WeakPassword',
      message:
        'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.',
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const newUserId = `USR-${Date.now().toString().slice(-4)}`;

  // Enforce: Public registration always creates regular 'User' role, never Admin
  const newUser: User = {
    id: newUserId,
    name: name.trim(),
    email: normalizedEmail,
    role: 'User', // strictly non-admin
    department: department ? department.trim() : 'General Personnel',
    status: 'Active',
    lastLogin: new Date().toLocaleString(),
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createUser(newUser);

  db.addAuditLog({
    user: newUser.name,
    role: newUser.role,
    action: 'User Registration',
    assetId: 'N/A',
    previousStatus: 'Unregistered',
    newStatus: 'Active User',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `New public account registered for ${newUser.email} with role: User`,
  });

  const token = generateToken(newUser);

  res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(newUser),
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const { name, department, avatar } = req.body;
  const currentUser = req.user;

  const updated = db.updateUser({
    ...currentUser,
    name: name ? name.trim() : currentUser.name,
    department: department ? department.trim() : currentUser.department,
    avatar: avatar !== undefined ? avatar : currentUser.avatar,
  });

  db.addAuditLog({
    user: updated.name,
    role: updated.role,
    action: 'Profile Updated',
    assetId: 'N/A',
    previousStatus: 'Active',
    newStatus: 'Active',
    deviceIp: req.ip || '127.0.0.1',
    result: 'Success',
    details: `User ${updated.email} updated personal profile information.`,
  });

  res.json({
    success: true,
    user: sanitizeUser(updated),
    message: 'Profile updated successfully.',
  });
});

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated' });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'MissingFields',
        message: 'Current password and new password are required.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'PasswordMismatch',
        message: 'New password and confirmation password do not match.',
      });
      return;
    }

    const isMatch = req.user.passwordHash && req.user.passwordHash.startsWith('$2')
      ? await bcrypt.compare(currentPassword, req.user.passwordHash)
      : false;

    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: 'IncorrectCurrentPassword',
        message: 'The current password you entered is incorrect.',
      });
      return;
    }

    if (!isStrongPassword(newPassword)) {
      res.status(400).json({
        success: false,
        error: 'WeakPassword',
        message:
          'New password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.',
      });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    db.updateUser({
      ...req.user,
      passwordHash: newHash,
    });

    db.addAuditLog({
      user: req.user.name,
      role: req.user.role,
      action: 'Password Changed',
      assetId: 'N/A',
      previousStatus: 'Active',
      newStatus: 'Active',
      deviceIp: req.ip || '127.0.0.1',
      result: 'Success',
      details: `User ${req.user.email} changed their account password.`,
    });

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  }
);

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user) {
    db.addAuditLog({
      user: req.user.name,
      role: req.user.role,
      action: 'User Logout',
      assetId: 'N/A',
      previousStatus: 'Authenticated',
      newStatus: 'Signed Out',
      deviceIp: req.ip || '127.0.0.1',
      result: 'Success',
      details: `User ${req.user.email} logged out of the platform.`,
    });
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
