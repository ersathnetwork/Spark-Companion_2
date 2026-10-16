export type SparkEmote = 'HAPPY' | 'THINKING' | 'SURPRISED' | 'PROUD' | 'CONFUSED' | 'SLEEPY';

export type CharacterShape = 'mochi' | 'galet' | 'lueur';

export type CharacterState = 
  | 'idle' 
  | 'working' 
  | 'finished' 
  | 'error' 
  | 'dizzy' 
  | 'thinking' 
  | 'searching' 
  | 'approval' 
  | 'question' 
  | 'ratelimit' 
  | 'sleeping';

export type CharacterEmote = 
  | 'love' 
  | 'surprised' 
  | 'proud' 
  | 'wink' 
  | 'yawn' 
  | 'happy' 
  | 'annoyed';

export type OutfitId = 'none' | 'detective' | 'beret' | 'party' | 'sunglasses' | 'wizard' | 'winter';

export type AgentType = 'claude' | 'cursor' | 'codex' | 'gemini' | 'antigravity' | 'ollama';

export type ActivePill = 'agent' | 'claude-usage' | 'codex-usage' | 'music' | 'github' | 'stripe' | 'vercel';

export interface ApprovalRequest {
  id: string;
  agent: AgentType;
  title: string;
  command: string;
  path: string;
  diff?: string;
  fingerprint: string;
  status: 'pending' | 'approved' | 'denied';
  timestamp: number;
}

export interface AgentStep {
  text: string;
  code?: string;
  icon?: string;
  status: 'done' | 'active' | 'pending';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'spark' | 'coucou' | 'system';
  text: string;
  emote?: SparkEmote | CharacterEmote;
  timestamp: number;
  screenImage?: string;
  agentContext?: string;
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
export type CoucouViewMode = 'android' | 'macbook' | 'iphone';
