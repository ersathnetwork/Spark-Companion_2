export type SparkEmote = 'HAPPY' | 'THINKING' | 'SURPRISED' | 'PROUD' | 'CONFUSED' | 'SLEEPY';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'spark' | 'system';
  text: string;
  emote?: SparkEmote;
  timestamp: number;
  screenImage?: string;
  actionsPerformed?: {
    battery?: boolean;
    torchOn?: boolean;
    torchOff?: boolean;
  };
}

export interface DeviceState {
  battery: number;
  isCharging: boolean;
  torch: boolean;
  overlayGranted: boolean;
  screenCaptureGranted: boolean;
  companionSpawned: boolean;
}

export interface CompanionSettings {
  apiKey: string;
  soundEnabled: boolean;
  autoEyeBlink: boolean;
  avatarScale: number;
  voiceFeedback: boolean;
  selectedColorTheme: 'classic' | 'cyberpunk' | 'pastel';
}

export type SimulatorAppId = 'browser' | 'code' | 'social' | 'device';
