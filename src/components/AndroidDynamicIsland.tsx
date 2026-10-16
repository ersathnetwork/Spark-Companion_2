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
import { coucouVoice } from '../utils/voice';
import { 
  Check, 
  X, 
  Play, 
  Pause, 
  Music, 
  ShieldAlert, 
  Terminal, 
  Sparkles, 
  Fingerprint, 
  Mic, 
  MicOff, 
  DollarSign, 
  GitBranch, 
  Flame, 
  ExternalLink 
} from 'lucide-react';

interface AndroidDynamicIslandProps {
  shape: CharacterShape;
  state: CharacterState;
  setState: (state: CharacterState) => void;
  emote: CharacterEmote | null;
  outfit: OutfitId;
  activeAgent: AgentType;
  setActiveAgent: (agent: AgentType) => void;
  activePill: ActivePill;
  setActivePill: (pill: ActivePill) => void;
  pendingApproval: ApprovalRequest | null;
  onApprove: (req: ApprovalRequest) => void;
  onDeny: (req: ApprovalRequest) => void;
  agentStepText: string;
  agentStepIndex: number;
  agentStepTotal: number;
  onVoiceCommandResult?: (text: string) => void;
}

export const AndroidDynamicIsland: React.FC<AndroidDynamicIslandProps> = ({
  shape,
  state,
  setState,
  emote,
  outfit,
  activeAgent,
  setActiveAgent,
  activePill,
  setActivePill,
  pendingApproval,
  onApprove,
  onDeny,
  agentStepText,
  agentStepIndex,
  agentStepTotal,
  onVoiceCommandResult,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showFingerprintEffect, setShowFingerprintEffect] = useState(false);

  // Auto-expand on approval alert
  const effectiveExpanded = isExpanded || pendingApproval !== null || isListeningVoice;

  // Setup voice listeners
  useEffect(() => {
    coucouVoice.setCallbacks(
      (transcript, isFinal) => {
        setVoiceTranscript(transcript);
        if (isFinal && transcript.trim()) {
          setIsListeningVoice(false);
          setState('thinking');
          coucouVoice.handleVoiceQuery(transcript).then((result) => {
            if (onVoiceCommandResult) onVoiceCommandResult(result);
            setState('finished');
            setTimeout(() => setState('idle'), 2500);
          });
        }
      },
      (listening) => {
        setIsListeningVoice(listening);
      }
    );
  }, []);

  const handleToggleIsland = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      soundFX.play(next ? 'open' : 'close');
      return next;
    });
  };

  const handleMicToggle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isListeningVoice) {
      coucouVoice.stopListening();
      setIsListeningVoice(false);
    } else {
      setVoiceTranscript('');
      setIsExpanded(true);
      coucouVoice.startListening();
      setIsListeningVoice(true);
    }
  };

  const handleApproveWithFingerprint = (req: ApprovalRequest) => {
    soundFX.play('approve');
    setShowFingerprintEffect(true);
    setTimeout(() => {
      setShowFingerprintEffect(false);
      onApprove(req);
    }, 700);
  };

  return (
    <div className="relative flex justify-center z-50 select-none">
      {/* Fingerprint Success Pulse Overlay */}
      {showFingerprintEffect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none transition-all">
          <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-3xl flex flex-col items-center gap-3 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 animate-pulse">
              <Fingerprint size={38} />
            </div>
            <div className="text-sm font-bold text-white tracking-wide">Fingerprint Verified</div>
            <div className="text-xs text-neutral-400">Android Biometric Authenticated</div>
          </div>
        </div>
      )}

      {/* Modern Android Notch Dynamic Island Pill */}
      <div
        onClick={handleToggleIsland}
        style={{
          width: effectiveExpanded ? '310px' : '124px',
          height: effectiveExpanded ? '184px' : '30px',
          borderRadius: effectiveExpanded ? '26px' : '999px',
          transition: 'all 0.42s cubic-bezier(0.34, 1.45, 0.64, 1)',
        }}
        className={`bg-black/95 text-white shadow-2xl border cursor-pointer overflow-hidden flex flex-col justify-between p-1.5 transition-shadow ${
          pendingApproval 
            ? 'border-amber-500/70 shadow-amber-500/25' 
            : isListeningVoice 
            ? 'border-purple-500/70 shadow-purple-500/25' 
            : 'border-neutral-800/90 hover:border-neutral-700'
        }`}
      >
        {/* Top Collapsed Pill Bar */}
        <div className="flex items-center justify-between px-1.5 h-6 w-full">
          {/* Left: Mochi In Punch-Hole */}
          <div className="flex items-center gap-1.5">
            <MochiCanvas
              shape={shape}
              state={pendingApproval ? 'approval' : isListeningVoice ? 'thinking' : state}
              emote={emote}
              outfit={outfit}
              size={22}
            />
            <span className="text-[11px] font-bold tracking-tight capitalize truncate max-w-[140px] flex items-center gap-1">
              {pendingApproval ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300">Approval</span>
                </>
              ) : isListeningVoice ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  <span className="text-purple-300">« OK Coucou »</span>
                </>
              ) : activePill === 'music' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                  <span className="text-pink-300">Daft Punk</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{activeAgent}</span>
                  <span className="text-[9px] text-neutral-400 font-normal">
                    {state === 'working' ? `(${agentStepIndex}/${agentStepTotal})` : ''}
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleMicToggle}
              className={`p-1 rounded-full transition-colors ${
                isListeningVoice ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="« OK Coucou » Voice Assistant"
            >
              <Mic size={11} />
            </button>
            <span className="text-[9px] text-neutral-500">
              {effectiveExpanded ? '▲' : '▼'}
            </span>
          </div>
        </div>

        {/* Expanded Content Viewport */}
        {effectiveExpanded && (
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="flex-1 px-1.5 pb-1 flex flex-col justify-between animate-in fade-in duration-200 text-xs"
          >
            {/* Pill Tabs Selector */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-1.5 text-[11px]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActivePill('agent')}
                  className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                    activePill === 'agent'
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Agent
                </button>
                <button
                  type="button"
                  onClick={() => setActivePill('claude-usage')}
                  className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                    activePill === 'claude-usage'
                      ? 'bg-neutral-800 text-purple-300 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  5h Plan
                </button>
                <button
                  type="button"
                  onClick={() => setActivePill('music')}
                  className={`px-2 py-0.5 rounded-lg font-medium flex items-center gap-0.5 transition-all ${
                    activePill === 'music'
                      ? 'bg-neutral-800 text-pink-300 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <Music size={10} />
                  <span>Music</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePill('stripe')}
                  className={`px-2 py-0.5 rounded-lg font-medium flex items-center gap-0.5 transition-all ${
                    activePill === 'stripe'
                      ? 'bg-neutral-800 text-emerald-300 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <DollarSign size={10} />
                  <span>Stripe</span>
                </button>
              </div>
            </div>

            {/* CASE 1: Voice Listening Mode */}
            {isListeningVoice ? (
              <div className="flex-1 bg-purple-950/40 border border-purple-500/30 rounded-2xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>À l'écoute... (« OK Coucou »)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {[4, 12, 8, 16, 6, 14, 8].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}px` }}
                        className="w-1 bg-purple-400 rounded-full animate-pulse"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-neutral-200 font-medium italic truncate">
                  "{voiceTranscript || 'Say: Play music, what is Claude doing, or turn on torch...'}"
                </div>

                <div className="flex justify-between items-center text-[10px] text-neutral-400">
                  <span>Speak naturally into microphone</span>
                  <button
                    type="button"
                    onClick={() => coucouVoice.stopListening()}
                    className="text-purple-300 font-semibold hover:underline"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : pendingApproval ? (
              /* CASE 2: Approval Request Alert */
              <div className="flex-1 bg-amber-950/40 border border-amber-500/40 rounded-2xl p-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <ShieldAlert size={13} />
                      <span>{pendingApproval.title}</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-900 font-mono text-neutral-400">
                      {pendingApproval.agent}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-neutral-200 mt-0.5 truncate bg-black/40 p-1 rounded border border-neutral-800">
                    $ {pendingApproval.command}
                  </div>
                </div>

                {/* Fingerprint Authorization Button */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onDeny(pendingApproval)}
                    className="flex-1 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-rose-400 text-[10px] font-bold flex items-center justify-center gap-1 border border-neutral-800 transition-all"
                  >
                    <X size={12} />
                    <span>Deny</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveWithFingerprint(pendingApproval)}
                    className="flex-[2] py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    <Fingerprint size={14} />
                    <span>Allow (Fingerprint)</span>
                  </button>
                </div>
              </div>
            ) : activePill === 'claude-usage' ? (
              /* CASE 3: Claude Plan Usage */
              <div className="flex-1 bg-neutral-900/90 rounded-2xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-purple-300">Claude Plan Usage</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Pro Plan</span>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[10px] text-neutral-400">
                      <span>5h Quota</span>
                      <span>42% (resets in 1h 40m)</span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-purple-500 rounded-full w-[42%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-neutral-400">
                      <span>Weekly Limit</span>
                      <span>18%</span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-blue-500 rounded-full w-[18%]" />
                    </div>
                  </div>
                </div>
              </div>
            ) : activePill === 'music' ? (
              /* CASE 4: Music Pill */
              <div className="flex-1 bg-neutral-900/90 rounded-2xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                    <Music size={16} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-white">One More Time</div>
                    <div className="text-[10px] text-neutral-400">Daft Punk • Discovery</div>
                    <div className="w-24 bg-neutral-800 h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-pink-400 h-full w-2/3" />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlayingMusic(!isPlayingMusic);
                    soundFX.playPop();
                  }}
                  className="p-2 rounded-full bg-white text-black hover:scale-105 transition-transform"
                >
                  {isPlayingMusic ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                </button>
              </div>
            ) : activePill === 'stripe' ? (
              /* CASE 5: Stripe Service Pill */
              <div className="flex-1 bg-neutral-900/90 rounded-2xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-emerald-400 flex items-center gap-1">
                    <DollarSign size={12} />
                    <span>Stripe Live Sales</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">Today</span>
                </div>
                <div className="text-xl font-bold text-white tracking-tight">
                  $1,420.00
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span>18 successful charges</span>
                  <span className="text-emerald-400">+24% vs yesterday</span>
                </div>
              </div>
            ) : (
              /* CASE 6: Agent Step Ticker */
              <div className="flex-1 bg-neutral-900/90 rounded-2xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-purple-300 capitalize flex items-center gap-1">
                    <Terminal size={12} />
                    <span>{activeAgent} Agent</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Step {agentStepIndex} of {agentStepTotal}
                  </span>
                </div>

                <div className="bg-black/50 p-2 rounded-xl text-[10px] font-mono text-neutral-300 border border-neutral-800 truncate">
                  <span className="text-purple-400">❯ </span>
                  <span>{agentStepText}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span>Android Autonomous coding</span>
                  <span className="text-emerald-400 font-mono">Sync OK</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
