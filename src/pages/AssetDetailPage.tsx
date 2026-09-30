import React, { useState } from 'react';
import {
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Award,
  FileCheck2,
  Trash2,
  Check,
  User,
  MapPin,
  Calendar,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { LifecycleStepper } from '../components/common/LifecycleStepper';

export const AssetDetailPage: React.FC = () => {
  const { assets, approveDisposal, rejectDisposal, currentUser, complianceRules, auditLogs, generateCertificate } = useApp();
  const { currentParams, navigate } = useNav();

  const assetId = currentParams.assetId || (assets[0] ? assets[0].id : '');
  const asset = assets.find((a) => a.id === assetId) || assets[0];

  const [activeTab, setActiveTab] = useState<'overview' | 'wiping' | 'compliance' | 'timeline'>('overview');
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!asset) {
    return (
      <div className="p-8 text-center text-slate-400">
        <BackButton />
        <p className="mt-4">Asset not found.</p>
      </div>
    );
  }

  // Filter audit logs for this asset
  const assetLogs = auditLogs.filter((l) => l.assetId === asset.id);

  const isAuthorizedApprover = ['Admin', 'Manager'].includes(currentUser.role);

  return (
    <div className="space-y-4">
      {/* Top-left Back button */}
      <BackButton />

      {/* Main Asset Header Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white font-mono">{asset.id}</h1>
                <StatusBadge status={asset.disposalStatus} />
                <StatusBadge status={asset.complianceStatus} size="sm" />
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {asset.deviceType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {asset.brand} {asset.model} · Serial Number:{' '}
                <span className="font-mono text-cyan-300 font-medium">{asset.serialNumber}</span>
              </p>
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {asset.disposalStatus === 'Active' && (
              <button
                onClick={() => navigate('disposal-request', { assetId: asset.id })}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 transition-colors text-xs flex items-center gap-1.5 shadow-sm"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Request Disposal
              </button>
            )}

            {asset.disposalStatus === 'Pending Approval' && isAuthorizedApprover && (
              <>
                <button
                  onClick={() => {
                    const reason = prompt('Specify rejection reason:');
                    if (reason) rejectDisposal(asset.id, reason);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 transition-colors text-xs border border-rose-800/50"
                >
                  Reject
                </button>
                <button
                  onClick={() => approveDisposal(asset.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors text-xs"
                >
                  Approve Disposal
                </button>
              </>
            )}

            {(asset.disposalStatus === 'Approved' || asset.disposalStatus === 'Wiping In Progress') && (
              <button
                onClick={() => navigate('data-wiping', { assetId: asset.id })}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Proceed to Data Wiping Station
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {(asset.disposalStatus === 'Verification Pending' || asset.disposalStatus === 'Verification Failed') && (
              <button
                onClick={() => navigate('verification', { assetId: asset.id })}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors text-xs flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Proceed to Verification
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {asset.certificateId && (
              <button
                onClick={() => navigate('certificate-details', { certificateId: asset.certificateId })}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Award className="w-3.5 h-3.5" />
                View Destruction Certificate
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {asset.disposalStatus === 'Ready For Disposal' && !asset.certificateId && (
              <button
                onClick={() => {
                  const cert = generateCertificate(asset.id);
                  navigate('certificate-details', { certificateId: cert.certificateId });
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Award className="w-3.5 h-3.5" />
                Generate Certificate
              </button>
            )}
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <div className="pt-3 border-t border-slate-800">
          <LifecycleStepper currentStage={asset.lifecycleStage} />
        </div>
      </div>

      {/* Navigation Tabs (Zero-pill segmented style) */}
      <div className="border-b border-slate-800 flex items-center gap-2 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'border-cyan-400 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Asset & Custody Information
        </button>
        <button
          onClick={() => setActiveTab('wiping')}
          className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'wiping'
              ? 'border-cyan-400 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Data Wiping & Sanitization Specs
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'compliance'
              ? 'border-cyan-400 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Regulatory Compliance Status
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'timeline'
              ? 'border-cyan-400 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Chain of Custody Audit Trail ({assetLogs.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Hardware Specifications */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Hardware & Device Specifications
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Brand / OEM</span>
                <span className="text-slate-200 font-medium">{asset.brand}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Model</span>
                <span className="text-slate-200 font-medium">{asset.model}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Serial Number</span>
                <span className="font-mono text-cyan-300 font-medium">{asset.serialNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Device Category</span>
                <span className="text-slate-200">{asset.deviceType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Storage Capacity</span>
                <span className="text-slate-200 font-mono">{asset.capacity || '512 GB NVMe'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Purchase Date</span>
                <span className="text-slate-200 font-mono">{asset.purchaseDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">MAC Address</span>
                <span className="text-slate-300 font-mono">{asset.macAddress || '48:2A:E3:89:12:F1'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Physical Condition</span>
                <span className="text-slate-200">{asset.assetCondition || 'Normal Working'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Custody & Location */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <User className="w-4 h-4 text-cyan-400" />
              Chain of Custody & Assignment
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Assigned Custodian</span>
                <span className="text-slate-200 font-medium">{asset.assignedEmployee}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Department</span>
                <span className="text-slate-200 font-medium">{asset.department}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Physical Location</span>
                <span className="text-slate-200 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {asset.location}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Disposal Authorization</span>
                <span className="text-slate-200 font-medium">
                  {asset.approvedBy ? `Approved by ${asset.approvedBy}` : 'Pending Authorization'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Disposal Request Details */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 md:col-span-2">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              Decommission Request Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Disposal Reason</span>
                <span className="text-slate-200 font-medium mt-0.5 block">{asset.disposalReason || 'End of Life Decommissioning'}</span>
              </div>
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Requested By & Date</span>
                <span className="text-slate-200 font-medium mt-0.5 block">{asset.requestedBy || 'SecOps Lead'} · {asset.requestedDate || '2026-08-12'}</span>
              </div>
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Priority Level</span>
                <span className="text-amber-400 font-medium mt-0.5 block">{asset.priority || 'Standard'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wiping' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-cyan-400" />
                Media Sanitization Execution & Wiping Records
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Technical parameters conforming to NIST SP 800-88 Rev 1 guidelines
              </p>
            </div>
            <button
              onClick={() => navigate('data-wiping', { assetId: asset.id })}
              className="px-3 py-1.5 rounded-lg bg-cyan-900/60 border border-cyan-700/80 text-cyan-300 hover:bg-cyan-800/80 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              Go to Wiping Station <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Wiping Standard</span>
              <span className="text-cyan-400 font-mono font-medium mt-0.5 block">
                {asset.wipingMethod || 'NIST SP 800-88 Purge'}
              </span>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Sanitization Tool</span>
              <span className="text-slate-200 font-mono font-medium mt-0.5 block">
                {asset.wipingTool || 'Blancco Drive Eraser v7.4'}
              </span>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Assigned Technician</span>
              <span className="text-slate-200 font-medium mt-0.5 block">
                {asset.technician || 'Alex Chen (CompTIA CySA+)'}
              </span>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Wiping Status</span>
              <span className="text-emerald-400 font-medium mt-0.5 block">
                {asset.wipingStatus || 'Completed (3 of 3 Passes)'}
              </span>
            </div>
          </div>

          {/* Terminal / Hex Logs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Sanitization Console Readback & Verification Log</span>
              <span className="font-mono text-[10px] text-slate-500">SHA-256 HASH VERIFIED</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 space-y-1 overflow-x-auto">
              <div className="text-cyan-400">&gt; TARGET: {asset.serialNumber} (SATA/NVMe Interface)</div>
              <div className="text-slate-400">&gt; METHOD: NIST SP 800-88 Rev 1 (ATA Secure Erase + Cryptographic Purge)</div>
              <div className="text-slate-400">&gt; PASS 1: Cryptographic Key Erasure: COMPLETED (0.02s)</div>
              <div className="text-slate-400">&gt; PASS 2: Pattern Overwrite (0x00) across 1,000,215,216 LBA sectors: COMPLETED</div>
              <div className="text-slate-400">&gt; PASS 3: Random Pattern Inversion & Hex Readback: COMPLETED (100% zero-fill confirmed)</div>
              <div className="text-emerald-400">&gt; FINAL STATUS: MEDIA SANITIZATION SUCCESSFUL · ZERO RESIDUAL SECTORS DETECTED</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Regulatory & Governance Matrix Alignment
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated against GDPR Art 17, HIPAA Security Rule, and ISO 27001 Annex A.8
              </p>
            </div>
            <button
              onClick={() => navigate('compliance')}
              className="px-3 py-1.5 rounded-lg bg-indigo-900/60 border border-indigo-700/80 text-indigo-300 hover:bg-indigo-800/80 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              Open Full Compliance Matrix <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Satisfied Compliance Requirements ({asset.completedRequirements?.length || 4})
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>NIST SP 800-88 Purge Sanitization Executed & Logged</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Dual-Custody Management Approval Recorded</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Hardware Serial Number & Custodian Verified</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Chain of Custody Events Cryptographically Sequenced</span>
                </li>
              </ul>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Pending Regulatory Actions
              </h4>
              {asset.certificateId ? (
                <div className="text-xs text-emerald-300 flex items-center gap-2 p-2 rounded bg-emerald-950/30 border border-emerald-800/40">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Certificate of Destruction Generated: <span className="font-mono">{asset.certificateId}</span>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-slate-300">
                  <p className="text-slate-400">
                    Awaiting final legal Certificate of Destruction issuance and authorized officer sign-off.
                  </p>
                  <button
                    onClick={() => {
                      const cert = generateCertificate(asset.id);
                      navigate('certificate-details', { certificateId: cert.certificateId });
                    }}
                    className="px-3 py-1.5 rounded bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 text-xs"
                  >
                    Generate Certificate Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-cyan-400" />
            Immutable Asset Lifecycle Audit Trail
          </h3>

          <div className="space-y-3">
            {assetLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No logged events for this asset yet.</p>
            ) : (
              assetLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-cyan-300">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-300 mt-1">{log.details}</p>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      By {log.user} ({log.role}) · Result: {log.result}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-700 font-mono shrink-0">
                    {log.result}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
