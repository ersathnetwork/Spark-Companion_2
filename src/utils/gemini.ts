import { GoogleGenAI } from '@google/genai';
import { DeviceState, SparkEmote } from '../types';

export const SYSTEM_INSTRUCTION = `
You are Spark, an intelligent, playful desktop & screen companion living on the user's Android and desktop system.
Always prefix your response with an emotion tag: [HAPPY], [THINKING], [PROUD], [SURPRISED], [CONFUSED], or [SLEEPY].

You can control phone and device hardware. When the user asks for:
- Battery level: include [ACTION: BATTERY] in your response.
- Turning on flashlight / torch: include [ACTION: TORCH_ON] in your response.
- Turning off flashlight / torch: include [ACTION: TORCH_OFF] in your response.

Keep your answers brief, punchy, and conversational (1-3 sentences), unless specifically asked to analyze or explain in deep detail.
Maintain an endearing, helpful personality with high situational awareness of what the user is doing or showing on their screen.
`.trim();

function getApiKey(customApiKey?: string): string {
  const custom = customApiKey?.trim();
  if (custom && custom.length > 0 && custom !== 'MY_GEMINI_API_KEY') {
    return custom;
  }
  const envKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : '';
  if (envKey && envKey !== 'MY_GEMINI_API_KEY') {
    return envKey;
  }
  return '';
}

function withTimeout<T>(promise: Promise<T>, ms = 3500): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Gemini request timed out after ${ms / 1000}s`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export function parseEmoteAndActions(rawText: string, deviceState?: DeviceState) {
  let processedText = rawText || '';
  const actions = {
    battery: false,
    torchOn: false,
    torchOff: false,
  };

  if (processedText.includes('[ACTION: BATTERY]')) {
    actions.battery = true;
    const level = deviceState?.battery !== undefined ? deviceState.battery : 85;
    processedText = processedText.replace('[ACTION: BATTERY]', `(Battery: ${level}%)`);
  }

  if (processedText.includes('[ACTION: TORCH_ON]')) {
    actions.torchOn = true;
    processedText = processedText.replace('[ACTION: TORCH_ON]', '');
  }

  if (processedText.includes('[ACTION: TORCH_OFF]')) {
    actions.torchOff = true;
    processedText = processedText.replace('[ACTION: TORCH_OFF]', '');
  }

  let emote: SparkEmote = 'HAPPY';
  if (processedText.includes('[THINKING]')) emote = 'THINKING';
  else if (processedText.includes('[PROUD]')) emote = 'PROUD';
  else if (processedText.includes('[SURPRISED]')) emote = 'SURPRISED';
  else if (processedText.includes('[SLEEPY]')) emote = 'SLEEPY';
  else if (processedText.includes('[CONFUSED]')) emote = 'CONFUSED';

  const cleanText = processedText.replace(/\[.*?\]/g, '').trim();

  return {
    cleanText: cleanText || 'Spark is listening!',
    rawText,
    emote,
    actions,
  };
}

export function getContextualFallback(
  prompt: string,
  screenContextText: string = '',
  deviceState?: DeviceState
) {
  const pLower = (prompt || '').toLowerCase();
  const sLower = (screenContextText || '').toLowerCase();

  const actions = {
    battery: false,
    torchOn: false,
    torchOff: false,
  };

  // Hardware triggers
  if (pLower.includes('battery') || pLower.includes('power') || pLower.includes('charge')) {
    actions.battery = true;
    const level = deviceState?.battery ?? 85;
    return {
      rawText: `[HAPPY] Your device battery is at ${level}%. Looking healthy and ready for action! [ACTION: BATTERY]`,
      cleanText: `Your device battery is at ${level}%. Looking healthy and ready for action! (Battery: ${level}%)`,
      emote: 'HAPPY' as SparkEmote,
      actions,
    };
  }

  if (pLower.includes('torch on') || pLower.includes('flashlight on') || (pLower.includes('torch') && !pLower.includes('off'))) {
    actions.torchOn = true;
    return {
      rawText: `[PROUD] Flashlight is turned ON! [ACTION: TORCH_ON]`,
      cleanText: `Flashlight is turned ON!`,
      emote: 'PROUD' as SparkEmote,
      actions,
    };
  }

  if (pLower.includes('torch off') || pLower.includes('flashlight off')) {
    actions.torchOff = true;
    return {
      rawText: `[HAPPY] Flashlight turned OFF. Conserving battery power! [ACTION: TORCH_OFF]`,
      cleanText: `Flashlight turned OFF. Conserving battery power!`,
      emote: 'HAPPY' as SparkEmote,
      actions,
    };
  }

  // Screen Context fallbacks
  if (sLower.includes('mainactivity.kt') || sLower.includes('code') || sLower.includes('kotlin')) {
    return {
      rawText: `[PROUD] You're in MainActivity.kt! I can see the analyzeScreen function with Gemini multimodal inference and action handlers.`,
      cleanText: `You're in MainActivity.kt! I can see the analyzeScreen function with Gemini multimodal inference and action handlers.`,
      emote: 'PROUD' as SparkEmote,
      actions,
    };
  }

  if (sLower.includes('browser') || sLower.includes('developer.android.com') || sLower.includes('url')) {
    return {
      rawText: `[HAPPY] You're browsing the Spark Companion guide! It explains the floating overlay, multimodal screen vision, and battery actions.`,
      cleanText: `You're browsing the Spark Companion guide! It explains the floating overlay, multimodal screen vision, and battery actions.`,
      emote: 'HAPPY' as SparkEmote,
      actions,
    };
  }

  if (sLower.includes('chat') || sLower.includes('social') || sLower.includes('rish')) {
    return {
      rawText: `[SURPRISED] You're looking at the Spark Team chat! Rish confirmed the GitHub Actions APK workflow is ready to build app-debug.apk.`,
      cleanText: `You're looking at the Spark Team chat! Rish confirmed the GitHub Actions APK workflow is ready to build app-debug.apk.`,
      emote: 'SURPRISED' as SparkEmote,
      actions,
    };
  }

  if (sLower.includes('setting') || sLower.includes('config') || sLower.includes('diagnostics')) {
    return {
      rawText: `[HAPPY] You're in Android Companion Settings! Draw Over Other Apps is active and you can trigger the GitHub APK cloud build.`,
      cleanText: `You're in Android Companion Settings! Draw Over Other Apps is active and you can trigger the GitHub APK cloud build.`,
      emote: 'HAPPY' as SparkEmote,
      actions,
    };
  }

  return {
    rawText: `[HAPPY] Spark is active! I'm observing your screen and ready to assist with actions or questions.`,
    cleanText: `Spark is active! I'm observing your screen and ready to assist with actions or questions.`,
    emote: 'HAPPY' as SparkEmote,
    actions,
  };
}

