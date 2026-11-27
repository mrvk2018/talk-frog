import { speakText as speakEnGb, spellOutText } from '@/utils/speech';

/** Озвучка шага: слово, буква или посимвольно (аббревиатуры, телефоны). */
export function playLessonAudio(textToSpeak: string, opts?: { forceSpellOut?: boolean }): void {
  const raw = textToSpeak.trim();
  if (!raw) return;

  const spell =
    opts?.forceSpellOut ||
    raw.includes(',') ||
    /^plus[\d,]/i.test(raw) ||
    (raw.includes('plus') && /\d/.test(raw));

  if (spell) {
    const compact = raw.replace(/\s+/g, '').replace(/,/g, '');
    spellOutText(compact);
    return;
  }
  speakEnGb(raw);
}