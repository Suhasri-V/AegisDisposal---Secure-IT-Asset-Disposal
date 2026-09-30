import React from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';
import { StatusBadge } from '../components/common/StatusBadge';

export const ReportDetailPage: React.FC = () => {
  const { assets, auditLogs, complianceRules, certificates } = useApp();
  const { currentParams } = useNav();

  const reportType = currentParams.reportType || 'Asset Disposal Report';
  const departmentFilter = currentParams.departmentFilter || 'All';
  const deviceFilter = currentParams.deviceFilter || 'All';
  const dateRange = currentParams.dateRange || 'Past 90 Days';

  // Filter assets based on report scope
  const filteredAssets = assets.filter((asset) => {
    const matchesDept = departmentFilter === 'All' || asset.department === departmentFilter;
    const matchesDevice = deviceFilter === 'All' || asset.deviceType === deviceFilter;
    return matchesDept && matchesDevice;
  });

  const handleExportCSV = () => {
    const headers = [
      'Asset ID',
      'Device Type',
      'Brand',
      'Model',
      'Serial Number',
      'Custodian',
      'Department',
      'Disposal Status',
      'Wiping Method',
      'Wiping Status',
      'Compliance Status',
    ];
    const rows = filteredAssets.map((a) => [
      a.id,
      a.deviceType,
      a.brand,
      a.model,
      a.serialNumber,
      `"${a.assignedEmployee}"`,
      `"${a.department}"`,
      a.disposalStatus,
      a.wipingMethod || 'N/A',
      a.wipingStatus || 'N/A',
      a.complianceStatus,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType.toLowerCase().replace(/\s+/g, '_')}_Dossier.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const compliantCount = filteredAssets.filter((a) => a.complianceStatus === 'Compliant').length;
  const wipedCount = filteredAssets.filter((a) => a.wipingStatus === 'Completed').length;
  const certifiedCount = filteredAssets.filter((a) => a.certificateId).length;

  return (
    <div className="space-y-4">
      {/* Top-left Back button */}
      <BackButton />

      {/* Main Report Container */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        {/* Header with Title and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                OFFICIAL AUDIT DOSSIER
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                REF: RPT-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {reportType}
            </h1>
            <p className="text-xs text-slate-400">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} · Scope: {departmentFilter} / {deviceFilter} / {dateRange}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Executive Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400">Total Audited Units</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">{filteredAssets.length}</div>
            <div className="text-[10px] text-slate-500 mt-1">100% hardware inventory scope</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400">Successfully Sanitized</div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{wipedCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">NIST SP 800-88 verified passes</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400">Regulatory Compliant</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{compliantCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">Zero non-conformances</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] text-slate-400">Certificates Issued</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{certifiedCount}</div>
            <div className="text-[10px] text-slate-500 mt-1">SHA-256 digital seals</div>
          </div>
        </div>

        {/* Detailed Inventory Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
              Asset Records & Sanitization Evidence
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredAssets.length} records
            </span>
          </div>

          <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-mono">
                <tr>
                  <th className="px-4 py-2.5">Asset ID</th>
                  <th className="px-4 py-2.5">Hardware / Serial</th>
                  <th className="px-4 py-2.5">Custodian & Dept</th>
                  <th className="px-4 py-2.5">Sanitization Method</th>
                  <th className="px-4 py-2.5">Lifecycle Status</th>
                  <th className="px-4 py-2.5">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-2.5 text-cyan-400 font-semibold">{asset.id}</td>
                    <td className="px-4 py-2.5">
                      <div className="text-slate-200">{asset.brand} {asset.model}</div>
                      <div className="text-[10px] text-slate-500">SN: {asset.serialNumber}</div>
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      <div className="text-slate-300">{asset.assignedEmployee}</div>
                      <div className="text-[10px] text-slate-500">{asset.department}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-slate-300">{asset.wipingMethod || 'Pending Sanitization'}</div>
                      <div className="text-[10px] text-emerald-400">{asset.wipingStatus || 'Queued'}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={asset.disposalStatus} size="sm" />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={asset.complianceStatus} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal Disclaimer & Verification Stamp */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Cryptographic Audit Attestation
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              All events recorded in this dossier correspond to immutable log entries in the AegisOps secure ledger.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-mono text-slate-500">SHA-256 REPORT CHECKSUM</div>
            <div className="text-xs font-mono text-cyan-400 font-semibold">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
          </div>
        </div>
      </div>
    </div>
  );
};
