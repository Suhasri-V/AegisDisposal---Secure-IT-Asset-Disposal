import React, { createContext, useContext, useState, useEffect } from 'react';
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
  LifecycleStage,
  DisposalStatus,
  ComplianceStatus,
} from '../types';
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
  setCurrentUser: (user: User) => void;
  complianceRules: ComplianceRule[];
  auditLogs: AuditLogEntry[];
  notifications: AppNotification[];
  certificates: CertificateOfDestruction[];
  settings: OrganizationSettings;

  // Asset CRUD & Workflow
  addAsset: (asset: Omit<ITAsset, 'id' | 'lifecycleStage' | 'disposalStatus' | 'complianceStatus' | 'completedRequirements' | 'missingRequirements' | 'riskLevel' | 'lastComplianceCheck'>) => ITAsset;
  updateAsset: (asset: ITAsset) => void;
  requestDisposal: (assetId: string, reason: string, condition: ITAsset['assetCondition'], priority: Priority, notes?: string) => void;
  approveDisposal: (assetId: string) => void;
  rejectDisposal: (assetId: string, reason: string) => void;
  startWiping: (assetId: string, method: WipingMethod, technician: string, tool: string) => void;
  completeWiping: (assetId: string, passed: boolean, logs: string[]) => void;
  verifyWiping: (assetId: string, passed: boolean, notes: string) => void;
  generateCertificate: (assetId: string, notes?: string) => CertificateOfDestruction;
  finalizeDisposal: (assetId: string, vendor: string, methodDetail: string) => void;

  // Compliance rules
  toggleComplianceRule: (ruleId: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Users
  addUser: (user: Omit<User, 'id' | 'lastLogin'>) => void;
  updateUser: (user: User) => void;
  toggleUserStatus: (id: string) => void;

  // Settings
  updateSettings: (newSettings: OrganizationSettings) => void;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Simple pseudo SHA-256 generator for prototype hashes
function generateMockSha256(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const pad = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
  return (hex + pad).slice(0, 64);
}

function calculateCompliance(asset: ITAsset, activeRules: ComplianceRule[]): {
  status: ComplianceStatus;
  completed: string[];
  missing: string[];
  risk: ITAsset['riskLevel'];
} {
  const completed: string[] = [];
  const missing: string[] = [];

  // RULE-01: Asset Ownership & Custody
  if (asset.serialNumber && asset.assignedEmployee) {
    completed.push('RULE-01');
  } else {
    missing.push('RULE-01');
  }

  // RULE-02: Disposal Approval
  if (asset.approvedBy || ['Approved', 'Data Wiping', 'Verification', 'Compliance Review', 'Certificate Generated', 'Disposed'].includes(asset.lifecycleStage)) {
    completed.push('RULE-02');
  } else if (asset.lifecycleStage !== 'Registered') {
    missing.push('RULE-02');
  }

  // RULE-03: Data Wiping Completed
  if (asset.wipingStatus === 'Completed' || ['Verification', 'Compliance Review', 'Certificate Generated', 'Disposed'].includes(asset.lifecycleStage)) {
    completed.push('RULE-03');
  } else if (['Approved', 'Data Wiping'].includes(asset.lifecycleStage)) {
    missing.push('RULE-03');
  }

  // RULE-04: Independent Verification
  if (asset.verificationResult === 'Passed' || ['Compliance Review', 'Certificate Generated', 'Disposed'].includes(asset.lifecycleStage)) {
    completed.push('RULE-04');
  } else if (asset.verificationResult === 'Failed') {
    missing.push('RULE-04');
  } else if (['Verification'].includes(asset.lifecycleStage)) {
    missing.push('RULE-04');
  }

  // RULE-05: Certificate of Destruction
  if (asset.certificateId || ['Certificate Generated', 'Disposed'].includes(asset.lifecycleStage)) {
    completed.push('RULE-05');
  } else if (['Compliance Review'].includes(asset.lifecycleStage)) {
    missing.push('RULE-05');
  }

  // RULE-06: Certified Recycler
  if (asset.lifecycleStage === 'Disposed') {
    completed.push('RULE-06');
    completed.push('RULE-07');
  }

  // Evaluate status
  let status: ComplianceStatus = 'Compliant';
  let risk: ITAsset['riskLevel'] = 'Low';

  if (asset.disposalStatus === 'Verification Failed' || asset.disposalStatus === 'Rejected') {
    status = 'Non-Compliant';
    risk = 'Critical';
  } else if (missing.length > 0 && asset.lifecycleStage !== 'Registered') {
    status = 'Partially Compliant';
    risk = asset.priority === 'Urgent' ? 'High' : 'Medium';
  } else if (asset.lifecycleStage === 'Registered') {
    status = 'Review Required';
    risk = 'Low';
  }

  return { status, completed, missing, risk };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence with localStorage fallback
  const [assets, setAssets] = useState<ITAsset[]>(() => {
    const saved = localStorage.getItem('aegis_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('aegis_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => users[0] || INITIAL_USERS[0]);

  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>(() => {
    const saved = localStorage.getItem('aegis_compliance_rules');
    return saved ? JSON.parse(saved) : INITIAL_COMPLIANCE_RULES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('aegis_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('aegis_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [certificates, setCertificates] = useState<CertificateOfDestruction[]>(() => {
    const saved = localStorage.getItem('aegis_certificates');
    return saved ? JSON.parse(saved) : INITIAL_CERTIFICATES;
  });

  const [settings, setSettings] = useState<OrganizationSettings>(() => {
    const saved = localStorage.getItem('aegis_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('aegis_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('aegis_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('aegis_compliance_rules', JSON.stringify(complianceRules));
  }, [complianceRules]);

  useEffect(() => {
    localStorage.setItem('aegis_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('aegis_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('aegis_certificates', JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem('aegis_settings', JSON.stringify(settings));
  }, [settings]);

  const addAuditLog = (
    action: string,
    assetId: string,
    prevStatus: string,
    newStatus: string,
    details?: string,
    result: 'Success' | 'Failed' | 'Warning' = 'Success'
  ) => {
    const now = new Date();
    const formatted = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;
    const newEntry: AuditLogEntry = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: formatted,
      user: currentUser.name,
      role: currentUser.role,
      action,
      assetId,
      previousStatus: prevStatus,
      newStatus,
      deviceIp: '10.24.1.88 (SecOps Console)',
      result,
      details,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const addNotification = (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success',
    assetId?: string,
    linkPage?: string
  ) => {
    const now = new Date();
    const formatted = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      title,
      message,
      timestamp: formatted,
      type,
      read: false,
      assetId,
      linkPage,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Add Asset
  const addAsset = (
    assetData: Omit<
      ITAsset,
      'id' | 'lifecycleStage' | 'disposalStatus' | 'complianceStatus' | 'completedRequirements' | 'missingRequirements' | 'riskLevel' | 'lastComplianceCheck'
    >
  ): ITAsset => {
    // Generate appropriate ID prefix
    let prefix = 'DEV';
    if (assetData.deviceType === 'Laptop') prefix = 'LAP';
    else if (assetData.deviceType === 'Desktop') prefix = 'DESK';
    else if (assetData.deviceType === 'Hard Drive') prefix = 'HDD';
    else if (assetData.deviceType === 'SSD') prefix = 'SSD';
    else if (assetData.deviceType === 'Mobile') prefix = 'MOB';
    else if (assetData.deviceType === 'Tablet') prefix = 'TAB';
    else if (assetData.deviceType === 'Server') prefix = 'SRV';

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `${prefix}-${randNum}`;

    const newAsset: ITAsset = {
      ...assetData,
      id: newId,
      lifecycleStage: 'Registered',
      disposalStatus: 'Active',
      complianceStatus: 'Review Required',
      completedRequirements: ['RULE-01'],
      missingRequirements: ['RULE-02', 'RULE-03', 'RULE-04', 'RULE-05'],
      riskLevel: 'Low',
      lastComplianceCheck: new Date().toISOString().slice(0, 10),
    };

    setAssets((prev) => [newAsset, ...prev]);
    addAuditLog('Asset Registered', newId, 'None', 'Active', `New ${newAsset.brand} ${newAsset.model} registered`);
    addNotification('New Asset Registered', `Asset ${newId} (${newAsset.brand} ${newAsset.model}) successfully registered.`, 'info', newId, 'assets');

    return newAsset;
  };

  // Update Asset
  const updateAsset = (updated: ITAsset) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    addAuditLog('Asset Modified', updated.id, updated.disposalStatus, updated.disposalStatus, 'Asset specifications/assignment updated');
  };

  // Request Disposal
  const requestDisposal = (
    assetId: string,
    reason: string,
    condition: ITAsset['assetCondition'] = 'Working',
    priority: Priority = 'Medium',
    notes?: string
  ) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const updated: ITAsset = {
      ...target,
      lifecycleStage: 'Disposal Requested',
      disposalStatus: 'Pending Approval',
      disposalReason: reason,
      assetCondition: condition,
      priority,
      requestedBy: currentUser.name,
      requestedDate: new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      complianceStatus: 'Partially Compliant',
    };

    setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
    addAuditLog('Disposal Requested', assetId, target.disposalStatus, 'Pending Approval', `Reason: ${reason}. Priority: ${priority}`);
    addNotification('Disposal Approval Required', `Asset ${assetId} requested for disposal by ${currentUser.name}. Requires Manager/Admin approval.`, 'warning', assetId, 'disposal-requests');
  };

  // Approve Disposal
  const approveDisposal = (assetId: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const completed = Array.from(new Set([...target.completedRequirements, 'RULE-02']));
    const updated: ITAsset = {
      ...target,
      lifecycleStage: 'Approved',
      disposalStatus: 'Approved',
      approvedBy: currentUser.name,
      approvalDate: new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      completedRequirements: completed,
      missingRequirements: target.missingRequirements.filter((r) => r !== 'RULE-02'),
    };

    setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
    addAuditLog('Disposal Approved', assetId, 'Pending Approval', 'Approved', `Approved for sanitization by ${currentUser.name}`);
    addNotification('Disposal Request Approved', `Asset ${assetId} approved. Queued for certified data wiping.`, 'success', assetId, 'data-wiping');
  };

  // Reject Disposal
  const rejectDisposal = (assetId: string, reason: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const updated: ITAsset = {
      ...target,
      lifecycleStage: 'Registered',
      disposalStatus: 'Rejected',
      rejectionReason: reason,
      complianceStatus: 'Non-Compliant',
      riskLevel: 'Medium',
    };

    setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
    addAuditLog('Disposal Rejected', assetId, 'Pending Approval', 'Rejected', `Rejected by ${currentUser.name}: ${reason}`, 'Failed');
    addNotification('Disposal Request Rejected', `Asset ${assetId} disposal request was rejected: ${reason}`, 'error', assetId, 'disposal-requests');
  };

  // Start Wiping
  const startWiping = (assetId: string, method: WipingMethod, technician: string, tool: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const updated: ITAsset = {
      ...target,
      lifecycleStage: 'Data Wiping',
      disposalStatus: 'Wiping In Progress',
      wipingMethod: method,
      technician: technician || currentUser.name,
      wipingTool: tool,
      wipingStartTime: new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      wipingStatus: 'In Progress',
      wipingPasses: method.includes('3-Pass') ? 3 : 1,
    };

    setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
    addAuditLog('Data Wiping Initiated', assetId, target.disposalStatus, 'Wiping In Progress', `Method: ${method}. Tool: ${tool}`);
    addNotification('Data Wiping Initiated', `Asset ${assetId} sanitization started with ${method}.`, 'info', assetId, 'data-wiping');
  };

  // Complete Wiping
  const completeWiping = (assetId: string, passed: boolean, logs: string[]) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const nowStr = new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (passed) {
      const completed = Array.from(new Set([...target.completedRequirements, 'RULE-03']));
      const updated: ITAsset = {
        ...target,
        lifecycleStage: 'Verification',
        disposalStatus: 'Verification Pending',
        wipingEndTime: nowStr,
        wipingStatus: 'Completed',
        wipeLogOutput: logs,
        completedRequirements: completed,
        missingRequirements: target.missingRequirements.filter((r) => r !== 'RULE-03'),
      };
      setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
      addAuditLog('Data Wiping Completed', assetId, 'Wiping In Progress', 'Verification Pending', 'Sanitization executed successfully. Ready for verification.');
      addNotification('Wiping Complete - Verification Pending', `Asset ${assetId} sanitized successfully. Independent verification required.`, 'warning', assetId, 'verification');
    } else {
      const updated: ITAsset = {
        ...target,
        lifecycleStage: 'Verification',
        disposalStatus: 'Verification Failed',
        wipingEndTime: nowStr,
        wipingStatus: 'Failed',
        wipeLogOutput: logs,
        complianceStatus: 'Non-Compliant',
        riskLevel: 'Critical',
      };
      setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
      addAuditLog('Data Wiping Failed', assetId, 'Wiping In Progress', 'Verification Failed', 'Sanitization routine encountered sector or controller faults.', 'Failed');
      addNotification('Data Wiping Failed Alert', `Asset ${assetId} sanitization failed! Re-wipe or physical destruction recommended.`, 'error', assetId, 'verification');
    }
  };

  // Verify Wiping
  const verifyWiping = (assetId: string, passed: boolean, notes: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const nowStr = new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (passed) {
      const completed = Array.from(new Set([...target.completedRequirements, 'RULE-03', 'RULE-04']));
      const updated: ITAsset = {
        ...target,
        lifecycleStage: 'Compliance Review',
        disposalStatus: 'Ready For Disposal',
        verifiedBy: currentUser.name,
        verificationDate: nowStr,
        verificationResult: 'Passed',
        verificationNotes: notes,
        complianceStatus: 'Compliant',
        riskLevel: 'Low',
        completedRequirements: completed,
        missingRequirements: target.missingRequirements.filter((r) => r !== 'RULE-04'),
      };
      setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
      addAuditLog('Wiping Verification Passed', assetId, target.disposalStatus, 'Ready For Disposal', `Verified by ${currentUser.name}: ${notes}`);
      addNotification('Sanitization Verified', `Asset ${assetId} successfully verified. Ready for Certificate of Destruction.`, 'success', assetId, 'compliance');
    } else {
      const updated: ITAsset = {
        ...target,
        lifecycleStage: 'Verification',
        disposalStatus: 'Verification Failed',
        verifiedBy: currentUser.name,
        verificationDate: nowStr,
        verificationResult: 'Failed',
        verificationNotes: notes,
        complianceStatus: 'Non-Compliant',
        riskLevel: 'Critical',
      };
      setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
      addAuditLog('Wiping Verification Marked Failed', assetId, target.disposalStatus, 'Verification Failed', `Flagged by ${currentUser.name}: ${notes}`, 'Failed');
      addNotification('Verification Rejection', `Asset ${assetId} failed verification check. Review notes: ${notes}`, 'error', assetId, 'verification');
    }
  };

  // Generate Certificate
  const generateCertificate = (assetId: string, notes?: string): CertificateOfDestruction => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) throw new Error('Asset not found');

    const certId = `CERT-WIPE-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const today = new Date().toISOString().slice(0, 10);
    const hash = generateMockSha256(`${certId}-${target.id}-${target.serialNumber}-${today}`);

    const newCert: CertificateOfDestruction = {
      certificateId: certId,
      assetId: target.id,
      deviceType: target.deviceType,
      brand: target.brand,
      model: target.model,
      serialNumber: target.serialNumber,
      sanitizationMethod: target.wipingMethod || settings.defaultWipingStandard,
      wipingTool: target.wipingTool || 'Blancco Drive Eraser Enterprise v7.4',
      technicianName: target.technician || 'Marcus Vance',
      verificationOfficer: target.verifiedBy || currentUser.name,
      issueDate: today,
      sha256Hash: hash,
      status: 'Valid',
      organization: settings.orgName,
      facilityLocation: settings.facilityName,
      notes: notes || 'NIST SP 800-88 Rev 1 compliance validated. Cryptographically sealed record.',
    };

    setCertificates((prev) => [newCert, ...prev]);

    const completed = Array.from(new Set([...target.completedRequirements, 'RULE-05']));
    const updated: ITAsset = {
      ...target,
      lifecycleStage: 'Certificate Generated',
      certificateId: certId,
      certificateHash: hash,
      certificateIssuedDate: today,
      completedRequirements: completed,
      missingRequirements: target.missingRequirements.filter((r) => r !== 'RULE-05'),
    };

    setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
    addAuditLog('Certificate Generated', assetId, target.disposalStatus, target.disposalStatus, `Issued ${certId} with SHA-256 integrity hash`);
    addNotification('Certificate Issued', `Official Certificate of Destruction ${certId} generated for asset ${assetId}.`, 'success', assetId, 'certificates');

    return newCert;
  };

  // Finalize Disposal
  const finalizeDisposal = (assetId: string, vendor: string, methodDetail: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const today = new Date().toISOString().slice(0, 10);
    const completed = Array.from(new Set([...target.completedRequirements, 'RULE-06', 'RULE-07']));

    const updated: ITAsset = {
      ...target,
      lifecycleStage: 'Disposed',
      disposalStatus: 'Disposed',
      finalDisposalDate: today,
      disposalVendor: vendor || settings.certifiedRecyclerPartner,
      disposalMethodDetail: methodDetail || 'Demounted and e-waste reclaimed by R2v3 certified partner',
      completedRequirements: completed,
      missingRequirements: [],
      complianceStatus: 'Compliant',
      riskLevel: 'Low',
    };

    setAssets((prev) => prev.map((a) => (a.id === assetId ? updated : a)));
    addAuditLog('Asset Disposed', assetId, target.disposalStatus, 'Disposed', `Physical custody transferred to ${vendor}. Lifecycle closed.`);
    addNotification('Asset Final Disposal Complete', `Asset ${assetId} has been successfully retired and recycled under R2v3 standards.`, 'success', assetId, 'audit-logs');
  };

  // Toggle compliance rule
  const toggleComplianceRule = (ruleId: string) => {
    setComplianceRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Users
  const addUser = (userData: Omit<User, 'id' | 'lastLogin'>) => {
    const newId = `USR-${String(users.length + 1).padStart(2, '0')}`;
    const newUser: User = {
      ...userData,
      id: newId,
      lastLogin: 'Never',
    };
    setUsers((prev) => [...prev, newUser]);
    addAuditLog('User Created', 'N/A', 'N/A', 'Active', `New user account created: ${newUser.name} (${newUser.role})`);
  };

  const updateUser = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const updateSettings = (newSettings: OrganizationSettings) => {
    setSettings(newSettings);
    addAuditLog('System Settings Updated', 'SYSTEM', 'Config', 'Updated', 'Organization compliance & wiping parameters updated');
  };

  const resetToDemoData = () => {
    setAssets(INITIAL_ASSETS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setComplianceRules(INITIAL_COMPLIANCE_RULES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCertificates(INITIAL_CERTIFICATES);
    setSettings(INITIAL_SETTINGS);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        assets,
        users,
        currentUser,
        setCurrentUser,
        complianceRules,
        auditLogs,
        notifications,
        certificates,
        settings,
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

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
