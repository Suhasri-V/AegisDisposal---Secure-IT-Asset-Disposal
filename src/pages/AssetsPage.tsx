import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  FileCheck2,
  Trash2,
  HardDrive,
  Laptop,
  Smartphone,
  Server,
  Tablet,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNav } from '../context/NavigationContext';
import { BackButton } from '../components/common/BackButton';
import { ITAsset, DeviceType, DisposalStatus, ComplianceStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

interface AssetsPageProps {
  onSelectAsset: (asset: ITAsset) => void;
  onEditAsset: (asset: ITAsset) => void;
  onRequestDisposal: (asset: ITAsset) => void;
  onOpenNewAssetModal: () => void;
}

export const AssetsPage: React.FC<AssetsPageProps> = ({
  onSelectAsset,
  onEditAsset,
  onRequestDisposal,
  onOpenNewAssetModal,
}) => {
  const { assets } = useApp();
  const { pageStates, setPageState } = useNav();

  const [search, setSearch] = useState(pageStates.assets?.search ?? '');
  const [deviceFilter, setDeviceFilter] = useState<string>(pageStates.assets?.deviceFilter ?? 'All');
  const [statusFilter, setStatusFilter] = useState<string>(pageStates.assets?.statusFilter ?? 'All');
  const [complianceFilter, setComplianceFilter] = useState<string>(pageStates.assets?.complianceFilter ?? 'All');
  const [departmentFilter, setDepartmentFilter] = useState<string>(pageStates.assets?.departmentFilter ?? 'All');

  // Preserve filter state
  useEffect(() => {
    setPageState('assets', {
      search,
      deviceFilter,
      statusFilter,
      complianceFilter,
      departmentFilter,
    });
  }, [search, deviceFilter, statusFilter, complianceFilter, departmentFilter, setPageState]);

  // Extract unique departments
  const departments = ['All', ...Array.from(new Set(assets.map((a) => a.department)))];

  // Filtering
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.id.toLowerCase().includes(search.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      asset.brand.toLowerCase().includes(search.toLowerCase()) ||
      asset.model.toLowerCase().includes(search.toLowerCase()) ||
      asset.assignedEmployee.toLowerCase().includes(search.toLowerCase());

    const matchesDevice = deviceFilter === 'All' || asset.deviceType === deviceFilter;
    const matchesStatus = statusFilter === 'All' || asset.disposalStatus === statusFilter;
    const matchesCompliance = complianceFilter === 'All' || asset.complianceStatus === complianceFilter;
    const matchesDepartment = departmentFilter === 'All' || asset.department === departmentFilter;

    return matchesSearch && matchesDevice && matchesStatus && matchesCompliance && matchesDepartment;
  });

  const exportCSV = () => {
    const headers = [
      'Asset ID',
      'Device Type',
      'Brand',
      'Model',
      'Serial Number',
      'Custodian',
      'Department',
      'Location',
      'Purchase Date',
      'Disposal Status',
      'Compliance Status',
    ];
    const rows = filteredAssets.map((a) => [
      a.id,
      a.deviceType,
      a.brand,
      a.model,
      a.serialNumber,
      `"${a.assignedEmployee}"`,
      `"${a.department}"`,
      `"${a.location}"`,
      a.purchaseDate,
      a.disposalStatus,
      a.complianceStatus,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IT_Assets_Inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top-left Back button */}
      <BackButton />

      {/* Top Action & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, Serial, Custodian, Brand..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-xs border border-slate-700 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={onOpenNewAssetModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add IT Asset
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Device Type</label>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Types</option>
              <option value="Laptop">Laptop</option>
              <option value="Desktop">Desktop</option>
              <option value="Hard Drive">Hard Drive</option>
              <option value="SSD">SSD</option>
              <option value="Mobile">Mobile</option>
              <option value="Tablet">Tablet</option>
              <option value="Server">Server</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Disposal Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active (In Use)</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Wiping In Progress">Wiping In Progress</option>
              <option value="Verification Pending">Verification Pending</option>
              <option value="Verification Failed">Verification Failed</option>
              <option value="Ready For Disposal">Ready For Disposal</option>
              <option value="Disposed">Disposed / Archived</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Compliance State</label>
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Compliance</option>
              <option value="Compliant">Compliant</option>
              <option value="Partially Compliant">Partially Compliant</option>
              <option value="Non-Compliant">Non-Compliant</option>
              <option value="Review Required">Review Required</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Asset Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            Showing <strong className="text-white">{filteredAssets.length}</strong> of{' '}
            <strong className="text-slate-300">{assets.length}</strong> IT Assets
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Sorted by Last Updated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium select-none">
                <th className="py-3 px-3">Asset ID</th>
                <th className="py-3 px-3">Device & Specs</th>
                <th className="py-3 px-3">Make / Model</th>
                <th className="py-3 px-3">Serial Number</th>
                <th className="py-3 px-3">Custodian</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Disposal Status</th>
                <th className="py-3 px-3">Compliance</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                    No IT assets match the current filter and search criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectAsset(asset)}
                  >
                    {/* Asset ID */}
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {asset.id}
                    </td>

                    {/* Device & Capacity */}
                    <td className="py-3 px-3 text-slate-200 whitespace-nowrap">
                      <div className="font-medium">{asset.deviceType}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                        {asset.capacity || 'N/A'}
                      </div>
                    </td>

                    {/* Make & Model */}
                    <td className="py-3 px-3 text-slate-300">
                      <div className="font-medium text-white truncate max-w-[140px]">
                        {asset.brand}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {asset.model}
                      </div>
                    </td>

                    {/* Serial Number */}
                    <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                      {asset.serialNumber}
                    </td>

                    {/* Custodian */}
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      <div className="font-medium truncate max-w-[130px]">
                        {asset.assignedEmployee}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {asset.department}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap truncate max-w-[120px]">
                      {asset.location}
                    </td>

                    {/* Disposal Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={asset.disposalStatus} size="sm" />
                    </td>

                    {/* Compliance Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={asset.complianceStatus} size="sm" />
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                          title="View Asset Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditAsset(asset)}
                          className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                          title="Edit Asset"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {asset.disposalStatus === 'Active' && (
                          <button
                            onClick={() => onRequestDisposal(asset)}
                            className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-medium text-[11px]"
                            title="Request Disposal"
                          >
                            Decommission
                          </button>
                        )}
                      </div>
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
