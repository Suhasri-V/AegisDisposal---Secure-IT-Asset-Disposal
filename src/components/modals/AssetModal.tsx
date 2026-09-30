import React, { useState } from 'react';
import { X, HardDrive, Cpu, ShieldCheck } from 'lucide-react';
import { ITAsset, DeviceType } from '../../types';
import { useApp } from '../../context/AppContext';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetToEdit?: ITAsset | null;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  assetToEdit,
}) => {
  const { addAsset, updateAsset } = useApp();

  const [deviceType, setDeviceType] = useState<DeviceType>(assetToEdit?.deviceType || 'Laptop');
  const [brand, setBrand] = useState(assetToEdit?.brand || '');
  const [model, setModel] = useState(assetToEdit?.model || '');
  const [serialNumber, setSerialNumber] = useState(assetToEdit?.serialNumber || '');
  const [assignedEmployee, setAssignedEmployee] = useState(assetToEdit?.assignedEmployee || '');
  const [department, setDepartment] = useState(assetToEdit?.department || 'Engineering');
  const [location, setLocation] = useState(assetToEdit?.location || 'Building A - Floor 3');
  const [purchaseDate, setPurchaseDate] = useState(assetToEdit?.purchaseDate || new Date().toISOString().slice(0, 10));
  const [capacity, setCapacity] = useState(assetToEdit?.capacity || '512GB NVMe SSD');
  const [ipAddress, setIpAddress] = useState(assetToEdit?.ipAddress || '');
  const [macAddress, setMacAddress] = useState(assetToEdit?.macAddress || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || !serialNumber || !assignedEmployee) {
      alert('Please fill out all required fields (Brand, Model, Serial Number, Assigned Custodian)');
      return;
    }

    if (assetToEdit) {
      updateAsset({
        ...assetToEdit,
        deviceType,
        brand,
        model,
        serialNumber,
        assignedEmployee,
        department,
        location,
        purchaseDate,
        capacity,
        ipAddress,
        macAddress,
      });
    } else {
      addAsset({
        deviceType,
        brand,
        model,
        serialNumber,
        assignedEmployee,
        department,
        location,
        purchaseDate,
        capacity,
        ipAddress,
        macAddress,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-800/60 text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {assetToEdit ? `Edit IT Asset (${assetToEdit.id})` : 'Register New Enterprise IT Asset'}
              </h2>
              <p className="text-xs text-slate-400">
                Log hardware specifications and custody metadata for lifecycle auditing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Device Type *</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Hard Drive">Hard Drive</option>
                <option value="SSD">Solid State Drive (SSD)</option>
                <option value="Mobile">Mobile Smartphone</option>
                <option value="Tablet">Tablet</option>
                <option value="Server">Rack Server / Host</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Manufacturer / Brand *</label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Dell, Lenovo, Apple, HP"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Model Name / Number *</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. ThinkPad T14s, PowerEdge R750"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Serial Number (Hardware ID) *</label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. PF49B901Z, CZC019842M"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Assigned Custodian / User *</label>
              <input
                type="text"
                required
                value={assignedEmployee}
                onChange={(e) => setAssignedEmployee(e.target.value)}
                placeholder="e.g. Liam Vance or System Cluster"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Engineering">Engineering</option>
                <option value="Finance">Finance</option>
                <option value="Infrastructure">Infrastructure & Cloud</option>
                <option value="Cybersecurity">Cybersecurity & SecOps</option>
                <option value="Product Design">Product Design</option>
                <option value="Corporate Facilities">Corporate Facilities</option>
                <option value="Executive">Executive Operations</option>
                <option value="Customer Success">Customer Success</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Deployment Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Building B - Lab 3, Ashburn DC"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Storage / Media Specs</label>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="e.g. 512GB NVMe Opal SSD, 16TB SAS"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Network IP (Optional)</label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g. 10.24.110.42"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Compliance Assurance notice */}
          <div className="p-3 rounded bg-slate-950/60 border border-slate-800 flex items-start gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Upon registration, asset ownership will be cryptographically logged to the immutable audit trail under ISO 27001 Annex A.8.10 standards.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors"
            >
              {assetToEdit ? 'Save Changes' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
