import React, { useState } from 'react';
import { 
  CharacterShape, 
  CharacterState, 
  CharacterEmote, 
  OutfitId, 
  AgentType, 
  ActivePill, 
  ApprovalRequest,
  DeviceState 
} from '../types';
import { MochiCanvas } from './MochiCanvas';
import { soundFX } from '../utils/audio';
import { pushProjectToGitHub } from '../utils/githubPublisher';
import { 
  Wifi, 
  Battery, 
  Signal, 
  Flashlight, 
  Fingerprint, 
  Check, 
  X, 
  Terminal, 
  ShieldAlert, 
  Play, 
  Pause, 
  Music, 
  ExternalLink, 
  Github, 
  UploadCloud, 
  Sparkles, 
  Send, 
  Folder, 
  FileCode, 
  Settings, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Shirt
} from 'lucide-react';

interface AndroidDynamicIslandPhoneProps {
  shape: CharacterShape;
  setShape: (shape: CharacterShape) => void;
  state: CharacterState;
  setState: (state: CharacterState) => void;
  emote: CharacterEmote | null;
  setEmote: (emote: CharacterEmote | null) => void;
  outfit: OutfitId;
  setOutfit: (outfit: OutfitId) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  deviceState: DeviceState;
  onToggleTorch: () => void;
  onSendMessageToCoucou: (prompt: string) => Promise<string>;
  coucouReplyText: string;
  isAiProcessing: boolean;
}

