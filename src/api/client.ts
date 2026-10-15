import {
  User,
  ITAsset,
  ComplianceRule,
  CertificateOfDestruction,
  AuditLogEntry,
  AppNotification,
  OrganizationSettings,
  UserRole,
} from '../types';

const TOKEN_KEY = 'aegis_auth_token';
const API_BASE = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, '') : '') + '/api';

export class ApiError extends Error {
  public status: number;
  public errorKey?: string;

  constructor(message: string, status: number, errorKey?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorKey = errorKey;
  }
}

class ApiClient {
  private token: string | null = null;
  private onUnauthorizedCallback?: () => void;

  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }

  public setOnUnauthorized(cb: () => void): void {
    this.onUnauthorizedCallback = cb;
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  public setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  public clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        if (this.onUnauthorizedCallback) {
          this.onUnauthorizedCallback();
        }
      }
      const message = (data && (data.message || data.error)) || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, data?.error);
    }

    return data as T;
  }

  // --- Auth ---
  public async googleAuthStatus(): Promise<{ success: boolean; googleAuthEnabled: boolean; message: string }> {
    return this.request<{ success: boolean; googleAuthEnabled: boolean; message: string }>('/auth/google/status');
  }

  public async login(email: string, password: string): Promise<{ success: boolean; token: string; user: User }> {
    const res = await this.request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  public async adminLogin(identifier: string, password: string): Promise<{ success: boolean; token: string; user: User }> {
    const res = await this.request<{ success: boolean; token: string; user: User }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setToken(res.token);
    return res;
  }

  public async register(payload: {
    name: string;
    email: string;
    password: string;
    department?: string;
  }): Promise<{ success: boolean; token: string; user: User }> {
    const res = await this.request<{ success: boolean; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.token);
    return res;
  }

  public async getMe(): Promise<{ success: boolean; user: User }> {
    return this.request<{ success: boolean; user: User }>('/auth/me');
  }

  public async updateProfile(payload: { name?: string; department?: string; avatar?: string }): Promise<{ success: boolean; user: User; message: string }> {
    return this.request<{ success: boolean; user: User; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearToken();
    }
  }

  // --- Users (Admin) ---
  public async getUsers(params?: { search?: string; role?: string; status?: string }): Promise<{ success: boolean; users: User[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; users: User[] }>(`/users${query ? `?${query}` : ''}`);
  }

  public async createUser(payload: {
    name: string;
    email: string;
    role: UserRole;
    department: string;
    password?: string;
  }): Promise<{ success: boolean; user: User; message: string }> {
    return this.request<{ success: boolean; user: User; message: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateUser(id: string, payload: Partial<User>): Promise<{ success: boolean; user: User; message: string }> {
    return this.request<{ success: boolean; user: User; message: string }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async toggleUserStatus(id: string): Promise<{ success: boolean; user: User; message: string }> {
    return this.request<{ success: boolean; user: User; message: string }>(`/users/${id}/status`, {
      method: 'PUT',
    });
  }

  public async changeUserRole(id: string, role: UserRole): Promise<{ success: boolean; user: User; message: string }> {
    return this.request<{ success: boolean; user: User; message: string }>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  public async getUserActivity(id: string): Promise<{ success: boolean; user: User; assets: ITAsset[]; disposalRequests: any[] }> {
    return this.request<{ success: boolean; user: User; assets: ITAsset[]; disposalRequests: any[] }>(`/users/${id}/activity`);
  }

  // --- Assets ---
  public async getAssets(params?: Record<string, string>): Promise<{ success: boolean; assets: ITAsset[]; count: number }> {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request<{ success: boolean; assets: ITAsset[]; count: number }>(`/assets${query ? `?${query}` : ''}`);
  }

  public async getAssetById(id: string): Promise<{ success: boolean; asset: ITAsset }> {
    return this.request<{ success: boolean; asset: ITAsset }>(`/assets/${id}`);
  }

  public async registerAsset(payload: Partial<ITAsset>): Promise<{ success: boolean; asset: ITAsset; message: string }> {
    return this.request<{ success: boolean; asset: ITAsset; message: string }>('/assets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateAsset(id: string, payload: Partial<ITAsset>): Promise<{ success: boolean; asset: ITAsset; message: string }> {
    return this.request<{ success: boolean; asset: ITAsset; message: string }>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async finalizeDisposal(id: string, vendor?: string, methodDetail?: string): Promise<{ success: boolean; asset: ITAsset; message: string }> {
    return this.request<{ success: boolean; asset: ITAsset; message: string }>(`/assets/${id}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ vendor, methodDetail }),
    });
  }

  // --- Disposal Requests ---
  public async getDisposalRequests(params?: Record<string, string>): Promise<{ success: boolean; requests: any[]; count: number }> {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request<{ success: boolean; requests: any[]; count: number }>(`/disposal-requests${query ? `?${query}` : ''}`);
  }

  public async submitDisposalRequest(payload: {
    assetId: string;
    reason: string;
    condition?: string;
    priority?: string;
    notes?: string;
  }): Promise<{ success: boolean; request: any; message: string }> {
    return this.request<{ success: boolean; request: any; message: string }>('/disposal-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async approveDisposalRequest(id: string): Promise<{ success: boolean; request: any; message: string }> {
    return this.request<{ success: boolean; request: any; message: string }>(`/disposal-requests/${id}/approve`, {
      method: 'POST',
    });
  }

  public async rejectDisposalRequest(id: string, reason: string): Promise<{ success: boolean; request: any; message: string }> {
    return this.request<{ success: boolean; request: any; message: string }>(`/disposal-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // --- Wiping ---
  public async getWipingRecords(): Promise<{ success: boolean; records: any[] }> {
    return this.request<{ success: boolean; records: any[] }>('/wiping/records');
  }

  public async startWiping(assetId: string, method?: string, technician?: string, tool?: string): Promise<{ success: boolean; message: string; record: any }> {
    return this.request<{ success: boolean; message: string; record: any }>('/wiping/start', {
      method: 'POST',
      body: JSON.stringify({ assetId, method, technician, tool }),
    });
  }

  public async completeWiping(assetId: string, passed: boolean, logs?: string[]): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/wiping/complete', {
      method: 'POST',
      body: JSON.stringify({ assetId, passed, logs }),
    });
  }

  // --- Verification ---
  public async getVerificationRecords(): Promise<{ success: boolean; records: any[] }> {
    return this.request<{ success: boolean; records: any[] }>('/verification/records');
  }

  public async verifyWiping(assetId: string, passed: boolean, notes?: string): Promise<{ success: boolean; message: string; record: any }> {
    return this.request<{ success: boolean; message: string; record: any }>('/verification/verify', {
      method: 'POST',
      body: JSON.stringify({ assetId, passed, notes }),
    });
  }

  // --- Compliance ---
  public async getComplianceRules(): Promise<{ success: boolean; rules: ComplianceRule[] }> {
    return this.request<{ success: boolean; rules: ComplianceRule[] }>('/compliance/rules');
  }

  public async toggleComplianceRule(ruleId: string, active: boolean): Promise<{ success: boolean; rule: ComplianceRule }> {
    return this.request<{ success: boolean; rule: ComplianceRule }>('/compliance/toggle', {
      method: 'POST',
      body: JSON.stringify({ ruleId, active }),
    });
  }

  // --- Certificates ---
  public async getCertificates(params?: Record<string, string>): Promise<{ success: boolean; certificates: CertificateOfDestruction[] }> {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request<{ success: boolean; certificates: CertificateOfDestruction[] }>(`/certificates${query ? `?${query}` : ''}`);
  }

  public async getCertificateById(id: string): Promise<{ success: boolean; certificate: CertificateOfDestruction; asset?: ITAsset }> {
    return this.request<{ success: boolean; certificate: CertificateOfDestruction; asset?: ITAsset }>(`/certificates/${id}`);
  }

  public async generateCertificate(assetId: string, notes?: string): Promise<{ success: boolean; certificate: CertificateOfDestruction; message: string }> {
    return this.request<{ success: boolean; certificate: CertificateOfDestruction; message: string }>('/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({ assetId, notes }),
    });
  }

  // --- Audit Logs ---
  public async getAuditLogs(params?: Record<string, string>): Promise<{ success: boolean; logs: AuditLogEntry[] }> {
    const query = params ? new URLSearchParams(params).toString() : '';
    return this.request<{ success: boolean; logs: AuditLogEntry[] }>(`/audit-logs${query ? `?${query}` : ''}`);
  }

  // --- Notifications ---
  public async getNotifications(): Promise<{ success: boolean; notifications: AppNotification[] }> {
    return this.request<{ success: boolean; notifications: AppNotification[] }>('/notifications');
  }

  public async markNotificationRead(id: string): Promise<void> {
    await this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  public async markAllNotificationsRead(): Promise<void> {
    await this.request('/notifications/read-all', { method: 'PUT' });
  }

  // --- Dashboard Stats ---
  public async getDashboardStats(): Promise<any> {
    return this.request('/dashboard/stats');
  }

  // --- Settings ---
  public async getSettings(): Promise<{ success: boolean; settings: OrganizationSettings }> {
    return this.request<{ success: boolean; settings: OrganizationSettings }>('/settings');
  }

  public async updateSettings(settings: Partial<OrganizationSettings>): Promise<{ success: boolean; settings: OrganizationSettings; message: string }> {
    return this.request<{ success: boolean; settings: OrganizationSettings; message: string }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  public async resetToDemoData(): Promise<void> {
    await this.request('/settings/reset', { method: 'POST' });
  }
}

export const api = new ApiClient();
