import React, { useState } from 'react';
import { DeviceState, SparkEmote } from '../types';
import { 
  Key, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Camera, 
  Battery, 
  Flashlight, 
  Play, 
  CheckCircle2, 
  Github, 
  FileCode, 
  Download, 
  Smartphone, 
  Monitor,
  ExternalLink,
  Info,
  UploadCloud,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { pushProjectToGitHub } from '../utils/githubPublisher';
import { CompanionAvatar } from './CompanionAvatar';
import { soundFX } from '../utils/audio';

interface LauncherActivityProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  deviceState: DeviceState;
  onSpawnCompanion: () => void;
  currentEmote: SparkEmote;
  soundEnabled: boolean;
  activeMode: 'simulator' | 'desktop';
  onChangeMode: (mode: 'simulator' | 'desktop') => void;
  hasServerKey: boolean;
}

export const LauncherActivity: React.FC<LauncherActivityProps> = ({
  apiKey,
  onSaveApiKey,
  deviceState,
  onSpawnCompanion,
  currentEmote,
  soundEnabled,
  activeMode,
  onChangeMode,
  hasServerKey,
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [activeTab, setActiveTab] = useState<'launcher' | 'apk-guide' | 'source'>('launcher');

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    if (soundEnabled) soundFX.playPop();
    onSpawnCompanion();
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col gap-6">
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('launcher')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'launcher'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Launcher & Controls
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk-guide')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'apk-guide'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Download size={13} />
            <span>GitHub APK Build Guide</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('source')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'source'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <FileCode size={13} />
            <span>Original Kotlin Source</span>
          </button>
        </div>

        <a
          href="https://github.com/irshrish/Spark-Companion"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-800 transition-colors"
        >
          <Github size={13} />
          <span>irshrish/Spark-Companion</span>
          <ExternalLink size={11} className="text-neutral-500" />
        </a>
      </div>

      {activeTab === 'launcher' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Main Launcher Form (Recreating Kotlin MainActivity) */}
          <div className="md:col-span-7 bg-[#1E1E2E]/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-2xl flex flex-col gap-6">
            
            <div className="flex items-center gap-4">
              <CompanionAvatar
                emote={currentEmote}
                size={68}
                soundEnabled={soundEnabled}
              />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Spark Companion
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                    Gemini 2.5 Flash
                  </span>
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  AI buddy powered by Google AI Studio • Floating Avatar & Multimodal Vision
                </p>
              </div>
            </div>

            {/* API Key Status Banner */}
            <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${hasServerKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-neutral-300">
                  {hasServerKey ? (
                    <>Google AI Studio Key <strong className="text-emerald-400">Detected</strong> from process.env</>
                  ) : (
                    <>Custom key or process.env.GEMINI_API_KEY</>
                  )}
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">Client SDK</span>
            </div>

            {/* API Key Form */}
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Key size={13} className="text-purple-400" />
                  <span>Google AI Studio API Key (Optional override)</span>
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste custom AI Studio API key (or leave blank to use server key)"
                  className="w-full bg-neutral-900/90 border border-neutral-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                />
                <span className="text-[11px] text-neutral-500">
                  Keys are handled securely on the server-side proxy route and never exposed to public bundles.
                </span>
              </div>

              {/* Spawn Companion Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles size={16} />
                <span>Save & Spawn Companion</span>
              </button>
            </form>

            {/* View Mode Switcher */}
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800/80">
              <span className="text-xs font-semibold text-neutral-300">Companion Workspace View</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeMode('simulator')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    activeMode === 'simulator'
                      ? 'bg-purple-950/40 border-purple-500/80 text-white'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={20} className={activeMode === 'simulator' ? 'text-purple-400' : 'text-neutral-500'} />
                  <div>
                    <div className="font-semibold text-xs">Phone Simulator</div>
                    <div className="text-[10px] text-neutral-400">Android screen sandbox</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeMode('desktop')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    activeMode === 'desktop'
                      ? 'bg-purple-950/40 border-purple-500/80 text-white'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Monitor size={20} className={activeMode === 'desktop' ? 'text-purple-400' : 'text-neutral-500'} />
                  <div>
                    <div className="font-semibold text-xs">Desktop Overlay</div>
                    <div className="text-[10px] text-neutral-400">Real browser screen share</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Android Permissions & Hardware Status Cards */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="bg-[#1E1E2E]/80 backdrop-blur-md rounded-3xl p-6 border border-neutral-800 shadow-xl flex flex-col gap-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-purple-400" />
                <span>Android Permissions & APIs</span>
              </h3>

              <div className="flex flex-col gap-2.5">
                {/* Overlay Permission */}
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Layers size={15} className="text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">Draw Over Other Apps</div>
                      <div className="text-[10px] text-neutral-500">WindowManager Overlay</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Active
                  </span>
                </div>

                {/* Screen Capture MediaProjection */}
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Camera size={15} className="text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">MediaProjection Vision</div>
                      <div className="text-[10px] text-neutral-500">VirtualDisplay screen capture</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Ready
                  </span>
                </div>

                {/* Battery Manager */}
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Battery size={15} className="text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">Battery Controller</div>
                      <div className="text-[10px] text-neutral-500">BATTERY_PROPERTY_CAPACITY</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-300">
                    {deviceState.battery}%
                  </span>
                </div>

                {/* Flashlight Torch */}
                <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Flashlight size={15} className={deviceState.torch ? 'text-amber-400 animate-pulse' : 'text-neutral-400'} />
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">Camera Torch Hardware</div>
                      <div className="text-[10px] text-neutral-500">CameraManager.setTorchMode</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    deviceState.torch
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}>
                    {deviceState.torch ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>

            {/* Companion Guide Tips */}
            <div className="bg-gradient-to-br from-purple-950/40 to-slate-900/80 rounded-3xl p-5 border border-purple-900/40 text-xs text-neutral-300 flex flex-col gap-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-400" />
                Companion Interaction Tips
              </span>
              <p className="text-neutral-400 leading-relaxed text-[11px]">
                Click or drag Spark anywhere on your screen. Tap Spark's face to trigger the animated squish spring physics and eye expressions. Tap <strong>"Read Screen"</strong> to have Gemini analyze whatever is in view!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* APK Cloud Build Guide Tab */}
      {activeTab === 'apk-guide' && (
        <div className="bg-[#1E1E2E]/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-2xl flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">How to Build the APK via GitHub Actions (Cloud)</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Zero local setup required: No local Android Studio, Gradle, or SDKs needed.
              </p>
            </div>
            <a
              href="https://github.com/irshrish/Spark-Companion"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Github size={14} />
              <span>View Repository</span>
            </a>
          </div>

          {/* Interactive Automatic Push & Build Form */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-800/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github size={18} className="text-purple-400" />
                <span className="font-bold text-sm text-white">Automatic GitHub Repository Pusher & APK Trigger</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700">
                1-Click Cloud CI/CD
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Enter your GitHub Personal Access Token (classic token with <code>repo</code> scope) and target repository name. This will automatically commit all project files and <code>.github/workflows/build-apk.yml</code>, triggering the Capacitor Android APK build!
            </p>

            <form onSubmit={handlePushToGitHub} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              <div className="md:col-span-6 flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-300">GitHub Personal Access Token</label>
                <input
                  type="password"
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="bg-neutral-900/90 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="md:col-span-6 flex flex-col gap-1">
                <label className="text-xs font-semibold text-neutral-300">Target Repository Name</label>
                <input
                  type="text"
                  value={ghRepo}
                  onChange={(e) => setGhRepo(e.target.value)}
                  placeholder="Spark-Companion"
                  className="bg-neutral-900/90 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {pushError && (
                <div className="md:col-span-12 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{pushError}</span>
                </div>
              )}

              {isPushing && (
                <div className="md:col-span-12 flex flex-col gap-1 py-1">
                  <div className="flex justify-between text-xs text-purple-300">
                    <span>{pushStatus}</span>
                    <span>{pushPercent}%</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${pushPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {pushResult && (
                <div className="md:col-span-12 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    <span>Project successfully pushed to GitHub! Actions build triggered.</span>
                  </div>
                  <a
                    href={pushResult.actionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                  >
                    <span>View Actions</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              <div className="md:col-span-12 flex justify-end">
                <button
                  type="submit"
                  disabled={isPushing}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isPushing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Pushing Project Files...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>Push to GitHub & Build APK</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-900 text-purple-300 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h3 className="font-semibold text-xs text-white">Push to GitHub</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Fork or clone the repository to your own GitHub account. Any push to <code>main</code> will trigger GitHub Actions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-900 text-purple-300 flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h3 className="font-semibold text-xs text-white">Automated Cloud Build</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                The workflow in <code>.github/workflows/build-apk.yml</code> sets up JDK 17, Gradle 8.5, and runs <code>gradle assembleDebug</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-900 text-purple-300 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h3 className="font-semibold text-xs text-white">Download Debug APK</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Click the completed workflow run under GitHub's <strong>Actions</strong> tab and download the <strong>Spark-Companion-Debug-APK</strong> artifact.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-900 text-purple-300 flex items-center justify-center font-bold text-xs">
                4
              </span>
              <h3 className="font-semibold text-xs text-white">Install on Android Phone</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Transfer the APK to your phone, grant Overlay and MediaProjection permissions, enter your Google AI Studio API key, and tap <strong>Save & Spawn Companion</strong>!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
            <div className="text-purple-400 font-bold mb-1"># GitHub Actions Workflow (.github/workflows/build-apk.yml)</div>
            <pre className="overflow-x-auto text-[10px] leading-relaxed">
{`name: Build Android APK
on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build Debug APK
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.5'
      - name: Build with Gradle
        run: gradle assembleDebug --stacktrace --no-daemon
      - name: Upload APK to Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: Spark-Companion-Debug-APK
          path: app/build/outputs/apk/debug/*.apk`}
            </pre>
          </div>
        </div>
      )}

      {/* Kotlin Source Tab */}
      {activeTab === 'source' && (
        <div className="bg-[#1E1E2E]/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCode size={18} className="text-purple-400" />
              <span>app/src/main/java/com/spark/companion/MainActivity.kt</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
              Kotlin / Jetpack Compose
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-96 overflow-y-auto">
            <pre className="leading-relaxed whitespace-pre-wrap">
{`package com.spark.companion

// 1. LAUNCHER ACTIVITY
class MainActivity : ComponentActivity() {
    private val PREFS_NAME = "CompanionPrefs"
    private val KEY_API_KEY = "gemini_api_key"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val savedKey = prefs.getString(KEY_API_KEY, "") ?: ""

        setContent {
            var apiKeyInput by remember { mutableStateOf(savedKey) }
            val deviceController = remember { DeviceController(this@MainActivity) }

            Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                Column(
                    modifier = Modifier.fillMaxSize().padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(text = "Spark Companion", style = MaterialTheme.typography.headlineMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "AI buddy powered by Google AI Studio", style = MaterialTheme.typography.bodyMedium)
                    
                    OutlinedTextField(
                        value = apiKeyInput,
                        onValueChange = { apiKeyInput = it },
                        label = { Text("Google AI Studio API Key") }
                    )

                    Button(onClick = {
                        prefs.edit().putString(KEY_API_KEY, apiKeyInput).apply()
                        CompanionBrainHolder.brain = CompanionBrain(apiKeyInput, deviceController)
                        launchCompanion()
                    }) {
                        Text("Save & Spawn Companion")
                    }
                }
            }
        }
    }
}

// 2. COMPANION BRAIN
class CompanionBrain(apiKey: String, private val deviceController: DeviceController) {
    private val model = GenerativeModel(
        modelName = "gemini-2.5-flash",
        apiKey = apiKey,
        systemInstruction = content {
            text("""
                You are Spark, an intelligent, playful desktop companion living on an Android device.
                Always prefix your response with an emotion tag: [HAPPY], [THINKING], [PROUD], [SURPRISED], or [SLEEPY].
                Hardware Actions: [ACTION: BATTERY], [ACTION: TORCH_ON], [ACTION: TORCH_OFF].
            """.trimIndent())
        }
    )
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
