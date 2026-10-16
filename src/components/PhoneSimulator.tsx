import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  SimulatorAppId, 
  DeviceState, 
  SparkEmote 
} from '../types';
import { 
  Battery, 
  Wifi, 
  Signal, 
  Flashlight, 
  Globe, 
  Code, 
  MessageSquare, 
  Settings, 
  Camera, 
  RotateCcw, 
  ChevronRight, 
  CheckCircle2, 
  Play, 
  ExternalLink,
  Layers,
  Sparkles,
  Github,
  UploadCloud,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { pushProjectToGitHub } from '../utils/githubPublisher';

interface PhoneSimulatorProps {
  deviceState: DeviceState;
  onToggleTorch: () => void;
  onSetBattery: (level: number) => void;
  onReadSimulatorScreen: () => void;
  currentEmote: SparkEmote;
}

export interface PhoneSimulatorHandle {
  captureScreenImage: () => Promise<string>;
  getVisibleScreenText: () => string;
}

export const PhoneSimulator = forwardRef<PhoneSimulatorHandle, PhoneSimulatorProps>(({
  deviceState,
  onToggleTorch,
  onSetBattery,
  onReadSimulatorScreen,
  currentEmote,
}, ref) => {
  const [activeApp, setActiveApp] = useState<SimulatorAppId>('code');
  const [browserUrl, setBrowserUrl] = useState('https://developer.android.com/spark-companion');
  const [sampleBugFixed, setSampleBugFixed] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);

  // GitHub Auto-builder states
  const [ghToken, setGhToken] = useState(() => localStorage.getItem('spark_gh_token') || '');
  const [ghRepo, setGhRepo] = useState(() => localStorage.getItem('spark_gh_repo') || 'Spark-Companion');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const [pushPercent, setPushPercent] = useState(0);
  const [pushResult, setPushResult] = useState<{ repoUrl: string; actionsUrl: string } | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  const handlePushToGitHub = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ghToken.trim()) {
      setPushError('Please enter your GitHub Personal Access Token (classic token with repo scope).');
      return;
    }
    setPushError(null);
    setPushResult(null);
    setIsPushing(true);
    localStorage.setItem('spark_gh_token', ghToken.trim());
    localStorage.setItem('spark_gh_repo', ghRepo.trim());

    try {
      const result = await pushProjectToGitHub({
        token: ghToken.trim(),
        repoName: ghRepo.trim() || 'Spark-Companion',
        onProgress: (status, percent) => {
          setPushStatus(status);
          setPushPercent(percent);
        },
      });
      setPushResult(result);
    } catch (err: any) {
      setPushError(err.message || 'Failed to push to GitHub');
    } finally {
      setIsPushing(false);
    }
  };

  const getVisibleText = (): string => {
    if (activeApp === 'code') {
      return `File: MainActivity.kt (Kotlin & Compose)\nCode snippet: suspend fun analyzeScreen(frame: Bitmap): Pair<String, String> {\n  val prompt = "What is on my screen? Keep under 2 sentences."\n  val reply = gemini.generateContent { image(frame); text(prompt) }\n  return parseEmoteAndActions(reply.text)\n}`;
    } else if (activeApp === 'browser') {
      return `Browser URL: ${browserUrl}\nPage: Spark: The Floating Companion powered by Gemini Flash on Android.\nCapabilities: Always-on floating avatar over other apps, MediaProjection screen snapshot vision, native battery & flashlight function calling.`;
    } else if (activeApp === 'social') {
      return `Spark Team Chat (3 online):\nRish (Lead Dev): "I just pushed the repository to GitHub! It uses GitHub Actions to build the debug APK in under 3 minutes."\nCompanion Tester: "The squish physics on the avatar feel so responsive! And asking it to toggle the flashlight works great."\nRish: "Let's test Spark's screen reading on this message thread!"`;
    } else {
      return `Android Device Diagnostics:\nDraw Over Other Apps: Granted (SYSTEM_ALERT_WINDOW)\nMediaProjection Vision: Active\nBattery Level: ${deviceState.battery}%\nCamera Torch: ${deviceState.torch ? 'ON' : 'OFF'}`;
    }
  };

  // Expose screen capture capability using html canvas
  useImperativeHandle(ref, () => ({
    getVisibleScreenText: () => getVisibleText(),
    captureScreenImage: async () => {
      const width = 400;
      const height = 300;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Draw dark background
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, width, height);

      // Status bar
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, width, 32);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`Spark Android • TAB: ${activeApp.toUpperCase()}`, 14, 21);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(`Battery: ${deviceState.battery}% | Torch: ${deviceState.torch ? 'ON' : 'OFF'}`, 14, 52);

      if (activeApp === 'code') {
        ctx.fillStyle = '#A78BFA';
        ctx.font = '11px monospace';
        ctx.fillText('// MainActivity.kt - Screen Vision Method', 14, 82);
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText('suspend fun analyzeScreen(frame: Bitmap) {', 14, 108);
        ctx.fillText('  val prompt = "What is on my screen?"', 26, 132);
        ctx.fillText('  val reply = gemini.generateContent(', 26, 156);
        ctx.fillText('    content { image(frame); text(prompt) }', 38, 180);
        ctx.fillText('  )', 26, 204);
        ctx.fillText('  return parseEmoteAndActions(reply.text)', 26, 228);
        ctx.fillText('}', 14, 252);
      } else if (activeApp === 'browser') {
        ctx.fillStyle = '#60A5FA';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('Gemini 2.5 Flash on Android', 14, 85);
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '11px sans-serif';
        ctx.fillText(`URL: ${browserUrl}`, 14, 112);
        ctx.fillText('Multimodal screen understanding in real-time.', 14, 136);
        ctx.fillText('Always-on floating avatar over any Android app.', 14, 160);
        ctx.fillText('Hardware controls: Battery, Flashlight Torch.', 14, 184);
      } else if (activeApp === 'social') {
        ctx.fillStyle = '#C084FC';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Team Spark Release Chat', 14, 85);
        ctx.fillStyle = '#E2E8F0';
        ctx.font = '11px sans-serif';
        ctx.fillText('Rish: Pushed repo to GitHub Actions.', 14, 112);
        ctx.fillText('Builds debug APK automatically in cloud.', 14, 136);
        ctx.fillText('Tester: Squish physics and flashlight verified!', 14, 160);
      } else {
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('Android Companion Settings', 14, 85);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#34D399';
        ctx.fillText('SYSTEM_ALERT_WINDOW: Granted', 14, 112);
        ctx.fillText('MediaProjection Screen Capture: Active', 14, 136);
        ctx.fillText(`Battery Simulator: ${deviceState.battery}%`, 14, 160);
      }

      return canvas.toDataURL('image/jpeg', 0.6);
    },
  }));

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col items-center">
      {/* Phone Case Frame */}
      <div className="relative w-[340px] sm:w-[370px] h-[720px] bg-neutral-900 rounded-[50px] p-3 shadow-2xl border-4 border-neutral-800 ring-1 ring-white/10 flex flex-col justify-between">
        
        {/* Flashlight Beam Emitter (Visual Torch at phone top) */}
        {deviceState.torch && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-14 bg-gradient-to-t from-amber-300/40 via-amber-200/20 to-transparent blur-xl pointer-events-none rounded-t-full" />
        )}

        {/* Top Speaker & Notch */}
        <div className="relative z-20 flex items-center justify-center pt-1 pb-1">
          <div className="w-20 h-4 bg-neutral-950 rounded-full flex items-center justify-center gap-2 px-2 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-neutral-800 border border-neutral-700" /> {/* Front camera */}
            <div className="w-8 h-1 bg-neutral-800 rounded-full" /> {/* Ear speaker */}
          </div>
        </div>

        {/* Phone Screen Display Area */}
        <div 
          ref={screenRef}
          className="relative flex-1 bg-slate-950 rounded-[38px] overflow-hidden flex flex-col border border-neutral-800/80 shadow-inner"
        >
          {/* Torch Light Ambient Overlay */}
          {deviceState.torch && (
            <div className="absolute inset-0 bg-amber-500/10 pointer-events-none z-30 transition-opacity" />
          )}

          {/* Android Status Bar */}
          <div className="h-8 bg-black/40 backdrop-blur-md px-6 flex items-center justify-between text-[11px] font-medium text-neutral-300 z-20 border-b border-white/5">
            <span>{currentTime}</span>
            <div className="flex items-center gap-2">
              {deviceState.torch && (
                <Flashlight size={12} className="text-amber-400 animate-pulse" />
              )}
              <Wifi size={12} />
              <Signal size={12} />
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span>{deviceState.battery}%</span>
                <Battery size={13} className={deviceState.battery < 20 ? 'text-red-400' : 'text-emerald-400'} />
              </div>
            </div>
          </div>

          {/* Interactive Screen Body */}
          <div className="flex-1 overflow-y-auto flex flex-col text-white font-sans text-xs">
            
            {/* APP: CODE EDITOR */}
            {activeApp === 'code' && (
              <div className="p-4 flex-1 flex flex-col gap-3 font-mono text-[11px] bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-slate-400 font-sans font-semibold text-xs">
                    <Code size={14} className="text-purple-400" />
                    <span>MainActivity.kt</span>
                  </div>
                  <span className="text-[10px] bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                    Kotlin + Compose
                  </span>
                </div>

                <div className="rounded-xl bg-slate-900/90 p-3 border border-slate-800 leading-relaxed overflow-x-auto text-slate-300">
                  <p className="text-purple-400">// Screen Vision Multimodal Method</p>
                  <p><span className="text-blue-400">suspend fun</span> <span className="text-amber-300">analyzeScreen</span>(frame: Bitmap): Pair&lt;String, String&gt; &#123;</p>
                  <p className="pl-3 text-slate-400">val prompt = <span className="text-emerald-300">"What is on my screen? Keep under 2 sentences."</span></p>
                  <p className="pl-3"><span className="text-blue-400">val</span> reply = gemini.generateContent &#123;</p>
                  <p className="pl-6">image(frame)</p>
                  <p className="pl-6">text(prompt)</p>
                  <p className="pl-3">&#125;</p>
                  <p className="pl-3"><span className="text-rose-400">return</span> parseEmoteAndActions(reply.text)</p>
                  <p>&#125;</p>
                </div>

                <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/80 flex flex-col gap-2 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs">Test Screen Vision</span>
                    <button
                      type="button"
                      onClick={() => setSampleBugFixed(!sampleBugFixed)}
                      className="text-[11px] text-purple-400 hover:text-purple-300"
                    >
                      {sampleBugFixed ? 'Revert Snippet' : 'Toggle Variation'}
                    </button>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Tap Spark's <strong className="text-purple-300">"Read Screen"</strong> to see Gemini inspect and explain this code logic!
                  </p>
                </div>
              </div>
            )}

            {/* APP: BROWSER */}
            {activeApp === 'browser' && (
              <div className="flex-1 flex flex-col bg-slate-900">
                {/* Browser URL Bar */}
                <div className="p-2.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center gap-2">
                  <Globe size={13} className="text-slate-400" />
                  <input
                    type="text"
                    value={browserUrl}
                    onChange={(e) => setBrowserUrl(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                  />
                  <RotateCcw size={13} className="text-slate-400 cursor-pointer" />
                </div>

                <div className="p-4 flex-1 flex flex-col gap-3 font-sans">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 p-4 border border-indigo-800/40">
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">AI Studio Project</span>
                    <h3 className="text-sm font-bold text-white mt-1">Spark: The Floating Companion</h3>
                    <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                      Powered by Gemini Flash multimodal inference. Spark stays on screen while you browse, reads articles, extracts action items, and controls system toggles.
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/60">
                    <h4 className="font-semibold text-xs text-slate-200">Key Android Capabilities</h4>
                    <ul className="mt-2 space-y-1.5 text-slate-300 text-[11px]">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        <span>Always-on floating avatar over any app</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        <span>MediaProjection screen snapshot vision</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        <span>Battery & Flashlight function calling</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* APP: SOCIAL / MESSAGES */}
            {activeApp === 'social' && (
              <div className="flex-1 flex flex-col bg-slate-950 p-3 gap-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center font-bold text-xs text-white">
                      SC
                    </div>
                    <div>
                      <div className="font-bold text-xs">Spark Team Chat</div>
                      <div className="text-[10px] text-emerald-400">3 online</div>
                    </div>
                  </div>
                  <MessageSquare size={14} className="text-slate-400" />
                </div>

                <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto">
                  <div className="bg-slate-900 p-2.5 rounded-2xl rounded-tl-sm border border-slate-800 max-w-[85%] self-start">
                    <span className="text-[10px] font-semibold text-purple-400 block">Rish (Lead Dev)</span>
                    <p className="text-slate-200 text-xs mt-0.5">
                      "I just pushed the repository to GitHub! It uses GitHub Actions to build the debug APK in under 3 minutes."
                    </p>
                  </div>

                  <div className="bg-purple-900/40 p-2.5 rounded-2xl rounded-tr-sm border border-purple-800/60 max-w-[85%] self-end">
                    <span className="text-[10px] font-semibold text-purple-300 block">Companion Tester</span>
                    <p className="text-purple-100 text-xs mt-0.5">
                      "The squish physics on the avatar feel so responsive! And asking it to toggle the flashlight works great."
                    </p>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-2xl rounded-tl-sm border border-slate-800 max-w-[85%] self-start">
                    <span className="text-[10px] font-semibold text-purple-400 block">Rish</span>
                    <p className="text-slate-200 text-xs mt-0.5">
                      "Let's test Spark's screen reading on this message thread!"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* APP: DEVICE SETTINGS */}
            {activeApp === 'device' && (
              <div className="flex-1 flex flex-col bg-slate-950 p-4 gap-3 font-sans">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Settings size={15} className="text-slate-400" />
                  <span className="font-bold text-xs">Android Companion Settings</span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-200">Draw Over Other Apps</div>
                      <div className="text-[10px] text-slate-400">SYSTEM_ALERT_WINDOW</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold">
                      Granted
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-200">MediaProjection Vision</div>
                      <div className="text-[10px] text-slate-400">Capture latest screen frame</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold">
                      Active
                    </span>
                  </div>

                  {/* Manual Battery Adjuster for Testing */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-slate-200">Battery Level Simulator</span>
                      <span className="font-mono text-xs text-purple-300 font-bold">{deviceState.battery}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={deviceState.battery}
                      onChange={(e) => onSetBattery(Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Automatic GitHub APK Builder Card */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/70 to-slate-900 border border-purple-800/60 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-purple-200">
                        <Github size={14} className="text-purple-400" />
                        <span>Cloud APK Builder</span>
                      </div>
                      <span className="text-[9px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700 font-mono">
                        Actions CI/CD
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Push to your GitHub repository to automatically build <code>app-debug.apk</code> using Capacitor & Android SDK in GitHub Actions.
                    </p>

                    <form onSubmit={handlePushToGitHub} className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-slate-300">GitHub Token</label>
                        <input
                          type="password"
                          value={ghToken}
                          onChange={(e) => setGhToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxx"
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-slate-300">Repository Name</label>
                        <input
                          type="text"
                          value={ghRepo}
                          onChange={(e) => setGhRepo(e.target.value)}
                          placeholder="Spark-Companion"
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      {pushError && (
                        <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-800 text-[10px] text-rose-200 flex items-start gap-1.5">
                          <AlertCircle size={12} className="shrink-0 mt-0.5" />
                          <span>{pushError}</span>
                        </div>
                      )}

                      {isPushing && (
                        <div className="flex flex-col gap-1 py-1">
                          <div className="flex justify-between text-[10px] text-purple-300">
                            <span>{pushStatus}</span>
                            <span>{pushPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-purple-500 h-full transition-all duration-300 rounded-full"
                              style={{ width: `${pushPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {pushResult && (
                        <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800 text-[10px] text-emerald-200 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Check size={12} />
                            <span>Pushed & Workflow Triggered!</span>
                          </div>
                          <a
                            href={pushResult.actionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                          >
                            <span>Download APK on Actions</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isPushing}
                        className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                      >
                        {isPushing ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Pushing to GitHub...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={13} />
                            <span>Push to GitHub & Build APK</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Android Bottom App Dock */}
          <div className="h-14 bg-black/60 backdrop-blur-md px-4 flex items-center justify-around border-t border-white/5 z-20">
            <button
              type="button"
              onClick={() => setActiveApp('code')}
              className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors ${
                activeApp === 'code' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code size={16} />
              <span className="text-[9px]">Code</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveApp('browser')}
              className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors ${
                activeApp === 'browser' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe size={16} />
              <span className="text-[9px]">Web</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveApp('social')}
              className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors ${
                activeApp === 'social' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={16} />
              <span className="text-[9px]">Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveApp('device')}
              className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-colors ${
                activeApp === 'device' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings size={16} />
              <span className="text-[9px]">Config</span>
            </button>
          </div>

          {/* Android Home Navigation Bar */}
          <div className="h-4 bg-black flex items-center justify-center">
            <div className="w-24 h-1 bg-white/40 rounded-full" />
          </div>
        </div>

        {/* Bottom Phone Bezel */}
        <div className="h-2" />
      </div>
    </div>
  );
});
