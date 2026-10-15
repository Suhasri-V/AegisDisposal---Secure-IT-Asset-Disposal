import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Building,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BackButton } from '../components/common/BackButton';

export const UserProfilePage: React.FC = () => {
  const { currentUser, updateProfile, changePassword, assets, auditLogs } = useApp();

  // Profile Edit State
  const [name, setName] = useState(currentUser.name);
  const [department, setDepartment] = useState(currentUser.department);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // User's assets
  const myAssets = assets.filter(
    (a) =>
      a.userId === currentUser.id ||
      a.assignedEmployee.toLowerCase() === currentUser.name.toLowerCase()
  );

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setIsUpdatingProfile(true);

    const result = await updateProfile({ name, department });
    setIsUpdatingProfile(false);

    if (result.ok) {
      setProfileSuccess(result.message);
      setTimeout(() => setProfileSuccess(''), 4000);
    } else {
      setProfileError(result.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please provide both current and new passwords.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword, confirmPassword);
    setIsChangingPassword(false);

    if (result.ok) {
      setPasswordSuccess(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } else {
      setPasswordError(result.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <BackButton />

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xl text-slate-950 font-mono shadow-lg shadow-cyan-950/30">
            {currentUser.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{currentUser.name}</h1>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                currentUser.role === 'Admin'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {currentUser.role}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {currentUser.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {currentUser.email}</span>
              <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-slate-500" /> {currentUser.department}</span>
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l border-slate-800 sm:pl-6 text-xs text-slate-400 font-mono space-y-1">
          <div><span className="text-slate-500">Account ID:</span> {currentUser.id}</div>
          <div><span className="text-slate-500">Last Sign-in:</span> {currentUser.lastLogin}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form 1: Edit Profile Details */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Personal Profile Information
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Editable</span>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Email Address</label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-slate-500 cursor-not-allowed font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Email is locked to your organization identity.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Assigned Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Access Role</label>
              <input
                type="text"
                value={`${currentUser.role} (Role changes must be authorized by an Administrator)`}
                disabled
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-slate-500 cursor-not-allowed text-[11px]"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors disabled:opacity-60"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Form 2: Change Password Securely */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              Secure Password Management
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Bcrypt Hashed</span>
          </div>

          {passwordSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, uppercase, lowercase, number, symbol"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Password Policy Requirements:</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                <li className={newPassword.length >= 8 ? 'text-emerald-400' : ''}>At least 8 characters</li>
                <li className={/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-emerald-400' : ''}>Uppercase & lowercase letters</li>
                <li className={/\d/.test(newPassword) ? 'text-emerald-400' : ''}>At least one numeric digit</li>
                <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-400' : ''}>At least one special character (!@#$%^&*)</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors disabled:opacity-60"
            >
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Summary of Registered Assets */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          Hardware Assets in Your Custody ({myAssets.length})
        </h3>
        {myAssets.length === 0 ? (
          <p className="text-xs text-slate-500">No hardware assets currently assigned to your account.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {myAssets.map((asset) => (
              <div key={asset.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-semibold">{asset.id}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                    {asset.disposalStatus}
                  </span>
                </div>
                <div className="text-slate-200 font-medium truncate">{asset.brand} {asset.model}</div>
                <div className="text-[10px] text-slate-400 font-mono">SN: {asset.serialNumber}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
