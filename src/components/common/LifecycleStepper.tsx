import React from 'react';
import { LifecycleStage } from '../../types';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface LifecycleStepperProps {
  currentStage: LifecycleStage;
  onSelectStage?: (stage: LifecycleStage) => void;
  interactive?: boolean;
}

const STAGES: { key: LifecycleStage; label: string; shortLabel: string }[] = [
  { key: 'Registered', label: 'Asset Registration', shortLabel: 'Registered' },
  { key: 'Disposal Requested', label: 'Disposal Request', shortLabel: 'Requested' },
  { key: 'Approved', label: 'Manager Approval', shortLabel: 'Approved' },
  { key: 'Data Wiping', label: 'Data Wiping', shortLabel: 'Wiping' },
  { key: 'Verification', label: 'Wiping Verification', shortLabel: 'Verification' },
  { key: 'Compliance Review', label: 'Compliance Check', shortLabel: 'Compliance' },
  { key: 'Certificate Generated', label: 'Certificate Gen', shortLabel: 'Certificate' },
  { key: 'Disposed', label: 'Final Disposal', shortLabel: 'Disposed' },
];

export const LifecycleStepper: React.FC<LifecycleStepperProps> = ({
  currentStage,
  onSelectStage,
  interactive = false,
}) => {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="min-w-[760px] flex items-center justify-between relative">
        {/* Connecting Background Line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-800 -z-0" />
        
        {/* Connecting Active Fill Line */}
        <div
          className="absolute top-4 left-6 h-0.5 bg-cyan-500 transition-all duration-500 -z-0"
          style={{
            width: `${Math.max(0, (currentIndex / (STAGES.length - 1)) * 100)}%`,
          }}
        />

        {STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          let circleBg = 'bg-slate-900 border-slate-700 text-slate-500';
          let textColor = 'text-slate-500';

          if (isPassed) {
            circleBg = 'bg-cyan-950 border-cyan-500 text-cyan-400';
            textColor = 'text-slate-300';
          } else if (isCurrent) {
            circleBg = 'bg-cyan-500 border-cyan-300 text-slate-950 font-bold ring-4 ring-cyan-500/20';
            textColor = 'text-cyan-300 font-semibold';
          }

          return (
            <div
              key={stage.key}
              onClick={() => interactive && onSelectStage && onSelectStage(stage.key)}
              className={`flex flex-col items-center relative z-10 ${
                interactive ? 'cursor-pointer group' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs transition-all duration-200 ${circleBg} ${
                  interactive ? 'group-hover:scale-110' : ''
                }`}
              >
                {isPassed ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 stroke-[2.5] animate-spin-slow" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-[11px] mt-2 whitespace-nowrap tracking-tight transition-colors ${textColor} ${
                  interactive ? 'group-hover:text-cyan-200' : ''
                }`}
              >
                {stage.shortLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
