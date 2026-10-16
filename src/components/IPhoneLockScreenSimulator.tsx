import React, { useState } from 'react';
import { CharacterShape, CharacterState, CharacterEmote, OutfitId, AgentType, ApprovalRequest } from '../types';
import { MochiCanvas } from './MochiCanvas';
import { soundFX } from '../utils/audio';
import { 
  Lock, 
  Fingerprint, 
  Check, 
  X, 
  Terminal, 
  ShieldAlert, 
  Sparkles,
  Flashlight,
  Camera
} from 'lucide-react';

interface IPhoneLockScreenProps {
  shape: CharacterShape;
  state: CharacterState;
  emote: CharacterEmote | null;
  outfit: OutfitId;
  activeAgent: AgentType;
  pendingApproval: ApprovalRequest | null;
  onApprove: (req: ApprovalRequest) => void;
  onDeny: (req: ApprovalRequest) => void;
  agentStepText: string;
}

export const IPhoneLockScreenSimulator: React.FC<IPhoneLockScreenProps> = ({
  shape,
  state,
  emote,
  outfit,
  activeAgent,
  pendingApproval,
  onApprove,
  onDeny,
  agentStepText,
}) => {
  const [faceIdSuccess, setFaceIdSuccess] = useState(false);

  const handleApproveWithFaceId = (req: ApprovalRequest) => {
    soundFX.play('approve');
    setFaceIdSuccess(true);
    setTimeout(() => {
      setFaceIdSuccess(false);
      onApprove(req);
    }, 700);
  };

  return (
    <div className="w-full flex justify-center py-4">
      {/* iPhone 15/16 Pro Frame */}
      <div className="w-[340px] sm:w-[380px] h-[680px] bg-[#0A0A0C] p-3.5 rounded-[54px] shadow-2xl border-4 border-neutral-800 relative flex flex-col justify-between overflow-hidden">
        {/* Dynamic Island Pill at Top */}
        <div className="w-full flex justify-center pt-1 z-30">
          <div className="h-8 px-4 bg-black rounded-full flex items-center justify-between gap-3 border border-neutral-900 shadow-lg min-w-[130px]">
            <MochiCanvas
              shape={shape}
              state={pendingApproval ? 'approval' : state}
              emote={emote}
              outfit={outfit}
              size={24}
            />
            <span className="text-[11px] font-semibold text-white tracking-tight flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="capitalize">{activeAgent}</span>
            </span>
          </div>
        </div>

        {/* Lock Screen Header: Clock & Date */}
        <div className="flex flex-col items-center pt-6 text-white z-20 select-none">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium tracking-wide">
            <Lock size={12} />
            <span>Friday, October 16</span>
          </div>
          <div className="text-6xl font-light tracking-tight mt-1 text-white">
            11:48
          </div>
        </div>

        {/* Center: Coucou Live Activity Widget on Lock Screen */}
        <div className="z-20 px-1 py-4">
          <div className="bg-neutral-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-2xl text-white">
            {/* Widget Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
                  <Terminal size={14} className="text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold capitalize flex items-center gap-1.5">
                    <span>{activeAgent} Code</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-purple-300">
                      Live Activity
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">MacBook Pro • Sync via Relay</div>
                </div>
              </div>
              <MochiCanvas
                shape={shape}
                state={pendingApproval ? 'approval' : state}
                emote={emote}
                outfit={outfit}
                size={34}
              />
            </div>

            {/* Approval request alert or Step Ticker */}
            {pendingApproval ? (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
                  <ShieldAlert size={16} className="text-amber-400 flex-none mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-amber-300">{pendingApproval.title}</div>
                    <div className="text-[11px] font-mono text-neutral-200 mt-0.5 truncate max-w-[240px]">
                      $ {pendingApproval.command}
                    </div>
                  </div>
                </div>

                {/* Face ID approval buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.play('error');
                      onDeny(pendingApproval);
                    }}
                    className="py-2.5 px-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <X size={14} />
                    <span>Deny</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveWithFaceId(pendingApproval)}
                    className="py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <Fingerprint size={16} />
                    <span>Allow (Face ID)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-neutral-300 font-mono bg-black/40 p-2.5 rounded-xl border border-neutral-800">
                  <span className="text-purple-400">❯ </span>
                  <span>{agentStepText}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Autonomous coding</span>
                  </span>
                  <span className="font-mono text-purple-300">Tap to expand</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lock Screen Bottom Shortcuts */}
        <div className="flex items-center justify-between px-6 pb-6 z-20 text-white">
          <div className="w-11 h-11 rounded-full bg-neutral-900/80 backdrop-blur-md flex items-center justify-center text-neutral-300 border border-white/10 shadow-lg">
            <Flashlight size={18} />
          </div>
          <div className="w-11 h-11 rounded-full bg-neutral-900/80 backdrop-blur-md flex items-center justify-center text-neutral-300 border border-white/10 shadow-lg">
            <Camera size={18} />
          </div>
        </div>

        {/* Home Indicator bar */}
        <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mb-2 z-30" />
      </div>
    </div>
  );
};
