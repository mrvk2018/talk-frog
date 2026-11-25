import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { authService } from '@/services/AuthService';
import type { LessonMasteryLevel, ZeroLevelLesson } from '@/types/lesson';
import type { DbLessonProgress } from '@/types/database';

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

function mergeRemoteProgress(rows: DbLessonProgress[]): void {
  for (const row of rows) {
    const idx = lessons.findIndex((l) => l.id === row.lesson_id);
    if (idx >= 0) {
      lessons[idx] = {
        ...lessons[idx],
        masteryLevel: row.mastery_level,
        aiScorePercent: row.ai_score_percent,
      };
    }
  }
}

async function pullFromSupabase(userId: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  const { data, error } = await supabase.from('lesson_progress').select('*').eq('user_id', userId);
  if (error || !data?.length) return;
  mergeRemoteProgress(data as DbLessonProgress[]);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
}

async function pushToSupabase(
  userId: string,
  lessonId: string,
  masteryLevel: LessonMasteryLevel,
  aiScorePercent: number,
): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  await supabase.from('lesson_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      mastery_level: masteryLevel,
      ai_score_percent: aiScorePercent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id' },
  );
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
      lessons = raw ? (JSON.parse(raw) as ZeroLevelLesson[]) : [...DEFAULT_LESSONS];
    } catch {
      lessons = [...DEFAULT_LESSONS];
    }

    await authService.hydrate();
    const userId = authService.getRemoteUserId();
    if (userId) {
      await pullFromSupabase(userId);
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

    const userId = authService.getRemoteUserId();
    if (userId) {
      await pushToSupabase(userId, lessonId, masteryLevel, score);
    }

    notify();
    return { ...lessons[idx] };
  },

  async resetAll(): Promise<void> {
    lessons = [...DEFAULT_LESSONS];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
    notify();
  },
};