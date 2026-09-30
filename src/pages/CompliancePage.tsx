import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Award,
  Search,
  Filter,
  Check,
  Sliders,
  Building,
  Info,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';
import { ITAsset } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

interface CompliancePageProps {
  onSelectAsset: (asset: ITAsset) => void;
  onGenerateCertificate: (asset: ITAsset) => void;
}

export const CompliancePage: React.FC<CompliancePageProps> = ({
  onSelectAsset,
  onGenerateCertificate,
}) => {
  const { assets, complianceRules, toggleComplianceRule } = useApp();
  const { pageStates, setPageState, navigate } = useNav();

  const [complianceFilter, setComplianceFilter] = useState<string>(
    pageStates.compliance?.complianceFilter ?? 'All'
  );
  const [riskFilter, setRiskFilter] = useState<string>(pageStates.compliance?.riskFilter ?? 'All');
  const [search, setSearch] = useState(pageStates.compliance?.search ?? '');
  const [showConfigRules, setShowConfigRules] = useState(
    pageStates.compliance?.showConfigRules ?? false
  );

  // Preserve filter state
  useEffect(() => {
    setPageState('compliance', {
      complianceFilter,
      riskFilter,
      search,
      showConfigRules,
    });
  }, [complianceFilter, riskFilter, search, showConfigRules, setPageState]);

  const filteredAssets = assets.filter((asset) => {
    const matchesCompliance = complianceFilter === 'All' || asset.complianceStatus === complianceFilter;
    const matchesRisk = riskFilter === 'All' || asset.riskLevel === riskFilter;
    const matchesSearch =
      asset.id.toLowerCase().includes(search.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      asset.assignedEmployee.toLowerCase().includes(search.toLowerCase()) ||
      asset.brand.toLowerCase().includes(search.toLowerCase());

    return matchesCompliance && matchesRisk && matchesSearch;
  });

  const compliantCount = assets.filter((a) => a.complianceStatus === 'Compliant').length;
  const partialCount = assets.filter((a) => a.complianceStatus === 'Partially Compliant').length;
  const nonCompliantCount = assets.filter((a) => a.complianceStatus === 'Non-Compliant').length;
  const reviewCount = assets.filter((a) => a.complianceStatus === 'Review Required').length;

  return (
    <div className="space-y-4">
      {/* Top-left Back button */}
      <BackButton />

      {/* Top Action & Navigation Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Regulatory Compliance & Sanitization Governance
          </h2>
          <p className="text-xs text-slate-400">
            NIST SP 800-88, GDPR Art 17, and HIPAA security compliance validation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('certificates')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Award className="w-3.5 h-3.5" />
            View Destruction Certificates <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Disclaimer Banner (Zero legal claim disclaimer per prompt instructions) */}
      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">
            Organizational Compliance Governance Framework:
          </span>{' '}
          Rules and thresholds displayed are configurable enterprise organizational requirements mapped to NIST SP 800-88, ISO 27001, GDPR Art 17, and HIPAA standards. This platform enforces organizational workflow verification and audit trail integrity.
        </div>
      </div>

      {/* Compliance Overview KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Fully Compliant Assets</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{compliantCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">All audit checks satisfied</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Partially Compliant</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{partialCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Pending sanitization/cert</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Non-Compliant (Alerts)</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{nonCompliantCount}</div>
          <div className="text-[10px] text-rose-400/80 mt-1">Failed wiping / rejected</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Active Policy Review</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{reviewCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Active inventory baseline</div>
        </div>
      </div>

      {/* Configurable Rules Panel Toggle */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Configurable Organizational Compliance Policies ({complianceRules.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Customize active rules across Data Protection, Sanitization, Retention, and Recycling
            </p>
          </div>
          <button
            onClick={() => setShowConfigRules(!showConfigRules)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 font-medium transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showConfigRules ? 'Hide Config' : 'Configure Rules'}
          </button>
        </div>

        {showConfigRules && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
            {complianceRules.map((rule) => (
              <div
                key={rule.id}
                className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{rule.name}</span>
                    {rule.mandatory && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                    {rule.standardReference} · {rule.category}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
                <button
                  onClick={() => toggleComplianceRule(rule.id)}
                  className={`px-2 py-1 rounded text-[11px] font-medium shrink-0 ${
                    rule.active
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rule.active ? 'Active' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Compliance Statuses</option>
            <option value="Compliant">Compliant</option>
            <option value="Partially Compliant">Partially Compliant</option>
            <option value="Non-Compliant">Non-Compliant</option>
            <option value="Review Required">Review Required</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
            <option value="Critical">Critical Risk</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset compliance..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-8 pr-3 py-1.5 text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Compliance Matrix Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium select-none">
                <th className="py-3 px-3">Asset ID</th>
                <th className="py-3 px-3">Make / Serial</th>
                <th className="py-3 px-3">Custodian</th>
                <th className="py-3 px-3">Compliance Status</th>
                <th className="py-3 px-3">Completed Milestones</th>
                <th className="py-3 px-3">Missing Requirements</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Last Audited</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                    No IT assets found matching the specified compliance filters.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectAsset(asset)}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {asset.id}
                    </td>

                    <td className="py-3 px-3 text-slate-200 whitespace-nowrap">
                      <div className="font-medium">{asset.brand} {asset.model}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{asset.serialNumber}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      {asset.assignedEmployee}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={asset.complianceStatus} size="sm" />
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                        <span>{asset.completedRequirements.length} satisfied</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {asset.missingRequirements.length > 0 ? (
                        <span className="text-amber-400 font-mono text-[11px]">
                          {asset.missingRequirements.length} pending
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">None (Complete)</span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={asset.riskLevel} size="sm" />
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {asset.lastComplianceCheck}
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {asset.disposalStatus === 'Ready For Disposal' && !asset.certificateId ? (
                        <button
                          onClick={() => onGenerateCertificate(asset)}
                          className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 text-[11px] transition-colors"
                        >
                          Generate Cert
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px]"
                        >
                          Audit Checklist
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
