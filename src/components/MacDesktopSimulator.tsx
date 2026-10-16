import React, { useState } from 'react';
import { 
  CharacterShape, 
  CharacterState, 
  CharacterEmote, 
  OutfitId, 
  AgentType, 
  ActivePill, 
  ApprovalRequest 
} from '../types';
import { MacNotchIsland } from './MacNotchIsland';
import { MochiCanvas } from './MochiCanvas';
import { soundFX } from '../utils/audio';
import { 
  Wifi, 
  Battery, 
  Volume2, 
  VolumeX, 
  Search, 
  Sliders, 
  File, 
  Folder, 
  Terminal, 
  Globe, 
  Sparkles, 
  Play, 
  ShieldAlert, 
  HelpCircle, 
  RotateCcw,
  Shirt,
  Send,
  Mic,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

interface MacDesktopSimulatorProps {
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
  onSendMessageToCoucou: (prompt: string) => Promise<string>;
  coucouReplyText: string;
  isAiProcessing: boolean;
}

export const MacDesktopSimulator: React.FC<MacDesktopSimulatorProps> = ({
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
  onSendMessageToCoucou,
  coucouReplyText,
  isAiProcessing,
}) => {
  const [activeAgent, setActiveAgent] = useState<AgentType>('claude');
  const [activePill, setActivePill] = useState<ActivePill>('agent');
  const [pendingApproval, setPendingApproval] = useState<ApprovalRequest | null>(null);
  const [isMochiPoppedOut, setIsMochiPoppedOut] = useState(false);
  const [floatingPos, setFloatingPos] = useState({ x: 740, y: 320 });
  const [isDraggingFloating, setIsDraggingFloating] = useState(false);

  // Agent execution simulation steps
  const [agentStepText, setAgentStepText] = useState('Watching repository changes and terminal inputs...');
  const [agentStepIndex, setAgentStepIndex] = useState(1);
  const [agentStepTotal, setAgentStepTotal] = useState(7);
  const [isAttachedToSafari, setIsAttachedToSafari] = useState(false);
  const [swallowedFile, setSwallowedFile] = useState<string | null>(null);

  // Chat bar with Coucou
  const [inputText, setInputText] = useState('');

  // Finder mock files
  const sampleFiles = [
    { name: 'agent-config.json', type: 'code' },
    { name: 'coucou-release.dmg', type: 'pkg' },
    { name: 'architecture.pdf', type: 'doc' },
    { name: 'mochi-avatar.png', type: 'img' },
  ];

  // Trigger simulated approval
  const handleTriggerApprovalDemo = () => {
    soundFX.play('approval');
    setState('approval');
    setPendingApproval({
      id: String(Date.now()),
      agent: activeAgent,
      title: 'Destructive Shell Command',
      command: 'rm -rf ./dist/ && npm run build --clean',
      path: '~/coucou/apps/web',
      diff: 'Permanently remove ./dist build directory and rebuild packages',
      fingerprint: 'a89f928e',
      status: 'pending',
      timestamp: Date.now(),
    });
  };

  const handleApprove = (_req: ApprovalRequest) => {
    setPendingApproval(null);
    setState('finished');
    setAgentStepText('Approved! Successfully cleaned dist/ and rebuilt assets.');
    setAgentStepIndex((prev) => Math.min(agentStepTotal, prev + 1));
    setTimeout(() => {
      setState('idle');
    }, 3000);
  };

  const handleDeny = (_req: ApprovalRequest) => {
    setPendingApproval(null);
    setState('error');
    setAgentStepText('Command denied by user. Reverting file changes.');
    setTimeout(() => {
      setState('idle');
    }, 2500);
  };

  const handleTriggerWorkDemo = () => {
    soundFX.play('work');
    setState('working');
    setAgentStepIndex(3);
    setAgentStepTotal(7);
    setAgentStepText('claude: editing src/components/MacNotchIsland.tsx with spring physics...');
  };

  const handleTriggerFinishDemo = () => {
    soundFX.play('finish');
    setState('finished');
    setEmote('proud');
    setAgentStepIndex(7);
    setAgentStepText('All 7 steps completed! Build passed with 0 errors.');
    setTimeout(() => {
      setEmote(null);
      setState('idle');
    }, 3500);
  };

  const handleTriggerQuestionDemo = () => {
    soundFX.play('question');
    setState('question');
    setAgentStepText('Claude: Should we enable Touch ID or Face ID for biometric confirmation?');
  };

  const handleDropFile = (file: File) => {
    setSwallowedFile(file.name);
    soundFX.play('gulp');
    setState('working');
    setAgentStepText(`Mochi swallowed ${file.name}! Analyzing file contents...`);
    onSendMessageToCoucou(`I just dropped ${file.name} onto Mochi. Summarize what Mochi should do with this file.`);
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

  return (
    <div className="w-full flex flex-col items-center">
      {/* MacBook Retina Frame */}
      <div className="w-full max-w-6xl bg-[#090A0C] p-3 sm:p-4 rounded-[32px] shadow-2xl border border-neutral-800 relative">
        {/* Screen Bezel */}
        <div 
          className="w-full h-[640px] sm:h-[700px] rounded-[22px] overflow-hidden relative flex flex-col justify-between"
          style={{
            background: `
              radial-gradient(1200px 520px at 18% 118%, #1E2D4A 0%, transparent 60%),
              radial-gradient(900px 500px at 92% -10%, #301E44 0%, transparent 55%),
              linear-gradient(180deg, #0C0E12 0%, #07090C 100%)
            `,
          }}
        >
          {/* macOS Top Menu Bar */}
          <div className="h-8 bg-black/40 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between text-xs text-neutral-300 z-40 select-none">
            {/* Left Menu Items */}
            <div className="flex items-center gap-4">
              <span className="font-bold text-white text-sm cursor-pointer"></span>
              <span className="font-semibold text-white">Coucou</span>
              <span className="hidden sm:inline hover:text-white cursor-pointer transition-colors">File</span>
              <span className="hidden sm:inline hover:text-white cursor-pointer transition-colors">Edit</span>
              <span className="hidden sm:inline hover:text-white cursor-pointer transition-colors">Agents</span>
              <span className="hidden sm:inline hover:text-white cursor-pointer transition-colors">Window</span>
              <span className="hidden sm:inline hover:text-white cursor-pointer transition-colors">Help</span>
            </div>

            {/* Right Menu Extras */}
            <div className="flex items-center gap-3 text-xs">
              <button 
                type="button"
                onClick={onToggleSound} 
                className="hover:text-white transition-colors"
                title={soundEnabled ? 'Mute' : 'Unmute'}
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
              <Wifi size={13} />
              <div className="flex items-center gap-1">
                <span>88%</span>
                <Battery size={13} />
              </div>
              <Sliders size={13} />
              <span className="font-medium">Fri 11:48 AM</span>
            </div>
          </div>

          {/* Notch & Dynamic Island Mount */}
          <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <MacNotchIsland
                shape={shape}
                state={state}
                emote={emote}
                outfit={outfit}
                activeAgent={activeAgent}
                activePill={activePill}
                onSelectPill={setActivePill}
                pendingApproval={pendingApproval}
                onApprove={handleApprove}
                onDeny={handleDeny}
                agentStepText={agentStepText}
                agentStepIndex={agentStepIndex}
                agentStepTotal={agentStepTotal}
                onDropFile={handleDropFile}
                onPopOutMochi={() => {
                  soundFX.play('pop');
                  setIsMochiPoppedOut(!isMochiPoppedOut);
                }}
                isMochiPoppedOut={isMochiPoppedOut}
              />
            </div>
          </div>

          {/* Floating Mochi on Desktop (when dragged out of notch) */}
          {isMochiPoppedOut && (
            <div
              style={{
                left: `${floatingPos.x}px`,
                top: `${floatingPos.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseDown={() => setIsDraggingFloating(true)}
              className="absolute z-40 cursor-grab active:cursor-grabbing flex flex-col items-center group select-none"
            >
              <div className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/20 shadow-2xl hover:scale-105 transition-transform">
                <MochiCanvas
                  shape={shape}
                  state={state}
                  emote={emote}
                  outfit={outfit}
                  size={84}
                  onClick={() => {
                    soundFX.play('slap');
                    setEmote('surprised');
                    setTimeout(() => setEmote(null), 1500);
                  }}
                />
              </div>
              <div className="mt-1 px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-neutral-300 font-medium tracking-tight border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                Drag me around or click to squish
              </div>
            </div>
          )}

          {/* Desktop Canvas Windows */}
          <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start relative z-10 overflow-hidden pt-12">
            {/* Window 1: Terminal / Coding Agent Session */}
            <div className="md:col-span-7 bg-[#14161B]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
              {/* Window Header */}
              <div className="h-9 bg-[#1C1F26]/80 px-3 flex items-center justify-between border-b border-white/5 select-none">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F57] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#FEBC2E] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#28C840] inline-block" />
                  <span className="text-xs font-mono font-medium text-neutral-400 ml-2 flex items-center gap-1.5">
                    <Terminal size={12} className="text-purple-400" />
                    <span>coucou-agent ~ {activeAgent}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]">
                    zsh
                  </span>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-3 font-mono text-xs text-neutral-300 space-y-2 h-56 sm:h-64 overflow-y-auto">
                <div className="text-neutral-500">
                  # AI Agent Session Active: {activeAgent.toUpperCase()} CLI
                </div>
                <div className="text-emerald-400">
                  $ claude "Add Coucou Dynamic Island notch companion"
                </div>
                <div className="text-neutral-400 text-[11px] pl-3 border-l-2 border-purple-500/40">
                  Thinking: Scanning repository files for SwiftUI NotchBuddy and relay workers...
                </div>
                <div className="bg-black/40 p-2 rounded-lg text-[11px] text-neutral-300 border border-neutral-800">
                  <span className="text-purple-400">Step {agentStepIndex}/{agentStepTotal}:</span> {agentStepText}
                </div>

                {swallowedFile && (
                  <div className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20 flex items-center gap-2">
                    <Sparkles size={14} />
                    <span>Mochi swallowed: <b>{swallowedFile}</b> and queued it into context!</span>
                  </div>
                )}

                {/* Live Coucou Speech Output */}
                <div className="bg-purple-950/40 border border-purple-500/30 p-2.5 rounded-xl text-xs flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-none">
                    M
                  </div>
                  <div>
                    <div className="font-bold text-[11px] text-purple-300 flex items-center gap-1.5">
                      <span>Mochi</span>
                      <span className="text-[10px] font-normal text-neutral-400">Live AI Voice</span>
                    </div>
                    <div className="text-neutral-200 mt-0.5 font-sans text-xs">
                      {isAiProcessing ? (
                        <span className="animate-pulse text-purple-300">Thinking with Gemini...</span>
                      ) : (
                        coucouReplyText || "Coucou! I'm keeping an eye on your AI coding agents from the notch. Let me know if you want to approve commands or chat!"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Test Controls for Agents */}
              <div className="p-2.5 bg-neutral-900/60 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                  <span>Simulate:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTriggerApprovalDemo}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium flex items-center gap-1 transition-all"
                  >
                    <ShieldAlert size={12} />
                    <span>Ask Approval</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerWorkDemo}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium flex items-center gap-1 transition-all"
                  >
                    <Play size={12} />
                    <span>Working</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerFinishDemo}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium flex items-center gap-1 transition-all"
                  >
                    <CheckCircle2 size={12} />
                    <span>Finish</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerQuestionDemo}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium flex items-center gap-1 transition-all"
                  >
                    <HelpCircle size={12} />
                    <span>Question</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Window 2: Finder / Draggable Files to Notch */}
            <div className="md:col-span-5 bg-[#16181E]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
              {/* Window Header */}
              <div className="h-9 bg-[#1F232B]/80 px-3 flex items-center justify-between border-b border-white/5 select-none">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F57] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#FEBC2E] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#28C840] inline-block" />
                  <span className="text-xs font-semibold text-neutral-300 ml-2 flex items-center gap-1.5">
                    <Folder size={12} className="text-blue-400" />
                    <span>Workspace Documents</span>
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500">Drag to notch</span>
              </div>

              {/* Finder File List */}
              <div className="p-3 space-y-2 h-44 overflow-y-auto">
                <div className="text-[11px] text-neutral-400 font-medium mb-1">
                  Drag any file directly onto Mochi in the notch:
                </div>
                {sampleFiles.map((f, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', f.name);
                      soundFX.play('hover');
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 cursor-grab active:cursor-grabbing transition-all text-xs text-neutral-200"
                  >
                    <File size={16} className="text-purple-400 flex-none" />
                    <span className="font-mono truncate flex-1">{f.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      {f.type}
                    </span>
                  </div>
                ))}
              </div>

              {/* « OK Coucou » Chat Input */}
              <form onSubmit={handleSendPrompt} className="p-2.5 bg-neutral-950/80 border-t border-white/5 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="« OK Coucou », how are my agents?"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAiProcessing || !inputText.trim()}
                  className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors"
                  title="Send message to Coucou via Gemini"
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          </div>

          {/* macOS Dock Bar */}
          <div className="pb-3 flex justify-center z-20 select-none">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
              {[
                { name: 'Finder', icon: '📁' },
                { name: 'Safari', icon: '🧭' },
                { name: 'Claude Code', icon: '🤖' },
                { name: 'Cursor', icon: '⚡' },
                { name: 'Terminal', icon: '💻' },
                { name: 'Music', icon: '🎵' },
                { name: 'Coucou Settings', icon: '⚙️' },
              ].map((app, idx) => (
                <div
                  key={idx}
                  onClick={() => soundFX.play('pop')}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-neutral-900/80 hover:scale-115 hover:-translate-y-1 transition-all duration-200 flex items-center justify-center text-lg sm:text-xl cursor-pointer shadow-md"
                  title={app.name}
                >
                  {app.icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Wardrobe & Character Controls Panel */}
      <div className="w-full max-w-6xl mt-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-white text-xs">
        {/* Character Pickers */}
        <div className="space-y-3">
          <div className="font-bold text-sm text-neutral-200 flex items-center gap-2">
            <span>Character Species</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'mochi', name: 'Mochi', desc: 'Rice cake with blush' },
              { id: 'galet', name: 'Galet', desc: 'Matte pebble' },
              { id: 'lueur', name: 'Lueur', desc: 'Glowing orb' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setShape(c.id as CharacterShape);
                  soundFX.play('pop');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  shape === c.id
                    ? 'bg-purple-950/60 border-purple-500 text-white'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs">{c.name}</div>
                <div className="text-[10px] text-neutral-500">{c.desc}</div>
              </button>
            ))}
          </div>

          <div className="font-bold text-sm text-neutral-200 pt-2 flex items-center gap-1.5">
            <Shirt size={14} className="text-purple-400" />
            <span>Wardrobe (Hats & Outfits)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'none', label: 'Classic' },
              { id: 'detective', label: 'Detective 🕵️' },
              { id: 'beret', label: 'French Beret 🥖' },
              { id: 'party', label: 'Party Cone 🎉' },
              { id: 'sunglasses', label: 'Shades 🕶️' },
              { id: 'wizard', label: 'Wizard 🧙' },
              { id: 'winter', label: 'Winter Beanie ❄️' },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setOutfit(o.id as OutfitId);
                  soundFX.play('blip');
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  outfit === o.id
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emotes & States Tester */}
        <div className="space-y-3">
          <div className="font-bold text-sm text-neutral-200 flex items-center gap-2">
            <span>Character State</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'idle', label: 'Idle' },
              { id: 'working', label: 'Working' },
              { id: 'finished', label: 'Finished' },
              { id: 'error', label: 'Error' },
              { id: 'thinking', label: 'Thinking' },
              { id: 'approval', label: 'Approval' },
              { id: 'question', label: 'Question' },
              { id: 'sleeping', label: 'Sleeping' },
              { id: 'dizzy', label: 'Dizzy' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setState(s.id as CharacterState);
                  soundFX.play(s.id === 'finished' ? 'finish' : s.id === 'error' ? 'error' : 'blip');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  state === s.id
                    ? 'bg-white text-black font-semibold border-white'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="font-bold text-sm text-neutral-200 pt-2 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
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
                className="px-3 py-1 rounded-full bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all text-xs"
              >
                {em.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Coding Agents Switcher & Cloud Relays */}
        <div className="space-y-3">
          <div className="font-bold text-sm text-neutral-200">
            Active AI Coding Agent
          </div>
          <div className="space-y-1.5">
            {[
              { id: 'claude', name: 'Claude Code', desc: 'Anthropic agent with 5h quota monitoring' },
              { id: 'cursor', name: 'Cursor Composer', desc: 'Multi-file editor with background indexing' },
              { id: 'codex', name: 'Codex CLI', desc: 'OpenAI agent with free resets limit pill' },
              { id: 'gemini', name: 'Gemini CLI', desc: 'Google AI CLI with multimodal context' },
              { id: 'antigravity', name: 'Antigravity', desc: 'Autonomous coding agent with approvals' },
            ].map((a) => (
              <div
                key={a.id}
                onClick={() => {
                  setActiveAgent(a.id as AgentType);
                  soundFX.play('blip');
                }}
                className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  activeAgent === a.id
                    ? 'bg-purple-950/50 border-purple-500 text-white'
                    : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-400 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <span>{a.name}</span>
                    {activeAgent === a.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-500">{a.desc}</div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                  Select
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
