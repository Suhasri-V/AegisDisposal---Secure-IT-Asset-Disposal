import React, { useEffect } from 'react';
import {
  Printer,
  Download,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';
import { CertificateDocument } from '../components/common/CertificateDocument';

export const CertificateDetailPage: React.FC = () => {
  const { certificates, assets } = useApp();
  const { currentParams } = useNav();

  const certificateId = currentParams.certificateId || (certificates[0] ? certificates[0].certificateId : '');
  const cert = certificates.find((c) => c.certificateId === certificateId) || certificates[0];
  const asset = cert ? assets.find((a) => a.id === cert.assetId) : null;

  // Auto-print support if navigating with autoPrint parameter
  useEffect(() => {
    if (currentParams.autoPrint === 'true' && cert) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentParams.autoPrint, cert]);

  if (!cert) {
    return (
      <div className="p-8 text-center text-slate-400">
        <BackButton />
        <p className="mt-4">Certificate not found.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const certText = `
================================================================================
                    OFFICIAL CERTIFICATE OF DATA DESTRUCTION
                         AEGIS DISPOSAL & SANITIZATION
================================================================================

CERTIFICATE ID:   ${cert.certificateId}
DATE OF ISSUANCE: ${cert.issueDate}
STATUS:           ${cert.status.toUpperCase()}
SANCTIONING BODY: ${cert.organization}
FACILITY:         ${cert.facilityLocation}

--------------------------------------------------------------------------------
1. TARGET HARDWARE IDENTIFICATION
--------------------------------------------------------------------------------
Asset ID:         ${cert.assetId}
Device Category:  ${cert.deviceType}
Brand & Model:    ${cert.brand} ${cert.model}
Serial Number:    ${cert.serialNumber}
Disposal Date:    ${asset?.finalDisposalDate || asset?.requestedDate || cert.issueDate}

--------------------------------------------------------------------------------
2. SANITIZATION METHODOLOGY & STANDARDS
--------------------------------------------------------------------------------
Standard:         ${cert.sanitizationMethod}
Sanitization Rig: ${cert.wipingTool}
Compliance Level: NIST SP 800-88 Rev 1 Purge & FIPS 140-3
Technician:       ${cert.technicianName}
Verification Off: ${cert.verificationOfficer}
Verification Date:${asset?.verificationDate || cert.issueDate}
Result:           ${asset?.verificationResult || 'Passed - Sanitized'}

--------------------------------------------------------------------------------
3. CRYPTOGRAPHIC PROOF OF SANITIZATION
--------------------------------------------------------------------------------
SHA-256 Record Hash:
${cert.sha256Hash}

Notes & Attestation:
${cert.notes}

"This document certifies that the aforementioned IT asset has been sanitized in
compliance with strict information security standards. No residual user data,
cryptographic key material, or partition table remains recoverable."
================================================================================
`;

    const blob = new Blob([certText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.certificateId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top-left Back button (hidden during print) */}
      <BackButton className="no-print print:hidden" />

      {/* Main Certificate View Container */}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Actions Bar (hidden during print) */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 no-print print:hidden shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Digital Certificate ID</span>
              <span className="font-mono text-xs text-emerald-400 font-bold">{cert.certificateId}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download text dossier"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Download Cert
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:shadow-cyan-500/20 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              Print Certificate
            </button>
          </div>
        </div>

        {/* Dedicated Print-Friendly Certificate Layout */}
        <CertificateDocument certificate={cert} asset={asset} />
      </div>
    </div>
  );
};