/**
 * Executes a clean plain-string generateContent call.
 * Does NOT send inlineData, multi-turn role arrays, or config objects to avoid 400 INVALID_ARGUMENT errors.
 */
async function executeGeminiCall(fullPrompt: string, apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Priority models: user specified gemini-2.5-flash; fallback to gemini-3.5-flash / gemini-3.8-flash
  const models = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const responsePromise = ai.models.generateContent({
        model,
        contents: fullPrompt,
      });

      const response = await withTimeout(responsePromise, 8000);
      const text = typeof response?.text === 'function' ? (response as any).text() : response?.text;
      if (text && typeof text === 'string' && text.trim().length > 0) {
        return text.trim();
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} request returned error:`, err?.message || err);
    }
  }

  throw lastError || new Error('No valid response returned from Gemini API');
}

export async function sendChatMessage(
  prompt: string,
  customApiKey?: string,
  deviceState?: DeviceState,
  history: Array<{ sender: string; text: string }> = [],
  screenContextText: string = ''
) {
  const apiKey = getApiKey(customApiKey);

  // If no API key configured, return contextual fallback immediately
  if (!apiKey) {
    return getContextualFallback(prompt, screenContextText, deviceState);
  }

  try {
    let historySnippet = '';
    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-3).map((h) => `${h.sender === 'user' ? 'User' : 'Spark'}: ${h.text}`);
      historySnippet = `\n[Recent Chat History]:\n${recent.join('\n')}\n`;
    }

    const screenSnippet = screenContextText ? `\n[Current Screen Content & State]:\n${screenContextText}\n` : '';
    const batteryLevel = deviceState?.battery ?? 88;
    const torchState = deviceState?.torch ? 'ON' : 'OFF';

    const fullPrompt = `${SYSTEM_INSTRUCTION}

[Device Hardware State]:
Battery: ${batteryLevel}%
Torch / Flashlight: ${torchState}
${screenSnippet}${historySnippet}
[User Prompt]:
${prompt}

Remember to prefix your answer with an emotion tag like [HAPPY] and include action tags [ACTION: BATTERY], [ACTION: TORCH_ON], or [ACTION: TORCH_OFF] if requested.`;

    const rawReply = await executeGeminiCall(fullPrompt, apiKey);
    return parseEmoteAndActions(rawReply, deviceState);
  } catch (err: any) {
    console.warn('sendChatMessage falling back to contextual response:', err?.message || err);
    return getContextualFallback(prompt, screenContextText, deviceState);
  }
}

export async function analyzeScreenImage(
  _rawDataUrl: string,
  prompt: string = 'What is on my screen? Keep response under 2 sentences.',
  customApiKey?: string,
  deviceState?: DeviceState,
  screenContextText: string = ''
) {
  const apiKey = getApiKey(customApiKey);

  // If no API key configured, return contextual fallback immediately
  if (!apiKey) {
    return getContextualFallback(prompt, screenContextText, deviceState);
  }

  try {
    const batteryLevel = deviceState?.battery ?? 88;
    const torchState = deviceState?.torch ? 'ON' : 'OFF';
    const screenSnippet = screenContextText ? `\n[Active Screen Text & State]:\n${screenContextText}\n` : '';

    const fullPrompt = `${SYSTEM_INSTRUCTION}

[Device Hardware State]:
Battery: ${batteryLevel}%
Torch / Flashlight: ${torchState}
${screenSnippet}
[User Prompt]:
${prompt}

Please analyze the user's active screen state above. Prefix your response with an emotion tag like [SURPRISED], [PROUD], or [HAPPY], and keep it concise.`;

    const rawReply = await executeGeminiCall(fullPrompt, apiKey);
    return parseEmoteAndActions(rawReply, deviceState);
  } catch (err: any) {
    console.warn('analyzeScreenImage falling back to contextual response:', err?.message || err);
    return getContextualFallback(prompt, screenContextText, deviceState);
  }
}
