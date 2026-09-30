import React, { useState } from 'react';
import { X, FileCheck2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ITAsset, Priority } from '../../types';
import { useApp } from '../../context/AppContext';

interface DisposalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: ITAsset | null;
}

export const DisposalRequestModal: React.FC<DisposalRequestModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  const { requestDisposal, currentUser } = useApp();

  const [reason, setReason] = useState('Scheduled hardware refresh cycle (48 months in field)');
  const [condition, setCondition] = useState<ITAsset['assetCondition']>('Working');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [notes, setNotes] = useState('');

  if (!isOpen || !asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for the disposal request');
      return;
    }

    requestDisposal(asset.id, reason, condition, priority, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-800/60 text-amber-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Initiate Decommission & Disposal Request
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Asset: {asset.id} · {asset.brand} {asset.model}
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 rounded bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              Asset Custody Snapshot
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-slate-500">Serial No:</span>{' '}
                <span className="font-mono text-cyan-400">{asset.serialNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">Custodian:</span> {asset.assignedEmployee}
              </div>
              <div>
                <span className="text-slate-500">Department:</span> {asset.department}
              </div>
              <div>
                <span className="text-slate-500">Location:</span> {asset.location}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Primary Disposal Justification *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="Scheduled hardware refresh cycle (48 months in field)">
                Scheduled hardware refresh cycle (48 months in field)
              </option>
              <option value="Critical hardware failure / Non-repairable uncorrectable sectors">
                Critical hardware failure / Non-repairable uncorrectable sectors
              </option>
              <option value="Employee departure and departmental decommission">
                Employee departure and departmental decommission
              </option>
              <option value="Security policy deprecation & cloud compute migration">
                Security policy deprecation & cloud compute migration
              </option>
              <option value="Damaged physical enclosure / Hazardous battery condition">
                Damaged physical enclosure / Hazardous battery condition
              </option>
              <option value="End of primary data retention & legal hold release">
                End of primary data retention & legal hold release
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Physical Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ITAsset['assetCondition'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Working">Working / Operational</option>
                <option value="Degraded">Degraded Performance</option>
                <option value="Faulty / Inoperable">Faulty / Inoperable</option>
                <option value="Obsolete">Obsolete Architecture</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Disposal Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Low">Low - Standard Queue</option>
                <option value="Medium">Medium - Standard SLA (5 Days)</option>
                <option value="High">High - Expedited (48 Hours)</option>
                <option value="Urgent">Urgent - Executive / Compliance Critical (24 Hours)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Technician Notes / Storage Data Sensitivity
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specify any high-risk data (e.g. Contains encrypted customer PII, trade secrets, internal keys)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </div>

          <div className="p-3 rounded bg-amber-950/30 border border-amber-800/40 text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Submitting this request will lock the asset from reassignment and dispatch an approval alert to the Manager / Information Security Officer.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 transition-colors"
            >
              Submit Disposal Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
