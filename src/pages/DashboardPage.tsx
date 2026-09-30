import React, { useState } from 'react';
import {
  HardDrive,
  Clock,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Award,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Check,
  Calendar,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ITAsset, LifecycleStage } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LifecycleStepper } from '../components/common/LifecycleStepper';
import { PageId } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
  onSelectAsset: (asset: ITAsset) => void;
  onOpenNewAssetModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onSelectAsset,
  onOpenNewAssetModal,
}) => {
  const { assets, auditLogs, complianceRules, certificates } = useApp();
  const [selectedStageFilter, setSelectedStageFilter] = useState<LifecycleStage | null>(null);

  // Computed metrics
  const totalAssets = assets.length;
  const pendingDisposal = assets.filter((a) => a.disposalStatus === 'Pending Approval').length;
  const approvedDisposal = assets.filter((a) => a.disposalStatus === 'Approved').length;
  const wipingInProgress = assets.filter((a) => a.disposalStatus === 'Wiping In Progress').length;
  const successfullyWiped = assets.filter(
    (a) => a.wipingStatus === 'Completed' || ['Ready For Disposal', 'Disposed'].includes(a.disposalStatus)
  ).length;
  const verificationPending = assets.filter(
    (a) => a.disposalStatus === 'Verification Pending' || a.disposalStatus === 'Verification Failed'
  ).length;
  const complianceIssues = assets.filter((a) => a.complianceStatus === 'Non-Compliant').length;
  const readyForDisposal = assets.filter((a) => a.disposalStatus === 'Ready For Disposal').length;

  // Chart data calculations
  // 1. Assets by Status
  const statusCounts = {
    Active: assets.filter((a) => a.disposalStatus === 'Active').length,
    'Pending Approval': pendingDisposal,
    Approved: approvedDisposal,
    'In Sanitization': wipingInProgress,
    'Pending Verification': verificationPending,
    'Ready / Certified': readyForDisposal,
    Disposed: assets.filter((a) => a.disposalStatus === 'Disposed').length,
  };

  // 2. Assets by Device Type
  const deviceTypeCounts: Record<string, number> = {};
  assets.forEach((a) => {
    deviceTypeCounts[a.deviceType] = (deviceTypeCounts[a.deviceType] || 0) + 1;
  });

  // 3. Wiping Success vs Failure
  const wipingCompletedCount = assets.filter((a) => a.wipingStatus === 'Completed').length;
  const wipingFailedCount = assets.filter(
    (a) => a.wipingStatus === 'Failed' || a.disposalStatus === 'Verification Failed'
  ).length;
  const wipingTotal = wipingCompletedCount + wipingFailedCount || 1;
  const wipingSuccessRate = Math.round((wipingCompletedCount / wipingTotal) * 100);

  // 4. Compliance Percentage
  const compliantCount = assets.filter((a) => a.complianceStatus === 'Compliant').length;
  const compliancePercentage = Math.round((compliantCount / (totalAssets || 1)) * 100);

  // Filtered assets by interactive stepper
  const displayedAssets = selectedStageFilter
    ? assets.filter((a) => a.lifecycleStage === selectedStageFilter)
    : assets.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div
          onClick={() => onNavigate('assets')}
          className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium truncate">Total IT Assets</div>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">{totalAssets}</div>
          <div className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1 font-mono">
            <span>In Inventory</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('disposal-requests')}
          className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium truncate">Pending Disposal</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1 tabular-nums">{pendingDisposal}</div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">Awaiting Approval</div>
        </div>

        <div
          onClick={() => onNavigate('disposal-requests')}
          className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium truncate">Approved Disposal</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1 tabular-nums">{approvedDisposal}</div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">Queued for Wiping</div>
        </div>

        <div
          onClick={() => onNavigate('data-wiping')}
          className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium truncate">Wiping In Progress</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">{wipingInProgress}</div>
          <div className="text-[10px] text-cyan-400/80 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Active Overwrite
          </div>
        </div>

        <div
          onClick={() => onNavigate('data-wiping')}
          className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium truncate">Successfully Wiped</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">{successfullyWiped}</div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">NIST 800-88 Purge</div>
        </div>

        <div
          onClick={() => onNavigate('verification')}
          className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium truncate">Verification Pending</div>
          <div className="text-xl font-bold font-mono text-indigo-400 mt-1 tabular-nums">{verificationPending}</div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">Hex Readback QA</div>
        </div>

        <div
          onClick={() => onNavigate('compliance')}
          className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium truncate">Compliance Issues</div>
          <div className={`text-xl font-bold font-mono mt-1 tabular-nums ${complianceIssues > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {complianceIssues}
          </div>
          <div className="text-[10px] text-rose-400/80 mt-1 truncate">
            {complianceIssues > 0 ? 'Action Required' : '0 Alerts'}
          </div>
        </div>

        <div
          onClick={() => onNavigate('certificates')}
          className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="text-[11px] text-slate-400 font-medium truncate">Ready for Disposal</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">{readyForDisposal}</div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">Certified & Cleared</div>
        </div>
      </div>

      {/* Interactive Lifecycle Tracker Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              IT Asset Disposal & Sanitization Lifecycle Pipeline
            </h2>
            <p className="text-xs text-slate-400">
              Click any stage below to inspect assets currently processing in that phase
            </p>
          </div>
          {selectedStageFilter && (
            <button
              onClick={() => setSelectedStageFilter(null)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Clear Filter (Showing all)
            </button>
          )}
        </div>

        <div className="pt-2">
          <LifecycleStepper
            currentStage={selectedStageFilter || 'Data Wiping'}
            interactive={true}
            onSelectStage={(stage) => setSelectedStageFilter(stage)}
          />
        </div>

        {selectedStageFilter && (
          <div className="text-xs text-slate-300 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>
              Filtering assets in phase: <strong className="text-cyan-400">{selectedStageFilter}</strong> (
              {assets.filter((a) => a.lifecycleStage === selectedStageFilter).length} assets found)
            </span>
          </div>
        )}
      </div>

      {/* Visual Analytics & Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Chart 1: Assets by Disposal Lifecycle Status */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200">Assets by Disposal Status</h3>
            <span className="text-[10px] font-mono text-slate-500">Live Breakdown</span>
          </div>
          <div className="space-y-2 pt-1 text-xs">
            {Object.entries(statusCounts).map(([statusName, count]) => {
              const pct = Math.round((count / (totalAssets || 1)) * 100);
              return (
                <div key={statusName} className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300 text-[11px]">
                    <span className="truncate">{statusName}</span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        statusName.includes('Failed')
                          ? 'bg-rose-500'
                          : statusName.includes('Sanitization')
                          ? 'bg-cyan-500'
                          : statusName.includes('Certified') || statusName.includes('Disposed')
                          ? 'bg-emerald-500'
                          : statusName.includes('Approval')
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Assets by Device Category */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200">Assets by Device Category</h3>
            <span className="text-[10px] font-mono text-slate-500">{Object.keys(deviceTypeCounts).length} Types</span>
          </div>
          <div className="space-y-2.5 pt-1 text-xs">
            {Object.entries(deviceTypeCounts).map(([type, count]) => {
              const pct = Math.round((count / (totalAssets || 1)) * 100);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300 text-[11px]">
                    <span>{type}</span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {count} units ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Sanitization Success vs Failure & Compliance Score */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200">Quality & Compliance Rates</h3>
            <span className="text-[10px] font-mono text-emerald-400">Audited</span>
          </div>

          {/* Wiping Success Ratio Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Wiping Success Rate:</span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                {wipingSuccessRate}% Success
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${wipingSuccessRate}%` }}
                title={`${wipingCompletedCount} passed`}
              />
              <div
                className="h-full bg-rose-500"
                style={{ width: `${100 - wipingSuccessRate}%` }}
                title={`${wipingFailedCount} failed`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{wipingCompletedCount} Passes Verified</span>
              <span>{wipingFailedCount} Retries / Fails</span>
            </div>
          </div>

          {/* Regulatory Compliance Gauge */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Organizational Compliance:</span>
              <span className="font-mono font-bold text-cyan-400 tabular-nums">
                {compliancePercentage}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500"
                style={{ width: `${compliancePercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>{compliantCount} Fully Compliant</span>
              <span>{totalAssets - compliantCount} Review Required</span>
            </div>
          </div>

          <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Certificates Issued:</span>
            <span className="font-mono font-bold text-emerald-400">{certificates.length} Sealed</span>
          </div>
        </div>
      </div>

      {/* Main Bottom Section: Recent Assets Table & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Assets Quick View Table */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Active Lifecycle Queue</h3>
              <p className="text-xs text-slate-400">
                {selectedStageFilter ? `Filtered by ${selectedStageFilter}` : 'Most recently updated assets'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenNewAssetModal}
                className="px-3 py-1.5 rounded-md bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors text-xs"
              >
                + Add Asset
              </button>
              <button
                onClick={() => onNavigate('assets')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                View all inventory <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-2 pl-1">Asset ID</th>
                  <th className="pb-2">Device & Model</th>
                  <th className="pb-2">Serial Number</th>
                  <th className="pb-2">Custodian</th>
                  <th className="pb-2">Disposal Status</th>
                  <th className="pb-2">Compliance</th>
                  <th className="pb-2 pr-1 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      No assets found in stage "{selectedStageFilter}"
                    </td>
                  </tr>
                ) : (
                  displayedAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => onSelectAsset(asset)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 pl-1 font-mono text-cyan-400 font-semibold whitespace-nowrap">
                        {asset.id}
                      </td>
                      <td className="py-2.5 text-slate-200">
                        <div className="font-medium truncate max-w-[140px]">
                          {asset.brand} {asset.model}
                        </div>
                        <div className="text-[10px] text-slate-500">{asset.deviceType}</div>
                      </td>
                      <td className="py-2.5 font-mono text-slate-400 whitespace-nowrap">
                        {asset.serialNumber}
                      </td>
                      <td className="py-2.5 text-slate-300 truncate max-w-[110px]">
                        {asset.assignedEmployee}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <StatusBadge status={asset.disposalStatus} size="sm" />
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <StatusBadge status={asset.complianceStatus} size="sm" />
                      </td>
                      <td className="py-2.5 pr-1 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAsset(asset);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Activity Feed */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Live Audit Trail
            </h3>
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              All logs
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {auditLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80 text-xs space-y-1 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 truncate">{log.action}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      log.result === 'Success'
                        ? 'text-emerald-400 bg-emerald-950/50'
                        : 'text-rose-400 bg-rose-950/50'
                    }`}
                  >
                    {log.result}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="font-mono text-cyan-400 font-medium">{log.assetId}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{log.user}</span>
                </div>
                {log.details && (
                  <p className="text-[10px] text-slate-500 italic truncate">{log.details}</p>
                )}
                <div className="text-[10px] text-slate-600 font-mono">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
