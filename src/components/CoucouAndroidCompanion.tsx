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
import { AndroidDynamicIsland } from './AndroidDynamicIsland';
import { MochiCanvas } from './MochiCanvas';
import { soundFX } from '../utils/audio';
import { coucouVoice } from '../utils/voice';
import { pushProjectToGitHub } from '../utils/githubPublisher';
import { 
  Signal, 
  Wifi, 
  Battery, 
  Flashlight, 
  Fingerprint, 
  Terminal, 
  ShieldAlert, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  UploadCloud, 
  CheckCircle2, 
  ExternalLink, 
  Shirt, 
  Play, 
  Github, 
  Check, 
  X,
  Smartphone,
  Music,
  DollarSign
} from 'lucide-react';

interface CoucouAndroidCompanionProps {
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

export const CoucouAndroidCompanion: React.FC<CoucouAndroidCompanionProps> = ({
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
  const [activeTab, setActiveTab] = useState<'agent' | 'voice' | 'apk' | 'wardrobe'>('agent');
  const [activeAgent, setActiveAgent] = useState<AgentType>('claude');
  const [activePill, setActivePill] = useState<ActivePill>('agent');
  const [pendingApproval, setPendingApproval] = useState<ApprovalRequest | null>(null);

  // Agent execution simulation
  const [agentStepText, setAgentStepText] = useState('Claude Code: editing src/components/AndroidDynamicIsland.tsx with spring physics...');
  const [agentStepIndex, setAgentStepIndex] = useState(3);
  const [agentStepTotal, setAgentStepTotal] = useState(7);

  // Voice Chat
  const [chatInput, setChatInput] = useState('');
  const [speechOutputEnabled, setSpeechOutputEnabled] = useState(true);

  // GitHub APK Builder State
  const [ghToken, setGhToken] = useState(() => localStorage.getItem('coucou_gh_token') || '');
  const [ghRepo, setGhRepo] = useState(() => localStorage.getItem('coucou_gh_repo') || 'Coucou-Android-Dynamic-Island');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const [pushPercent, setPushPercent] = useState(0);
  const [pushResult, setPushResult] = useState<{ repoUrl: string; actionsUrl: string } | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  const handleTriggerApprovalAlert = () => {
    soundFX.play('approval');
    setState('approval');
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

  const handleApprove = (_req: ApprovalRequest) => {
    setPendingApproval(null);
    setState('finished');
    setAgentStepText('Approved with Fingerprint! Build bundle compiled successfully.');
    setAgentStepIndex((p) => Math.min(agentStepTotal, p + 1));
    if (speechOutputEnabled) coucouVoice.speak('Command approved with fingerprint!');
    setTimeout(() => setState('idle'), 2500);
  };

  const handleDeny = (_req: ApprovalRequest) => {
    soundFX.play('error');
    setPendingApproval(null);
    setState('error');
    setAgentStepText('Command denied by user. Execution aborted.');
    if (speechOutputEnabled) coucouVoice.speak('Command denied.');
    setTimeout(() => setState('idle'), 2500);
  };

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text || isAiProcessing) return;
    setChatInput('');
    soundFX.play('blip');
    setState('thinking');

    // Check voice intent first
    const intent = coucouVoice.parseIntent(text);
    if (intent) {
      if (intent.actionPayload?.outfit) {
        setOutfit(intent.actionPayload.outfit);
      }
      if (speechOutputEnabled) coucouVoice.speak(intent.spokenResponse);
      onSendMessageToCoucou(intent.spokenResponse);
      setState('finished');
      setTimeout(() => setState('idle'), 2500);
      return;
    }

    const reply = await onSendMessageToCoucou(text);
    if (speechOutputEnabled) coucouVoice.speak(reply);
  };

  const handleQuickVoiceChip = (phrase: string) => {
    setChatInput(phrase);
    soundFX.play('pop');
    handleSendChat();
  };

  const handlePushToGitHub = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ghToken.trim()) {
      setPushError('Please enter your GitHub Personal Access Token (classic token with "repo" scope).');
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
        repoName: ghRepo.trim() || 'Coucou-Android-Dynamic-Island',
        onProgress: (status, percent) => {
          setPushStatus(status);
          setPushPercent(percent);
        },
      });
      setPushResult(result);
      soundFX.play('finish');
      if (speechOutputEnabled) coucouVoice.speak('Pushed to GitHub! Building APK in GitHub Actions.');
    } catch (err: any) {
      setPushError(err.message || 'Failed to push to GitHub');
      soundFX.play('error');
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-2 select-none">
      {/* Flagship Android Frame */}
      <div className="w-full max-w-[420px] h-[780px] bg-[#0A0D12] p-3.5 rounded-[52px] shadow-2xl border-4 border-neutral-800 relative flex flex-col justify-between overflow-hidden">
        {/* Android Screen Surface */}
        <div 
          className="w-full h-full rounded-[42px] overflow-hidden relative flex flex-col justify-between"
          style={{
            background: `
              radial-gradient(700px 380px at 50% 0%, #15243B 0%, transparent 68%),
              linear-gradient(180deg, #090B0F 0%, #050608 100%)
            `,
          }}
        >
          {/* Android Status Bar */}
          <div className="h-9 px-4 flex items-center justify-between text-xs text-neutral-300 z-30 relative">
            <span className="font-semibold text-white tracking-tight">12:10</span>

            {/* Centered Android Notch Dynamic Island */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1.5 z-40">
              <AndroidDynamicIsland
                shape={shape}
                state={state}
                setState={setState}
                emote={emote}
                outfit={outfit}
                activeAgent={activeAgent}
                setActiveAgent={setActiveAgent}
                activePill={activePill}
                setActivePill={setActivePill}
                pendingApproval={pendingApproval}
                onApprove={handleApprove}
                onDeny={handleDeny}
                agentStepText={agentStepText}
                agentStepIndex={agentStepIndex}
                agentStepTotal={agentStepTotal}
                onVoiceCommandResult={(res) => {
                  onSendMessageToCoucou(res);
                }}
              />
            </div>

            {/* Right Status Indicators */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-300">
              <Signal size={12} />
              <Wifi size={12} />
              <div className="flex items-center gap-0.5">
                <span className="text-[11px] font-mono">{deviceState.battery}%</span>
                <Battery size={13} />
              </div>
            </div>
          </div>

          {/* Android Viewport Screen Content */}
          <div className="flex-1 p-3.5 flex flex-col overflow-y-auto mt-4 z-10 text-xs">
            {/* Top Navigation Tabs */}
            <div className="flex items-center justify-between bg-neutral-900/90 p-1 rounded-2xl border border-neutral-800 mb-3 select-none">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('agent');
                  soundFX.play('pop');
                }}
                className={`flex-1 py-1.5 rounded-xl text-center text-xs font-semibold transition-all ${
                  activeTab === 'agent'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Agent
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('voice');
                  soundFX.play('pop');
                }}
                className={`flex-1 py-1.5 rounded-xl text-center text-xs font-semibold transition-all ${
                  activeTab === 'voice'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Voice (« OK »)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('apk');
                  soundFX.play('pop');
                }}
                className={`flex-1 py-1.5 rounded-xl text-center text-xs font-bold transition-all ${
                  activeTab === 'apk'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-400 hover:text-white'
                }`}
              >
                Build APK 🚀
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('wardrobe');
                  soundFX.play('pop');
                }}
                className={`flex-1 py-1.5 rounded-xl text-center text-xs font-semibold transition-all ${
                  activeTab === 'wardrobe'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Wardrobe
              </button>
            </div>

            {/* TAB 1: AI Agent Monitor */}
            {activeTab === 'agent' && (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Agent Card */}
                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white">
                          <Terminal size={14} />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs capitalize">
                            {activeAgent} Code
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            Coucou Android Relay • Connected
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                        Autonomous
                      </span>
                    </div>

                    <div className="bg-black/60 p-2.5 rounded-2xl border border-neutral-800 font-mono text-[11px] text-neutral-300">
                      <div className="text-neutral-500 mb-1"># Live Command in Notch</div>
                      <div className="text-purple-300">❯ {agentStepText}</div>
                    </div>

                    {/* Quick Agent Selectors */}
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
                          className={`py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            activeAgent === a.id
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {a.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trigger Biometric Alert Demo */}
                  <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-3.5 space-y-2">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Fingerprint size={16} className="text-emerald-400" />
                      <span>Test Notch Fingerprint Approval</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Tap below to simulate a dangerous command request. The Android Dynamic Island will expand for fingerprint authorization!
                    </p>
                    <button
                      type="button"
                      onClick={handleTriggerApprovalAlert}
                      className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                    >
                      <ShieldAlert size={14} />
                      <span>Simulate Danger Command Alert</span>
                    </button>
                  </div>
                </div>

                {/* Hardware Toggle in Phone */}
                <div className="bg-neutral-900/60 p-2.5 rounded-2xl border border-neutral-800 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Device Flashlight:</span>
                  <button
                    type="button"
                    onClick={onToggleTorch}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                      deviceState.torch ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    <Flashlight size={12} />
                    <span>Torch {deviceState.torch ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Voice Assistant (« OK Coucou ») */}
            {activeTab === 'voice' && (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {/* Mochi AI Voice Card */}
                  <div className="bg-purple-950/40 border border-purple-500/30 p-3.5 rounded-3xl flex items-start gap-3">
                    <MochiCanvas
                      shape={shape}
                      state={state}
                      emote={emote}
                      outfit={outfit}
                      size={36}
                    />
                    <div className="flex-1">
                      <div className="font-bold text-purple-300 text-xs flex items-center justify-between">
                        <span>Mochi Voice Assistant</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !speechOutputEnabled;
                            setSpeechOutputEnabled(next);
                            coucouVoice.speechEnabled = next;
                            soundFX.play('pop');
                          }}
                          className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                        >
                          {speechOutputEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                          <span>{speechOutputEnabled ? 'Voice ON' : 'Muted'}</span>
                        </button>
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

                  {/* 10 Core Voice Commands Quick Chips */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                      10 Core Coucou Voice Commands
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        'Play Daft Punk',
                        'What is Claude doing?',
                        'Claude plan quota',
                        'Stripe revenue today',
                        'GitHub CI status',
                        'Put on sunglasses',
                        'Dress as a detective',
                        'Put on wizard hat',
                      ].map((cmd, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleQuickVoiceChip(cmd)}
                          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-left text-neutral-300 border border-neutral-800 text-[10px] font-medium truncate"
                        >
                          🗣️ {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chat and Mic Input Bar */}
                <form onSubmit={handleSendChat} className="flex items-center gap-1.5 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      coucouVoice.startListening();
                    }}
                    className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                    title="Tap to speak into mic"
                  >
                    <Mic size={14} />
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="« OK Coucou », ask me anything..."
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={isAiProcessing || !chatInput.trim()}
                    className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: Automatic GitHub APK Generator */}
            {activeTab === 'apk' && (
              <div className="space-y-3 flex-1 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-2.5">
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-3.5">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                      <Sparkles size={14} />
                      <span>Automatic Cloud APK Build via GitHub Actions</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                      Push all project code and Capacitor Android workflow to GitHub to build and generate <code className="text-emerald-400 font-mono">app-debug.apk</code> in the cloud without Android Studio!
                    </p>
                  </div>

                  <form onSubmit={handlePushToGitHub} className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                        GitHub Personal Access Token (classic with "repo" scope):
                      </label>
                      <input
                        type="password"
                        value={ghToken}
                        onChange={(e) => setGhToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                        GitHub Repository Name:
                      </label>
                      <input
                        type="text"
                        value={ghRepo}
                        onChange={(e) => setGhRepo(e.target.value)}
                        placeholder="Coucou-Android-Dynamic-Island"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    {pushError && (
                      <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px]">
                        {pushError}
                      </div>
                    )}

                    {isPushing && (
                      <div className="space-y-1.5 bg-neutral-900 p-3 rounded-2xl border border-neutral-800">
                        <div className="flex justify-between text-[11px] text-neutral-300">
                          <span>{pushStatus}</span>
                          <span className="font-mono font-bold">{pushPercent}%</span>
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
                      <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-2">
                        <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 size={14} />
                          <span>Pushed Successfully! Build Running in GitHub Actions</span>
                        </div>
                        <p className="text-[10px] text-neutral-300">
                          Capacitor Android build is assembling <code className="text-emerald-400 font-mono">app-debug.apk</code>.
                        </p>
                        <a
                          href={pushResult.actionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 rounded-xl bg-emerald-500 text-black font-bold text-center text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <span>Open GitHub Actions & Download APK</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isPushing}
                      className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <UploadCloud size={16} />
                      <span>{isPushing ? 'Pushing to GitHub...' : 'Push to GitHub & Generate APK'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 4: Wardrobe & Character Customization */}
            {activeTab === 'wardrobe' && (
              <div className="space-y-3 flex-1 overflow-y-auto">
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-3.5 space-y-2">
                  <div className="font-bold text-white text-xs">Mochi Species</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'mochi', name: 'Mochi', desc: 'Rice cake' },
                      { id: 'galet', name: 'Galet', desc: 'Pebble' },
                      { id: 'lueur', name: 'Lueur', desc: 'Glow orb' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setShape(s.id as CharacterShape);
                          soundFX.play('pop');
                        }}
                        className={`p-2 rounded-xl text-xs font-semibold border ${
                          shape === s.id
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <div>{s.name}</div>
                        <div className="text-[9px] text-neutral-400 font-normal">{s.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="font-bold text-white text-xs pt-2 flex items-center gap-1">
                    <Shirt size={13} className="text-purple-400" />
                    <span>Hats & Outfits</span>
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
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          outfit === o.id
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>

                  <div className="font-bold text-white text-xs pt-2 flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-400" />
                    <span>Interactive Emotes</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'love', label: 'Love ❤️' },
                      { id: 'surprised', label: 'Surprised 😲' },
                      { id: 'proud', label: 'Proud ⭐' },
                      { id: 'wink', label: 'Wink 😉' },
                      { id: 'yawn', label: 'Yawn 🥱' },
                    ].map((em) => (
                      <button
                        key={em.id}
                        type="button"
                        onClick={() => {
                          setEmote(em.id as CharacterEmote);
                          soundFX.play(em.id);
                          setTimeout(() => setEmote(null), 2500);
                        }}
                        className="px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs"
                      >
                        {em.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-3 flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Handcrafted SFX Sounds</span>
                  <button
                    type="button"
                    onClick={onToggleSound}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                      soundEnabled ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {soundEnabled ? 'Audio ON' : 'Muted'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Android Gesture Bar */}
          <div className="h-6 flex items-center justify-center select-none z-20">
            <div className="w-24 h-1 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
