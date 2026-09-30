import React, { useState } from 'react';
import {
  Search,
  Bell,
  UserCheck,
  ChevronDown,
  Shield,
  CheckCircle2,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageId } from './Sidebar';
import { ITAsset } from '../../types';
import { AppRoute } from '../../context/NavigationContext';

interface HeaderProps {
  currentPage: AppRoute;
  onNavigate: (page: any) => void;
  onSelectAsset?: (asset: ITAsset) => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Disposal & Sanitization Operations Dashboard',
    subtitle: 'Unified enterprise tracking of IT assets from decommission to certified destruction',
  },
  assets: {
    title: 'IT Asset Inventory & Lifecycle Control',
    subtitle: 'Track laptops, workstations, drives, mobile devices, and data center servers',
  },
  'asset-details': {
    title: 'Asset Technical Dossier & Lifecycle Record',
    subtitle: 'Comprehensive hardware specifications, chain of custody, and sanitization proofs',
  },
  'disposal-requests': {
    title: 'Decommission & Disposal Authorization Workflow',
    subtitle: 'Review, evaluate, and authorize organizational asset retirement requests',
  },
  'disposal-request': {
    title: 'Submit Asset Decommission Authorization Request',
    subtitle: 'Dual-custody verification workflow for media sanitization authorization',
  },
  'data-wiping': {
    title: 'Certified Data Sanitization & Wiping Station',
    subtitle: 'Execute NIST SP 800-88, DoD 5220.22-M, and cryptographic erasure protocols',
  },
  verification: {
    title: 'Independent Wiping Verification & Quality Assurance',
    subtitle: 'Independent technician hex readback, bad sector analysis, and zero-fill verification',
  },
  compliance: {
    title: 'Regulatory & Standards Compliance Matrix',
    subtitle: 'Continuous auditing against GDPR Art 17, HIPAA, ISO 27001, and NIST 800-88 requirements',
  },
  certificates: {
    title: 'Cryptographic Certificates of Data Destruction',
    subtitle: 'Tamper-evident, SHA-256 sealed digital certificates for legal and audit compliance',
  },
  'certificate-details': {
    title: 'Cryptographic Certificate of Destruction Attestation',
    subtitle: 'Tamper-evident FIPS 180-4 digital seal and verified technician sign-offs',
  },
  'audit-logs': {
    title: 'Immutable Chain-of-Custody Audit Trail',
    subtitle: 'Cryptographically hashed event ledger recording every asset transition and technician action',
  },
  reports: {
    title: 'Executive Analytics & Regulatory Reporting',
    subtitle: 'Generate audit summaries, e-waste metrics, and data destruction compliance dossiers',
  },
  'report-details': {
    title: 'Executive Regulatory & Sanitization Audit Dossier',
    subtitle: 'Full auditable breakdown, compliance metrics, and chain of custody evidence',
  },
  'ai-assistant': {
    title: 'AI Compliance & Sanitization Intelligence',
    subtitle: 'Ask questions regarding pending wipes, compliance blockers, or asset history',
  },
  notifications: {
    title: 'Security & Workflow Notification Center',
    subtitle: 'Real-time alerts regarding failed passes, overdue verifications, and approvals',
  },
  'user-management': {
    title: 'Role-Based Access Control & Personnel Directory',
    subtitle: 'Manage administrative roles, certified technicians, and compliance officers',
  },
  settings: {
    title: 'Organization Governance & Platform Settings',
    subtitle: 'Configure sanitization standards, downstream recycling partners, and retention rules',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onSelectAsset,
}) => {
  const {
    currentUser,
    setCurrentUser,
    users,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    assets,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const currentInfo = PAGE_TITLES[currentPage] || {
    title: 'Security Management Console',
    subtitle: 'IT Asset Sanitization & Regulatory Oversight',
  };

  // Filter assets for global search
  const filteredAssets = searchQuery.trim()
    ? assets.filter(
        (a) =>
          a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.assignedEmployee.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20 no-print print:hidden">
      {/* Zone 1: Contextual Breadcrumb & Page Info */}
      <div className="flex flex-col justify-center min-w-0 pr-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono text-cyan-400">AegisOps</span>
          <span aria-hidden="true" className="text-slate-600">/</span>
          <span className="text-slate-200 capitalize font-medium truncate">
            {currentPage.replace('-', ' ')}
          </span>
        </div>
        <h1 className="text-sm font-semibold text-white tracking-tight truncate">
          {currentInfo.title}
        </h1>
      </div>

      {/* Zone 2: Global Search Bar */}
      <div className="relative w-80 max-w-sm hidden md:block">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            placeholder="Search Asset ID, Serial No, User..."
            className="w-full bg-slate-900/90 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-lg border border-slate-700/70 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 placeholder:text-slate-500 font-mono transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
              className="absolute right-2.5 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showSearchDropdown && searchQuery.trim() && (
          <div
            className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 max-h-72 overflow-y-auto"
            onMouseLeave={() => setShowSearchDropdown(false)}
          >
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
              Matching Assets ({filteredAssets.length})
            </div>
            {filteredAssets.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-500 text-center">
                No IT assets found matching "{searchQuery}"
              </div>
            ) : (
              filteredAssets.slice(0, 5).map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    if (onSelectAsset) onSelectAsset(asset);
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center justify-between border-b border-slate-800/50 last:border-none"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-cyan-400 font-semibold text-xs">
                        {asset.id}
                      </span>
                      <span className="text-slate-300 text-xs truncate">
                        {asset.brand} {asset.model}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      SN: {asset.serialNumber} · Custodian: {asset.assignedEmployee}
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                    {asset.disposalStatus}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Zone 3: Role Switcher, Notifications, Persona Profile */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Pill / Persona Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            title="Switch Simulated Active Persona"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400">Role:</span>
            <span className="font-semibold text-cyan-300">{currentUser.role}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showRoleMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-xs"
              onMouseLeave={() => setShowRoleMenu(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800 flex justify-between">
                <span>Switch Simulated Persona</span>
                <span className="text-cyan-400 text-[10px]">RBAC Active</span>
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between ${
                    currentUser.id === u.id ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-medium text-xs">{u.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {u.role} · {u.department}
                    </div>
                  </div>
                  {currentUser.id === u.id && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center font-mono animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Drawer Popover */}
          {showNotifMenu && (
            <div
              className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50"
              onMouseLeave={() => setShowNotifMenu(false)}
            >
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No active notifications
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.linkPage) onNavigate(n.linkPage as PageId);
                        setShowNotifMenu(false);
                      }}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-800/70 transition-colors ${
                        !n.read ? 'bg-slate-800/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {n.timestamp.split(' ')[1] || n.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      {n.assetId && (
                        <span className="inline-block mt-1 font-mono text-[10px] text-cyan-400">
                          Asset: {n.assetId} →
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-800 text-center">
                <button
                  onClick={() => {
                    onNavigate('notifications');
                    setShowNotifMenu(false);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  View all alerts & history
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current User Quick Info */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400 font-mono">
            {currentUser.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-medium text-slate-200 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {currentUser.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
