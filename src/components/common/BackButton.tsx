import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNav } from '../../context/NavigationContext';

interface BackButtonProps {
  label?: string;
  fallbackPage?: string;
  className?: string;
}

const PAGE_NAMES: Record<string, string> = {
  dashboard: 'Dashboard',
  assets: 'IT Assets',
  'disposal-requests': 'Disposal Requests',
  'data-wiping': 'Data Wiping',
  verification: 'Verification',
  compliance: 'Compliance',
  certificates: 'Certificates',
  'audit-logs': 'Audit Logs',
  reports: 'Reports',
  'ai-assistant': 'AI Assistant',
  notifications: 'Notifications',
  'user-management': 'User Management',
  settings: 'Settings',
  'asset-details': 'Asset Details',
  'disposal-request': 'Disposal Request',
  'report-details': 'Report Details',
  'certificate-details': 'Certificate Details',
};

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  className = '',
}) => {
  const { goBack, previousEntry, canGoBack } = useNav();

  if (!canGoBack && !previousEntry) {
    return null;
  }

  const prevName = previousEntry?.page ? PAGE_NAMES[previousEntry.page] || previousEntry.page : '';

  return (
    <div className={`mb-3.5 flex items-center no-print print:hidden ${className}`}>
      <button
        onClick={goBack}
        type="button"
        aria-label={prevName ? `Go back to ${prevName}` : 'Go back to previous page'}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition-all duration-150 shadow-sm group cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
        <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-0.5 transition-transform duration-150" />
        <span>{label}</span>
        {prevName && (
          <span className="text-slate-400 font-normal hidden sm:inline border-l border-slate-700 pl-2">
            to {prevName}
          </span>
        )}
      </button>
    </div>
  );
};
