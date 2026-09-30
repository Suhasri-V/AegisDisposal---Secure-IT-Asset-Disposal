import React, { useState } from 'react';
import {
  X,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Award,
  FileCheck2,
  Trash2,
  Check,
  ChevronRight,
  User,
  MapPin,
  Calendar,
  Cpu,
} from 'lucide-react';
import { ITAsset } from '../../types';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { LifecycleStepper } from '../common/LifecycleStepper';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: ITAsset | null;
  onRequestDisposal?: (asset: ITAsset) => void;
  onStartWiping?: (asset: ITAsset) => void;
  onVerify?: (asset: ITAsset) => void;
  onViewCertificate?: (certId: string) => void;
  onGenerateCertificate?: (asset: ITAsset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  onRequestDisposal,
  onStartWiping,
  onVerify,
  onViewCertificate,
  onGenerateCertificate,
}) => {
  const { approveDisposal, rejectDisposal, currentUser, complianceRules } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'wiping' | 'compliance' | 'timeline'>('overview');

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono">{asset.id}</h2>
                <StatusBadge status={asset.disposalStatus} />
                <StatusBadge status={asset.complianceStatus} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                {asset.brand} {asset.model} · SN: <span className="font-mono text-slate-300">{asset.serialNumber}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Lifecycle Stepper */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/30">
          <LifecycleStepper currentStage={asset.lifecycleStage} />
        </div>

        {/* Navigation Tabs (Zero-pill compliant segmented control) */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Asset & Custody
          </button>
          <button
            onClick={() => setActiveTab('wiping')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'wiping'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Data Wiping & Verification
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'compliance'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Compliance & Certificate
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'timeline'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Lifecycle Audit History
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Asset Information Card */}
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="font-semibold text-slate-200 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  Asset Specifications
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Device Category</span>
                    <span className="font-medium text-slate-200">{asset.deviceType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Brand & Model</span>
                    <span className="font-medium text-slate-200">{asset.brand} {asset.model}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Hardware Serial No</span>
                    <span className="font-mono text-cyan-400 font-medium">{asset.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Storage Media / Capacity</span>
                    <span>{asset.capacity || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Purchase / Commission Date</span>
                    <span className="font-mono">{asset.purchaseDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Assigned Custodian</span>
                    <span className="font-medium text-slate-200">{asset.assignedEmployee}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Department</span>
                    <span>{asset.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Facility Location</span>
                    <span>{asset.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Network IP / MAC</span>
                    <span className="font-mono text-slate-400">{asset.ipAddress || 'DHCP'} · {asset.macAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Disposal Information Card */}
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="font-semibold text-slate-200 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                  Disposal Authorization Details
                </h3>
                {asset.disposalReason ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-slate-300">
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[10px]">Disposal Justification</span>
                      <span className="font-medium text-slate-200">{asset.disposalReason}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Physical Condition</span>
                      <span>{asset.assetCondition || 'Working'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Requested By</span>
                      <span>{asset.requestedBy}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Requested Date</span>
                      <span className="font-mono">{asset.requestedDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Authorization Sign-off</span>
                      <span className="font-medium text-emerald-400">{asset.approvedBy || 'Pending Sign-off'}</span>
                    </div>
                    {asset.finalDisposalDate && (
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[10px]">Final Disposal Vendor</span>
                        <span className="text-purple-400 font-medium">{asset.disposalVendor} ({asset.finalDisposalDate})</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs py-2">
                    No disposal request has been filed yet for this asset. It is currently in active organizational custody.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'wiping' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="font-semibold text-slate-200 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-cyan-400" />
                  Sanitization Protocol & Verification Status
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Sanitization Method</span>
                    <span className="font-medium text-emerald-400">{asset.wipingMethod || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Sanitization Tool / Rig</span>
                    <span>{asset.wipingTool || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Assigned Technician</span>
                    <span>{asset.technician || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Wiping Start Time</span>
                    <span className="font-mono">{asset.wipingStartTime || 'Not started'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Wiping End Time</span>
                    <span className="font-mono">{asset.wipingEndTime || 'Incomplete'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Independent Verifier</span>
                    <span className="font-medium text-cyan-300">{asset.verifiedBy || 'Pending'}</span>
                  </div>
                </div>

                {asset.verificationNotes && (
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Verification Officer Audit Notes:</span>
                    <p className="text-slate-300 italic text-[11px] mt-0.5">{asset.verificationNotes}</p>
                  </div>
                )}
              </div>

              {/* Terminal Logs */}
              {asset.wipeLogOutput && asset.wipeLogOutput.length > 0 && (
                <div>
                  <span className="text-slate-400 text-[11px] font-mono block mb-1">
                    Recorded Sanitization Log Output
                  </span>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400/90 space-y-1">
                    {asset.wipeLogOutput.map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-200 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Regulatory Compliance Checklist
                  </h3>
                  <StatusBadge status={asset.complianceStatus} size="sm" />
                </div>

                <div className="space-y-2 pt-1">
                  {complianceRules.map((rule) => {
                    const isDone = asset.completedRequirements.includes(rule.id);
                    return (
                      <div
                        key={rule.id}
                        className={`flex items-start justify-between p-2.5 rounded border text-xs ${
                          isDone
                            ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                            : 'bg-rose-950/20 border-rose-900/40 text-slate-400'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                              isDone ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-600'
                            }`}
                          >
                            {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="text-[10px]">○</span>}
                          </div>
                          <div>
                            <div className={`font-medium ${isDone ? 'text-slate-200' : 'text-slate-400'}`}>
                              {rule.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {rule.standardReference} · {rule.category}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-mono shrink-0 px-2 py-0.5 rounded ${
                            isDone ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {isDone ? 'COMPLIANT' : 'PENDING'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Certificate Snapshot */}
              {asset.certificateId && (
                <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      Certificate of Data Destruction Issued
                    </span>
                    <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                      ID: {asset.certificateId} · Issued: {asset.certificateIssuedDate}
                    </div>
                  </div>
                  {onViewCertificate && (
                    <button
                      onClick={() => onViewCertificate(asset.certificateId!)}
                      className="px-3 py-1.5 rounded-md bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 text-xs"
                    >
                      View Certificate
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-200 uppercase text-[11px] tracking-wider">
                Asset Lifecycle Chronology
              </h3>
              <div className="space-y-3 pl-2 border-l-2 border-slate-800 ml-2">
                <div className="relative pl-4">
                  <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-900" />
                  <div className="font-medium text-slate-200 text-xs">Asset Registered in Inventory</div>
                  <div className="text-[10px] text-slate-500 font-mono">{asset.purchaseDate} · Assigned to {asset.assignedEmployee}</div>
                </div>

                {asset.requestedDate && (
                  <div className="relative pl-4">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900" />
                    <div className="font-medium text-slate-200 text-xs">Disposal Authorization Requested</div>
                    <div className="text-[10px] text-slate-500 font-mono">{asset.requestedDate} · By {asset.requestedBy}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{asset.disposalReason}</p>
                  </div>
                )}

                {asset.approvalDate && (
                  <div className="relative pl-4">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
                    <div className="font-medium text-slate-200 text-xs">Disposal Approved by Manager</div>
                    <div className="text-[10px] text-slate-500 font-mono">{asset.approvalDate} · Approved by {asset.approvedBy}</div>
                  </div>
                )}

                {asset.wipingStartTime && (
                  <div className="relative pl-4">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-900" />
                    <div className="font-medium text-slate-200 text-xs">Data Sanitization Executed ({asset.wipingMethod})</div>
                    <div className="text-[10px] text-slate-500 font-mono">{asset.wipingStartTime} · Status: {asset.wipingStatus}</div>
                  </div>
                )}

                {asset.verificationDate && (
                  <div className="relative pl-4">
                    <div className={`absolute -left-[21px] top-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${asset.verificationResult === 'Passed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div className="font-medium text-slate-200 text-xs">Wiping Verification: {asset.verificationResult}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{asset.verificationDate} · Verified by {asset.verifiedBy}</div>
                  </div>
                )}

                {asset.certificateIssuedDate && (
                  <div className="relative pl-4">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    <div className="font-medium text-slate-200 text-xs">Certificate of Destruction Issued</div>
                    <div className="text-[10px] text-slate-500 font-mono">{asset.certificateIssuedDate} · {asset.certificateId}</div>
                  </div>
                )}

                {asset.finalDisposalDate && (
                  <div className="relative pl-4">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-slate-900" />
                    <div className="font-medium text-slate-200 text-xs">Final Physical Disposal & Recycling Completed</div>
                    <div className="text-[10px] text-slate-500 font-mono">{asset.finalDisposalDate} · Recycler: {asset.disposalVendor}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Contextual Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            Lifecycle stage: <strong className="text-slate-200">{asset.lifecycleStage}</strong>
          </div>

          <div className="flex items-center gap-2">
            {/* Step 1: Active -> Request Disposal */}
            {asset.disposalStatus === 'Active' && onRequestDisposal && (
              <button
                onClick={() => {
                  onClose();
                  onRequestDisposal(asset);
                }}
                className="px-3.5 py-1.5 rounded-md bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 transition-colors text-xs"
              >
                Request Disposal
              </button>
            )}

            {/* Step 2: Pending Approval -> Approve / Reject */}
            {asset.disposalStatus === 'Pending Approval' && (
              <>
                <button
                  onClick={() => {
                    rejectDisposal(asset.id, 'Condition re-evaluation or redeployment required');
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-md bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 transition-colors text-xs border border-rose-800/50"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => {
                    approveDisposal(asset.id);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-md bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors text-xs"
                >
                  Approve Disposal
                </button>
              </>
            )}

            {/* Step 3: Approved / Wiping in progress -> Start Wiping */}
            {(asset.disposalStatus === 'Approved' || asset.disposalStatus === 'Wiping In Progress') && onStartWiping && (
              <button
                onClick={() => {
                  onClose();
                  onStartWiping(asset);
                }}
                className="px-3.5 py-1.5 rounded-md bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {asset.disposalStatus === 'Wiping In Progress' ? 'Continue Wiping' : 'Start Certified Wiping'}
              </button>
            )}

            {/* Step 4: Verification Pending -> Verify */}
            {(asset.disposalStatus === 'Verification Pending' || asset.disposalStatus === 'Verification Failed') && onVerify && (
              <button
                onClick={() => {
                  onClose();
                  onVerify(asset);
                }}
                className="px-3.5 py-1.5 rounded-md bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Review & Verify Sanitization
              </button>
            )}

            {/* Step 5: Ready For Disposal / Verified -> Generate Certificate */}
            {asset.disposalStatus === 'Ready For Disposal' && !asset.certificateId && onGenerateCertificate && (
              <button
                onClick={() => {
                  onClose();
                  onGenerateCertificate(asset);
                }}
                className="px-3.5 py-1.5 rounded-md bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors text-xs flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                Generate Certificate of Destruction
              </button>
            )}

            {/* Certificate View */}
            {asset.certificateId && onViewCertificate && (
              <button
                onClick={() => {
                  onClose();
                  onViewCertificate(asset.certificateId!);
                }}
                className="px-3.5 py-1.5 rounded-md bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors text-xs flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                View Certificate
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
