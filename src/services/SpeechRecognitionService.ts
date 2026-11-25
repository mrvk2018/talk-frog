import { Platform } from 'react-native';
import type { SpeechRecognitionStatus } from '@/types/speech';

type Listener = (status: SpeechRecognitionStatus, message?: string) => void;

let status: SpeechRecognitionStatus = 'idle';
let lastError = '';
const listeners = new Set<Listener>();
let webRecognition: import('@/types/speech').WebSpeechRecognition | null = null;

function setStatus(next: SpeechRecognitionStatus, message?: string) {
  status = next;
  if (message) lastError = message;
  listeners.forEach((fn) => fn(next, message));
}

export const speechRecognitionService = {
  getStatus(): SpeechRecognitionStatus {
    return status;
  },

  getLastError(): string {
    return lastError;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  isSupported(): boolean {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    return false;
  },

  async startListening(onText: (text: string) => void): Promise<void> {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      setStatus(
        'error',
        'Нативное распознавание будет в dev-client. Пока введите фразу текстом.',
      );
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setStatus('error', 'Браузер не поддерживает SpeechRecognition. Используйте Chrome или Safari.');
      return;
    }

    try {
      webRecognition?.abort();
    } catch {
      // noop
    }

    const recognition = new SpeechRecognitionCtor();
    webRecognition = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? '';
      setStatus('processing');
      onText(transcript);
      setStatus('idle');
    };

    recognition.onerror = (event) => {
      const code = event.error;
      const map: Record<string, string> = {
        'not-allowed': 'Доступ к микрофону запрещён. Разрешите микрофон в настройках браузера.',
        'no-speech': 'Речь не распознана. Попробуйте ещё раз.',
        'network': 'Ошибка сети при распознавании речи.',
        aborted: 'Запись прервана.',
      };
      setStatus('error', map[code] ?? 'Ошибка распознавания речи.');
    };

    recognition.onend = () => {
      if (status === 'listening') setStatus('idle');
    };

    setStatus('listening');
    recognition.start();
  },

  stopListening(): void {
    try {
      webRecognition?.stop();
    } catch {
      // noop
    }
    setStatus('idle');
  },
};