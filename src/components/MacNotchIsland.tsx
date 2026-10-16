import React, { useState, useEffect } from 'react';
import { 
  CharacterShape, 
  CharacterState, 
  CharacterEmote, 
  OutfitId, 
  AgentType, 
  ActivePill, 
  ApprovalRequest 
} from '../types';
import { MochiCanvas } from './MochiCanvas';
import { soundFX } from '../utils/audio';
import { 
  Check, 
  X, 
  Play, 
  Pause, 
  Music, 
  ShieldAlert, 
  ChevronRight, 
  Terminal, 
  Sparkles, 
  FileText, 
  ExternalLink,
  Fingerprint
} from 'lucide-react';

interface MacNotchIslandProps {
  shape: CharacterShape;
  state: CharacterState;
  emote: CharacterEmote | null;
  outfit: OutfitId;
  activeAgent: AgentType;
  activePill: ActivePill;
  onSelectPill: (pill: ActivePill) => void;
  pendingApproval: ApprovalRequest | null;
  onApprove: (request: ApprovalRequest) => void;
  onDeny: (request: ApprovalRequest) => void;
  agentStepText: string;
  agentStepIndex: number;
  agentStepTotal: number;
  onDropFile?: (file: File) => void;
  onPopOutMochi?: () => void;
  isMochiPoppedOut?: boolean;
}

