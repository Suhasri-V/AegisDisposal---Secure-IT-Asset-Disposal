import React, { useState, useEffect } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { API_ORIGIN, api } from '../api/client';

const GOOGLE_AUTH_ERRORS: Record<string, string> = {
  google_state_invalid:
    'Google sign-in could not verify the login session. Start again from this HTTPS application address; if it continues, verify the configured frontend and callback URLs.',
  google_sign_in_cancelled: 'Google sign-in was cancelled. Select an account and approve the sign-in to continue.',
  google_sign_in_failed:
    'Google could not complete authentication. Please contact your administrator to verify the OAuth client credentials and callback URL.',
  google_oauth_client_invalid:
    'Google rejected the OAuth credentials. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the backend environment.',
  google_oauth_not_configured:
    'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the backend environment.',
  google_authorization_expired:
    'Google sign-in authorization expired or could not be verified. Start again from this page; if it repeats, ask your administrator to check the callback URL.',
  google_profile_failed:
    'Google accepted the sign-in but did not return account details. Please try again, and contact your administrator if it continues.',
  google_email_not_verified: 'Google requires a verified email address to sign in to this account.',
  use_admin_login: 'This email belongs to the administrator. Use the Admin login page instead.',
  account_not_eligible: 'This Google account is not eligible for standard user access. Please contact your administrator.',
  account_inactive: 'This account is inactive. Please contact your administrator to restore access.',
};

export const AuthPage: React.FC = () => {
  const { login, loginAdmin, registerUser, settings } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const searchError = new URLSearchParams(window.location.search).get('error');
  const initialError = searchError
    ? GOOGLE_AUTH_ERRORS[searchError] || 'Google sign-in could not be completed. Please try again or contact your administrator.'
    : '';
  const [error, setError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [googleAuthMessage, setGoogleAuthMessage] = useState('Checking Google sign-in availability…');
  const [isGoogleStatusLoading, setIsGoogleStatusLoading] = useState(true);
  const [emailInputEnabled, setEmailInputEnabled] = useState(false);
  const [passwordInputEnabled, setPasswordInputEnabled] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  });

  useEffect(() => {
    let isMounted = true;
    api
      .googleAuthStatus()
      .then((status) => {
        if (!isMounted) return;
        setGoogleAuthEnabled(status.googleAuthEnabled);
        setGoogleAuthMessage(status.message);
      })
      .catch(() => {
        if (!isMounted) return;
        setGoogleAuthEnabled(false);
        setGoogleAuthMessage('Unable to check Google sign-in. Please try again shortly.');
      })
      .finally(() => {
        if (isMounted) setIsGoogleStatusLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGoogleSignIn = () => {
    if (!googleAuthEnabled) return;
    setError('');
    setIsGoogleLoading(true);
    window.location.assign(`${API_ORIGIN}/api/auth/google`);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const emailTrimmed = form.email.trim();
    const isAdminCandidate =
      emailTrimmed.toLowerCase().includes('admin') ||
      emailTrimmed.toLowerCase() === 'suhasi271426@gmail.com';

    let result = await login(emailTrimmed, form.password);

    // If standard user login rejects because account has Admin role, seamlessly log in as Admin!
    if (!result.ok && (result.message?.includes('Admin') || isAdminCandidate)) {
      result = await loginAdmin(emailTrimmed, form.password);
    }

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message || 'Unable to sign in to the platform. Please check your credentials.');
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!settings.registrationEnabled && !settings.publicRegistrationEnabled) {
      setError('Public registration is disabled by the platform administrator.');
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please provide your name, email, and password.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await registerUser({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      department: form.department.trim() || 'General Personnel',
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message || 'Unable to complete registration. Please check your details and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-mono">AEGISOPS SECOPS</h2>
        <p className="mt-1 text-xs text-slate-400 font-mono tracking-widest uppercase">
          Defense-Grade IT Asset Disposal & Sanitization
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">
              {mode === 'login' ? 'Authenticate Access' : 'Create Standard Account'}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {mode === 'login'
                ? 'Sign in to access secure asset management workflows'
                : 'Register a verified account to submit disposal requests'}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs text-slate-300">Full name</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-slate-300">Email address</label>
              <input
                name="aegis_login_email"
                type="email"
                autoComplete="off"
                readOnly={mode === 'login' && !emailInputEnabled}
                onFocus={() => setEmailInputEnabled(true)}
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="name@company.com"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs text-slate-300">Department</label>
                <input
                  value={form.department}
                  onChange={(event) => setForm({ ...form, department: event.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Hardware Operations"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-slate-300">Password</label>
              <input
                name={mode === 'login' ? 'aegis_login_password' : 'password'}
                type="password"
                autoComplete={mode === 'login' ? 'new-password' : 'new-password'}
                readOnly={mode === 'login' && !passwordInputEnabled}
                onFocus={() => setPasswordInputEnabled(true)}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Enter your password"
              />
              {mode === 'login' && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="text-slate-500">Quick fill:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInputEnabled(true);
                      setPasswordInputEnabled(true);
                      setForm({ ...form, email: 'admin@aegisdisposal.local', password: 'AegisAdmin@2026!' });
                    }}
                    className="rounded bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 text-[11px] text-cyan-300 hover:bg-cyan-900/60 transition-colors"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInputEnabled(true);
                      setPasswordInputEnabled(true);
                      setForm({ ...form, email: 'm.vance@aegisdefense.io', password: 'AegisUser!2026' });
                    }}
                    className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Standard User
                  </button>
                </div>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs text-slate-300">Confirm password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Repeat your password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-70"
            >
              {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in to AegisOps' : 'Create secure account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-500">
                <span className="h-px flex-1 bg-slate-800" />
                or
                <span className="h-px flex-1 bg-slate-800" />
              </div>

              {/* Google Sign-In */}
              <button
                id="google-signin-btn"
                type="button"
                disabled={isGoogleLoading || isSubmitting || isGoogleStatusLoading || !googleAuthEnabled}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-700 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-cyan-600 animate-spin inline-block" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {isGoogleLoading ? 'Signing in with Google…' : 'Continue with Google'}
              </button>

              {!googleAuthEnabled && (
                <p role="status" className="mt-2 text-center text-xs text-amber-300">
                  {googleAuthMessage}
                </p>
              )}
            </>
          )}

          <div className="mt-6 flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-400">
            <span>{settings.registrationEnabled || settings.publicRegistrationEnabled ? 'Public registration available' : 'Registration disabled'}</span>
            <button
              type="button"
              onClick={() => {
                setError('');
                setEmailInputEnabled(false);
                setPasswordInputEnabled(false);
                setMode((current) => (current === 'login' ? 'register' : 'login'));
              }}
              className="inline-flex items-center gap-1.5 font-medium text-cyan-300 hover:text-cyan-200"
            >
              {mode === 'login' ? <UserPlus className="w-3.5 h-3.5" /> : <LockKeyhole className="w-3.5 h-3.5" />}
              {mode === 'login' ? 'New account' : 'Back to login'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
