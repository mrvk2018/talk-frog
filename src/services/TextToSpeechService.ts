import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export const textToSpeechService = {
  speakEnglish(phrase: string): void {
    if (!phrase.trim()) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
      return;
    }

    Speech.speak(phrase, { language: 'en-US', rate: 0.95 });
  },
};