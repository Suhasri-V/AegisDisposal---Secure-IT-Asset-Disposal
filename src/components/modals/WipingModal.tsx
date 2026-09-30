import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Cpu, CheckCircle2, AlertTriangle, Play, FastForward, RotateCcw } from 'lucide-react';
import { ITAsset, WipingMethod } from '../../types';
import { useApp } from '../../context/AppContext';

interface WipingModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: ITAsset | null;
}

export const WipingModal: React.FC<WipingModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  const { startWiping, completeWiping, currentUser, users } = useApp();

  const [method, setMethod] = useState<WipingMethod>('NIST 800-88 Rev 1 Purge');
  const [technician, setTechnician] = useState('Marcus Vance');
  const [tool, setTool] = useState('Blancco Drive Eraser Enterprise v7.4');

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPass, setCurrentPass] = useState(1);
  const [totalPasses, setTotalPasses] = useState(3);
  const [logs, setLogs] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [simulationResult, setSimulationResult] = useState<'Passed' | 'Failed'>('Passed');

  const logEndRef = useRef<HTMLDivElement>(null);

  // Initialize total passes based on method
  useEffect(() => {
    if (method.includes('3-Pass') || method.includes('Purge')) {
      setTotalPasses(3);
    } else {
      setTotalPasses(1);
    }
  }, [method]);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setIsSimulating(false);
      setProgress(0);
      setCurrentPass(1);
      setLogs([]);
      setIsFinished(false);
      setSimulationResult('Passed');
      if (asset?.wipingMethod) setMethod(asset.wipingMethod);
      if (asset?.technician) setTechnician(asset.technician);
      if (asset?.wipingTool) setTool(asset.wipingTool);
    }
  }, [isOpen, asset]);

  // Auto scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Simulation timer runner
  useEffect(() => {
    let interval: any = null;

    if (isSimulating && !isFinished) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 4;

          // Milestone logs
          if (next === 8) {
            setLogs((l) => [
              ...l,
              `[${new Date().toLocaleTimeString()}] Bus handshake established. Drive ID: ${asset?.serialNumber} confirmed.`,
            ]);
          } else if (next === 24) {
            setLogs((l) => [
              ...l,
              `[${new Date().toLocaleTimeString()}] Security Freeze Lock released. Target capacity: ${asset?.capacity || '512GB'}.`,
            ]);
          } else if (next === 44) {
            setCurrentPass(totalPasses > 1 ? 2 : 1);
            setLogs((l) => [
              ...l,
              `[${new Date().toLocaleTimeString()}] Pass ${totalPasses > 1 ? '2' : '1'}: Overwriting sectors with pseudo-random cryptographic pattern...`,
            ]);
          } else if (next === 72) {
            if (totalPasses >= 3) setCurrentPass(3);
            setLogs((l) => [
              ...l,
              `[${new Date().toLocaleTimeString()}] Finalizing zero-fill inversion (0x00 pattern) across all LBA blocks...`,
            ]);
          } else if (next >= 100) {
            clearInterval(interval);
            setIsFinished(true);
            setIsSimulating(false);

            if (simulationResult === 'Passed') {
              setLogs((l) => [
                ...l,
                `[${new Date().toLocaleTimeString()}] 100% sector readback verification successful. 0 uncorrected blocks.`,
                `[${new Date().toLocaleTimeString()}] Sanitization completed in compliance with ${method}.`,
              ]);
            } else {
              setLogs((l) => [
                ...l,
                `[${new Date().toLocaleTimeString()}] ERROR: I/O Read timeout at sector 0x7E19B200. Bad blocks encountered.`,
                `[${new Date().toLocaleTimeString()}] Wiping routine failed verification threshold.`,
              ]);
            }
            return 100;
          }

          return next;
        });
      }, 150);
    }

    return () => clearInterval(interval);
  }, [isSimulating, isFinished, totalPasses, simulationResult, asset, method]);

  if (!isOpen || !asset) return null;

  const handleStartWiping = (willFail = false) => {
    setSimulationResult(willFail ? 'Failed' : 'Passed');
    setIsSimulating(true);
    setProgress(0);
    setLogs([
      `[${new Date().toLocaleTimeString()}] Starting sanitization job via ${tool}`,
      `[${new Date().toLocaleTimeString()}] Standard: ${method}`,
      `[${new Date().toLocaleTimeString()}] Operator: ${technician}`,
      `[${new Date().toLocaleTimeString()}] Asset ID: ${asset.id} | Serial: ${asset.serialNumber}`,
    ]);

    startWiping(asset.id, method, technician, tool);
  };

  const handleInstantComplete = (passed = true) => {
    setProgress(100);
    setIsSimulating(false);
    setIsFinished(true);
    setSimulationResult(passed ? 'Passed' : 'Failed');

    const finalLogs = [
      `[${new Date().toLocaleTimeString()}] Starting sanitization job via ${tool}`,
      `[${new Date().toLocaleTimeString()}] Standard: ${method} | Operator: ${technician}`,
      `[${new Date().toLocaleTimeString()}] Rapid sanitization simulation executed.`,
      passed
        ? `[${new Date().toLocaleTimeString()}] SUCCESS: All sectors zero-filled and verified under ${method}.`
        : `[${new Date().toLocaleTimeString()}] FAILED: I/O write error on sector 0x2A199042.`,
    ];

    setLogs(finalLogs);
    completeWiping(asset.id, passed, finalLogs);
  };

  const handleFinishAndSave = () => {
    completeWiping(asset.id, simulationResult === 'Passed', logs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-800/60 text-cyan-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Certified Data Sanitization Simulator
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Asset: {asset.id} · {asset.brand} {asset.model} ({asset.capacity || 'Storage Drive'})
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

        {/* Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Configuration Form (disabled during simulation or completion) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Data Sanitization Method *
              </label>
              <select
                disabled={isSimulating || isFinished}
                value={method}
                onChange={(e) => setMethod(e.target.value as WipingMethod)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
              >
                <option value="NIST 800-88 Rev 1 Purge">NIST 800-88 Rev 1 Purge (High Security 3-Pass)</option>
                <option value="NIST 800-88 Rev 1 Clear">NIST 800-88 Rev 1 Clear (Single-Pass Overwrite)</option>
                <option value="DoD 5220.22-M (3-Pass)">DoD 5220.22-M (DoD Standard 3-Pass)</option>
                <option value="Cryptographic Erasure (Crypto Erase)">Cryptographic Erasure (SED Key Zeroize)</option>
                <option value="ATA Secure Erase">ATA Secure Erase (Firmware-Level Command)</option>
                <option value="Physical Destruction / Degaussing">Physical Destruction / Degaussing</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Assigned Certified Technician *
              </label>
              <select
                disabled={isSimulating || isFinished}
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Sanitization Tool / Software Rig</label>
            <select
              disabled={isSimulating || isFinished}
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
            >
              <option value="Blancco Drive Eraser Enterprise v7.4">Blancco Drive Eraser Enterprise v7.4 (ADISA Certified)</option>
              <option value="DBAN Enterprise AutoWipe">DBAN Enterprise AutoWipe v3.1</option>
              <option value="BitRaser Pro SecureSanitize">BitRaser Pro SecureSanitize (NIST Certified)</option>
              <option value="Samsung Magician Enterprise CLI">Samsung Magician Enterprise CLI (NVMe Crypto Purge)</option>
              <option value="Certified Degausser & Mechanical Shredder">Certified Degausser & Mechanical Shredder</option>
            </select>
          </div>

          {/* Live Progress Bar Section */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Sanitization Progress
              </span>
              <span className="font-mono text-cyan-400 font-bold tabular-nums">
                {progress}%
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className={`h-full transition-all duration-150 ${
                  simulationResult === 'Failed' && isFinished
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>
                Pass: <strong className="text-slate-200">{currentPass}</strong> of{' '}
                <strong className="text-slate-200">{totalPasses}</strong>
              </span>
              <span>
                Status:{' '}
                {isSimulating ? (
                  <span className="text-cyan-400 animate-pulse">Running Overwrite Passes...</span>
                ) : isFinished ? (
                  simulationResult === 'Passed' ? (
                    <span className="text-emerald-400 font-semibold">Completed Successfully</span>
                  ) : (
                    <span className="text-rose-400 font-semibold">Sanitization Failed</span>
                  )
                ) : (
                  <span className="text-slate-500">Ready to initiate</span>
                )}
              </span>
            </div>
          </div>

          {/* Terminal / Live Log Output */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-[11px] font-mono">Real-Time Sanitization Output Logs</span>
              <span className="text-[10px] text-slate-600 font-mono">ISO/IEC 27040 Compliance Feed</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-md p-3 font-mono text-[11px] text-emerald-400/90 h-36 overflow-y-auto space-y-1 scrollbar-thin">
              {logs.length === 0 ? (
                <div className="text-slate-600">
                  Click "Start Wiping Simulation" below to initiate raw sector zeroization...
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="leading-tight">
                    {log.includes('ERROR') || log.includes('failed') ? (
                      <span className="text-rose-400">{log}</span>
                    ) : log.includes('SUCCESS') || log.includes('successful') ? (
                      <span className="text-emerald-300 font-bold">{log}</span>
                    ) : (
                      log
                    )}
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {!isSimulating && !isFinished && (
              <>
                <button
                  type="button"
                  onClick={() => handleStartWiping(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors text-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Simulate Wiping (4s)
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantComplete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-xs border border-slate-700"
                  title="Complete without waiting"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  Instant Success
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantComplete(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 transition-colors text-xs border border-rose-800/50"
                  title="Simulate bad sectors / failure for compliance testing"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Test Failure Flow
                </button>
              </>
            )}

            {isSimulating && (
              <div className="text-xs text-cyan-400 animate-pulse font-mono">
                Overwriting sectors... Please wait
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isFinished ? (
              <button
                type="button"
                onClick={handleFinishAndSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Proceed to Verification Queue
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-xs"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
