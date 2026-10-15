import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin, isLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both your Admin email and password.');
      return;
    }

    const result = await loginAdmin(email.trim(), password);
    if (!result.ok) {
      setError(result.message || 'Unable to sign in to the Admin portal.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-300">
          <ShieldCheck className="h-4 w-4" />
          AegisSecOps Admin
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Administrator Login</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Enter the authorized Administrator email and password to access the platform governance dashboard.
        </p>

        {error && (
          <div role="alert" className="mt-5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-xs text-slate-300">
              Admin Email
            </label>
            <input
              id="admin-email"
              name="admin_email"
              type="email"
              autoComplete="off"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@aegisdisposal.local"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-xs text-slate-300">
              Admin Password
            </label>
            <input
              id="admin-password"
              name="admin_password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter administrator password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-70 transition-colors"
          >
            {isLoading ? 'Authenticating...' : 'Sign in to Admin Dashboard'}
            <LockKeyhole className="h-4 w-4" />
          </button>
        </form>

        <a href="/user/login" className="mt-6 inline-flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200">
          Return to User Login <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </section>
    </main>
  );
};