export const AndroidDynamicIslandPhone: React.FC<AndroidDynamicIslandPhoneProps> = ({
  shape,
  setShape,
  state,
  setState,
  emote,
  setEmote,
  outfit,
  setOutfit,
  soundEnabled,
  onToggleSound,
  deviceState,
  onToggleTorch,
  onSendMessageToCoucou,
  coucouReplyText,
  isAiProcessing,
}) => {
  // Navigation tabs inside the phone
  const [activeTab, setActiveTab] = useState<'agent' | 'chat' | 'apk' | 'settings'>('agent');
  const [activeAgent, setActiveAgent] = useState<AgentType>('claude');
  const [activePill, setActivePill] = useState<ActivePill>('agent');
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<ApprovalRequest | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [showFingerprintSuccess, setShowFingerprintSuccess] = useState(false);

  // Agent execution simulation steps
  const [agentStepText, setAgentStepText] = useState('Watching repository changes and terminal inputs...');
  const [agentStepIndex, setAgentStepIndex] = useState(3);
  const [agentStepTotal, setAgentStepTotal] = useState(7);

  // Chat bar with Coucou
  const [inputText, setInputText] = useState('');

  // GitHub APK Builder State
  const [ghToken, setGhToken] = useState(() => localStorage.getItem('coucou_gh_token') || '');
  const [ghRepo, setGhRepo] = useState(() => localStorage.getItem('coucou_gh_repo') || 'Coucou-Android');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const [pushPercent, setPushPercent] = useState(0);
  const [pushResult, setPushResult] = useState<{ repoUrl: string; actionsUrl: string } | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  const handleToggleIsland = () => {
    setIsIslandExpanded((prev) => {
      const next = !prev;
      soundFX.play(next ? 'open' : 'close');
      return next;
    });
  };

  const handleTriggerApproval = () => {
    soundFX.play('approval');
    setState('approval');
    setIsIslandExpanded(true);
    setPendingApproval({
      id: String(Date.now()),
      agent: activeAgent,
      title: 'Danger: Execute Shell Script',
      command: 'rm -rf ./dist/ && npm run build --release',
      path: '~/coucou/android',
      diff: 'Permanently remove stale build artifacts and compile release bundle',
      fingerprint: 'b7c20a1f',
      status: 'pending',
      timestamp: Date.now(),
    });
  };

  const handleApproveWithFingerprint = (req: ApprovalRequest) => {
    soundFX.play('approve');
    setShowFingerprintSuccess(true);
    setTimeout(() => {
      setShowFingerprintSuccess(false);
      setPendingApproval(null);
      setState('finished');
      setAgentStepText('Approved via Fingerprint! Cleaned dist and compiled bundle.');
      setAgentStepIndex((p) => Math.min(agentStepTotal, p + 1));
      setTimeout(() => setState('idle'), 2500);
    }, 750);
  };

  const handleDeny = (_req: ApprovalRequest) => {
    soundFX.play('error');
    setPendingApproval(null);
    setState('error');
    setAgentStepText('Command denied by user. Execution halted.');
    setTimeout(() => setState('idle'), 2000);
  };

  const handleSendPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isAiProcessing) return;
    setInputText('');
    soundFX.play('blip');
    setState('thinking');
    await onSendMessageToCoucou(text);
  };

  const handlePushToGitHub = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ghToken.trim()) {
      setPushError('Please enter your GitHub Personal Access Token (classic token with "repo" permission).');
      return;
    }
    setPushError(null);
    setPushResult(null);
    setIsPushing(true);
    localStorage.setItem('coucou_gh_token', ghToken.trim());
    localStorage.setItem('coucou_gh_repo', ghRepo.trim());

    try {
      const result = await pushProjectToGitHub({
        token: ghToken.trim(),
        repoName: ghRepo.trim() || 'Coucou-Android',
        onProgress: (status, percent) => {
          setPushStatus(status);
          setPushPercent(percent);
        },
      });
      setPushResult(result);
      soundFX.play('finish');
    } catch (err: any) {
      setPushError(err.message || 'Failed to push to GitHub');
      soundFX.play('error');
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-2">
      {/* Fingerprint Authenticated Modal */}
      {showFingerprintSuccess && (
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

      {/* Modern Android Flagship Phone Frame */}
      <div className="w-[340px] sm:w-[410px] h-[740px] sm:h-[780px] bg-[#0A0D12] p-3 sm:p-4 rounded-[48px] shadow-2xl border-4 border-neutral-800 relative flex flex-col justify-between overflow-hidden">
        {/* Screen Glass Surface */}
        <div 
          className="w-full h-full rounded-[38px] overflow-hidden relative flex flex-col justify-between select-none"
          style={{
            background: `
              radial-gradient(600px 320px at 50% 0%, #17243B 0%, transparent 70%),
              linear-gradient(180deg, #090B0F 0%, #060709 100%)
            `,
          }}
        >
          {/* Top Android Status Bar */}
          <div className="h-9 px-4 flex items-center justify-between text-xs text-neutral-300 z-30 select-none relative">
            {/* Clock on Left */}
            <span className="font-semibold text-white tracking-tight">11:58</span>

            {/* Android Notch / Punch-Hole Dynamic Island in Center */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1.5 z-40">
              <div
                onClick={handleToggleIsland}
                style={{
                  width: isIslandExpanded || pendingApproval ? '280px' : '110px',
                  height: isIslandExpanded || pendingApproval ? '160px' : '28px',
                  borderRadius: isIslandExpanded || pendingApproval ? '22px' : '999px',
                  transition: 'all 0.38s cubic-bezier(0.34, 1.4, 0.64, 1)',
                }}
                className={`bg-black/95 text-white shadow-2xl border border-neutral-800 cursor-pointer overflow-hidden flex flex-col justify-between p-1.5 ${
                  pendingApproval ? 'border-amber-500/60 shadow-amber-500/20' : ''
                }`}
              >
                {/* Pill Top Row */}
                <div className="flex items-center justify-between px-1.5 h-6">
                  <div className="flex items-center gap-1.5">
                    <MochiCanvas
                      shape={shape}
                      state={pendingApproval ? 'approval' : state}
                      emote={emote}
                      outfit={outfit}
                      size={22}
                    />
                    <span className="text-[10px] font-bold tracking-tight capitalize truncate max-w-[120px]">
                      {pendingApproval ? 'Approval' : activeAgent}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {pendingApproval ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Expanded Content Inside Dynamic Island */}
                {(isIslandExpanded || pendingApproval) && (
                  <div className="flex-1 px-1.5 pb-1 flex flex-col justify-between animate-in fade-in duration-200 text-xs">
                    {pendingApproval ? (
                      <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2 flex flex-col justify-between h-full">
                        <div>
                          <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                            <ShieldAlert size={12} />
                            <span>{pendingApproval.title}</span>
                          </div>
                          <div className="text-[10px] font-mono text-neutral-300 truncate mt-0.5">
                            $ {pendingApproval.command}
                          </div>
                        </div>

                        {/* Fingerprint Allow Button */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeny(pendingApproval);
                            }}
                            className="flex-1 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-rose-400 text-[10px] font-semibold flex items-center justify-center gap-1"
                          >
                            <X size={11} />
                            <span>Deny</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveWithFingerprint(pendingApproval);
                            }}
                            className="flex-[2] py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20"
                          >
                            <Fingerprint size={13} />
                            <span>Allow (Fingerprint)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-neutral-900/90 rounded-xl p-2 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-purple-300 font-semibold uppercase">Coding Agent Step</span>
                          <span className="text-[10px] text-neutral-400 font-mono">{agentStepIndex}/{agentStepTotal}</span>
                        </div>
                        <div className="text-[10px] font-mono text-neutral-300 truncate">
                          {agentStepText}
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTorch();
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${
                              deviceState.torch ? 'bg-amber-400 text-black font-bold' : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            <Flashlight size={10} />
                            <span>Torch {deviceState.torch ? 'ON' : 'OFF'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPlayingMusic(!isPlayingMusic);
                              soundFX.play('pop');
                            }}
                            className="text-[10px] text-pink-400 font-medium flex items-center gap-1"
                          >
                            <Music size={10} />
                            <span>{isPlayingMusic ? 'Pause Music' : 'Play Daft Punk'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Android Status Icons on Right */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-300">
              <Signal size={12} />
              <Wifi size={12} />
              <div className="flex items-center gap-0.5">
                <span className="text-[11px] font-mono">{deviceState.battery}%</span>
                <Battery size={13} />
              </div>
            </div>
          </div>

          {/* Android App Screen Viewport */}
          <div className="flex-1 p-3 flex flex-col overflow-y-auto mt-4 z-10 text-xs">
            {/* Top Navigation Bar Inside Phone */}
            <div className="flex items-center justify-between bg-neutral-900/80 p-1 rounded-2xl border border-neutral-800 mb-3 select-none">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('agent');
                  soundFX.play('pop');
                }}
                className={`flex-1 py-1 rounded-xl text-center font-medium transition-all ${
                  activeTab === 'agent'
                    ? 'bg-purple-600 text-white font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Agent
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('chat');
                  soundFX.play('pop');
                }}
                className={`flex-1 py-1 rounded-xl text-center font-medium transition-all ${
                  activeTab === 'chat'
                    ? 'bg-purple-600 text-white font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('apk');
                  soundFX.play('pop');
                }}
                className={`flex-1 py-1 rounded-xl text-center font-medium transition-all ${
                  activeTab === 'apk'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-emerald-400 hover:text-white'
                }`}
              >
                Build APK 🚀
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  soundFX.play('pop');
                }}
                className={`flex-1 py-1 rounded-xl text-center font-medium transition-all ${
                  activeTab === 'settings'
                    ? 'bg-purple-600 text-white font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Config
              </button>
            </div>

            {/* TAB 1: Agent Monitor & Trigger */}
            {activeTab === 'agent' && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Terminal size={14} className="text-purple-400" />
                      <span>Active Agent: {activeAgent.toUpperCase()}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-purple-300 font-mono">
                      Coucou v0.2.1
                    </span>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-xl border border-neutral-800/80 font-mono text-[11px] text-neutral-300">
                    <div className="text-neutral-500 mb-1"># Live Step Execution</div>
                    <div className="text-purple-400">❯ {agentStepText}</div>
                  </div>

                  {/* Agent Selector buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { id: 'claude', name: 'Claude' },
                      { id: 'cursor', name: 'Cursor' },
                      { id: 'codex', name: 'Codex' },
                      { id: 'gemini', name: 'Gemini' },
                      { id: 'antigravity', name: 'Antigravity' },
                    ].map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setActiveAgent(a.id as AgentType);
                          soundFX.play('blip');
                        }}
                        className={`py-1 rounded-lg text-[11px] font-medium border transition-all ${
                          activeAgent === a.id
                            ? 'bg-purple-600 border-purple-500 text-white font-semibold'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulate Approval in Dynamic Island */}
                <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-3 space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Fingerprint size={14} className="text-emerald-400" />
                    <span>Test Notch Dynamic Island</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Tap below to send an authorization alert to the top Android notch pill:
                  </p>
                  <button
                    type="button"
                    onClick={handleTriggerApproval}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <ShieldAlert size={14} />
                    <span>Send Approval Alert to Notch</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Coucou Gemini AI Chat */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {/* Speech bubble */}
                  <div className="bg-purple-950/40 border border-purple-500/30 p-3 rounded-2xl flex items-start gap-2.5">
                    <div className="flex-none">
                      <MochiCanvas
                        shape={shape}
                        state={state}
                        emote={emote}
                        outfit={outfit}
                        size={32}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-purple-300 text-[11px] flex items-center gap-1">
                        <span>Mochi</span>
                        <span className="text-[10px] text-neutral-400 font-normal">Gemini Voice</span>
                      </div>
                      <div className="text-neutral-200 mt-1 text-xs leading-relaxed">
                        {isAiProcessing ? (
                          <span className="animate-pulse text-purple-300">Thinking with Gemini...</span>
                        ) : (
                          coucouReplyText
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick questions */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-neutral-400 uppercase font-semibold">Quick Prompts</div>
                    <button
                      type="button"
                      onClick={() => onSendMessageToCoucou('How are my AI coding agents doing?')}
                      className="w-full p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-left text-neutral-300 border border-neutral-800 text-[11px]"
                    >
                      💬 « How are my coding agents doing? »
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendMessageToCoucou('Turn on torch and check my device battery level')}
                      className="w-full p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-left text-neutral-300 border border-neutral-800 text-[11px]"
                    >
                      ⚡ « Turn on torch & check battery »
                    </button>
                  </div>
                </div>

                {/* Input Field */}
                <form onSubmit={handleSendPrompt} className="flex items-center gap-1.5 pt-2 border-t border-neutral-800">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="« OK Coucou », ask me anything..."
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={isAiProcessing || !inputText.trim()}
                    className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: Automatic GitHub APK Builder */}
            {activeTab === 'apk' && (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                      <Sparkles size={14} />
                      <span>Automatic GitHub APK Cloud Build</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                      Push all source files and the Capacitor Android workflow directly to GitHub. GitHub Actions builds and outputs <code className="text-emerald-400 font-mono">app-debug.apk</code> in the cloud!
                    </p>
                  </div>

                  <form onSubmit={handlePushToGitHub} className="space-y-2">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                        GitHub Personal Access Token (classic with repo scope):
                      </label>
                      <input
                        type="password"
                        value={ghToken}
                        onChange={(e) => setGhToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                        Repository Name:
                      </label>
                      <input
                        type="text"
                        value={ghRepo}
                        onChange={(e) => setGhRepo(e.target.value)}
                        placeholder="Coucou-Android"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    {pushError && (
                      <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px]">
                        {pushError}
                      </div>
                    )}

                    {isPushing && (
                      <div className="space-y-1.5 bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                        <div className="flex justify-between text-[11px] text-neutral-300">
                          <span>{pushStatus}</span>
                          <span className="font-mono">{pushPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${pushPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {pushResult && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-2">
                        <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 size={13} />
                          <span>Pushed to GitHub Successfully!</span>
                        </div>
                        <p className="text-[10px] text-neutral-300">
                          GitHub Actions is now building <code className="text-emerald-400">app-debug.apk</code>.
                        </p>
                        <div className="flex gap-2">
                          <a
                            href={pushResult.actionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-center text-[10px] flex items-center justify-center gap-1 shadow-md"
                          >
                            <span>Open Actions & Download APK</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isPushing}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <UploadCloud size={15} />
                      <span>{isPushing ? 'Pushing to GitHub...' : 'Push to GitHub & Generate APK'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 4: Config & Wardrobe */}
            {activeTab === 'settings' && (
              <div className="space-y-3 flex-1 overflow-y-auto">
                <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-3 space-y-2">
                  <div className="font-bold text-white text-xs">Mochi Species</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'mochi', name: 'Mochi' },
                      { id: 'galet', name: 'Galet' },
                      { id: 'lueur', name: 'Lueur' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setShape(s.id as CharacterShape);
                          soundFX.play('pop');
                        }}
                        className={`py-1.5 rounded-lg text-xs font-medium border ${
                          shape === s.id
                            ? 'bg-purple-600 border-purple-500 text-white font-bold'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>

                  <div className="font-bold text-white text-xs pt-2 flex items-center gap-1">
                    <Shirt size={12} className="text-purple-400" />
                    <span>Outfits</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'none', label: 'Classic' },
                      { id: 'detective', label: 'Detective 🕵️' },
                      { id: 'beret', label: 'Beret 🥖' },
                      { id: 'party', label: 'Party 🎉' },
                      { id: 'sunglasses', label: 'Shades 🕶️' },
                      { id: 'wizard', label: 'Wizard 🧙' },
                      { id: 'winter', label: 'Beanie ❄️' },
                    ].map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setOutfit(o.id as OutfitId);
                          soundFX.play('blip');
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                          outfit === o.id
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Sound Effects</span>
                  <button
                    type="button"
                    onClick={onToggleSound}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                      soundEnabled ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {soundEnabled ? 'Enabled' : 'Muted'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Android Navigation Gesture Bar at Bottom */}
          <div className="h-6 flex items-center justify-center select-none z-20">
            <div className="w-24 h-1 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
