import React from 'react';
import { DisposalStatus, ComplianceStatus, LifecycleStage, Priority } from '../../types';

interface StatusBadgeProps {
  status: DisposalStatus | ComplianceStatus | LifecycleStage | Priority | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorStyles = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  let dotColor = 'bg-slate-400';

  switch (status) {
    // Disposal Statuses
    case 'Active':
      colorStyles = 'bg-slate-800/80 text-slate-300 border-slate-700/70';
      dotColor = 'bg-slate-400';
      break;
    case 'Pending Approval':
    case 'Disposal Requested':
      colorStyles = 'bg-amber-950/40 text-amber-300 border-amber-800/50';
      dotColor = 'bg-amber-400 animate-pulse';
      break;
    case 'Approved':
      colorStyles = 'bg-blue-950/40 text-blue-300 border-blue-800/50';
      dotColor = 'bg-blue-400';
      break;
    case 'Wiping In Progress':
    case 'Data Wiping':
      colorStyles = 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60';
      dotColor = 'bg-cyan-400 animate-ping';
      break;
    case 'Wiped':
    case 'Verification Pending':
    case 'Verification':
      colorStyles = 'bg-indigo-950/40 text-indigo-300 border-indigo-800/50';
      dotColor = 'bg-indigo-400';
      break;
    case 'Ready For Disposal':
    case 'Certificate Generated':
    case 'Compliant':
    case 'Passed':
    case 'Valid':
      colorStyles = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50';
      dotColor = 'bg-emerald-400';
      break;
    case 'Partially Compliant':
    case 'Review Required':
    case 'Medium':
      colorStyles = 'bg-amber-950/40 text-amber-300 border-amber-800/50';
      dotColor = 'bg-amber-400';
      break;
    case 'Verification Failed':
    case 'Non-Compliant':
    case 'Failed':
    case 'Rejected':
    case 'High':
    case 'Critical':
    case 'Urgent':
      colorStyles = 'bg-rose-950/40 text-rose-300 border-rose-800/50';
      dotColor = 'bg-rose-400';
      break;
    case 'Disposed':
      colorStyles = 'bg-purple-950/40 text-purple-300 border-purple-800/50';
      dotColor = 'bg-purple-400';
      break;
    case 'Low':
      colorStyles = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
      dotColor = 'bg-slate-400';
      break;
    default:
      colorStyles = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
      dotColor = 'bg-slate-400';
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border tracking-tight whitespace-nowrap ${paddingClass} ${colorStyles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
};
