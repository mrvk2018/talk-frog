import { speakText } from '@/utils/speech';

/** @deprecated используйте speakText / spellOutText из @/utils/speech */
export const textToSpeechService = {
  speakEnglish(phrase: string): void {
    speakText(phrase);
  },
};