import React, { useState } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  HardDrive,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';
import { Priority, ITAsset } from '../types';

export const DisposalRequestCreatePage: React.FC = () => {
  const { assets, requestDisposal, currentUser } = useApp();
  const { currentParams, goBack, navigate } = useNav();

  const preselectedAssetId = currentParams.assetId || (assets[0] ? assets[0].id : '');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(preselectedAssetId);
  const [reason, setReason] = useState<string>('End of Life / Deprecated');
  const [condition, setCondition] = useState<ITAsset['assetCondition']>('Working');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;

    requestDisposal(selectedAssetId, reason, condition, priority, notes);
    setIsSubmitted(true);

    setTimeout(() => {
      goBack();
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Top-left Back button */}
      <BackButton />

      {/* Main Form Container */}
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Banner */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                Submit IT Asset Decommission & Disposal Request
              </h1>
              <p className="text-xs text-slate-400">
                Initiate formal security approval and dual-custody authorization for media sanitization
              </p>
            </div>
          </div>
        </div>

        {isSubmitted ? (
          <div className="p-8 rounded-xl bg-slate-900 border border-emerald-800/80 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Disposal Request Authorized & Logged</h2>
            <p className="text-xs text-slate-400">
              Request for asset <span className="font-mono text-cyan-400 font-semibold">{selectedAssetId}</span> has been queued for Manager/SecOps approval.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">Returning to previous page...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
            {/* Asset Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Target IT Asset
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.brand} {a.model} (SN: {a.serialNumber}) — {a.disposalStatus}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Asset Snapshot */}
            {selectedAsset && (
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Device Type</span>
                  <span className="text-slate-300 font-medium">{selectedAsset.deviceType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Custodian</span>
                  <span className="text-slate-300 font-medium">{selectedAsset.assignedEmployee}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Department</span>
                  <span className="text-slate-300 font-medium">{selectedAsset.department}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Current Status</span>
                  <span className="text-cyan-400 font-mono">{selectedAsset.disposalStatus}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Disposal Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Disposal Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="End of Life / Deprecated">End of Life / Deprecated</option>
                  <option value="Hardware Failure / Unrepairable">Hardware Failure / Unrepairable</option>
                  <option value="Lease Expiration & Return">Lease Expiration & Return</option>
                  <option value="Security Policy Deprecation">Security Policy Deprecation</option>
                  <option value="Storage Architecture Upgrade">Storage Architecture Upgrade</option>
                  <option value="Physical Damage Beyond Repair">Physical Damage Beyond Repair</option>
                </select>
              </div>

              {/* Asset Condition */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Asset Physical Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ITAsset['assetCondition'])}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Working">Working (Normal Wear)</option>
                  <option value="Degraded">Degraded (Performance / Minor Errors)</option>
                  <option value="Faulty / Inoperable">Faulty / Inoperable (Hardware Failure)</option>
                  <option value="Obsolete">Obsolete (End of Lifecycle)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Requested By */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Requested By
                </label>
                <div className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400 font-medium">
                  {currentUser.name} ({currentUser.role})
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Medium">Medium (Standard Workflow)</option>
                  <option value="High">High (Audit / Regulatory Deadline)</option>
                  <option value="Urgent">Urgent (Critical Lease Penalty Risk)</option>
                  <option value="Low">Low (Batch Decommissioning)</option>
                </select>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Additional Notes & Chain-of-Custody Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Include data sensitivity remarks, target sanitization method preference, or storage bay location..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={goBack}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 text-xs transition-colors shadow-sm flex items-center gap-1.5"
              >
                Submit Decommission Request <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
