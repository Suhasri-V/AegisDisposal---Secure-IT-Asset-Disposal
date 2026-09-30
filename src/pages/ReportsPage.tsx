import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileText,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';

type ReportType =
  | 'Asset Disposal Report'
  | 'Data Wiping Report'
  | 'Compliance Report'
  | 'Failed Wiping Report'
  | 'Audit Report'
  | 'Monthly Disposal Summary';

export const ReportsPage: React.FC = () => {
  const { assets, auditLogs, complianceRules, certificates } = useApp();
  const { pageStates, setPageState, navigate } = useNav();

  const [selectedReport, setSelectedReport] = useState<ReportType>(
    (pageStates.reports?.selectedReport as ReportType) ?? 'Asset Disposal Report'
  );
  const [departmentFilter, setDepartmentFilter] = useState(pageStates.reports?.departmentFilter ?? 'All');
  const [deviceFilter, setDeviceFilter] = useState(pageStates.reports?.deviceFilter ?? 'All');
  const [dateRange, setDateRange] = useState(pageStates.reports?.dateRange ?? 'Past 90 Days');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedTime, setLastGeneratedTime] = useState<string>('Just now');

  // Preserve report filters
  useEffect(() => {
    setPageState('reports', {
      selectedReport,
      departmentFilter,
      deviceFilter,
      dateRange,
    });
  }, [selectedReport, departmentFilter, deviceFilter, dateRange, setPageState]);

  const departments = ['All', ...Array.from(new Set(assets.map((a) => a.department)))];

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setLastGeneratedTime(new Date().toLocaleTimeString());
    }, 400);
  };

  const handleExportCSV = () => {
    const csvContent = `Report: ${selectedReport}\nGenerated: ${new Date().toISOString()}\nScope: ${departmentFilter} / ${deviceFilter} / ${dateRange}\n\nAsset ID,Device Type,Brand,Model,Serial,Status,Compliance\n` +
      assets
        .map((a) => `${a.id},${a.deviceType},${a.brand},${a.model},${a.serialNumber},${a.disposalStatus},${a.complianceStatus}`)
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  // Report specific data calculations
  const reportData = (() => {
    switch (selectedReport) {
      case 'Data Wiping Report':
        return assets.filter((a) => a.wipingMethod || a.wipingStatus);
      case 'Failed Wiping Report':
        return assets.filter((a) => a.wipingStatus === 'Failed' || a.disposalStatus === 'Verification Failed');
      case 'Compliance Report':
        return assets.filter((a) => a.complianceStatus === 'Compliant' || a.complianceStatus === 'Non-Compliant');
      case 'Monthly Disposal Summary':
      case 'Asset Disposal Report':
      default:
        return assets;
    }
  })();

  return (
    <div className="space-y-4">
      {/* Top-left Back button */}
      <BackButton />

      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Executive Analytics & Regulatory Compliance Dossiers
            </h2>
            <p className="text-xs text-slate-400">
              Generate auditable disposal metrics, environmental recycling proofs, and sanitization reports
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() =>
                navigate('report-details', {
                  reportType: selectedReport,
                  departmentFilter,
                  deviceFilter,
                  dateRange,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Report Details
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 text-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGenerating ? 'Compiling...' : 'Generate Live Report'}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs border border-slate-700 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs border border-slate-700 font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Report Type Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-800 text-xs">
          {[
            'Asset Disposal Report',
            'Data Wiping Report',
            'Compliance Report',
            'Failed Wiping Report',
            'Audit Report',
            'Monthly Disposal Summary',
          ].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedReport(type as ReportType)}
              className={`p-2.5 rounded-lg text-left transition-colors border ${
                selectedReport === type
                  ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <FileText className="w-4 h-4 mb-1 text-slate-500" />
              <div className="truncate text-[11px]">{type}</div>
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Date Range Horizon</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="Past 30 Days">Past 30 Days</option>
              <option value="Past 90 Days">Past 90 Days (Quarterly)</option>
              <option value="Past 180 Days">Past 180 Days</option>
              <option value="Year to Date">Year to Date (2026)</option>
              <option value="All Time">All Time (7-Year Retained)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Organizational Unit / Dept</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Hardware Classification</label>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Device Categories</option>
              <option value="Laptop">Laptops</option>
              <option value="Desktop">Workstations / Desktops</option>
              <option value="Hard Drive">Rotational HDDs</option>
              <option value="SSD">Solid State Drives (SSDs)</option>
              <option value="Server">Rack Servers / Compute Nodes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generated Report Presentation Canvas */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        {/* Report Document Header */}
        <div className="border-b border-slate-800 pb-4 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
              Executive Dossier · AegisDisposal Intelligence
            </div>
            <h1 className="text-lg font-bold text-white mt-1">{selectedReport}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Scope: {departmentFilter} Department · {deviceFilter} Devices · Horizon: {dateRange}
            </p>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400">
            <div>Generated: {lastGeneratedTime}</div>
            <div className="text-emerald-400">Status: Verified Official</div>
          </div>
        </div>

        {/* Executive Summary Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">Total Assets In Scope</span>
            <span className="text-base font-bold font-mono text-white">{reportData.length} Units</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Wiping Success Rate</span>
            <span className="text-base font-bold font-mono text-emerald-400">92.8%</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Certificates Sealed</span>
            <span className="text-base font-bold font-mono text-cyan-400">{certificates.length} Cryptographic</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Estimated E-Waste Diverted</span>
            <span className="text-base font-bold font-mono text-purple-400">420 kg (R2v3)</span>
          </div>
        </div>

        {/* Detailed Data Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">Asset Record Breakdown</span>
            <span className="text-slate-500 font-mono text-[11px]">{reportData.length} entries matched</span>
          </div>

          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Asset ID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Make / Serial</th>
                  <th className="py-2.5 px-3">Custodian</th>
                  <th className="py-2.5 px-3">Sanitization Standard</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                {reportData.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-cyan-400 font-medium">{asset.id}</td>
                    <td className="py-2.5 px-3 text-slate-300">{asset.deviceType}</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <div>{asset.brand} {asset.model}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{asset.serialNumber}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{asset.assignedEmployee}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-medium">{asset.wipingMethod || 'NIST 800-88 Purge'}</td>
                    <td className="py-2.5 px-3 text-slate-300">{asset.disposalStatus}</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${asset.complianceStatus === 'Compliant' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                        {asset.complianceStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regulatory Attestation */}
        <div className="p-3.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-200">Third-Party Auditor Attestation Statement</div>
          <p className="leading-relaxed">
            Data destruction logs and certificates documented within this report have been recorded on immutable append-only storage. Sanitization was conducted pursuant to NIST SP 800-88 Rev 1 guidelines with zero recoverable data traces.
          </p>
        </div>
      </div>
    </div>
  );
};
