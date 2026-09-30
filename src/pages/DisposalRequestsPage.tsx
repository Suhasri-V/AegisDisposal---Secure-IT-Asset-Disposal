import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';
import { ITAsset } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

interface DisposalRequestsPageProps {
  onSelectAsset: (asset: ITAsset) => void;
  onRequestDisposalNew: () => void;
}

export const DisposalRequestsPage: React.FC<DisposalRequestsPageProps> = ({
  onSelectAsset,
  onRequestDisposalNew,
}) => {
  const { assets, approveDisposal, rejectDisposal, currentUser } = useApp();
  const { pageStates, setPageState, navigate } = useNav();

  const [tabFilter, setTabFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>(
    (pageStates.disposalRequests?.tabFilter as any) ?? 'All'
  );
  const [search, setSearch] = useState(pageStates.disposalRequests?.search ?? '');
  const [rejectingAssetId, setRejectingAssetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Preserve filter state
  useEffect(() => {
    setPageState('disposalRequests', {
      tabFilter,
      search,
    });
  }, [tabFilter, search, setPageState]);

  // Assets that have a disposal request history or are currently pending/approved/rejected
  const requestAssets = assets.filter((a) => a.disposalReason || a.disposalStatus === 'Pending Approval');

  const filtered = requestAssets.filter((asset) => {
    let matchesTab = true;
    if (tabFilter === 'Pending') matchesTab = asset.disposalStatus === 'Pending Approval';
    else if (tabFilter === 'Approved') matchesTab = ['Approved', 'Wiping In Progress', 'Ready For Disposal', 'Disposed'].includes(asset.disposalStatus);
    else if (tabFilter === 'Rejected') matchesTab = asset.disposalStatus === 'Rejected';

    const matchesSearch =
      asset.id.toLowerCase().includes(search.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      (asset.disposalReason && asset.disposalReason.toLowerCase().includes(search.toLowerCase())) ||
      (asset.requestedBy && asset.requestedBy.toLowerCase().includes(search.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const isAuthorizedApprover = ['Admin', 'Manager'].includes(currentUser.role);

  const handleConfirmReject = (assetId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason');
      return;
    }
    rejectDisposal(assetId, rejectionReason);
    setRejectingAssetId(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-4">
      {/* Top-left Back button */}
      <BackButton />

      {/* Top Workflow Summary Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              IT Asset Decommission & Disposal Authorization
            </h2>
            <p className="text-xs text-slate-400">
              Formal dual-custody verification required prior to physical media sanitization
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('disposal-request')}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Disposal Request
            </button>
            {!isAuthorizedApprover && (
              <span className="text-[11px] text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded">
                Logged in as {currentUser.role} (Switch to Admin/Manager to approve)
              </span>
            )}
          </div>
        </div>

        {/* Filter controls & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          {/* Segmented Tab Filter (Zero-pill compliant) */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setTabFilter('All')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                tabFilter === 'All' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Requests ({requestAssets.length})
            </button>
            <button
              onClick={() => setTabFilter('Pending')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                tabFilter === 'Pending' ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending Approval ({requestAssets.filter((a) => a.disposalStatus === 'Pending Approval').length})
            </button>
            <button
              onClick={() => setTabFilter('Approved')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                tabFilter === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setTabFilter('Rejected')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                tabFilter === 'Rejected' ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rejected
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-3 px-3">Asset ID</th>
                <th className="py-3 px-3">Make / Model</th>
                <th className="py-3 px-3">Disposal Reason</th>
                <th className="py-3 px-3">Condition</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Requested By & Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Sign-off Officer</th>
                <th className="py-3 px-3 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                    No disposal requests found in current category.
                  </td>
                </tr>
              ) : (
                filtered.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectAsset(asset)}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {asset.id}
                    </td>

                    <td className="py-3 px-3 text-slate-200 whitespace-nowrap">
                      <div className="font-medium">{asset.brand} {asset.model}</div>
                      <div className="text-[10px] text-slate-500 font-mono">SN: {asset.serialNumber}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-300 max-w-[200px]">
                      <div className="truncate font-medium">{asset.disposalReason || 'Scheduled decommission'}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-slate-300 font-medium">
                        {asset.assetCondition || 'Working'}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={asset.priority || 'Medium'} size="sm" />
                    </td>

                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      <div className="font-medium">{asset.requestedBy}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{asset.requestedDate}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={asset.disposalStatus} size="sm" />
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                      {asset.approvedBy ? (
                        <div className="text-emerald-400 font-medium">
                          ✓ {asset.approvedBy}
                        </div>
                      ) : asset.rejectionReason ? (
                        <div className="text-rose-400 text-[11px] truncate max-w-[120px]">
                          Rejected: {asset.rejectionReason}
                        </div>
                      ) : (
                        <div className="text-amber-400/80 font-mono text-[11px]">
                          Pending Approval
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {asset.disposalStatus === 'Pending Approval' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => approveDisposal(asset.id)}
                            className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 text-[11px] transition-colors"
                            title="Approve Disposal Request"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingAssetId(asset.id)}
                            className="px-2 py-1 rounded bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/50 text-[11px]"
                            title="Reject Request"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px]"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal dialog */}
      {rejectingAssetId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5" />
              Reject Disposal Request ({rejectingAssetId})
            </div>
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State the justification (e.g. Asset still under warranty, redeployment required)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectingAssetId(null)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmReject(rejectingAssetId)}
                className="px-3 py-1.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-500"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
