import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';
import { ITAsset } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

interface VerificationPageProps {
  onSelectAsset: (asset: ITAsset) => void;
  onOpenWipingModal: (asset: ITAsset) => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({
  onSelectAsset,
  onOpenWipingModal,
}) => {
  const { assets, verifyWiping, currentUser } = useApp();
  const { pageStates, setPageState, navigate } = useNav();

  const [search, setSearch] = useState(pageStates.verification?.search ?? '');
  const [filterState, setFilterState] = useState<'All' | 'Pending' | 'Passed' | 'Failed'>(
    (pageStates.verification?.filterState as any) ?? 'Pending'
  );

  // Preserve filter state
  useEffect(() => {
    setPageState('verification', {
      search,
      filterState,
    });
  }, [search, filterState, setPageState]);

  // Modal for verification sign-off
  const [verifyingAsset, setVerifyingAsset] = useState<ITAsset | null>(null);
  const [decision, setDecision] = useState<'Passed' | 'Failed'>('Passed');
  const [notes, setNotes] = useState('');

  // Assets that have reached or passed the verification stage
  const verificationAssets = assets.filter((a) =>
    ['Verification Pending', 'Verification Failed', 'Ready For Disposal', 'Disposed'].includes(a.disposalStatus) ||
    a.wipingStatus === 'Completed' ||
    a.wipingStatus === 'Failed'
  );

  const filtered = verificationAssets.filter((asset) => {
    let matchesFilter = true;
    if (filterState === 'Pending') matchesFilter = asset.disposalStatus === 'Verification Pending';
    else if (filterState === 'Passed') matchesFilter = asset.verificationResult === 'Passed';
    else if (filterState === 'Failed') matchesFilter = asset.verificationResult === 'Failed' || asset.disposalStatus === 'Verification Failed';

    const matchesSearch =
      asset.id.toLowerCase().includes(search.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      (asset.wipingMethod && asset.wipingMethod.toLowerCase().includes(search.toLowerCase())) ||
      (asset.verifiedBy && asset.verifiedBy.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const openVerifyModal = (asset: ITAsset, defaultDecision: 'Passed' | 'Failed') => {
    setVerifyingAsset(asset);
    setDecision(defaultDecision);
    setNotes(
      defaultDecision === 'Passed'
        ? 'Complete hex readback confirmed 100% zero-fill across all sectors. Optical inspection intact.'
        : 'Pass failed due to uncorrectable I/O sector timeout on target controller.'
    );
  };

  const handleConfirmVerification = () => {
    if (!verifyingAsset) return;
    verifyWiping(verifyingAsset.id, decision === 'Passed', notes);
    setVerifyingAsset(null);
  };

  return (
    <div className="space-y-4">
      {/* Top-left Back button */}
      <BackButton />

      {/* Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Independent Wiping Verification & Quality Assurance
            </h2>
            <p className="text-xs text-slate-400">
              Secondary technician hex verification, zero-fill audit, and sector readback sign-off
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-800 text-indigo-300 font-mono">
              Standard: PCI-DSS Req 9.8.2 / NIST SP 800-88
            </span>
            <button
              onClick={() => navigate('compliance')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Review Regulatory Compliance <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterState('Pending')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterState === 'Pending'
                  ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Verification Pending ({verificationAssets.filter((a) => a.disposalStatus === 'Verification Pending').length})
            </button>
            <button
              onClick={() => setFilterState('Passed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterState === 'Passed'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Verified Passed
            </button>
            <button
              onClick={() => setFilterState('Failed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterState === 'Failed'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Verification Failed ({verificationAssets.filter((a) => a.disposalStatus === 'Verification Failed').length})
            </button>
            <button
              onClick={() => setFilterState('All')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterState === 'All' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Assets ({verificationAssets.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search verification records..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Verification Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium select-none">
                <th className="py-3 px-3">Asset ID</th>
                <th className="py-3 px-3">Device / Drive</th>
                <th className="py-3 px-3">Wiping Method</th>
                <th className="py-3 px-3">Sanitization Result</th>
                <th className="py-3 px-3">QA Verification</th>
                <th className="py-3 px-3">Verified By</th>
                <th className="py-3 px-3">Verification Date</th>
                <th className="py-3 px-3">Audit Notes</th>
                <th className="py-3 px-3 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                    No verification records found matching current criteria.
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

                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      <div className="font-medium text-emerald-400">{asset.wipingMethod || 'NIST 800-88'}</div>
                      <div className="text-[10px] text-slate-500">{asset.wipingTool}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {asset.wipingStatus === 'Completed' ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Overwrite Finished
                        </span>
                      ) : asset.wipingStatus === 'Failed' ? (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Sanitization Fault
                        </span>
                      ) : (
                        <span className="text-slate-400">In Progress</span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {asset.verificationResult === 'Passed' ? (
                        <StatusBadge status="Passed" size="sm" />
                      ) : asset.verificationResult === 'Failed' ? (
                        <StatusBadge status="Failed" size="sm" />
                      ) : (
                        <StatusBadge status="Verification Pending" size="sm" />
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      {asset.verifiedBy || 'Pending Assignment'}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {asset.verificationDate || '—'}
                    </td>

                    <td className="py-3 px-3 text-slate-400 max-w-[200px]">
                      <div className="truncate text-[11px] italic">
                        {asset.verificationNotes || 'No officer notes recorded yet.'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {asset.disposalStatus === 'Verification Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openVerifyModal(asset, 'Passed')}
                            className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 text-[11px] transition-colors"
                          >
                            Verify Successful
                          </button>
                          <button
                            onClick={() => openVerifyModal(asset, 'Failed')}
                            className="px-2 py-1 rounded bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/50 text-[11px]"
                          >
                            Mark Failed
                          </button>
                        </div>
                      ) : asset.disposalStatus === 'Verification Failed' ? (
                        <button
                          onClick={() => onOpenWipingModal(asset)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 text-[11px]"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Re-run Wiping
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px]"
                        >
                          View Audit Sign-off
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

      {/* Verification Sign-off Modal */}
      {verifyingAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Perform Sanitization Verification ({verifyingAsset.id})
            </div>

            <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs space-y-1 text-slate-300">
              <div>
                <span className="text-slate-500">Device:</span> {verifyingAsset.brand} {verifyingAsset.model} (SN: {verifyingAsset.serialNumber})
              </div>
              <div>
                <span className="text-slate-500">Executing Tech:</span> {verifyingAsset.technician} · {verifyingAsset.wipingTool}
              </div>
              <div>
                <span className="text-slate-500">Method:</span> {verifyingAsset.wipingMethod}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">
                Verification Verdict *
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setDecision('Passed')}
                  className={`p-2.5 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    decision === 'Passed'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Verify Successful (Pass)
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('Failed')}
                  className={`p-2.5 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    decision === 'Failed'
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Mark Failed (I/O Fault)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">
                Verification Officer Attestation Notes *
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-500 font-mono text-[11px]">
                Signatory: {currentUser.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVerifyingAsset(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmVerification}
                  className={`px-4 py-1.5 rounded font-semibold text-slate-950 ${
                    decision === 'Passed' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  Commit QA Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
