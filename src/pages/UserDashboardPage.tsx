import React from 'react';
import {
  HardDrive,
  FileCheck2,
  Trash2,
  CheckCircle2,
  Award,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Download,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { ITAsset, LifecycleStage } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

interface UserDashboardPageProps {
  onSelectAsset: (asset: ITAsset) => void;
  onOpenNewAssetModal: () => void;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  'Registered',
  'Disposal Requested',
  'Approved',
  'Data Wiping',
  'Verification',
  'Compliance Review',
  'Certificate Generated',
  'Disposed',
];

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  onSelectAsset,
  onOpenNewAssetModal,
}) => {
  const { currentUser, assets, certificates, notifications } = useApp();
  const { navigate } = useNav();

  // Scope assets strictly to current user
  const userName = currentUser.name.toLowerCase();
  const myAssets = assets.filter(
    (a) =>
      a.userId === currentUser.id ||
      a.assignedEmployee.toLowerCase() === userName ||
      (a.requestedBy && a.requestedBy.toLowerCase() === userName)
  );

  // My disposal requests
  const myRequests = myAssets.filter(
    (a) => a.disposalReason || a.disposalStatus !== 'Active'
  );

  // My certificates
  const myAssetIds = new Set(myAssets.map((a) => a.id));
  const myCertificates = certificates.filter((c) => myAssetIds.has(c.assetId));

  // Counts
  const totalAssets = myAssets.length;
  const pendingRequests = myRequests.filter((a) => a.disposalStatus === 'Pending Approval').length;
  const approvedRequests = myRequests.filter((a) =>
    ['Approved', 'Wiping In Progress', 'Ready For Disposal', 'Disposed'].includes(a.disposalStatus)
  ).length;
  const rejectedRequests = myRequests.filter((a) => a.disposalStatus === 'Rejected').length;
  const wipingInProgress = myAssets.filter((a) => a.disposalStatus === 'Wiping In Progress').length;
  const verifiedAssets = myAssets.filter((a) => a.verificationResult === 'Passed').length;
  const availableCerts = myCertificates.length;

  return (
    <div className="space-y-6">
      {/* User Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-mono text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            Standard User Workspace · RBAC Active
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
            Welcome back, {currentUser.name}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Custodian Department: <span className="text-slate-200 font-medium">{currentUser.department}</span> ·
            Manage your registered hardware, request formal decommission, and download destruction certificates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenNewAssetModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Register IT Asset
          </button>
          <button
            onClick={() => navigate('disposal-request')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
          >
            <FileCheck2 className="w-4 h-4" />
            Submit Disposal Request
          </button>
        </div>
      </div>

      {/* Database KPI Metrics Grid for User */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => navigate('assets')}
          className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>My Assets</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 tabular-nums">{totalAssets}</div>
          <div className="text-[10px] text-slate-500 mt-1">In your custody</div>
        </div>

        <div
          onClick={() => navigate('disposal-requests')}
          className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2 tabular-nums">{pendingRequests}</div>
          <div className="text-[10px] text-slate-500 mt-1">Awaiting admin review</div>
        </div>

        <div
          onClick={() => navigate('disposal-requests')}
          className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Approved Requests</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2 tabular-nums">{approvedRequests}</div>
          <div className="text-[10px] text-slate-500 mt-1">Authorized for wiping</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Wiping Progress</span>
            <Trash2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-2 tabular-nums">{wipingInProgress}</div>
          <div className="text-[10px] text-slate-500 mt-1">In clean-bay station</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Verified Media</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-2 tabular-nums">{verifiedAssets}</div>
          <div className="text-[10px] text-slate-500 mt-1">Hex readback passed</div>
        </div>

        <div
          onClick={() => navigate('certificates')}
          className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Certificates</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2 tabular-nums">{availableCerts}</div>
          <div className="text-[10px] text-slate-500 mt-1">SHA-256 sealed proofs</div>
        </div>
      </div>

      {/* Active Disposal Requests & Real Timeline Trackers */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              Active Decommission & Sanitization Tracking
            </h2>
            <p className="text-xs text-slate-400">
              Live lifecycle state transitions for your submitted IT assets
            </p>
          </div>
          <button
            onClick={() => navigate('disposal-requests')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            View all requests <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {myRequests.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
            <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs text-slate-400 font-medium">No active disposal requests</div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              You haven't submitted any hardware for decommission yet. Select an eligible asset below to request disposal.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myRequests.slice(0, 3).map((asset) => {
              const currentStageIdx = LIFECYCLE_STAGES.indexOf(asset.lifecycleStage);
              const isRejected = asset.disposalStatus === 'Rejected';

              return (
                <div
                  key={asset.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-cyan-400 font-semibold text-xs">{asset.id}</span>
                      <span className="text-slate-300 text-xs font-medium">
                        {asset.brand} {asset.model} (SN: {asset.serialNumber})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={asset.disposalStatus} />
                      <button
                        onClick={() => onSelectAsset(asset)}
                        className="p-1 text-slate-400 hover:text-slate-200"
                        title="View Asset Dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Status Stepper */}
                  <div className="pt-2">
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-[10px]">
                      {LIFECYCLE_STAGES.map((stage, idx) => {
                        const isPast = idx < currentStageIdx;
                        const isCurrent = idx === currentStageIdx;
                        const isStageRejected = isRejected && stage === 'Approved';

                        let bgClass = 'bg-slate-900 border-slate-800 text-slate-500';
                        if (isStageRejected) {
                          bgClass = 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-semibold';
                        } else if (isCurrent) {
                          bgClass = 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold';
                        } else if (isPast) {
                          bgClass = 'bg-slate-800 border-slate-700 text-slate-300';
                        }

                        return (
                          <div
                            key={stage}
                            className={`p-1.5 rounded border text-center truncate ${bgClass}`}
                            title={stage}
                          >
                            <div className="text-[9px] font-mono text-slate-500">0{idx + 1}</div>
                            <div className="truncate font-medium">{stage}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Remarks & Feedback */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                    <div>
                      <span className="text-slate-500">Reason:</span> {asset.disposalReason || 'N/A'}
                    </div>
                    {isRejected && asset.rejectionReason && (
                      <div className="text-rose-400 font-medium">
                        <span className="text-rose-500">Rejection Reason:</span> {asset.rejectionReason}
                      </div>
                    )}
                    {asset.approvedBy && (
                      <div className="text-slate-400">
                        <span className="text-slate-500">Approved by:</span> {asset.approvedBy} on {asset.approvalDate}
                      </div>
                    )}
                    {asset.certificateId && (
                      <button
                        onClick={() => navigate('certificate-details', { certificateId: asset.certificateId })}
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        <Award className="w-3.5 h-3.5" /> Certificate: {asset.certificateId} →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: My Assets & My Available Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Assets */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              IT Assets in Your Custody ({myAssets.length})
            </h3>
            <button
              onClick={() => navigate('assets')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View all →
            </button>
          </div>

          {myAssets.length === 0 ? (
            <p className="text-xs text-slate-500 p-4 text-center">No assets found in your custody.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {myAssets.slice(0, 5).map((asset) => (
                <div
                  key={asset.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-semibold">{asset.id}</span>
                      <span className="text-slate-200 font-medium truncate">{asset.brand} {asset.model}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      SN: {asset.serialNumber} · Condition: {asset.assetCondition || 'Working'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={asset.disposalStatus} />
                    {asset.disposalStatus === 'Active' && (
                      <button
                        onClick={() => navigate('disposal-request', { assetId: asset.id })}
                        className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-semibold hover:bg-amber-500/30 transition-colors"
                      >
                        Request Disposal
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Available Certificates */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Destruction Certificates ({myCertificates.length})
            </h3>
            <button
              onClick={() => navigate('certificates')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View all →
            </button>
          </div>

          {myCertificates.length === 0 ? (
            <p className="text-xs text-slate-500 p-4 text-center">
              No certificates issued yet. Once data sanitization and verification conclude, certificates will appear here.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {myCertificates.map((cert) => (
                <div
                  key={cert.certificateId}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-mono text-cyan-400 font-semibold">{cert.certificateId}</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Asset {cert.assetId} · {cert.brand} {cert.model}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Issued: {cert.issueDate} · Sealed: {cert.sha256Hash.slice(0, 12)}...
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('certificate-details', { certificateId: cert.certificateId })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-semibold transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    View & Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
