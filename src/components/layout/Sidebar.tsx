import React from 'react';
import {
  LayoutDashboard,
  HardDrive,
  FileCheck2,
  Trash2,
  CheckCircle,
  ShieldCheck,
  Award,
  History,
  BarChart3,
  Bot,
  Bell,
  Users,
  Settings,
  ShieldAlert,
  User,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type PageId =
  | 'dashboard'
  | 'assets'
  | 'disposal-requests'
  | 'data-wiping'
  | 'verification'
  | 'compliance'
  | 'certificates'
  | 'audit-logs'
  | 'reports'
  | 'ai-assistant'
  | 'notifications'
  | 'user-management'
  | 'settings'
  | 'profile';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: any) => void;
  collapsed?: boolean;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
  count?: number;
  badge?: string | number;
  badgeColor?: string;
  isAi?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { assets, notifications, currentUser, certificates } = useApp();
  const isAdmin = currentUser.role === 'Admin';
  const isUser = currentUser.role === 'User';

  // Admin counts
  const pendingRequestsCount = assets.filter((a) => a.disposalStatus === 'Pending Approval').length;
  const wipingQueueCount = assets.filter((a) => a.disposalStatus === 'Approved' || a.disposalStatus === 'Wiping In Progress').length;
  const verificationQueueCount = assets.filter((a) => a.disposalStatus === 'Verification Pending' || a.disposalStatus === 'Verification Failed').length;
  const complianceIssuesCount = assets.filter((a) => a.complianceStatus === 'Non-Compliant').length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  // User scoped counts
  const userName = currentUser.name.toLowerCase();
  const myAssets = assets.filter(
    (a) =>
      a.userId === currentUser.id ||
      a.assignedEmployee.toLowerCase() === userName ||
      (a.requestedBy && a.requestedBy.toLowerCase() === userName)
  );
  const myPendingRequestsCount = myAssets.filter((a) => a.disposalStatus === 'Pending Approval').length;
  const myAssetIds = new Set(myAssets.map((a) => a.id));
  const myCertsCount = certificates.filter((c) => myAssetIds.has(c.assetId)).length;

  const adminNavGroups: NavGroup[] = [
    {
      group: 'Core Lifecycle',
      items: [
        { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
        { id: 'assets', label: 'IT Assets Inventory', icon: HardDrive, count: assets.length },
        { id: 'disposal-requests', label: 'Disposal Requests', icon: FileCheck2, badge: pendingRequestsCount, badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' },
        { id: 'data-wiping', label: 'Data Wiping Station', icon: Trash2, badge: wipingQueueCount, badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' },
        { id: 'verification', label: 'Wiping Verification', icon: CheckCircle, badge: verificationQueueCount, badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' },
      ],
    },
    {
      group: 'Governance & Proof',
      items: [
        { id: 'compliance', label: 'Compliance Matrix', icon: ShieldCheck, badge: complianceIssuesCount > 0 ? `${complianceIssuesCount} Alert` : undefined, badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/40' },
        { id: 'certificates', label: 'Destruction Certificates', icon: Award, count: certificates.length },
        { id: 'audit-logs', label: 'Chain-of-Custody Logs', icon: History },
        { id: 'reports', label: 'Executive Reports', icon: BarChart3 },
      ],
    },
    {
      group: 'Administration & System',
      items: [
        { id: 'user-management', label: 'User Management', icon: Users },
        { id: 'settings', label: 'Platform Settings', icon: Settings },
        { id: 'ai-assistant', label: 'AI SecOps Assistant', icon: Bot, isAi: true },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined, badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
        { id: 'profile', label: 'My Admin Profile', icon: User },
      ],
    },
  ];

  const userNavGroups: NavGroup[] = [
    {
      group: 'User Workspace',
      items: [
        { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { id: 'assets', label: 'My IT Assets', icon: HardDrive, count: myAssets.length },
        { id: 'disposal-requests', label: 'My Disposal Requests', icon: FileCheck2, badge: myPendingRequestsCount > 0 ? myPendingRequestsCount : undefined, badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' },
      ],
    },
    {
      group: 'Proof & Records',
      items: [
        { id: 'certificates', label: 'My Certificates', icon: Award, count: myCertsCount },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined, badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
      ],
    },
    {
      group: 'Account',
      items: [
        { id: 'profile', label: 'My Profile', icon: User },
      ],
    },
  ];

  const navGroups = isAdmin ? adminNavGroups : userNavGroups;

  return (
    <aside className="w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col h-screen shrink-0 sticky top-0 select-none z-30 no-print print:hidden">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-900/20">
            <ShieldAlert className="w-5 h-5 text-slate-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight font-sans">
                Aegis<span className="text-cyan-400 font-extrabold">Disposal</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              SecOps Platform
            </p>
          </div>
        </div>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono">
            Active Role
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold tracking-wide border ${
              isAdmin
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isAdmin ? 'ADMINISTRATOR' : 'STANDARD USER'}
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {group.group}
            </div>
            <div className="space-y-0.5 pt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const activeId =
                  currentPage === 'asset-details'
                    ? 'assets'
                    : currentPage === 'disposal-request'
                    ? 'disposal-requests'
                    : currentPage === 'report-details'
                    ? 'reports'
                    : currentPage === 'certificate-details'
                    ? 'certificates'
                    : currentPage;
                const isActive = activeId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id as PageId)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 rounded-l-none'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-cyan-400' : 'text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                          item.badgeColor || 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {item.count !== undefined && !item.badge && (
                      <span className="text-[10px] font-mono text-slate-600 tabular-nums">
                        {item.count}
                      </span>
                    )}

                    {item.isAi && (
                      <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/30 font-semibold">
                        GenAI
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Security Standard Verification Pill */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="p-2.5 rounded border border-slate-800 bg-slate-900/40 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
            <span>Enforced Standard</span>
            <span className="text-cyan-400 font-mono text-[10px]">NIST 800-88</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
            <span>FIPS 140-3</span>
            <span aria-hidden="true">·</span>
            <span>R2v3 Verified</span>
            <span aria-hidden="true">·</span>
            <span>GDPR Art 17</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
