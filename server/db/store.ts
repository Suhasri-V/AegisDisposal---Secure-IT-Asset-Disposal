import fs from 'fs';
import path from 'path';
import {
  User,
  ITAsset,
  ComplianceRule,
  CertificateOfDestruction,
  AuditLogEntry,
  AppNotification,
  OrganizationSettings,
  DisposalRequest,
  WipingRecord,
  VerificationRecord,
} from './types';
import {
  INITIAL_ASSETS,
  INITIAL_USERS,
  INITIAL_COMPLIANCE_RULES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_CERTIFICATES,
} from '../../src/data/initialData';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) {
    atomicWriteJson(filePath, defaultValue);
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Error reading ${filename}, falling back to default:`, error);
    return defaultValue;
  }
}

function atomicWriteJson<T>(filePath: string, data: T): void {
  ensureDataDir();
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

function writeJsonFile<T>(filename: string, data: T): void {
  const filePath = getFilePath(filename);
  atomicWriteJson(filePath, data);
}

// ---------------------------------------------------------------------------
// Pre-computed Bcrypt (cost=12) hashes for seed accounts
// USR-01 sarah.chen@aegisdefense.io     password: AegisManager!2026
// USR-02 m.vance@aegisdefense.io        password: AegisUser!2026
// USR-03 elena.rostova@aegisdefense.io  password: AegisCompliance!2026
// USR-04 d.reynolds@aegisdefense.io     password: AegisManager!2026
// USR-05 tanya.m@thirdpartyaudit.com    password: AegisAuditor!2026
// USR-06 user@aegisdefense.io           password: AegisUser!2026
//
// SECURITY: suhasi271426@gmail.com is the ONLY authorized admin.
// Admin credentials must be configured via ADMIN_PASSWORD_HASH in .env or initialized securely.
// Google Sign-In NEVER grants Admin role. Admin requires email+password only.
// ---------------------------------------------------------------------------
const SEED_USERS: User[] = [
  {
    id: 'USR-00',
    name: 'AegisDisposal Administrator',
    email: 'admin@aegisdisposal.local',
    role: 'Admin',
    department: 'System Administration',
    status: 'Active',
    lastLogin: 'Never',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'USR-01',
    name: 'Sarah Chen, CISSP',
    email: 'sarah.chen@aegisdefense.io',
    role: 'Manager',
    department: 'Cybersecurity & Infrastructure',
    status: 'Active',
    lastLogin: '2026-09-30 06:45 AM',
    passwordHash: '$2b$12$EqIasYbiJ58jWb9lUEbi..57jAANZ0YudjbojefGDDEzKW8WqiQWW',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-09-30T06:45:00Z',
  },
  {
    id: 'USR-02',
    name: 'Marcus Vance',
    email: 'm.vance@aegisdefense.io',
    role: 'User',
    department: 'Hardware Operations',
    status: 'Active',
    lastLogin: '2026-09-30 06:12 AM',
    passwordHash: '$2b$12$PVach15G1Fz3sTieTu8LfeYYT4yUwGr2JeCTrZfcwIEyvX5ZeRERS',
    createdAt: '2026-01-15T09:30:00Z',
    updatedAt: '2026-09-30T06:12:00Z',
  },
  {
    id: 'USR-03',
    name: 'Elena Rostova, CISA',
    email: 'elena.rostova@aegisdefense.io',
    role: 'Compliance Officer',
    department: 'Governance, Risk & Compliance',
    status: 'Active',
    lastLogin: '2026-09-29 04:30 PM',
    passwordHash: '$2b$12$TvVdz9HgMZ3cZrn14r4j.uThGPwEaaEC7xEigxOMPzX/H/1962Gtu',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-09-29T16:30:00Z',
  },
  {
    id: 'USR-04',
    name: 'David K. Reynolds',
    email: 'd.reynolds@aegisdefense.io',
    role: 'Manager',
    department: 'Enterprise IT Services',
    status: 'Active',
    lastLogin: '2026-09-30 05:20 AM',
    passwordHash: '$2b$12$u.wj5aZ.myQl2MYGxWDYA.0zsX2ifw9zjDCZkFWYkzqqrX3MRunHC',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-09-30T05:20:00Z',
  },
  {
    id: 'USR-05',
    name: 'Tanya Morales',
    email: 'tanya.m@thirdpartyaudit.com',
    role: 'Auditor',
    department: 'External Assurance',
    status: 'Active',
    lastLogin: '2026-09-28 02:15 PM',
    passwordHash: '$2b$12$bqWkZQXEgmkV8GvfhAItmOgjlsS5zxCWxVSGG4PhE6e8Fz.8HtrJK',
    createdAt: '2026-03-01T14:00:00Z',
    updatedAt: '2026-09-28T14:15:00Z',
  },
  {
    id: 'USR-06',
    name: 'Alex Taylor (Standard User)',
    email: 'user@aegisdefense.io',
    role: 'User',
    department: 'Software Engineering',
    status: 'Active',
    lastLogin: '2026-10-01 09:00 AM',
    passwordHash: '$2b$12$ysODgBecMqxL/SgeBzzQsOFIOfGT15CEkz3jteQJP3G8CR5rd2G/C',
    createdAt: '2026-03-15T09:00:00Z',
    updatedAt: '2026-10-01T09:00:00Z',
  },
];

// Helper to seed initial disposal requests from initial assets
function deriveInitialDisposalRequests(assets: ITAsset[]): DisposalRequest[] {
  const requests: DisposalRequest[] = [];
  assets.forEach((asset, idx) => {
    if (asset.disposalReason || ['Pending Approval', 'Approved', 'Rejected', 'Wiping In Progress', 'Wiped', 'Verification Pending', 'Ready For Disposal', 'Disposed'].includes(asset.disposalStatus)) {
      requests.push({
        id: `REQ-${1000 + idx}`,
        assetId: asset.id,
        userId: asset.userId || 'USR-02',
        requestedBy: asset.requestedBy || asset.assignedEmployee || 'Marcus Vance',
        department: asset.department,
        reason: asset.disposalReason || 'Routine hardware replacement / End of Life',
        condition: asset.assetCondition || 'Working',
        priority: asset.priority || 'Medium',
        notes: `Automated lifecycle request for ${asset.brand} ${asset.model}`,
        status: asset.disposalStatus === 'Pending Approval' ? 'Pending Approval' : asset.disposalStatus === 'Rejected' ? 'Rejected' : 'Approved',
        requestedDate: asset.requestedDate || '2026-09-20',
        approvedBy: asset.approvedBy,
        approvalDate: asset.approvalDate,
        rejectionReason: asset.rejectionReason,
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-25T12:00:00Z',
      });
    }
  });
  return requests;
}

// Helper to seed initial wiping records
function deriveInitialWipingRecords(assets: ITAsset[]): WipingRecord[] {
  const records: WipingRecord[] = [];
  assets.forEach((asset, idx) => {
    if (asset.wipingMethod || asset.wipingStatus) {
      records.push({
        id: `WIPE-${1000 + idx}`,
        assetId: asset.id,
        wipingMethod: asset.wipingMethod || 'NIST 800-88 Rev 1 Purge',
        wipingTool: asset.wipingTool || 'Blancco Drive Eraser v7.14',
        technician: asset.technician || 'Marcus Vance',
        startTime: asset.wipingStartTime || '2026-09-22 09:00',
        endTime: asset.wipingEndTime,
        passes: asset.wipingPasses || 3,
        status: asset.wipingStatus || 'Completed',
        logs: asset.wipeLogOutput || [
          `Initializing target device ${asset.serialNumber}...`,
          `Applied sanitization pattern: ${asset.wipingMethod || 'NIST 800-88 Purge'}`,
          `Verification pass confirmed zero residuals.`,
        ],
        createdAt: '2026-09-22T09:00:00Z',
      });
    }
  });
  return records;
}

// Helper to seed initial verifications
function deriveInitialVerifications(assets: ITAsset[]): VerificationRecord[] {
  const verifications: VerificationRecord[] = [];
  assets.forEach((asset, idx) => {
    if (asset.verifiedBy || asset.verificationResult) {
      verifications.push({
        id: `VER-${1000 + idx}`,
        assetId: asset.id,
        verifiedBy: asset.verifiedBy || 'Elena Rostova, CISA',
        verificationDate: asset.verificationDate || '2026-09-23',
        verificationResult: asset.verificationResult || 'Passed',
        verificationNotes: asset.verificationNotes || 'Complete optical inspection and hex sector verification passed.',
        createdAt: '2026-09-23T14:00:00Z',
      });
    }
  });
  return verifications;
}

class DatabaseStore {
  private initialized = false;

  public initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    ensureDataDir();

    // 1. Users
    if (!fs.existsSync(getFilePath('users.json'))) {
      writeJsonFile('users.json', SEED_USERS);
    }

    // 2. Assets
    if (!fs.existsSync(getFilePath('assets.json'))) {
      // Ensure initial assets have appropriate user mappings
      const seededAssets = INITIAL_ASSETS.map((a) => {
        const isVance = a.assignedEmployee.includes('Vance');
        return {
          ...a,
          userId: isVance ? 'USR-02' : undefined,
        };
      });
      writeJsonFile('assets.json', seededAssets);
    }

    const currentAssets = readJsonFile<ITAsset[]>('assets.json', INITIAL_ASSETS);

    // 3. Disposal Requests
    if (!fs.existsSync(getFilePath('disposal_requests.json'))) {
      writeJsonFile('disposal_requests.json', deriveInitialDisposalRequests(currentAssets));
    }

    // 4. Wiping Records
    if (!fs.existsSync(getFilePath('wiping_records.json'))) {
      writeJsonFile('wiping_records.json', deriveInitialWipingRecords(currentAssets));
    }

    // 5. Verifications
    if (!fs.existsSync(getFilePath('verifications.json'))) {
      writeJsonFile('verifications.json', deriveInitialVerifications(currentAssets));
    }

    // 6. Compliance Rules
    if (!fs.existsSync(getFilePath('compliance.json'))) {
      writeJsonFile('compliance.json', INITIAL_COMPLIANCE_RULES);
    }

    // 7. Certificates
    if (!fs.existsSync(getFilePath('certificates.json'))) {
      writeJsonFile('certificates.json', INITIAL_CERTIFICATES);
    }

    // 8. Audit Logs
    if (!fs.existsSync(getFilePath('audit_logs.json'))) {
      writeJsonFile('audit_logs.json', INITIAL_AUDIT_LOGS);
    }

    // 9. Notifications
    if (!fs.existsSync(getFilePath('notifications.json'))) {
      writeJsonFile('notifications.json', INITIAL_NOTIFICATIONS);
    }

    // 10. Settings
    if (!fs.existsSync(getFilePath('settings.json'))) {
      writeJsonFile('settings.json', {
        ...INITIAL_SETTINGS,
        registrationEnabled: true,
        publicRegistrationEnabled: true,
      });
    }

    this.initialized = true;
  }

  // --- Users ---
  public getUsers(): User[] {
    this.initialize();
    return readJsonFile<User[]>('users.json', SEED_USERS);
  }

  public saveUsers(users: User[]): void {
    writeJsonFile('users.json', users);
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    return this.getUsers().find((u) => u.email.trim().toLowerCase() === normalized);
  }

  public getUserByGoogleId(googleId: string): User | undefined {
    return this.getUsers().find((u) => u.googleId === googleId);
  }

  public createUser(user: User): User {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
    return user;
  }

  public updateUser(user: User): User {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...user, updatedAt: new Date().toISOString() };
      this.saveUsers(users);
      return users[index];
    }
    return user;
  }

  public deleteUser(id: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length !== users.length) {
      this.saveUsers(filtered);
      return true;
    }
    return false;
  }

  // --- Assets ---
  public getAssets(): ITAsset[] {
    this.initialize();
    return readJsonFile<ITAsset[]>('assets.json', INITIAL_ASSETS);
  }

  public saveAssets(assets: ITAsset[]): void {
    writeJsonFile('assets.json', assets);
  }

  public getAssetById(id: string): ITAsset | undefined {
    return this.getAssets().find((a) => a.id === id);
  }

  public createAsset(asset: ITAsset): ITAsset {
    const assets = this.getAssets();
    assets.unshift(asset);
    this.saveAssets(assets);
    return asset;
  }

  public updateAsset(asset: ITAsset): ITAsset {
    const assets = this.getAssets();
    const index = assets.findIndex((a) => a.id === asset.id);
    if (index !== -1) {
      assets[index] = { ...assets[index], ...asset };
      this.saveAssets(assets);
      return assets[index];
    }
    return asset;
  }

  public deleteAsset(id: string): boolean {
    const assets = this.getAssets();
    const filtered = assets.filter((a) => a.id !== id);
    if (filtered.length !== assets.length) {
      this.saveAssets(filtered);
      return true;
    }
    return false;
  }

  // --- Disposal Requests ---
  public getDisposalRequests(): DisposalRequest[] {
    this.initialize();
    return readJsonFile<DisposalRequest[]>('disposal_requests.json', []);
  }

  public saveDisposalRequests(requests: DisposalRequest[]): void {
    writeJsonFile('disposal_requests.json', requests);
  }

  public getDisposalRequestById(id: string): DisposalRequest | undefined {
    return this.getDisposalRequests().find((r) => r.id === id);
  }

  public createDisposalRequest(req: DisposalRequest): DisposalRequest {
    const requests = this.getDisposalRequests();
    requests.unshift(req);
    this.saveDisposalRequests(requests);
    return req;
  }

  public updateDisposalRequest(req: DisposalRequest): DisposalRequest {
    const requests = this.getDisposalRequests();
    const index = requests.findIndex((r) => r.id === req.id);
    if (index !== -1) {
      requests[index] = { ...requests[index], ...req, updatedAt: new Date().toISOString() };
      this.saveDisposalRequests(requests);
      return requests[index];
    }
    return req;
  }

  // --- Wiping Records ---
  public getWipingRecords(): WipingRecord[] {
    this.initialize();
    return readJsonFile<WipingRecord[]>('wiping_records.json', []);
  }

  public saveWipingRecords(records: WipingRecord[]): void {
    writeJsonFile('wiping_records.json', records);
  }

  public createWipingRecord(record: WipingRecord): WipingRecord {
    const records = this.getWipingRecords();
    records.unshift(record);
    this.saveWipingRecords(records);
    return record;
  }

  public updateWipingRecord(record: WipingRecord): WipingRecord {
    const records = this.getWipingRecords();
    const index = records.findIndex((r) => r.id === record.id);
    if (index !== -1) {
      records[index] = { ...records[index], ...record };
      this.saveWipingRecords(records);
      return records[index];
    }
    return record;
  }

  // --- Verifications ---
  public getVerifications(): VerificationRecord[] {
    this.initialize();
    return readJsonFile<VerificationRecord[]>('verifications.json', []);
  }

  public saveVerifications(records: VerificationRecord[]): void {
    writeJsonFile('verifications.json', records);
  }

  public createVerification(record: VerificationRecord): VerificationRecord {
    const records = this.getVerifications();
    records.unshift(record);
    this.saveVerifications(records);
    return record;
  }

  // --- Compliance Rules ---
  public getComplianceRules(): ComplianceRule[] {
    this.initialize();
    return readJsonFile<ComplianceRule[]>('compliance.json', INITIAL_COMPLIANCE_RULES);
  }

  public saveComplianceRules(rules: ComplianceRule[]): void {
    writeJsonFile('compliance.json', rules);
  }

  public updateComplianceRule(ruleId: string, active: boolean): ComplianceRule | undefined {
    const rules = this.getComplianceRules();
    const index = rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      rules[index].active = active;
      this.saveComplianceRules(rules);
      return rules[index];
    }
    return undefined;
  }

  // --- Certificates ---
  public getCertificates(): CertificateOfDestruction[] {
    this.initialize();
    return readJsonFile<CertificateOfDestruction[]>('certificates.json', INITIAL_CERTIFICATES);
  }

  public saveCertificates(certs: CertificateOfDestruction[]): void {
    writeJsonFile('certificates.json', certs);
  }

  public getCertificateById(id: string): CertificateOfDestruction | undefined {
    return this.getCertificates().find((c) => c.certificateId === id);
  }

  public createCertificate(cert: CertificateOfDestruction): CertificateOfDestruction {
    const certs = this.getCertificates();
    certs.unshift(cert);
    this.saveCertificates(certs);
    return cert;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLogEntry[] {
    this.initialize();
    return readJsonFile<AuditLogEntry[]>('audit_logs.json', INITIAL_AUDIT_LOGS);
  }

  public saveAuditLogs(logs: AuditLogEntry[]): void {
    writeJsonFile('audit_logs.json', logs);
  }

  public addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }): AuditLogEntry {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: entry.timestamp || new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    logs.unshift(newEntry);
    this.saveAuditLogs(logs);
    return newEntry;
  }

  // --- Notifications ---
  public getNotifications(): AppNotification[] {
    this.initialize();
    return readJsonFile<AppNotification[]>('notifications.json', INITIAL_NOTIFICATIONS);
  }

  public saveNotifications(notifications: AppNotification[]): void {
    writeJsonFile('notifications.json', notifications);
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const notifications = this.getNotifications();
    const newNotif: AppNotification = {
      ...notification,
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    notifications.unshift(newNotif);
    this.saveNotifications(notifications);
    return newNotif;
  }

  public markNotificationAsRead(id: string): void {
    const notifications = this.getNotifications();
    const target = notifications.find((n) => n.id === id);
    if (target) {
      target.read = true;
      this.saveNotifications(notifications);
    }
  }

  public markAllNotificationsAsRead(userId?: string): void {
    const notifications = this.getNotifications();
    notifications.forEach((n) => {
      n.read = true;
    });
    this.saveNotifications(notifications);
  }

  // --- Settings ---
  public getSettings(): OrganizationSettings {
    this.initialize();
    return readJsonFile<OrganizationSettings>('settings.json', {
      ...INITIAL_SETTINGS,
      registrationEnabled: true,
      publicRegistrationEnabled: true,
    });
  }

  public updateSettings(newSettings: Partial<OrganizationSettings>): OrganizationSettings {
    const current = this.getSettings();
    const merged = { ...current, ...newSettings };
    writeJsonFile('settings.json', merged);
    return merged;
  }

  // --- Reset to Demo Data ---
  public resetToDemoData(): void {
    writeJsonFile('users.json', SEED_USERS);
    writeJsonFile('assets.json', INITIAL_ASSETS);
    writeJsonFile('disposal_requests.json', deriveInitialDisposalRequests(INITIAL_ASSETS));
    writeJsonFile('wiping_records.json', deriveInitialWipingRecords(INITIAL_ASSETS));
    writeJsonFile('verifications.json', deriveInitialVerifications(INITIAL_ASSETS));
    writeJsonFile('compliance.json', INITIAL_COMPLIANCE_RULES);
    writeJsonFile('certificates.json', INITIAL_CERTIFICATES);
    writeJsonFile('audit_logs.json', INITIAL_AUDIT_LOGS);
    writeJsonFile('notifications.json', INITIAL_NOTIFICATIONS);
    writeJsonFile('settings.json', {
      ...INITIAL_SETTINGS,
      registrationEnabled: true,
      publicRegistrationEnabled: true,
    });
  }
}

export const db = new DatabaseStore();
