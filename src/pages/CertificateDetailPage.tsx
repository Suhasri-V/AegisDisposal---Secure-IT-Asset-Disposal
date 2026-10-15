import React, { useEffect, useRef, useState } from 'react';
import {
  Printer,
  Download,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';
import { CertificateDocument } from '../components/common/CertificateDocument';
import { downloadCertificatePng } from '../components/common/downloadCertificatePng';

export const CertificateDetailPage: React.FC = () => {
  const { certificates, assets } = useApp();
  const { currentParams } = useNav();

  const certificateId = currentParams.certificateId || (certificates[0] ? certificates[0].certificateId : '');
  const cert = certificates.find((c) => c.certificateId === certificateId) || certificates[0];
  const asset = cert ? assets.find((a) => a.id === cert.assetId) : null;
  const certificateElementRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownload = async () => {
    const certificateElement = certificateElementRef.current
      || document.querySelector<HTMLElement>('.certificate-print-document');
    if (!certificateElement || isDownloading) return;

    setIsDownloading(true);
    try {
      await downloadCertificatePng(certificateElement, cert.certificateId);
    } catch (error) {
      console.error('Failed to download certificate PNG:', error);
    } finally {
      setIsDownloading(false);
    }
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
              disabled={isDownloading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download certificate PNG"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              {isDownloading ? 'Preparing PNG...' : 'Download Cert'}
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
        <CertificateDocument ref={certificateElementRef} certificate={cert} asset={asset} />
      </div>
    </div>
  );
};
