import React, { useState } from 'react';
import {
  Settings,
  Building2,
  ShieldCheck,
  Bell,
  Lock,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WipingMethod, OrganizationSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetToDemoData, complianceRules, toggleComplianceRule } = useApp();

  const [orgName, setOrgName] = useState(settings.orgName);
  const [facilityName, setFacilityName] = useState(settings.facilityName);
  const [complianceLeadEmail, setComplianceLeadEmail] = useState(settings.complianceLeadEmail);
  const [defaultWipingStandard, setDefaultWipingStandard] = useState<WipingMethod>(settings.defaultWipingStandard);
  const [certifiedRecyclerPartner, setCertifiedRecyclerPartner] = useState(settings.certifiedRecyclerPartner);
  const [recyclerLicenseNumber, setRecyclerLicenseNumber] = useState(settings.recyclerLicenseNumber);
  const [auditRetentionDays, setAuditRetentionDays] = useState(settings.auditRetentionDays);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      orgName,
      facilityName,
      complianceLeadEmail,
      defaultWipingStandard,
      certifiedRecyclerPartner,
      recyclerLicenseNumber,
      auditRetentionDays,
      hashAlgorithm: settings.hashAlgorithm,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            Organization Governance & Platform Settings
          </h2>
          <p className="text-xs text-slate-400">
            Configure sanitization standards, downstream recycling partners, and immutable audit parameters
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            Settings saved successfully!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Organization Information */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            1. Organization & Facility Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Legal Entity Name (Printed on Destruction Certificates)
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Sanitization Facility & Clean Bay Location
              </label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Compliance Officer Lead Email
              </label>
              <input
                type="email"
                value={complianceLeadEmail}
                onChange={(e) => setComplianceLeadEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Default Enterprise Sanitization Standard
              </label>
              <select
                value={defaultWipingStandard}
                onChange={(e) => setDefaultWipingStandard(e.target.value as WipingMethod)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="NIST 800-88 Rev 1 Purge">NIST 800-88 Rev 1 Purge (3-Pass High Security)</option>
                <option value="NIST 800-88 Rev 1 Clear">NIST 800-88 Rev 1 Clear (Single Pass Overwrite)</option>
                <option value="DoD 5220.22-M (3-Pass)">DoD 5220.22-M (3-Pass Standard)</option>
                <option value="Cryptographic Erasure (Crypto Erase)">Cryptographic Erasure (Crypto Erase)</option>
                <option value="ATA Secure Erase">ATA Secure Erase (Firmware-Level)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Environmental Recycler Partner */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            2. Downstream R2v3 / e-Stewards Recycling Partner
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Certified Downstream E-Waste Recycler
              </label>
              <input
                type="text"
                value={certifiedRecyclerPartner}
                onChange={(e) => setCertifiedRecyclerPartner(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                EPA / R2v3 Certification License Number
              </label>
              <input
                type="text"
                value={recyclerLicenseNumber}
                onChange={(e) => setRecyclerLicenseNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Security & Cryptographic Settings */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            3. Cryptography & Audit Ledger Retention
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Certificate Integrity Hash Algorithm
              </label>
              <input
                type="text"
                disabled
                value={settings.hashAlgorithm}
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-slate-400 font-mono opacity-80"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Audit Record Minimum Retention Horizon (Days)
              </label>
              <input
                type="number"
                value={auditRetentionDays}
                onChange={(e) => setAuditRetentionDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Default: 2555 days (7 years, compliant with SOX 802 / GDPR Art 17)
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Demo State Management */}
        <div className="p-5 rounded-xl bg-slate-900 border border-rose-900/40 space-y-3">
          <h3 className="font-semibold text-rose-300 text-xs uppercase tracking-wider">
            Prototype Demonstration Control
          </h3>
          <p className="text-xs text-slate-400">
            Reset all in-memory database records (assets, wiping simulations, certificates, and audit logs) back to initial factory demo state.
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset application back to default demo dataset?')) {
                resetToDemoData();
                alert('Demo data reset successfully.');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800 hover:bg-rose-900/60 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Initial Demo Data
          </button>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-900/20"
          >
            <Save className="w-4 h-4" />
            Save Governance Settings
          </button>
        </div>
      </form>
    </div>
  );
};
