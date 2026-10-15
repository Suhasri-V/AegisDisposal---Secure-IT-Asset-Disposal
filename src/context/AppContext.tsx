import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ITAsset,
  User,
  ComplianceRule,
  AuditLogEntry,
  AppNotification,
  OrganizationSettings,
  CertificateOfDestruction,
  WipingMethod,
  Priority,
  UserRole,
} from '../types';
import { api, ApiError } from '../api/client';
import {
  INITIAL_ASSETS,
  INITIAL_USERS,
  INITIAL_COMPLIANCE_RULES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_CERTIFICATES,
} from '../data/initialData';

interface AppContextType {
  assets: ITAsset[];
  users: User[];
  currentUser: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setCurrentUser: (user: User) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string; user?: User }>;
  loginAdmin: (identifier: string, password: string) => Promise<{ ok: boolean; message?: string; user?: User }>;
  completeGoogleLogin: (token: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  registerUser: (payload: {
    name: string;
    email: string;
    password: string;
    department: string;
    role?: UserRole;
  }) => Promise<{ ok: boolean; message?: string; user?: User }>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<{ ok: boolean; message: string }>;
  updateProfile: (payload: { name?: string; department?: string; avatar?: string }) => Promise<{ ok: boolean; message: string }>;
  hasPermission: (requiredRoles: UserRole | UserRole[]) => boolean;
  complianceRules: ComplianceRule[];
  auditLogs: AuditLogEntry[];
  notifications: AppNotification[];
  certificates: CertificateOfDestruction[];
  settings: OrganizationSettings;
  dashboardStats: any;
  refreshData: () => Promise<void>;

  // Asset CRUD & Workflow
  addAsset: (asset: Omit<ITAsset, 'id' | 'lifecycleStage' | 'disposalStatus' | 'complianceStatus' | 'completedRequirements' | 'missingRequirements' | 'riskLevel' | 'lastComplianceCheck'>) => Promise<ITAsset>;
  updateAsset: (asset: ITAsset) => Promise<void>;
  requestDisposal: (assetId: string, reason: string, condition: ITAsset['assetCondition'], priority: Priority, notes?: string) => Promise<void>;
  approveDisposal: (assetId: string) => Promise<void>;
  rejectDisposal: (assetId: string, reason: string) => Promise<void>;
  startWiping: (assetId: string, method: WipingMethod, technician: string, tool: string) => Promise<void>;
  completeWiping: (assetId: string, passed: boolean, logs: string[]) => Promise<void>;
  verifyWiping: (assetId: string, passed: boolean, notes: string) => Promise<void>;
  generateCertificate: (assetId: string, notes?: string) => Promise<CertificateOfDestruction>;
  finalizeDisposal: (assetId: string, vendor: string, methodDetail: string) => Promise<void>;

  // Compliance rules
  toggleComplianceRule: (ruleId: string) => Promise<void>;

  // Notifications
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Users
  addUser: (user: Omit<User, 'id' | 'lastLogin'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;

  // Settings
  updateSettings: (newSettings: OrganizationSettings) => Promise<void>;
  resetToDemoData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('aegis_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_USERS[0];
      }
    }
    return INITIAL_USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('aegis_auth_token'));
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [assets, setAssets] = useState<ITAsset[]>(INITIAL_ASSETS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>(INITIAL_COMPLIANCE_RULES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [certificates, setCertificates] = useState<CertificateOfDestruction[]>(INITIAL_CERTIFICATES);
  const [settings, setSettings] = useState<OrganizationSettings>(INITIAL_SETTINGS);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Load all data from backend
  const refreshData = useCallback(async () => {
    if (!api.getToken()) return;

    try {
      setIsLoading(true);
      setError(null);

      // 1. Assets & Notifications (accessible to all authenticated roles)
      const [assetsRes, notifsRes, certsRes, rulesRes, settingsRes, statsRes] = await Promise.allSettled([
        api.getAssets(),
        api.getNotifications(),
        api.getCertificates(),
        api.getComplianceRules(),
        api.getSettings(),
        api.getDashboardStats(),
      ]);

      if (assetsRes.status === 'fulfilled') setAssets(assetsRes.value.assets);
      if (notifsRes.status === 'fulfilled') setNotifications(notifsRes.value.notifications);
      if (certsRes.status === 'fulfilled') setCertificates(certsRes.value.certificates);
      if (rulesRes.status === 'fulfilled') setComplianceRules(rulesRes.value.rules);
      if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value.settings);
      if (statsRes.status === 'fulfilled') setDashboardStats(statsRes.value);

      // 2. Admin-only endpoints
      if (currentUser && currentUser.role === 'Admin') {
        const [usersRes, logsRes] = await Promise.allSettled([
          api.getUsers(),
          api.getAuditLogs(),
        ]);
        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users);
        if (logsRes.status === 'fulfilled') setAuditLogs(logsRes.value.logs);
      }
    } catch (err: any) {
      console.warn('Could not fully synchronize with backend API:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Initial session hydration
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api
        .getMe()
        .then((res) => {
          if (res.user) {
            setCurrentUser(res.user);
            setIsAuthenticated(true);
            localStorage.setItem('aegis_current_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          // Token expired or invalid
          api.clearToken();
          setIsAuthenticated(false);
          localStorage.removeItem('aegis_current_user');
        });
    }

    api.setOnUnauthorized(() => {
      setIsAuthenticated(false);
      localStorage.removeItem('aegis_current_user');
    });
  }, []);

  // Fetch data whenever authentication or current user changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; message?: string; user?: User }> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.login(email, password);

      if (res.success && res.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        localStorage.setItem('aegis_current_user', JSON.stringify(res.user));
        return { ok: true, user: res.user };
      }
      return { ok: false, message: 'Invalid credentials or login failed.' };
    } catch (err: any) {
      const msg = err.message || 'Unable to sign in to the platform.';
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const loginAdmin = async (
    identifier: string,
    password: string
  ): Promise<{ ok: boolean; message?: string; user?: User }> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.adminLogin(identifier, password);
      if (res.success && res.user?.role === 'Admin') {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        localStorage.setItem('aegis_current_user', JSON.stringify(res.user));
        return { ok: true, user: res.user };
      }
      api.clearToken();
      return { ok: false, message: 'This account is not authorized for Admin access.' };
    } catch (err: any) {
      const msg = err.message || 'Unable to sign in to the Admin portal.';
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const completeGoogleLogin = async (token: string): Promise<{ ok: boolean; message?: string }> => {
    try {
      api.setToken(token);
      const res = await api.getMe();
      if (res.user.role !== 'User') {
        api.clearToken();
        return { ok: false, message: 'Google sign-in is available only for standard User accounts.' };
      }
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      localStorage.setItem('aegis_current_user', JSON.stringify(res.user));
      return { ok: true };
    } catch (err: any) {
      api.clearToken();
      const msg = err.message || 'Unable to complete Google sign-in.';
      setError(msg);
      return { ok: false, message: msg };
    }
  };

  const logout = () => {
    void api.logout();
    setIsAuthenticated(false);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.removeItem('aegis_current_user');
  };

  const registerUser = async (payload: {
    name: string;
    email: string;
    password: string;
    department: string;
    role?: UserRole;
  }): Promise<{ ok: boolean; message?: string; user?: User }> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.register({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        department: payload.department,
      });

      if (res.success && res.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        localStorage.setItem('aegis_current_user', JSON.stringify(res.user));
        return { ok: true, user: res.user };
      }
      return { ok: false, message: 'Registration failed.' };
    } catch (err: any) {
      const msg = err.message || 'Unable to create your account.';
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ ok: boolean; message: string }> => {
    try {
      const res = await api.changePassword(currentPassword, newPassword, confirmPassword);
      return { ok: true, message: res.message || 'Password changed successfully.' };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Failed to change password.' };
    }
  };

  const updateProfile = async (payload: {
    name?: string;
    department?: string;
    avatar?: string;
  }): Promise<{ ok: boolean; message: string }> => {
    try {
      const res = await api.updateProfile(payload);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('aegis_current_user', JSON.stringify(res.user));
        return { ok: true, message: res.message || 'Profile updated successfully.' };
      }
      return { ok: false, message: 'Failed to update profile.' };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Failed to update profile.' };
    }
  };

  const hasPermission = (requiredRoles: UserRole | UserRole[]): boolean => {
    if (!currentUser) return false;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(currentUser.role);
  };

  // Asset CRUD & Workflow
  const addAsset = async (
    assetPayload: Omit<
      ITAsset,
      | 'id'
      | 'lifecycleStage'
      | 'disposalStatus'
      | 'complianceStatus'
      | 'completedRequirements'
      | 'missingRequirements'
      | 'riskLevel'
      | 'lastComplianceCheck'
    >
  ): Promise<ITAsset> => {
    const res = await api.registerAsset(assetPayload);
    await refreshData();
    return res.asset;
  };

  const updateAsset = async (asset: ITAsset): Promise<void> => {
    await api.updateAsset(asset.id, asset);
    await refreshData();
  };

  const requestDisposal = async (
    assetId: string,
    reason: string,
    condition: ITAsset['assetCondition'] = 'Working',
    priority: Priority = 'Medium',
    notes?: string
  ): Promise<void> => {
    await api.submitDisposalRequest({
      assetId,
      reason,
      condition,
      priority,
      notes,
    });
    await refreshData();
  };

  const approveDisposal = async (assetId: string): Promise<void> => {
    // Find disposal request corresponding to assetId
    const requests = await api.getDisposalRequests({ assetId, status: 'Pending Approval' });
    const req = requests.requests && requests.requests.length > 0 ? requests.requests[0] : null;
    if (req) {
      await api.approveDisposalRequest(req.id);
    } else {
      // Direct approval fallback
      await api.approveDisposalRequest(assetId);
    }
    await refreshData();
  };

  const rejectDisposal = async (assetId: string, reason: string): Promise<void> => {
    const requests = await api.getDisposalRequests({ assetId, status: 'Pending Approval' });
    const req = requests.requests && requests.requests.length > 0 ? requests.requests[0] : null;
    if (req) {
      await api.rejectDisposalRequest(req.id, reason);
    } else {
      await api.rejectDisposalRequest(assetId, reason);
    }
    await refreshData();
  };

  const startWiping = async (
    assetId: string,
    method: WipingMethod,
    technician: string,
    tool: string
  ): Promise<void> => {
    await api.startWiping(assetId, method, technician, tool);
    await refreshData();
  };

  const completeWiping = async (assetId: string, passed: boolean, logs: string[]): Promise<void> => {
    await api.completeWiping(assetId, passed, logs);
    await refreshData();
  };

  const verifyWiping = async (assetId: string, passed: boolean, notes: string): Promise<void> => {
    await api.verifyWiping(assetId, passed, notes);
    await refreshData();
  };

  const generateCertificate = async (assetId: string, notes?: string): Promise<CertificateOfDestruction> => {
    const res = await api.generateCertificate(assetId, notes);
    await refreshData();
    return res.certificate;
  };

  const finalizeDisposal = async (assetId: string, vendor: string, methodDetail: string): Promise<void> => {
    await api.finalizeDisposal(assetId, vendor, methodDetail);
    await refreshData();
  };

  const toggleComplianceRule = async (ruleId: string): Promise<void> => {
    const current = complianceRules.find((r) => r.id === ruleId);
    if (!current) return;
    await api.toggleComplianceRule(ruleId, !current.active);
    await refreshData();
  };

  const markNotificationAsRead = async (id: string): Promise<void> => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await api.markNotificationRead(id);
  };

  const markAllNotificationsAsRead = async (): Promise<void> => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await api.markAllNotificationsRead();
  };

  const addUser = async (userPayload: Omit<User, 'id' | 'lastLogin'>): Promise<void> => {
    await api.createUser(userPayload);
    await refreshData();
  };

  const updateUser = async (user: User): Promise<void> => {
    await api.updateUser(user.id, user);
    await refreshData();
  };

  const toggleUserStatus = async (id: string): Promise<void> => {
    await api.toggleUserStatus(id);
    await refreshData();
  };

  const updateSettings = async (newSettings: OrganizationSettings): Promise<void> => {
    await api.updateSettings(newSettings);
    await refreshData();
  };

  const resetToDemoData = async (): Promise<void> => {
    await api.resetToDemoData();
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        assets,
        users,
        currentUser,
        isAuthenticated,
        isLoading,
        error,
        setCurrentUser,
        login,
        loginAdmin,
        completeGoogleLogin,
        logout,
        registerUser,
        changePassword,
        updateProfile,
        hasPermission,
        complianceRules,
        auditLogs,
        notifications,
        certificates,
        settings,
        dashboardStats,
        refreshData,
        addAsset,
        updateAsset,
        requestDisposal,
        approveDisposal,
        rejectDisposal,
        startWiping,
        completeWiping,
        verifyWiping,
        generateCertificate,
        finalizeDisposal,
        toggleComplianceRule,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addUser,
        updateUser,
        toggleUserStatus,
        updateSettings,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
