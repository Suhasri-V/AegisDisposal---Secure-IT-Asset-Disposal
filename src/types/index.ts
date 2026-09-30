export type DeviceType = 'Laptop' | 'Desktop' | 'Hard Drive' | 'SSD' | 'Mobile' | 'Tablet' | 'Server';

export type LifecycleStage =
  | 'Registered'
  | 'Disposal Requested'
  | 'Approved'
  | 'Data Wiping'
  | 'Verification'
  | 'Compliance Review'
  | 'Certificate Generated'
  | 'Disposed';

export type DisposalStatus =
  | 'Active'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Wiping In Progress'
  | 'Wiped'
  | 'Verification Pending'
  | 'Verification Failed'
  | 'Ready For Disposal'
  | 'Disposed';

export type ComplianceStatus = 'Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Review Required';

export type WipingMethod =
  | 'NIST 800-88 Rev 1 Purge'
  | 'NIST 800-88 Rev 1 Clear'
  | 'DoD 5220.22-M (3-Pass)'
  | 'Cryptographic Erasure (Crypto Erase)'
  | 'ATA Secure Erase'
  | 'Physical Destruction / Degaussing';

export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';

export type UserRole = 'Admin' | 'IT Technician' | 'Compliance Officer' | 'Manager' | 'Auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  avatar?: string;
}

export interface ITAsset {
  id: string; // e.g. LAP-1001
  deviceType: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  assignedEmployee: string;
  department: string;
  location: string;
  purchaseDate: string;
  capacity?: string; // e.g. 512GB NVMe, 2TB HDD
  ipAddress?: string;
  macAddress?: string;

  // Lifecycle & Status
  lifecycleStage: LifecycleStage;
  disposalStatus: DisposalStatus;
  complianceStatus: ComplianceStatus;

  // Disposal Request details
  disposalReason?: string;
  assetCondition?: 'Working' | 'Degraded' | 'Faulty / Inoperable' | 'Obsolete';
  priority?: Priority;
  requestedBy?: string;
  requestedDate?: string;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;

  // Wiping details
  wipingMethod?: WipingMethod;
  wipingTool?: string;
  technician?: string;
  wipingStartTime?: string;
  wipingEndTime?: string;
  wipingPasses?: number;
  wipingStatus?: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  wipeLogOutput?: string[];

  // Verification details
  verifiedBy?: string;
  verificationDate?: string;
  verificationResult?: 'Passed' | 'Failed';
  verificationNotes?: string;

  // Compliance details
  completedRequirements: string[];
  missingRequirements: string[];
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  lastComplianceCheck: string;

  // Certificate details
  certificateId?: string;
  certificateHash?: string;
  certificateIssuedDate?: string;

  // Final Disposal
  finalDisposalDate?: string;
  disposalVendor?: string;
  disposalMethodDetail?: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  category:
    | 'Data Protection'
    | 'Secure Data Destruction'
    | 'Asset Disposal Policy'
    | 'Audit Requirements'
    | 'Record Retention'
    | 'Environmental Disposal';
  description: string;
  standardReference: string; // e.g. "NIST SP 800-88 Rev 1", "GDPR Art 17", "ISO 27001 A.8.10"
  mandatory: boolean;
  active: boolean;
}

export interface CertificateOfDestruction {
  certificateId: string;
  assetId: string;
  deviceType: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  sanitizationMethod: WipingMethod;
  wipingTool: string;
  technicianName: string;
  verificationOfficer: string;
  issueDate: string;
  sha256Hash: string;
  status: 'Valid' | 'Revoked';
  organization: string;
  facilityLocation: string;
  notes: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  assetId: string;
  previousStatus: string;
  newStatus: string;
  deviceIp: string;
  result: 'Success' | 'Failed' | 'Warning';
  details?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  assetId?: string;
  linkPage?: string;
}

export interface OrganizationSettings {
  orgName: string;
  facilityName: string;
  complianceLeadEmail: string;
  defaultWipingStandard: WipingMethod;
  certifiedRecyclerPartner: string;
  recyclerLicenseNumber: string;
  auditRetentionDays: number;
  hashAlgorithm: string;
}
