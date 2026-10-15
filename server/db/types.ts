import {
  DeviceType,
  LifecycleStage,
  DisposalStatus,
  ComplianceStatus,
  WipingMethod,
  Priority,
  UserRole,
  User,
  ITAsset,
  ComplianceRule,
  CertificateOfDestruction,
  AuditLogEntry,
  AppNotification,
  OrganizationSettings,
} from '../../src/types';

export type {
  DeviceType,
  LifecycleStage,
  DisposalStatus,
  ComplianceStatus,
  WipingMethod,
  Priority,
  UserRole,
  User,
  ITAsset,
  ComplianceRule,
  CertificateOfDestruction,
  AuditLogEntry,
  AppNotification,
  OrganizationSettings,
};

export interface DisposalRequest {
  id: string; // e.g. REQ-1001
  assetId: string;
  userId?: string;
  requestedBy: string;
  department: string;
  reason: string;
  condition: 'Working' | 'Degraded' | 'Faulty / Inoperable' | 'Obsolete';
  priority: Priority;
  notes?: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  requestedDate: string;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WipingRecord {
  id: string; // e.g. WIPE-1001
  assetId: string;
  wipingMethod: WipingMethod;
  wipingTool: string;
  technician: string;
  startTime: string;
  endTime?: string;
  passes: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  logs: string[];
  errorRemarks?: string;
  createdAt: string;
}

export interface VerificationRecord {
  id: string; // e.g. VER-1001
  assetId: string;
  verifiedBy: string;
  verificationDate: string;
  verificationResult: 'Passed' | 'Failed';
  verificationNotes: string;
  createdAt: string;
}

export interface ComplianceChecklist {
  assetId: string;
  completedRequirements: string[];
  missingRequirements: string[];
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  lastCheckedDate: string;
  notes?: string;
}
