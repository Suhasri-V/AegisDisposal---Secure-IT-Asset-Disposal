import React, { useState, useEffect } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck, UserPlus, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { API_ORIGIN, api } from '../api/client';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const GOOGLE_AUTH_ERRORS: Record<string, string> = {
  google_state_invalid:
    'Google sign-in could not verify the login session. Start again from this HTTPS application address; if it continues, verify the configured frontend and callback URLs.',
  google_sign_in_cancelled: 'Google sign-in was cancelled. Select an account and approve the sign-in to continue.',
  google_sign_in_failed:
    'Google could not complete authentication. Please contact your administrator to verify the OAuth client credentials and callback URL.',
  google_oauth_client_invalid:
    'Google rejected the server-configured OAuth credentials. Verify that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET belong to the same Google OAuth client, then update them in the Render environment settings.',
  google_oauth_not_configured:
    'Google sign-in is not configured on the backend. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, and FRONTEND_URL in the Render environment settings.',
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
  const { login, registerUser, settings, loginWithGoogleProfile } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const searchError = new URLSearchParams(window.location.search).get('error');
  const initialError = searchError
    ? GOOGLE_AUTH_ERRORS[searchError] || 'Google sign-in could not be completed. Please try again or contact your administrator.'
    : '';
  const [error, setError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  });

  // Google OAuth availability — optimistic by default, verified in background
  const [googleEnabled, setGoogleEnabled] = useState<boolean>(true);
  const [isWakingBackend, setIsWakingBackend] = useState<boolean>(false);
  const [googleStatusMessage, setGoogleStatusMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    let retryTimer: any;

    const checkStatus = (retriesLeft = 3, delay = 2000) => {
      api
        .googleAuthStatus()
        .then((res) => {
          if (!isMounted) return;
          setIsWakingBackend(false);
          setGoogleEnabled(res.googleAuthEnabled);
          setGoogleStatusMessage(res.message);
        })
        .catch(() => {
          if (!isMounted) return;
          if (retriesLeft > 0) {
            setIsWakingBackend(true);
            setGoogleStatusMessage('Connecting to authentication service…');
            retryTimer = setTimeout(() => checkStatus(retriesLeft - 1, delay * 1.5), delay);
          } else {
            setIsWakingBackend(false);
            setGoogleStatusMessage('');
          }
        });
    };

    checkStatus();

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      // 1. Direct Firebase Google Sign-In Popup (instant, browser-native)
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (!fbUser.email) {
        throw new Error('Google did not return an email address.');
      }
      const res = await loginWithGoogleProfile({
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        googleId: fbUser.uid,
        avatar: fbUser.photoURL || undefined,
      });
      if (!res.ok) {
        setError(res.message || 'Unable to complete Google sign-in.');
      }
    } catch (fbErr: any) {
      if (fbErr?.code === 'auth/popup-closed-by-user' || fbErr?.code === 'auth/cancelled-popup-request') {
        setIsGoogleLoading(false);
        return;
      }
      console.warn('Firebase popup sign-in did not complete, falling back to server OAuth:', fbErr);
      // 2. Fall back to backend OAuth redirect
      const targetUrl = API_ORIGIN ? `${API_ORIGIN}/api/auth/google` : '/api/auth/google';
      window.location.assign(targetUrl);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(form.email, form.password);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message || 'Unable to sign in to the platform.');
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!settings.registrationEnabled && !settings.publicRegistrationEnabled) {
      setError('Public registration is disabled by the platform administrator.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await registerUser({
      name: form.name,
      email: form.email,
      password: form.password,
      department: form.department,
      role: 'User', // strictly User role
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message || 'Unable to create your account.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-[1.2fr_0.8fr] rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-cyan-950/20 overflow-hidden">
        <div className="relative p-8 md:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_32%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-300">
              <ShieldCheck className="w-4 h-4" />
              AegisSecOps
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">
              Secure IT disposal operations, compliance, and credential-led governance.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Sign in to manage asset lifecycle controls, data sanitization approvals, verification checkpoints,
              and certificate evidence across the enterprise disposal workflow.
            </p>

            <div className="mt-8 rounded-xl border border-slate-700/60 bg-slate-950/50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <LockKeyhole className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-medium">Credential-protected access</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign in with your registered User account or continue with Google. Administrator accounts must use the separate Admin Login page.
              </p>
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  🔒 Administrator accounts are provisioned by the system administrator only.
                  They cannot be self-registered. Contact your administrator if you need access.
                </p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Credentials are verified on the server and password hashes are never exposed to the browser.
                </p>
              </div>
            </div>
            <a href="/admin/login" className="mt-5 inline-flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200">
              Administrator? Continue to Admin Login <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="p-8 md:p-10 bg-slate-900/70">
          <div className="flex items-center justify-between gap-3 pb-5 border-b border-slate-800">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Access portal</div>
              <h2 className="mt-1 text-xl font-semibold text-white">
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </h2>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-cyan-300">
              <LockKeyhole className="w-5 h-5" />
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="mt-6 space-y-4">
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
                type="email"
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
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Enter your password"
              />
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
                disabled={isGoogleLoading || isSubmitting}
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

              {isWakingBackend && (
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-cyan-400 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 border-t-transparent animate-spin inline-block" />
                  <span>Connecting to authentication service…</span>
                </div>
              )}

              {!googleEnabled && googleStatusMessage && (
                <p role="status" className="mt-2 text-center text-xs text-amber-300">
                  {googleStatusMessage}
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
