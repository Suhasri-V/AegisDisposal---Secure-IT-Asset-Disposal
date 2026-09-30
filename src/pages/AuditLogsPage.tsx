import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useApp();

  const [userFilter, setUserFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Extract unique users & actions
  const uniqueUsers = ['All', ...Array.from(new Set(auditLogs.map((l) => l.user)))];
  const uniqueActions = ['All', ...Array.from(new Set(auditLogs.map((l) => l.action)))];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesUser = userFilter === 'All' || log.user === userFilter;
    const matchesAction = actionFilter === 'All' || log.action === actionFilter;
    const matchesStatus = statusFilter === 'All' || log.result === statusFilter;
    const matchesSearch =
      log.assetId.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()));

    return matchesUser && matchesAction && matchesStatus && matchesSearch;
  });

  const exportCSV = () => {
    const headers = [
      'Log ID',
      'Timestamp',
      'User',
      'Role',
      'Action',
      'Asset ID',
      'Previous Status',
      'New Status',
      'Device/IP Info',
      'Result',
      'Details',
    ];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.user}"`,
      l.role,
      `"${l.action}"`,
      l.assetId,
      l.previousStatus,
      l.newStatus,
      `"${l.deviceIp}"`,
      l.result,
      `"${l.details || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aegis_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Cryptographic Immutable Chain-of-Custody Audit Ledger
            </h2>
            <p className="text-xs text-slate-400">
              Tamper-evident chronological record of all lifecycle state transitions, technician actions, and approvals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs border border-slate-700 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Export Audit CSV
            </button>
            <span className="text-[11px] px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400" />
              WORM Compliant
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Search Logs</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Asset, user, action..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-8 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Executing User</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Event Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {uniqueActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Event Result</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Results</option>
              <option value="Success">Success Only</option>
              <option value="Failed">Failed / Errors Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium select-none">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Operator / Role</th>
                <th className="py-3 px-3">Audit Action</th>
                <th className="py-3 px-3">Asset Target</th>
                <th className="py-3 px-3">Lifecycle State Transition</th>
                <th className="py-3 px-3">Device / Terminal IP</th>
                <th className="py-3 px-3">Result</th>
                <th className="py-3 px-3">Audit Details & Signatures</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No audit log entries found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {log.timestamp}
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3 text-slate-200 whitespace-nowrap">
                      <div className="font-medium text-white">{log.user}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.role}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-cyan-300">{log.action}</span>
                    </td>

                    {/* Asset ID */}
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {log.assetId}
                    </td>

                    {/* State transition */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                      <span className="text-slate-500">{log.previousStatus}</span>
                      <span className="text-slate-600 mx-1.5">→</span>
                      <span className="text-white font-medium">{log.newStatus}</span>
                    </td>

                    {/* Device / Terminal */}
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {log.deviceIp}
                    </td>

                    {/* Result */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          log.result === 'Success'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-3 text-slate-400 text-[11px] max-w-[280px]">
                      <div className="truncate italic">{log.details || '—'}</div>
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
