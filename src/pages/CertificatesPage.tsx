import React, { useState } from 'react';
import {
  Award,
  Search,
  Eye,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';
import { CertificateOfDestruction, ITAsset } from '../types';

interface CertificatesPageProps {
  onViewCertificateModal: (cert: CertificateOfDestruction, asset?: ITAsset) => void;
  onSelectAsset: (asset: ITAsset) => void;
}

export const CertificatesPage: React.FC<CertificatesPageProps> = ({
  onViewCertificateModal,
  onSelectAsset,
}) => {
  const { certificates, assets, generateCertificate } = useApp();
  const { navigate } = useNav();
  const [search, setSearch] = useState('');

  // Assets that are ready for a certificate but don't have one yet
  const readyForCertAssets = assets.filter(
    (a) =>
      ['Ready For Disposal', 'Compliance Review'].includes(a.disposalStatus) &&
      !a.certificateId &&
      a.verificationResult === 'Passed'
  );

  const filtered = certificates.filter(
    (cert) =>
      cert.certificateId.toLowerCase().includes(search.toLowerCase()) ||
      cert.assetId.toLowerCase().includes(search.toLowerCase()) ||
      cert.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      cert.technicianName.toLowerCase().includes(search.toLowerCase()) ||
      cert.verificationOfficer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top-left Back button */}
      <BackButton />

      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Cryptographic Certificates of Data Destruction
            </h2>
            <p className="text-xs text-slate-400">
              Legally binding, SHA-256 hashed records attesting to non-recoverable data sanitization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-mono">
              FIPS 180-4 / NIST SP 800-88 Compliant Vault
            </span>
            {filtered.length > 0 && (
              <button
                onClick={() => navigate('certificate-details', { certificateId: filtered[0].certificateId })}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                title="Print the primary certificate"
              >
                <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                Print Certificate
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md pt-2 border-t border-slate-800">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-4.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Certificate ID, Asset ID, Serial No, Officer..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Assets Ready for Certificate Alert/Action Bar */}
      {readyForCertAssets.length > 0 && (
        <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              <strong>{readyForCertAssets.length} verified assets</strong> are waiting for official Certificate of Destruction generation.
            </span>
          </div>
          <div className="flex items-center gap-2">
            {readyForCertAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => {
                  const cert = generateCertificate(asset.id);
                  onViewCertificateModal(cert, asset);
                }}
                className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 text-[11px] font-mono transition-colors"
              >
                Sign {asset.id} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Certificate Vault Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium select-none">
                <th className="py-3 px-3">Certificate ID</th>
                <th className="py-3 px-3">Target Asset</th>
                <th className="py-3 px-3">Hardware Serial</th>
                <th className="py-3 px-3">Wiping Method</th>
                <th className="py-3 px-3">Wiping Tool</th>
                <th className="py-3 px-3">Technician</th>
                <th className="py-3 px-3">Verification Officer</th>
                <th className="py-3 px-3">Issue Date</th>
                <th className="py-3 px-3">Cryptographic Hash</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                    No certificates found matching "{search}".
                  </td>
                </tr>
              ) : (
                filtered.map((cert) => {
                  const matchedAsset = assets.find((a) => a.id === cert.assetId);

                  return (
                    <tr
                      key={cert.certificateId}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => navigate('certificate-details', { certificateId: cert.certificateId })}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {cert.certificateId}
                      </td>

                      <td className="py-3 px-3 text-slate-200 whitespace-nowrap">
                        <div className="font-semibold font-mono text-cyan-400">{cert.assetId}</div>
                        <div className="text-[10px] text-slate-400">{cert.brand} {cert.model}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {cert.serialNumber}
                      </td>

                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap font-medium text-emerald-300">
                        {cert.sanitizationMethod}
                      </td>

                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap truncate max-w-[130px]">
                        {cert.wipingTool}
                      </td>

                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {cert.technicianName}
                      </td>

                      <td className="py-3 px-3 text-cyan-300 whitespace-nowrap font-medium">
                        {cert.verificationOfficer}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                        {cert.issueDate}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap text-[10px] max-w-[120px] truncate" title={cert.sha256Hash}>
                        {cert.sha256Hash.slice(0, 16)}...
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewCertificateModal(cert, matchedAsset)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              navigate('certificate-details', { certificateId: cert.certificateId, autoPrint: 'true' });
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-[11px] transition-colors"
                            title="Print Certificate"
                            aria-label={`Print Certificate ${cert.certificateId}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onViewCertificateModal(cert, matchedAsset)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                            title="Download Certificate"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
