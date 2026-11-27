import { Platform } from 'react-native';

export const SPEECH_LOCALE_GB = 'en-GB';

let expoSpeech: typeof import('expo-speech') | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  expoSpeech = require('expo-speech') as typeof import('expo-speech');
} catch {
  expoSpeech = null;
}

function pickBritishVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'en-GB') ??
    voices.find((v) => v.lang.startsWith('en-GB')) ??
    voices.find((v) => v.lang.startsWith('en'))
  );
}

/** Озвучка с приоритетом en-GB (Web: speechSynthesis, native: expo-speech). */
export function speakText(text: string, options?: { rate?: number; language?: string }): void {
  const phrase = text.trim();
  if (!phrase) return;

  const lang = options?.language ?? SPEECH_LOCALE_GB;
  const rate = options?.rate ?? 0.92;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = lang;
    utterance.rate = rate;
    const voice = pickBritishVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    return;
  }

  if (expoSpeech) {
    expoSpeech.speak(phrase, { language: lang, rate });
    return;
  }
}

/** Посимвольное чтение (A-B-C, цифры телефона). */
export function spellOutText(text: string, options?: { rate?: number }): void {
  const raw = text.trim().toUpperCase();
  if (!raw) return;

  const parts = raw.split('').filter((ch) => /[A-Z0-9+ ]/.test(ch));
  const spelled = parts
    .map((ch) => {
      if (ch === '+') return 'plus';
      if (ch === ' ') return '';
      if (/\d/.test(ch)) return ch;
      return ch;
    })
    .filter(Boolean)
    .join(', ');

  speakText(spelled, { rate: options?.rate ?? 0.85 });
}

export const speech = {
  speakText,
  spellOutText,
};