import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { DEFAULT_LESSON3_CONTENT } from '@/data/lesson3DefaultContent';
import type { Lesson3StructuredContent } from '@/types/lessonStructured';

const CACHE_KEY = '@talkfrog/lesson_structured_v1';

const defaults: Record<string, Lesson3StructuredContent> = {
  z3: DEFAULT_LESSON3_CONTENT,
};

let cache: Record<string, Lesson3StructuredContent> = { ...defaults };
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function parseLesson3(raw: unknown): Lesson3StructuredContent | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Lesson3StructuredContent;
  if (c.lessonId !== 'z3' || !Array.isArray(c.phrases)) return null;
  return c;
}

export const lessonStructuredContentService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getLesson3(): Lesson3StructuredContent {
    return cache.z3 ?? DEFAULT_LESSON3_CONTENT;
  },

  getDefaultLesson3(): Lesson3StructuredContent {
    return DEFAULT_LESSON3_CONTENT;
  },

  async hydrate(): Promise<void> {
    if (hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, Lesson3StructuredContent>;
        cache = { ...defaults, ...parsed };
      }
    } catch {
      cache = { ...defaults };
    }

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('lesson_structured_content')
        .select('lesson_id, content')
        .eq('lesson_id', 'z3')
        .maybeSingle();

      if (!error && data?.content) {
        const parsed = parseLesson3(data.content);
        if (parsed) {
          cache.z3 = parsed;
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        }
      }
    }

    hydrated = true;
    notify();
  },

  async refreshFromCloud(): Promise<void> {
    hydrated = false;
    await this.hydrate();
  },

  async saveLesson3ToCloud(
    content: Lesson3StructuredContent,
    adminLogin: string,
  ): Promise<{ ok: boolean; error?: string }> {
    cache.z3 = content;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    notify();

    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured) {
      return { ok: true, error: 'Сохранено локально (Supabase не настроен)' };
    }

    const { data, error } = await supabase.rpc('save_lesson_structured_content', {
      p_admin_login: adminLogin,
      p_lesson_id: 'z3',
      p_content: content,
    });

    if (error) return { ok: false, error: error.message };
    if (data !== true) return { ok: false, error: 'Нет прав администратора для записи' };
    return { ok: true };
  },
};