export const MacNotchIsland: React.FC<MacNotchIslandProps> = ({
  shape,
  state,
  emote,
  outfit,
  activeAgent,
  activePill,
  onSelectPill,
  pendingApproval,
  onApprove,
  onDeny,
  agentStepText,
  agentStepIndex,
  agentStepTotal,
  onDropFile,
  onPopOutMochi,
  isMochiPoppedOut = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [showFaceIdConfirm, setShowFaceIdConfirm] = useState(false);

  // Auto-expand if there is an approval waiting
  const isExpanded = pendingApproval !== null || isManuallyExpanded;

  const handleToggleExpand = () => {
    setIsManuallyExpanded((prev) => {
      const next = !prev;
      soundFX.play(next ? 'open' : 'close');
      return next;
    });
  };

  const handleApproveClick = (req: ApprovalRequest) => {
    soundFX.play('approve');
    setShowFaceIdConfirm(true);
    setTimeout(() => {
      setShowFaceIdConfirm(false);
      onApprove(req);
    }, 700);
  };

  const handleDenyClick = (req: ApprovalRequest) => {
    soundFX.play('error');
    onDeny(req);
  };

  // Keyboard shortcut listener for approvals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pendingApproval) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleApproveClick(pendingApproval);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleDenyClick(pendingApproval);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingApproval]);

  return (
    <div className="relative flex justify-center z-50">
      {/* Face ID Animation Overlay */}
      {showFaceIdConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none transition-all duration-300">
          <div className="bg-neutral-900/90 border border-neutral-700 p-6 rounded-3xl flex flex-col items-center gap-3 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 animate-pulse">
              <Fingerprint size={36} />
            </div>
            <div className="text-sm font-semibold text-white tracking-wide">Approved with Touch ID / Face ID</div>
            <div className="text-xs text-neutral-400">Command permitted to run</div>
          </div>
        </div>
      )}

      {/* Main Dynamic Island Container */}
      <div
        onMouseEnter={() => {
          setIsHovered(true);
          soundFX.play('hover');
        }}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          soundFX.play('gulp');
          if (e.dataTransfer.files && e.dataTransfer.files[0] && onDropFile) {
            onDropFile(e.dataTransfer.files[0]);
          }
        }}
        style={{
          width: isExpanded ? '520px' : isHovered ? '320px' : '196px',
          height: isExpanded ? '204px' : '36px',
          borderRadius: isExpanded ? '0 0 28px 28px' : '0 0 14px 14px',
          transition: 'all 0.42s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}
        className={`bg-black text-white relative shadow-2xl border-x border-b ${
          pendingApproval ? 'border-amber-500/60 shadow-amber-500/10' : 'border-neutral-800'
        } overflow-hidden select-none flex flex-col`}
      >
        {/* Top Notch Bar Content */}
        <div 
          onClick={handleToggleExpand}
          className="h-9 px-3 flex items-center justify-between cursor-pointer w-full"
        >
          {/* Left: Mochi In Notch */}
          <div className="flex items-center gap-2">
            {!isMochiPoppedOut ? (
              <MochiCanvas
                shape={shape}
                state={pendingApproval ? 'approval' : state}
                emote={emote}
                outfit={outfit}
                size={30}
                isMorphingToBox={isDragOver}
                onClick={(e?: any) => {
                  if (e) e.stopPropagation();
                  handleToggleExpand();
                }}
              />
            ) : (
              <div 
                className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] text-neutral-500"
                title="Mochi is loose on the desktop!"
              >
                🪟
              </div>
            )}

            {/* Pill Label */}
            <span className="text-xs font-semibold tracking-tight text-neutral-200 truncate max-w-[170px] flex items-center gap-1.5">
              {pendingApproval ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300">Approval Waiting</span>
                </>
              ) : activePill === 'music' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                  <span className="text-pink-300 truncate">Daft Punk • Discovery</span>
                </>
              ) : (
                <>
                  <span className={`w-2 h-2 rounded-full ${
                    state === 'working' ? 'bg-blue-400 animate-pulse' :
                    state === 'finished' ? 'bg-emerald-400' :
                    state === 'error' ? 'bg-rose-400' : 'bg-neutral-500'
                  }`} />
                  <span className="capitalize">{activeAgent}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    {state === 'working' ? `(${agentStepIndex}/${agentStepTotal})` : state}
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Right: Quick pill badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            {pendingApproval ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium text-[10px]">
                Review
              </span>
            ) : (
              <span className="text-[10px] text-neutral-500 hover:text-white transition-colors">
                {isExpanded ? '▲' : '▼'}
              </span>
            )}
          </div>
        </div>

        {/* Expanded View Content */}
        {isExpanded && (
          <div className="flex-1 px-4 pb-3 flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
            {/* Pill Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectPill('agent')}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all ${
                    activePill === 'agent'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Agent Live
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPill('claude-usage')}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-medium transition-all ${
                    activePill === 'claude-usage'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Claude 5h
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPill('music')}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                    activePill === 'music'
                      ? 'bg-neutral-800 text-pink-300'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Music size={11} />
                  <span>Music</span>
                </button>
              </div>

              {/* Pop out to Desktop toggle */}
              {onPopOutMochi && (
                <button
                  type="button"
                  onClick={onPopOutMochi}
                  className="text-[11px] text-neutral-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                  title="Float Mochi on desktop"
                >
                  <span>{isMochiPoppedOut ? 'Dock Mochi' : 'Desktop Float'}</span>
                  <ExternalLink size={11} />
                </button>
              )}
            </div>

            {/* Content for Approval or Active Pill */}
            {pendingApproval ? (
              <div className="flex-1 flex flex-col justify-between bg-neutral-950/80 rounded-xl p-3 border border-amber-500/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{pendingApproval.title}</span>
                        <span className="text-[10px] font-mono font-normal px-1.5 rounded bg-neutral-800 text-neutral-400">
                          {pendingApproval.agent}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono truncate max-w-[340px]">
                        $ {pendingApproval.command}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diff or details */}
                <div className="bg-black/60 rounded-lg p-2 font-mono text-[11px] text-neutral-300 overflow-x-auto max-h-12 border border-neutral-800">
                  <span className="text-emerald-400">+ </span>
                  <span>{pendingApproval.diff || 'Executing command in workspace directory'}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] text-neutral-500 flex items-center gap-2">
                    <span><kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700">⌘↵</kbd> Allow</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-neutral-700">Esc</kbd> Deny</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDenyClick(pendingApproval)}
                      className="px-3 py-1 rounded-xl text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-rose-400 border border-neutral-800 flex items-center gap-1 transition-all"
                    >
                      <X size={12} />
                      <span>Deny</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveClick(pendingApproval)}
                      className="px-4 py-1 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all"
                    >
                      <Check size={13} />
                      <span>Allow</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : activePill === 'music' ? (
              <div className="flex-1 flex items-center justify-between bg-neutral-950/60 rounded-xl p-3 border border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center text-white shadow-md">
                    <Music size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">One More Time</div>
                    <div className="text-[11px] text-neutral-400">Daft Punk • Discovery</div>
                    <div className="w-32 bg-neutral-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-pink-400 h-full w-2/3" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingMusic(!isPlayingMusic);
                      soundFX.playPop();
                    }}
                    className="p-2 rounded-full bg-white text-black hover:scale-105 transition-transform"
                  >
                    {isPlayingMusic ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                  </button>
                </div>
              </div>
            ) : activePill === 'claude-usage' ? (
              <div className="flex-1 flex flex-col justify-between bg-neutral-950/60 rounded-xl p-3 border border-neutral-800 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-200">Claude Plan Usage</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Pro Plan Active</span>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-0.5">
                      <span>5-hour quota</span>
                      <span>42% used (resets in 1h 40m)</span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full w-[42%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-0.5">
                      <span>Weekly quota</span>
                      <span>18% used</span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[18%]" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between bg-neutral-950/60 rounded-xl p-3 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-purple-400" />
                    <span className="text-xs font-semibold text-white capitalize">{activeAgent} Agent</span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Step {agentStepIndex} of {agentStepTotal}
                  </span>
                </div>

                {/* Live step ticker */}
                <div className="bg-neutral-900/90 rounded-lg p-2 font-mono text-[11px] text-neutral-200 border border-neutral-800 truncate">
                  <span className="text-purple-400">❯ </span>
                  <span>{agentStepText}</span>
                </div>

                {/* Drop file prompt */}
                <div className="text-[10px] text-neutral-500 flex items-center justify-between">
                  <span>Drop a file on the notch to swallow & analyze</span>
                  <span className="text-purple-400 font-medium">Ready</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
