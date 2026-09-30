import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';
import { ITAsset, WipingMethod } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

interface DataWipingPageProps {
  onSelectAsset: (asset: ITAsset) => void;
  onOpenWipingModal: (asset: ITAsset) => void;
}

export const DataWipingPage: React.FC<DataWipingPageProps> = ({
  onSelectAsset,
  onOpenWipingModal,
}) => {
  const { assets } = useApp();
  const { pageStates, setPageState, navigate } = useNav();

  const [methodFilter, setMethodFilter] = useState<string>(pageStates.dataWiping?.methodFilter ?? 'All');
  const [statusFilter, setStatusFilter] = useState<string>(pageStates.dataWiping?.statusFilter ?? 'All');
  const [search, setSearch] = useState(pageStates.dataWiping?.search ?? '');

  // Preserve filter state
  useEffect(() => {
    setPageState('dataWiping', {
      methodFilter,
      statusFilter,
      search,
    });
  }, [methodFilter, statusFilter, search, setPageState]);

  // Assets that are either approved for wiping, currently in wiping, or have finished wiping
  const wipingAssets = assets.filter((a) =>
    ['Approved', 'Data Wiping', 'Verification', 'Compliance Review', 'Certificate Generated', 'Disposed'].includes(
      a.lifecycleStage
    )
  );

  const filtered = wipingAssets.filter((asset) => {
    const matchesMethod = methodFilter === 'All' || asset.wipingMethod === methodFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Pending' && asset.disposalStatus === 'Approved') ||
      (statusFilter === 'In Progress' && asset.disposalStatus === 'Wiping In Progress') ||
      (statusFilter === 'Completed' && asset.wipingStatus === 'Completed') ||
      (statusFilter === 'Failed' && (asset.wipingStatus === 'Failed' || asset.disposalStatus === 'Verification Failed'));

    const matchesSearch =
      asset.id.toLowerCase().includes(search.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      (asset.technician && asset.technician.toLowerCase().includes(search.toLowerCase())) ||
      (asset.wipingTool && asset.wipingTool.toLowerCase().includes(search.toLowerCase()));

    return matchesMethod && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top-left Back button */}
      <BackButton />

      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-cyan-400" />
              Certified Storage Media Sanitization Station
            </h2>
            <p className="text-xs text-slate-400">
              NIST SP 800-88 Rev 1, DoD 5220.22-M, and ATA Secure Erase execution center
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 font-mono">
              Rig: Blancco Drive Eraser v7.4 / ATA Command Rig
            </span>
            <button
              onClick={() => navigate('verification')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Proceed to Verification <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Search Asset / Serial / Tech</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-slate-950 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Sanitization Standard</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Sanitization Methods</option>
              <option value="NIST 800-88 Rev 1 Purge">NIST 800-88 Rev 1 Purge</option>
              <option value="NIST 800-88 Rev 1 Clear">NIST 800-88 Rev 1 Clear</option>
              <option value="DoD 5220.22-M (3-Pass)">DoD 5220.22-M (3-Pass)</option>
              <option value="Cryptographic Erasure (Crypto Erase)">Cryptographic Erasure</option>
              <option value="ATA Secure Erase">ATA Secure Erase</option>
              <option value="Physical Destruction / Degaussing">Physical Destruction</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Wiping Lifecycle State</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Wiping States</option>
              <option value="Pending">Awaiting Sanitization</option>
              <option value="In Progress">Active Overwrite In Progress</option>
              <option value="Completed">Sanitization Completed</option>
              <option value="Failed">Failed / I/O Read Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Wiping Queue Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium select-none">
                <th className="py-3 px-3">Asset ID</th>
                <th className="py-3 px-3">Device & Specs</th>
                <th className="py-3 px-3">Serial Number</th>
                <th className="py-3 px-3">Sanitization Method</th>
                <th className="py-3 px-3">Technician & Tool</th>
                <th className="py-3 px-3">Execution Timestamps</th>
                <th className="py-3 px-3">Wipe Status</th>
                <th className="py-3 px-3">Verification</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                    No storage assets currently in the sanitization queue matching filters.
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
                      <div className="text-[10px] text-slate-500">{asset.deviceType} · {asset.capacity || 'Storage Drive'}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                      {asset.serialNumber}
                    </td>

                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      <div className="font-medium text-emerald-400">
                        {asset.wipingMethod || 'NIST 800-88 Purge (Default)'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Passes: {asset.wipingPasses || (asset.wipingMethod?.includes('3-Pass') ? 3 : 1)}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      <div className="font-medium">{asset.technician || 'Marcus Vance'}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                        {asset.wipingTool || 'Blancco v7.4'}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      <div>Start: {asset.wipingStartTime || 'Not started'}</div>
                      <div>End: {asset.wipingEndTime || '—'}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={asset.disposalStatus} size="sm" />
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {asset.verificationResult === 'Passed' ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      ) : asset.verificationResult === 'Failed' ? (
                        <span className="text-rose-400 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Failed
                        </span>
                      ) : asset.wipingStatus === 'Completed' ? (
                        <span className="text-indigo-400 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Pending QA
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {/* Action buttons */}
                      {asset.disposalStatus === 'Approved' ? (
                        <button
                          onClick={() => onOpenWipingModal(asset)}
                          className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 text-[11px] transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Start Wiping
                        </button>
                      ) : asset.disposalStatus === 'Wiping In Progress' ? (
                        <button
                          onClick={() => onOpenWipingModal(asset)}
                          className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-600 text-white font-semibold hover:bg-cyan-500 text-[11px] animate-pulse"
                        >
                          <Cpu className="w-3 h-3" />
                          Monitor Progress
                        </button>
                      ) : asset.disposalStatus === 'Verification Failed' ? (
                        <button
                          onClick={() => onOpenWipingModal(asset)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 text-[11px]"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Re-run Sanitization
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px]"
                        >
                          View Logs
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
    </div>
  );
};
