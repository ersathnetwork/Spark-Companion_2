import React, { useState, useEffect, useRef } from 'react';
import { 
  SparkEmote, 
  DeviceState, 
  ChatMessage, 
  CompanionSettings 
} from './types';
import { FloatingOverlay } from './components/FloatingOverlay';
import { PhoneSimulator, PhoneSimulatorHandle } from './components/PhoneSimulator';
import { LauncherActivity } from './components/LauncherActivity';
import { soundFX } from './utils/audio';
import { sendChatMessage, analyzeScreenImage } from './utils/gemini';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Monitor, 
  Github, 
  CheckCircle2, 
  Layers,
  Camera,
  RotateCcw,
  Zap
} from 'lucide-react';

const PREFS_KEY_API_KEY = 'spark_gemini_api_key';
const PREFS_KEY_SOUND = 'spark_sound_enabled';

export default function App() {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem(PREFS_KEY_API_KEY) || '';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem(PREFS_KEY_SOUND);
    return saved !== null ? saved === 'true' : true;
  });
  const [hasServerKey, setHasServerKey] = useState(() => {
    const envKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : '';
    return Boolean(envKey && envKey !== 'MY_GEMINI_API_KEY');
  });

  // Spark Companion State
  const [emote, setEmote] = useState<SparkEmote>('HAPPY');
  const [speechText, setSpeechText] = useState<string>(
    'Spark is active! Tap me to squish, or tap Read Screen to analyze your display.'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMode, setActiveMode] = useState<'simulator' | 'desktop'>('simulator');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Hardware and Device State
  const [deviceState, setDeviceState] = useState<DeviceState>({
    battery: 88,
    isCharging: false,
    torch: false,
    overlayGranted: true,
    screenCaptureGranted: true,
    companionSpawned: true,
  });

  const phoneSimulatorRef = useRef<PhoneSimulatorHandle>(null);
  const torchTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    // Detect actual device battery if supported by browser
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setDeviceState((prev) => ({
            ...prev,
            battery: Math.round(battery.level * 100),
            isCharging: battery.charging,
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
  }, []);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem(PREFS_KEY_API_KEY, newKey);
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(PREFS_KEY_SOUND, String(next));
      if (next) soundFX.playPop();
      return next;
    });
  };

  // Hardware Flashlight controller
  const handleToggleTorch = async () => {
    const nextTorch = !deviceState.torch;
    if (soundEnabled) {
      soundFX.playTorchClick(nextTorch);
    }

    setDeviceState((prev) => ({ ...prev, torch: nextTorch }));

    // Attempt hardware camera torch on compatible mobile browsers
    if (nextTorch && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        const track = stream.getVideoTracks()[0];
        const capabilities: any = track.getCapabilities?.();
        if (capabilities && capabilities.torch) {
          await (track as any).applyConstraints({
            advanced: [{ torch: true }],
          });
          torchTrackRef.current = track;
        }
      } catch {
        // Torch constraint not supported or camera denied; simulator torch visual still activates!
      }
    } else if (!nextTorch && torchTrackRef.current) {
      try {
        torchTrackRef.current.stop();
        torchTrackRef.current = null;
      } catch {}
    }
  };

  // Query Battery via natural language to demonstrate device function calling
  const handleQueryBattery = () => {
    handleSendMessage('What is my current device battery level?');
  };

  // Chat / Message Handler (Calls server-side Gemini 3.8 Flash)
  const handleSendMessage = async (prompt: string) => {
    setIsProcessing(true);
    setEmote('THINKING');

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: prompt,
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, userMsg]);

    try {
      let visibleText = '';
      if (phoneSimulatorRef.current?.getVisibleScreenText) {
        visibleText = phoneSimulatorRef.current.getVisibleScreenText();
      }

      const data = await sendChatMessage(
        prompt,
        apiKey,
        deviceState,
        chatHistory.map((m) => ({ sender: m.sender, text: m.text })),
        visibleText
      );

      const sparkReply = data.cleanText || 'Spark is ready!';
      setSpeechText(sparkReply);
      setEmote(data.emote || 'HAPPY');

      // Execute returned hardware actions
      if (data.actions?.torchOn) {
        setDeviceState((prev) => ({ ...prev, torch: true }));
        if (soundEnabled) soundFX.playTorchClick(true);
      } else if (data.actions?.torchOff) {
        setDeviceState((prev) => ({ ...prev, torch: false }));
        if (soundEnabled) soundFX.playTorchClick(false);
      }

      if (soundEnabled) {
        soundFX.playSparkChime();
      }

      const sparkMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'spark',
        text: sparkReply,
        emote: data.emote || 'HAPPY',
        timestamp: Date.now(),
        actionsPerformed: data.actions,
      };
      setChatHistory((prev) => [...prev, sparkMsg]);
    } catch (err: any) {
      setEmote('CONFUSED');
      setSpeechText(`Spark note: ${err.message || 'Observation ready'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Multimodal Screen Vision Handler - Fast synchronous canvas capture
  const handleReadScreen = async () => {
    setIsProcessing(true);
    setEmote('THINKING');
    setSpeechText('Scanning screen...');
    if (soundEnabled) soundFX.playPop();

    try {
      let imageBase64 = '';
      let visibleText = '';

      if (phoneSimulatorRef.current) {
        imageBase64 = await phoneSimulatorRef.current.captureScreenImage();
        visibleText = phoneSimulatorRef.current.getVisibleScreenText();
      }

      const data = await analyzeScreenImage(
        imageBase64,
        'What is on my screen? Keep response under 2 sentences.',
        apiKey,
        deviceState,
        visibleText
      );

      const reply = data.cleanText || 'I analyzed your screen!';
      setSpeechText(reply);
      setEmote(data.emote || 'SURPRISED');

      if (data.actions?.torchOn) {
        setDeviceState((prev) => ({ ...prev, torch: true }));
        if (soundEnabled) soundFX.playTorchClick(true);
      } else if (data.actions?.torchOff) {
        setDeviceState((prev) => ({ ...prev, torch: false }));
        if (soundEnabled) soundFX.playTorchClick(false);
      }

      if (soundEnabled) {
        soundFX.playSparkChime();
      }
    } catch (err: any) {
      setEmote('CONFUSED');
      setSpeechText(`Spark note: ${err.message || 'Screen observed'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1117] text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-[#161B22]/90 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight flex items-center gap-2">
              Spark Companion
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-neutral-800 text-purple-300 border border-neutral-700">
                Android & Web
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Always-on floating avatar • Multimodal screen vision
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Switcher */}
          <div className="hidden sm:flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                activeMode === 'simulator'
                  ? 'bg-purple-600 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone size={13} />
              <span>Phone Sandbox</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                activeMode === 'desktop'
                  ? 'bg-purple-600 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Monitor size={13} />
              <span>Full Desktop</span>
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

          {/* Spawn / Despawn Toggle */}
          <button
            type="button"
            onClick={() => {
              setDeviceState((prev) => ({
                ...prev,
                companionSpawned: !prev.companionSpawned,
              }));
              if (soundEnabled) soundFX.playPop();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              deviceState.companionSpawned
                ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                deviceState.companionSpawned ? 'bg-purple-400 animate-ping' : 'bg-neutral-600'
              }`}
            />
            <span>{deviceState.companionSpawned ? 'Companion Active' : 'Spawn Spark'}</span>
          </button>
        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 p-4 sm:p-8 flex flex-col items-center justify-start max-w-7xl mx-auto w-full">
        {activeMode === 'simulator' ? (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Phone Simulator Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="text-center mb-3">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Android 14 Environment
                </span>
                <p className="text-[11px] text-neutral-500">
                  Switch apps below & click "Read Screen" on Spark
                </p>
              </div>
              <PhoneSimulator
                ref={phoneSimulatorRef}
                deviceState={deviceState}
                onToggleTorch={handleToggleTorch}
                onSetBattery={(battery) => setDeviceState((p) => ({ ...p, battery }))}
                onReadSimulatorScreen={handleReadScreen}
                currentEmote={emote}
              />
            </div>

            {/* Launcher & Controls Activity */}
            <div className="lg:col-span-7 w-full">
              <LauncherActivity
                apiKey={apiKey}
                onSaveApiKey={handleSaveApiKey}
                deviceState={deviceState}
                onSpawnCompanion={() =>
                  setDeviceState((p) => ({ ...p, companionSpawned: true }))
                }
                currentEmote={emote}
                soundEnabled={soundEnabled}
                activeMode={activeMode}
                onChangeMode={setActiveMode}
                hasServerKey={hasServerKey}
              />
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <LauncherActivity
              apiKey={apiKey}
              onSaveApiKey={handleSaveApiKey}
              deviceState={deviceState}
              onSpawnCompanion={() =>
                setDeviceState((p) => ({ ...p, companionSpawned: true }))
              }
              currentEmote={emote}
              soundEnabled={soundEnabled}
              activeMode={activeMode}
              onChangeMode={setActiveMode}
              hasServerKey={hasServerKey}
            />
          </div>
        )}
      </main>

      {/* Always-on Floating Overlay Companion (Recreating Android FloatingCompanionService) */}
      {deviceState.companionSpawned && (
        <FloatingOverlay
          emote={emote}
          speechText={speechText}
          isProcessing={isProcessing}
          deviceState={deviceState}
          onSendMessage={handleSendMessage}
          onReadScreen={handleReadScreen}
          onToggleTorch={handleToggleTorch}
          onQueryBattery={handleQueryBattery}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onEmoteChange={setEmote}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Spark Companion</span>
          <span>•</span>
          <span>Google AI Studio & Gemini 3.8 Flash</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/irshrish/Spark-Companion"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-400 transition-colors flex items-center gap-1"
          >
            <Github size={12} />
            <span>irshrish/Spark-Companion</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
