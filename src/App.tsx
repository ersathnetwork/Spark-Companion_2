import React, { useState } from 'react';
import { 
  CharacterShape, 
  CharacterState, 
  CharacterEmote, 
  OutfitId, 
  DeviceState 
} from './types';
import { CoucouAndroidCompanion } from './components/CoucouAndroidCompanion';
import { soundFX } from './utils/audio';
import { coucouVoice } from './utils/voice';
import { sendChatMessage } from './utils/gemini';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Github, 
  UploadCloud 
} from 'lucide-react';

export default function App() {
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

  // Gemini AI Chat State
  const [coucouReplyText, setCoucouReplyText] = useState(
    "Coucou! I'm Mochi, living in your Android notch dynamic island. I keep an eye on Claude Code, Cursor, and Codex with fingerprint approvals!"
  );
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFX.enabled = next;
      coucouVoice.speechEnabled = next;
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
        `Android Notch Dynamic Island State: ${state}, Outfit: ${outfit}. ${systemContext}`
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
    <div className="min-h-screen bg-[#06080B] text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-50 bg-[#0C0F14]/90 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-purple-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <span className="text-base select-none">🍮</span>
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight flex items-center gap-2">
              Coucou Android Companion
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-neutral-800 text-emerald-400 border border-neutral-700">
                Notch Dynamic Island
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Biometric fingerprint approvals, « OK Coucou » voice, and cloud APK builder
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute SFX & Voice' : 'Enable SFX & Voice'}
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
      <main className="flex-1 p-3 sm:p-6 flex flex-col items-center justify-start max-w-5xl mx-auto w-full">
        <CoucouAndroidCompanion
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
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Coucou Android Dynamic Island Companion</span>
          <span>•</span>
          <span>Ported from Louis-CFM/coucou • Automatic Cloud APK Builder</span>
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
