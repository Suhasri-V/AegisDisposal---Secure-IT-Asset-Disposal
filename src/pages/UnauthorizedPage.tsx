import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNav } from '../context/NavigationContext';
import { useApp } from '../context/AppContext';

interface UnauthorizedPageProps {
  requiredRole?: string;
  attemptedPage?: string;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  requiredRole = 'Administrator',
  attemptedPage = 'this module',
}) => {
  const { navigate } = useNav();
  const { currentUser } = useApp();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-slate-900/90 p-8 shadow-2xl shadow-rose-950/20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-[11px] font-mono text-rose-300">
            HTTP 403 Forbidden · Role Restriction
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Restricted Administrative Area
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your current account role is{' '}
            <span className="font-semibold text-cyan-300 font-mono">{currentUser.role}</span>.
            Access to {attemptedPage} requires elevated{' '}
            <span className="font-semibold text-rose-300">{requiredRole}</span> privileges under
            enterprise role-based access control (RBAC).
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 text-left font-mono space-y-1">
          <div><span className="text-slate-500">Security Context:</span> Enforced Server-Side</div>
          <div><span className="text-slate-500">User Identity:</span> {currentUser.name}</div>
          <div><span className="text-slate-500">Account ID:</span> {currentUser.id}</div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            <Home className="w-4 h-4" />
            Return to My Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
