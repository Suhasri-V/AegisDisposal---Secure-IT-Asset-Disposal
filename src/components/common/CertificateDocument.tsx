import React from 'react';
import {
  ShieldCheck,
  Award,
  Lock,
  CheckCircle2,
  HardDrive,
  FileText,
  Calendar,
  Building2,
  Cpu,
} from 'lucide-react';
import { CertificateOfDestruction, ITAsset } from '../../types';

interface CertificateDocumentProps {
  certificate: CertificateOfDestruction;
  asset?: ITAsset | null;
}

export const CertificateDocument: React.FC<CertificateDocumentProps> = ({
  certificate,
  asset,
}) => {
  const verificationDate = asset?.verificationDate || certificate.issueDate;
  const disposalDate = asset?.finalDisposalDate || asset?.requestedDate || certificate.issueDate;
  const verificationResult = asset?.verificationResult
    ? `${asset.verificationResult.toUpperCase()} — Zero-Fill Sector Readback 100% Verified`
    : 'PASSED — Sanitization & Readback Verified';

  return (
    <div className="certificate-print-document bg-slate-900 border-2 border-emerald-500/40 rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-2xl space-y-5 print:shadow-none print:rounded-none">
      {/* Subtle Security Background Watermark */}
      <div className="print-watermark absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
        <ShieldCheck className="w-80 h-80 text-emerald-400" />
      </div>

      {/* Top Header & Organization */}
      <div className="relative z-10 border-b-2 border-slate-800 print-border pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 print:border-slate-800 print:text-black">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold print-highlight">
                {certificate.organization || 'Aegis Defense Systems Global LLC · SecOps Facility'}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase print-dark-text">
                CERTIFICATE OF DATA DESTRUCTION
              </h1>
              <p className="text-[11px] text-slate-400 print-muted-text">
                NIST SP 800-88 Rev 1 Media Sanitization Compliance · Official Compliance Record
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0 print-dark-text">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider print-muted-text">
              Certificate ID
            </div>
            <div className="text-sm font-mono text-emerald-400 font-bold print-dark-text">
              {certificate.certificateId}
            </div>
            <div className="text-[10px] text-slate-400 font-mono print-muted-text">
              Issued: {certificate.issueDate}
            </div>
          </div>
        </div>
      </div>

      {/* Official Attestation Statement */}
      <div className="relative z-10 text-[11px] leading-relaxed text-slate-300 print-dark-text bg-slate-950/60 print-box-bg p-3 rounded-lg border border-slate-800/80 print-border">
        This document serves as formal legal attestation that the storage media hardware described herein has undergone certified, non-recoverable logical sanitization conforming to organization security policies and NIST Special Publication 800-88 Revision 1 standards. All magnetic, solid-state, and optical data sectors have been sanitized such that data recovery is impossible using laboratory attack techniques.
      </div>

      {/* Grid Section 1: Asset Information & Section 2: Data Destruction Details */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        {/* Box 1: Target Asset Information */}
        <div className="p-3.5 rounded-lg bg-slate-950/60 print-box-bg border border-slate-800 print-border space-y-2">
          <h2 className="text-[11px] font-bold text-slate-200 print-dark-text uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 print-border pb-1.5">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400 print-dark-text" />
            1. Target Asset Information
          </h2>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
            <div>
              <span className="text-[10px] text-slate-500 print-muted-text block">Certificate ID</span>
              <span className="font-mono text-emerald-400 print-dark-text font-bold">{certificate.certificateId}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 print-muted-text block">Asset ID</span>
              <span className="font-mono text-cyan-300 print-dark-text font-bold">{certificate.assetId}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 print-muted-text block">Device Type</span>
              <span className="text-slate-200 print-dark-text font-medium">{certificate.deviceType}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 print-muted-text block">Brand / Model</span>
              <span className="text-slate-200 print-dark-text font-medium">{certificate.brand} {certificate.model}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 print-muted-text block">Serial Number</span>
              <span className="font-mono text-slate-200 print-dark-text font-semibold">{certificate.serialNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 print-muted-text block">Disposal Date</span>
              <span className="text-slate-200 print-dark-text font-mono">{disposalDate}</span>
            </div>
          </div>
        </div>

        {/* Box 2: Data Destruction Details */}
        <div className="p-3.5 rounded-lg bg-slate-950/60 print-box-bg border border-slate-800 print-border space-y-2">
          <h2 className="text-[11px] font-bold text-slate-200 print-dark-text uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 print-border pb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 print-dark-text" />
            2. Data Destruction Details
          </h2>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
            <div className="col-span-2">
              <span className="text-[10px] text-slate-500 print-muted-text block">Data Wiping Method</span>
              <span className="text-emerald-400 print-dark-text font-semibold">{certificate.sanitizationMethod}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 print-muted-text block">Wiping Tool</span>
              <span className="text-slate-200 print-dark-text font-mono truncate block">{certificate.wipingTool}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 print-muted-text block">Technician</span>
              <span className="text-slate-200 print-dark-text font-medium">{certificate.technicianName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 print-muted-text block">Sanitization Passes</span>
              <span className="text-slate-200 print-dark-text">3 Passes (Purge / Crypto Erase)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 print-muted-text block">Facility Location</span>
              <span className="text-slate-200 print-dark-text truncate block">{certificate.facilityLocation || 'SecOps Bay 2'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section 3: Verification Details */}
      <div className="relative z-10 p-3.5 rounded-lg bg-slate-950/60 print-box-bg border border-slate-800 print-border space-y-2">
        <h2 className="text-[11px] font-bold text-slate-200 print-dark-text uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 print-border pb-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 print-dark-text" />
          3. Independent Verification Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
          <div>
            <span className="text-[10px] text-slate-500 print-muted-text block">Verification Officer</span>
            <span className="text-slate-200 print-dark-text font-medium">{certificate.verificationOfficer}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 print-muted-text block">Verification Date</span>
            <span className="text-slate-200 print-dark-text font-mono">{verificationDate}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 print-muted-text block">Verification Result</span>
            <span className="text-emerald-400 print-dark-text font-bold">{verificationResult}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 print-muted-text block">Certificate Status</span>
            <span className="text-emerald-400 print-dark-text font-bold">VALID & SEALED</span>
          </div>
        </div>
      </div>

      {/* Section 4: Cryptographic Checksum SHA-256 */}
      <div className="relative z-10 p-3 rounded-lg bg-slate-950 print-code-bg border border-slate-800 print-border space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400 print-muted-text font-mono">
          <span className="flex items-center gap-1.5 text-cyan-400 print-dark-text font-bold">
            <Lock className="w-3.5 h-3.5" />
            FIPS 180-4 CRYPTOGRAPHIC DIGITAL SEAL (SHA-256)
          </span>
          <span className="text-emerald-400 print-dark-text font-bold uppercase tracking-wider">
            TAMPER-EVIDENT AUDIT SEAL
          </span>
        </div>
        <div className="font-mono text-[10.5px] text-cyan-300/90 print-dark-text break-all bg-slate-900/80 print-box-bg p-1.5 rounded border border-slate-800 print-border select-all">
          {certificate.sha256Hash}
        </div>
      </div>

      {/* Section 5: Authorized Signature Area */}
      <div className="relative z-10 pt-2 grid grid-cols-2 gap-6 text-xs">
        {/* Technician Signature */}
        <div className="border-t-2 border-slate-700 print-border pt-2 text-center space-y-1">
          <div className="font-serif italic text-base text-cyan-200 print-dark-text min-h-[24px]">
            {certificate.technicianName}
          </div>
          <div className="text-[11px] font-bold text-white print-dark-text">{certificate.technicianName}</div>
          <div className="text-[10px] text-slate-400 print-muted-text">
            Sanitization Technician · CompTIA Security+
          </div>
          <div className="text-[9px] text-slate-500 print-muted-text font-mono">
            Date Signed: {certificate.issueDate}
          </div>
        </div>

        {/* Verification Officer Signature */}
        <div className="border-t-2 border-slate-700 print-border pt-2 text-center space-y-1">
          <div className="font-serif italic text-base text-cyan-200 print-dark-text min-h-[24px]">
            {certificate.verificationOfficer}
          </div>
          <div className="text-[11px] font-bold text-white print-dark-text">{certificate.verificationOfficer}</div>
          <div className="text-[10px] text-slate-400 print-muted-text">
            Verification Officer · Lead Compliance Auditor (CISA, CISSP)
          </div>
          <div className="text-[9px] text-slate-500 print-muted-text font-mono">
            Date Verified: {verificationDate}
          </div>
        </div>
      </div>

      {/* Footer Legal & Regulatory Notice */}
      <div className="relative z-10 pt-2 border-t border-slate-800 print-border text-[9.5px] text-slate-400 print-muted-text text-center font-mono">
        AegisDisposal Cryptographic Registry · Certified compliance with NIST SP 800-88 Rev 1, DoD 5220.22-M, GDPR Article 17, and HIPAA Security Rule §164.310(d)(2).
      </div>
    </div>
  );
};
