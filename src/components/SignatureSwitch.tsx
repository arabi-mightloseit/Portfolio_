import React, { useState } from 'react';
import { ThemeMode } from '../types';
import { playMechanicalRelay } from '../utils/audio';

interface SignatureSwitchProps {
  isArmed: boolean;
  onToggle: (armed: boolean) => void;
  theme: ThemeMode;
}

export const SignatureSwitch: React.FC<SignatureSwitchProps> = ({
  isArmed,
  onToggle,
  theme,
}) => {
  const [showStatusToast, setShowStatusToast] = useState(false);

  const handleToggle = () => {
    const nextState = !isArmed;
    playMechanicalRelay(nextState);
    onToggle(nextState);
    setShowStatusToast(true);
    setTimeout(() => {
      setShowStatusToast(false);
    }, 3800);
  };

  const isNoir = theme === 'noir';

  return (
    <div className="relative inline-flex items-center gap-3 select-none z-30">
      {/* Section toggle: label + track/thumb. Visual state is driven by `isArmed` (.is-active). */}
      <button
        type="button"
        role="switch"
        aria-checked={isArmed}
        aria-label="Toggle between Section L (unimaginative) and Section W (Artistic)"
        title={isArmed ? 'Section W: Artistic' : 'Section L: Unimaginative'}
        onClick={handleToggle}
        className={`section-toggle${isArmed ? ' is-active' : ''}`}
      >
        <span className="toggle-label">
          <span className="toggle-label-prefix">Section&nbsp;</span>
          {isArmed ? 'W' : 'L'}
        </span>
        <span className="toggle-track" aria-hidden="true">
          <span className="toggle-thumb" />
        </span>
      </button>

      {/* Subtle Hardware Status Toast */}
      {showStatusToast && (
        <div
          role="status"
          className={`absolute right-0 top-[42px] w-64 p-2.5 rounded-sm text-left shadow-lg border backdrop-blur-xs transition-opacity duration-200 z-50 ${
            isNoir
              ? 'bg-[#14161D] border-[#3D5CFF]/40 text-[#F1EBDD]'
              : 'bg-[#F9F5EC] border-[#2946D3]/40 text-[#101116]'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-editorial-mono uppercase tracking-[0.16em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E83B2E]" />
            <span className={`font-semibold ${isNoir ? 'text-[#5577FF]' : 'text-[#2946D3]'}`}>
              {isArmed ? 'SECTION W // ARTISTIC' : 'SECTION L // UNIMAGINATIVE'}
            </span>
          </div>
          <p
            className={`mt-1 text-[11px] leading-snug font-editorial-sans ${
              isNoir ? 'text-[#F1EBDD]/75' : 'text-[#101116]/75'
            }`}
          >
            {isArmed
              ? 'Creative layer engaged: Section W artistic vector activated.'
              : 'Minimalist baseline engaged: Section L unimaginative vector active.'}
          </p>
        </div>
      )}
    </div>
  );
};
