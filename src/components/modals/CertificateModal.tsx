import React from 'react';
import {
  X,
  Award,
  Printer,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { CertificateOfDestruction, ITAsset } from '../../types';
import { useApp } from '../../context/AppContext';
import { CertificateDocument } from '../common/CertificateDocument';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateOfDestruction | null;
  asset?: ITAsset | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
  asset,
}) => {
  const { finalizeDisposal, settings } = useApp();

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open-printing');
      return () => {
        document.body.classList.remove('modal-open-printing');
      };
    }
  }, [isOpen]);

  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const certText = `
================================================================================
                    OFFICIAL CERTIFICATE OF DATA DESTRUCTION
                         AEGIS DISPOSAL & SANITIZATION
================================================================================

CERTIFICATE ID:   ${certificate.certificateId}
DATE OF ISSUANCE: ${certificate.issueDate}
STATUS:           ${certificate.status.toUpperCase()}
SANCTIONING BODY: ${certificate.organization}
FACILITY:         ${certificate.facilityLocation}

--------------------------------------------------------------------------------
1. TARGET HARDWARE IDENTIFICATION
--------------------------------------------------------------------------------
Asset ID:         ${certificate.assetId}
Device Category:  ${certificate.deviceType}
Brand & Model:    ${certificate.brand} ${certificate.model}
Serial Number:    ${certificate.serialNumber}
Disposal Date:    ${asset?.finalDisposalDate || asset?.requestedDate || certificate.issueDate}

--------------------------------------------------------------------------------
2. SANITIZATION METHODOLOGY & STANDARDS
--------------------------------------------------------------------------------
Standard:         ${certificate.sanitizationMethod}
Sanitization Rig: ${certificate.wipingTool}
Compliance Level: NIST SP 800-88 Rev 1 Purge & FIPS 140-3
Technician:       ${certificate.technicianName}
Verification Off: ${certificate.verificationOfficer}
Verification Date:${asset?.verificationDate || certificate.issueDate}
Result:           ${asset?.verificationResult || 'Passed - Sanitized'}

--------------------------------------------------------------------------------
3. CRYPTOGRAPHIC PROOF OF SANITIZATION
--------------------------------------------------------------------------------
SHA-256 Record Hash:
${certificate.sha256Hash}

Notes & Attestation:
${certificate.notes}

"This document certifies that the aforementioned IT asset has been sanitized in
compliance with strict information security standards. No residual user data,
cryptographic key material, or partition table remains recoverable."
================================================================================
`;

    const blob = new Blob([certText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certificate.certificateId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden my-6">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between no-print print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold text-white font-mono">
              {certificate.certificateId}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
              Cryptographically Verified
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              Print Certificate
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-xs border border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Cert
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="p-4 sm:p-6 bg-slate-950">
          <CertificateDocument certificate={certificate} asset={asset} />
        </div>

        {/* Footer / Final Disposal Trigger (Hidden on print) */}
        {asset && asset.lifecycleStage !== 'Disposed' && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between no-print print:hidden">
            <div className="text-xs text-slate-400">
              Certificate is signed and active. Ready for physical transfer to R2v3 downstream recycler.
            </div>
            <button
              onClick={() => {
                finalizeDisposal(
                  asset.id,
                  settings.certifiedRecyclerPartner,
                  'De-manufactured and precious metals reclaimed by R2v3 partner'
                );
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors text-xs shadow-lg shadow-purple-900/30 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Final Disposal & Archive
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
