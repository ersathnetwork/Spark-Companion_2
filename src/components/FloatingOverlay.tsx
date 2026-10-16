import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'motion/react';
import { SparkEmote, DeviceState } from '../types';
import { CompanionAvatar } from './CompanionAvatar';
import { 
  Camera, 
  Send, 
  Battery, 
  Flashlight, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Mic, 
  Sparkles,
  X,
  Maximize2,
  RefreshCw,
  HelpCircle,
  FileCode,
  Globe
} from 'lucide-react';
import { soundFX } from '../utils/audio';

interface FloatingOverlayProps {
  emote: SparkEmote;
  speechText: string;
  isProcessing: boolean;
  deviceState: DeviceState;
  onSendMessage: (text: string) => Promise<void>;
  onReadScreen: () => Promise<void>;
  onToggleTorch: () => void;
  onQueryBattery: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onEmoteChange?: (emote: SparkEmote) => void;
}

export const FloatingOverlay: React.FC<FloatingOverlayProps> = ({
  emote,
  speechText,
  isProcessing,
  deviceState,
  onSendMessage,
  onReadScreen,
  onToggleTorch,
  onQueryBattery,
  soundEnabled,
  onToggleSound,
}) => {
  const [showBubble, setShowBubble] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Position state (persists during dragging)
  const [position, setPosition] = useState({ x: 40, y: 120 });

  const handleAvatarClick = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setShowBubble(true);
      return;
    }
    setShowBubble((prev) => !prev);
    if (soundEnabled) {
      soundFX.playPop();
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isProcessing) return;

    setInputText('');
    if (soundEnabled) soundFX.playPop();
    try {
      await onSendMessage(text);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleReadScreenClick = async () => {
    if (isProcessing) return;
    try {
      await onReadScreen();
    } catch (err) {
      console.error('Failed to read screen:', err);
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isProcessing) return;
    if (soundEnabled) soundFX.playPop();
    try {
      await onSendMessage(prompt);
    } catch (err) {
      console.error('Failed to send quick prompt:', err);
    }
  };

  // Web Speech API Voice Recognition (Client side if supported)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      if (soundEnabled) soundFX.playPop();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        onSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: position.x, y: position.y }}
      onDragEnd={(_e, info) => {
        setPosition((prev) => ({
          x: prev.x + info.offset.x,
          y: prev.y + info.offset.y,
        }));
      }}
      className="fixed z-50 flex items-start gap-3 select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Spark Companion Avatar */}
      <div className="relative group">
        <CompanionAvatar
          emote={emote}
          onClick={handleAvatarClick}
          size={isMinimized ? 56 : 76}
          soundEnabled={soundEnabled}
        />

        {/* Drag handle tooltip indicator */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-neutral-900/90 text-neutral-300 text-[10px] px-2 py-0.5 rounded-full border border-neutral-700 whitespace-nowrap backdrop-blur-md">
          Drag to move
        </div>

        {/* Active Torch Glow Indicator */}
        {deviceState.torch && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-neutral-950 animate-pulse shadow-[0_0_12px_#f59e0b]" />
        )}
      </div>

      {/* Floating Speech Bubble (Surface: 0xFF1E1E2E) */}
      {showBubble && !isMinimized && (
        <motion.div
          ref={bubbleRef}
          initial={{ opacity: 0, scale: 0.9, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: -10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-80 sm:w-96 rounded-2xl bg-[#1E1E2E] border border-neutral-700/80 shadow-2xl text-white p-3.5 backdrop-blur-xl relative flex flex-col gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-xs tracking-wide uppercase text-neutral-300 flex items-center gap-1.5">
                Spark Companion
                <span className="text-[10px] font-mono lowercase px-1.5 py-0.2 rounded bg-neutral-800/90 text-purple-300 border border-neutral-700">
                  [{emote}]
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleSound}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Minimize avatar"
              >
                <Minimize2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setShowBubble(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Hide speech bubble"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Dialogue Speech Content */}
          <div className="min-h-[56px] max-h-48 overflow-y-auto px-1 text-sm text-neutral-200 leading-relaxed font-sans pr-1">
            {isProcessing ? (
              <div className="flex items-center gap-2.5 text-neutral-400 text-xs py-2">
                <RefreshCw size={14} className="animate-spin text-purple-400" />
                <span>Spark is observing & analyzing...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{speechText}</div>
            )}
          </div>

          {/* Quick Action Buttons (Original Screen Vision & Hardware Calls) */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleReadScreenClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera size={13} />
              <span>Read Screen</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onToggleTorch}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                deviceState.torch
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-neutral-800/80 hover:bg-neutral-700/80 border-neutral-700 text-neutral-300'
              }`}
              title="Toggle hardware flashlight"
            >
              <Flashlight size={12} className={deviceState.torch ? 'text-amber-400' : ''} />
              <span>{deviceState.torch ? 'Torch ON' : 'Torch'}</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onQueryBattery}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 text-neutral-300 text-xs font-medium transition-all"
              title="Check battery level"
            >
              <Battery size={12} className={deviceState.battery < 20 ? 'text-rose-400' : 'text-emerald-400'} />
              <span>{deviceState.battery}%</span>
            </button>
          </div>

          {/* Text & Voice Input Form */}
          <form onSubmit={handleSend} className="relative flex items-center gap-1.5 pt-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Spark or request action..."
              disabled={isProcessing}
              className="w-full bg-neutral-900/90 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />

            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
              title="Speak with Voice"
            >
              <Mic size={14} />
            </button>

            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white shadow-sm transition-all"
              title="Send to Spark"
            >
              <Send size={14} />
            </button>
          </form>

          {/* Quick Prompts Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px] text-neutral-400">
            <button
              type="button"
              onClick={() => handleQuickPrompt('What do you think of what is currently on the screen?')}
              className="px-2 py-0.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 whitespace-nowrap transition-colors"
            >
              💡 "What do you think?"
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('Check my battery status and give me advice.')}
              className="px-2 py-0.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 whitespace-nowrap transition-colors"
            >
              ⚡ "Check battery"
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('Turn on the flashlight')}
              className="px-2 py-0.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 whitespace-nowrap transition-colors"
            >
              🔦 "Turn on torch"
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
