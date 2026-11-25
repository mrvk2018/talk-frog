import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LessonMasteryLevel, ZeroLevelLesson } from '@/types/lesson';

const STORAGE_KEY = '@talkfrog/zero_level_progress_v1';

const DEFAULT_LESSONS: ZeroLevelLesson[] = [
  { id: 'z1', number: 1, title: 'ABC', masteryLevel: 'not_started', aiScorePercent: 0 },
  { id: 'z2', number: 2, title: '123', masteryLevel: 'not_started', aiScorePercent: 0 },
  { id: 'z3', number: 3, title: 'Hello?', masteryLevel: 'not_started', aiScorePercent: 0 },
  { id: 'z4', number: 4, title: 'My name.', masteryLevel: 'not_started', aiScorePercent: 0, isLockedForGuest: true },
  { id: 'z5', number: 5, title: 'I & U', masteryLevel: 'not_started', aiScorePercent: 0, isLockedForGuest: true },
  { id: 'z6', number: 6, title: 'Thanks', masteryLevel: 'not_started', aiScorePercent: 0, isLockedForGuest: true },
  { id: 'z7', number: 7, title: "I'm OK", masteryLevel: 'not_started', aiScorePercent: 0, isLockedForGuest: true },
  { id: 'z8', number: 8, title: "I'm 20", masteryLevel: 'not_started', aiScorePercent: 0, isLockedForGuest: true },
];

let lessons: ZeroLevelLesson[] = [...DEFAULT_LESSONS];
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export const SCORE_BY_MASTERY: Record<LessonMasteryLevel, number> = {
  not_started: 0,
  learning: 45,
  good: 78,
  mastered: 96,
};

export const lessonsProgressService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getLessons(): ZeroLevelLesson[] {
    return lessons.map((l) => ({ ...l }));
  },

  isHydrated(): boolean {
    return hydrated;
  },

  async hydrate(): Promise<ZeroLevelLesson[]> {
    if (hydrated) return this.getLessons();
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        lessons = JSON.parse(raw) as ZeroLevelLesson[];
      } else {
        lessons = [...DEFAULT_LESSONS];
      }
    } catch {
      lessons = [...DEFAULT_LESSONS];
    }
    hydrated = true;
    notify();
    return this.getLessons();
  },

  getLessonById(id: string): ZeroLevelLesson | undefined {
    return lessons.find((l) => l.id === id);
  },

  async updateMastery(
    lessonId: string,
    masteryLevel: LessonMasteryLevel,
    aiScorePercent?: number,
  ): Promise<ZeroLevelLesson | null> {
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx < 0) return null;
    const score = aiScorePercent ?? SCORE_BY_MASTERY[masteryLevel];
    lessons[idx] = { ...lessons[idx], masteryLevel, aiScorePercent: score };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
    notify();
    return { ...lessons[idx] };
  },

  async resetAll(): Promise<void> {
    lessons = [...DEFAULT_LESSONS];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
    notify();
  },
};