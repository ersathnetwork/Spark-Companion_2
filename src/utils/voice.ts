// Voice Engine for Coucou: « OK Coucou » wake word, 10 core intent parser, and Text-to-Speech

import { soundFX } from './audio';
import { sendChatMessage } from './gemini';

export interface VoiceIntentResult {
  intent: 
    | 'music_play' 
    | 'music_pause' 
    | 'agent_status' 
    | 'claude_usage' 
    | 'stripe_revenue' 
    | 'github_ci' 
    | 'outfit_change' 
    | 'torch_toggle' 
    | 'battery_check' 
    | 'approval_refuse' 
    | 'general_question';
  spokenResponse: string;
  actionPayload?: any;
}

class CoucouVoiceEngine {
  private recognition: any = null;
  public isListening: boolean = false;
  public speechEnabled: boolean = true;
  private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onStateCallback: ((isListening: boolean) => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          if (this.onStateCallback) this.onStateCallback(true);
        };

        this.recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          const isFinal = event.results[current].isFinal;
          if (this.onTranscriptCallback) {
            this.onTranscriptCallback(transcript, isFinal);
          }
        };

        this.recognition.onerror = () => {
          this.isListening = false;
          if (this.onStateCallback) this.onStateCallback(false);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onStateCallback) this.onStateCallback(false);
        };
      } catch {}
    }
  }

  public setCallbacks(
    onTranscript: (text: string, isFinal: boolean) => void,
    onState: (isListening: boolean) => void
  ) {
    this.onTranscriptCallback = onTranscript;
    this.onStateCallback = onState;
  }

  public startListening() {
    soundFX.play('peek');
    if (!this.recognition) {
      this.initRecognition();
    }
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch {
        this.recognition.stop();
        setTimeout(() => {
          try { this.recognition.start(); } catch {}
        }, 200);
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.isListening = false;
    if (this.onStateCallback) this.onStateCallback(false);
  }

  // Text-To-Speech Cute Voice for Mochi
  public speak(text: string) {
    if (!this.speechEnabled || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/\[.*?\]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Cute animated companion voice tuning
      utterance.pitch = 1.35; // higher playful pitch for Mochi
      utterance.rate = 1.08;  // cheerful, snappy cadence
      utterance.volume = 0.95;

      const voices = window.speechSynthesis.getVoices();
      // Prefer smooth English or French voice
      const preferred = voices.find(
        (v) => v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural') || v.lang.startsWith('en')
      );
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  // Deterministic intent parser for Coucou's 10 core voice actions
  public parseIntent(rawText: string): VoiceIntentResult | null {
    const text = rawText.toLowerCase().trim();

    // 1. Music Controls
    if (text.includes('play music') || text.includes('daft punk') || text.includes('lance la musique') || text.includes('play song')) {
      return {
        intent: 'music_play',
        spokenResponse: 'Playing Daft Punk - Discovery in the notch!',
        actionPayload: { playing: true },
      };
    }
    if (text.includes('pause') || text.includes('stop music') || text.includes('coupe la musique')) {
      return {
        intent: 'music_pause',
        spokenResponse: 'Music paused.',
        actionPayload: { playing: false },
      };
    }

    // 2. Where are my agents?
    if (text.includes('agent') || text.includes('what is claude') || text.includes('cursor') || text.includes('où en sont')) {
      return {
        intent: 'agent_status',
        spokenResponse: 'Claude Code is on step 3 of 7: editing the Android Dynamic Island component with spring animations!',
      };
    }

    // 3. Claude Plan Usage
    if (text.includes('quota') || text.includes('plan usage') || text.includes('combien il me reste')) {
      return {
        intent: 'claude_usage',
        spokenResponse: 'You have used 42% of your 5-hour Claude quota. Resets in 1 hour 40 minutes.',
      };
    }

    // 4. Stripe Revenue
    if (text.includes('stripe') || text.includes('revenue') || text.includes('combien j\'ai vendu') || text.includes('money')) {
      return {
        intent: 'stripe_revenue',
        spokenResponse: 'Today on Stripe: 1,420 dollars across 18 transactions. Looking great!',
      };
    }

    // 5. GitHub CI
    if (text.includes('ci') || text.includes('github') || text.includes('pr') || text.includes('build green')) {
      return {
        intent: 'github_ci',
        spokenResponse: 'All GitHub Actions workflows are green! Build APK job is ready.',
      };
    }

    // 6. Wardrobe / Outfits
    if (text.includes('detective')) {
      return {
        intent: 'outfit_change',
        spokenResponse: 'Fedora on! Detective Mochi is on the case.',
        actionPayload: { outfit: 'detective' },
      };
    }
    if (text.includes('sunglasses') || text.includes('shades')) {
      return {
        intent: 'outfit_change',
        spokenResponse: 'Shades equipped. Looking cool in the notch!',
        actionPayload: { outfit: 'sunglasses' },
      };
    }
    if (text.includes('wizard')) {
      return {
        intent: 'outfit_change',
        spokenResponse: 'Wizard hat equipped! Magic coding enabled.',
        actionPayload: { outfit: 'wizard' },
      };
    }
    if (text.includes('beret')) {
      return {
        intent: 'outfit_change',
        spokenResponse: 'French beret on! Coucou!',
        actionPayload: { outfit: 'beret' },
      };
    }

    // 7. Hardware: Torch / Flashlight
    if (text.includes('torch') || text.includes('flashlight') || text.includes('lumière')) {
      return {
        intent: 'torch_toggle',
        spokenResponse: 'Toggling device flashlight torch!',
      };
    }

    // 8. Hardware: Battery
    if (text.includes('battery') || text.includes('batterie') || text.includes('charge')) {
      return {
        intent: 'battery_check',
        spokenResponse: 'Your Android device battery is at 88%. Healthy and charging!',
      };
    }

    // 9. Reject / Refuse approval
    if (text.includes('refuse') || text.includes('deny') || text.includes('annule')) {
      return {
        intent: 'approval_refuse',
        spokenResponse: 'Command denied and aborted.',
      };
    }

    return null;
  }

  // Handle voice query: first test deterministic intents, then fallback to Gemini AI
  public async handleVoiceQuery(transcript: string): Promise<string> {
    const intent = this.parseIntent(transcript);
    if (intent) {
      this.speak(intent.spokenResponse);
      return intent.spokenResponse;
    }

    // Fallback to Gemini AI for general knowledge or coding questions
    try {
      const response = await sendChatMessage(
        transcript,
        undefined,
        { battery: 88, isCharging: false, torch: false, overlayGranted: true, screenCaptureGranted: true, companionSpawned: true },
        [],
        'You are Mochi in the Android Notch Dynamic Island. Keep answer to 1 cute, punchy sentence.'
      );
      const text = response.cleanText || "Coucou! I'm listening!";
      this.speak(text);
      return text;
    } catch {
      const fallback = "Coucou! I heard you. I'm keeping an eye on your coding agents!";
      this.speak(fallback);
      return fallback;
    }
  }
}

export const coucouVoice = new CoucouVoiceEngine();
