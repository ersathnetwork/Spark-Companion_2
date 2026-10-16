import React, { useState } from 'react';
import { 
  CharacterShape, 
  CharacterState, 
  CharacterEmote, 
  OutfitId, 
  CoucouViewMode, 
  AgentType, 
  ApprovalRequest,
  DeviceState 
} from './types';
import { AndroidDynamicIslandPhone } from './components/AndroidDynamicIslandPhone';
import { MacDesktopSimulator } from './components/MacDesktopSimulator';
import { IPhoneLockScreenSimulator } from './components/IPhoneLockScreenSimulator';
import { soundFX } from './utils/audio';
import { sendChatMessage } from './utils/gemini';
import { 
  Sparkles, 
  Monitor, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Github, 
  CheckCircle2, 
  Terminal, 
  ShieldCheck, 
  Layers,
  UploadCloud,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<CoucouViewMode>('android');
  const [shape, setShape] = useState<CharacterShape>('mochi');
  const [state, setState] = useState<CharacterState>('idle');
  const [emote, setEmote] = useState<CharacterEmote | null>(null);
  const [outfit, setOutfit] = useState<OutfitId>('none');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Device & Hardware State
  const [deviceState, setDeviceState] = useState<DeviceState>({
    battery: 88,
    isCharging: false,
    torch: false,
    overlayGranted: true,
    screenCaptureGranted: true,
    companionSpawned: true,
  });

  // Agent State
  const [activeAgent, setActiveAgent] = useState<AgentType>('claude');
  const [agentStepText, setAgentStepText] = useState('Watching terminal commands and workspace diffs...');
  const [pendingApproval, setPendingApproval] = useState<ApprovalRequest | null>(null);

  // Gemini AI Chat State
  const [coucouReplyText, setCoucouReplyText] = useState(
    "Coucou! I'm Mochi, living in your Android notch dynamic island. I keep an eye on Claude Code, Cursor, Codex, and Gemini CLI with biometric fingerprint approvals!"
  );
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFX.enabled = next;
      if (next) soundFX.play('pop');
      return next;
    });
  };

  const handleToggleTorch = () => {
    const nextTorch = !deviceState.torch;
    setDeviceState((p) => ({ ...p, torch: nextTorch }));
    soundFX.playTorchClick(nextTorch);
  };

  const handleSendMessageToCoucou = async (prompt: string): Promise<string> => {
    setIsAiProcessing(true);
    setState('thinking');
    soundFX.play('think');

    try {
      const systemContext = `You are Mochi (from Coucou), an adorable, helpful companion living in the user's Android notch dynamic island. You keep an eye on AI coding agents like Claude Code, Cursor, Codex, and Gemini CLI. You love keeping the user safe from dangerous commands, wearing cute hats, and watching coding progress. Respond in 1-2 punchy, endearing sentences with an emotion tag like [HAPPY], [PROUD], or [SURPRISED].`;

      const response = await sendChatMessage(
        prompt,
        undefined,
        deviceState,
        [],
        `Active Agent: ${activeAgent}, Notch State: ${state}, Outfit: ${outfit}. ${systemContext}`
      );

      const reply = response.cleanText || "Coucou! I'm watching your agents and ready to approve commands!";
      setCoucouReplyText(reply);
      setState('finished');
      soundFX.play('finish');
      setTimeout(() => setState('idle'), 2500);
      return reply;
    } catch {
      const fallback = "Coucou! I'm here in your Android notch watching your coding agents!";
      setCoucouReplyText(fallback);
      setState('idle');
      return fallback;
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080A] text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-50 bg-[#0E1015]/90 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-purple-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <span className="text-base select-none">🤖</span>
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight flex items-center gap-2">
              Coucou Android
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-neutral-800 text-emerald-400 border border-neutral-700">
                Notch Dynamic Island
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Punch-hole dynamic island with fingerprint approvals & cloud APK builder
            </div>
          </div>
        </div>

        {/* View Mode Switcher & Extras */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Pill */}
          <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('android');
                soundFX.play('pop');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'android'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone size={13} />
              <span>Android Notch</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('macbook');
                soundFX.play('pop');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'macbook'
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Monitor size={13} />
              <span>Mac Notch</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('iphone');
                soundFX.play('pop');
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === 'iphone'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>iPhone Lock</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/Louis-CFM/coucou"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors"
          >
            <Github size={13} />
            <span>Louis-CFM/coucou</span>
          </a>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="flex-1 p-4 sm:p-8 flex flex-col items-center justify-start max-w-7xl mx-auto w-full">
        {viewMode === 'android' ? (
          <AndroidDynamicIslandPhone
            shape={shape}
            setShape={setShape}
            state={state}
            setState={setState}
            emote={emote}
            setEmote={setEmote}
            outfit={outfit}
            setOutfit={setOutfit}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            deviceState={deviceState}
            onToggleTorch={handleToggleTorch}
            onSendMessageToCoucou={handleSendMessageToCoucou}
            coucouReplyText={coucouReplyText}
            isAiProcessing={isAiProcessing}
          />
        ) : viewMode === 'macbook' ? (
          <MacDesktopSimulator
            shape={shape}
            setShape={setShape}
            state={state}
            setState={setState}
            emote={emote}
            setEmote={setEmote}
            outfit={outfit}
            setOutfit={setOutfit}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onSendMessageToCoucou={handleSendMessageToCoucou}
            coucouReplyText={coucouReplyText}
            isAiProcessing={isAiProcessing}
          />
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Coucou on iPhone (Live Activities & Dynamic Island)
              </span>
              <p className="text-[11px] text-neutral-500">
                Lock your Mac and approve coding agent actions with Face ID right from your phone
              </p>
            </div>
            <IPhoneLockScreenSimulator
              shape={shape}
              state={state}
              emote={emote}
              outfit={outfit}
              activeAgent={activeAgent}
              pendingApproval={pendingApproval}
              onApprove={(_req) => {
                setPendingApproval(null);
                setState('finished');
                setAgentStepText('Approved via iPhone Face ID! Task resuming on Mac.');
                setTimeout(() => setState('idle'), 2500);
              }}
              onDeny={(_req) => {
                setPendingApproval(null);
                setState('error');
                setAgentStepText('Denied via iPhone! Command aborted.');
                setTimeout(() => setState('idle'), 2500);
              }}
              agentStepText={agentStepText}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Coucou Android Notch Dynamic Island</span>
          <span>•</span>
          <span>Automatic Cloud APK Build via GitHub Actions</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Louis-CFM/coucou"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <Github size={12} />
            <span>github.com/Louis-CFM/coucou</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
