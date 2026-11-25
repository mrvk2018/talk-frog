import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import type { AppSettingKey, AppSettingsMap, LessonContentItem } from '@/types/appSettings';

const CACHE_KEY = '@talkfrog/app_settings_cache_v2';

export const DEFAULT_AI_PROMPT = `You are TalkFrog AI Teacher for absolute beginners, co-created by Eli and Vlad.
Rules: explain in clear Russian; model English phrases must be grammatically flawless (C1–C2).
Encourage short spoken answers, praise effort, correct pronunciation gently.
Follow the zero-level sequence: letters, numbers, greetings, identity, gratitude, wellbeing, age.`;

export const DEFAULT_ZERO_README = `Как проходить «Нулевой уровень» (Эли и Влад)

1. Выберите кувшинку-урок сверху вниз, но в своём темпе.
2. Проговаривайте вслух — TalkFrog слушает микрофон и помогает с произношением.
3. Цвет листа показывает, насколько материал усвоен: от голубого «старт» до насыщенного зелёного «отлично».
4. Гости проходят первые уроки с лимитами; полный доступ — в тарифах.

Главное — короткие сессии и радость от маленьких побед. Мы рядом!`;

export const DEFAULT_LESSONS_CONTENT: LessonContentItem[] = [
  {
    id: 'z1',
    number: 1,
    title: 'ABC',
    targetPhrases: ['A', 'B', 'C', 'A-B-C'],
    phoneticHint: 'Эй — Bi — Si (чётко, коротко)',
    methodologyNoteRu: 'Эли и Влад: проговариваем буквы без русского «э» на конце — чистый английский звук.',
  },
  {
    id: 'z2',
    number: 2,
    title: '123',
    targetPhrases: ['One', 'Two', 'Three', 'One, two, three'],
    phoneticHint: 'Уан — Ту — Сри',
    methodologyNoteRu: 'Считаем от одного до трёх вслух три раза подряд, как ритм.',
  },
  {
    id: 'z3',
    number: 3,
    title: 'Hello?',
    targetPhrases: ['Hello!', 'Hello?', 'Hi!'],
    phoneticHint: 'Хэ-лоу (мягкое «хэ»)',
    methodologyNoteRu: 'Вопросительная интонация вверх в конце: Hello?',
  },
  {
    id: 'z4',
    number: 4,
    title: 'My name.',
    targetPhrases: ['My name is…', 'Nice to meet you.'],
    phoneticHint: 'Май нейм из…',
    methodologyNoteRu: 'Сначала имя, потем вежливая фраза Nice to meet you — обычно вместе.',
  },
  {
    id: 'z5',
    number: 5,
    title: 'I & U',
    targetPhrases: ['I am fine.', 'You are great.', 'I and you'],
    phoneticHint: 'Ай эм файн / Ю ар грейт',
    methodologyNoteRu: 'Различаем I (я) и you (ты/вы) — короткие, уверенные ударения.',
  },
  {
    id: 'z6',
    number: 6,
    title: 'Thanks',
    targetPhrases: ['Thank you.', 'Thanks!', 'Thanks a lot.'],
    phoneticHint: 'Сэнк ю / Сэнкс',
    methodologyNoteRu: 'Благодарность всегда с улышкой — тренируем тёплый тон.',
  },
  {
    id: 'z7',
    number: 7,
    title: "I'm OK",
    targetPhrases: ["I'm OK.", "I'm fine.", "I'm good."],
    phoneticHint: 'Айм ОуКей / Айм файн',
    methodologyNoteRu: 'Связка I\'m = I am — произносим слитно, без паузы.',
  },
  {
    id: 'z8',
    number: 8,
    title: "I'm 20",
    targetPhrases: ["I'm twenty.", "I am twenty years old."],
    phoneticHint: 'Твэн-ти (ударение на первый слог)',
    methodologyNoteRu: 'Число + возраст: сначала I\'m twenty, затем полная форма для закрепления.',
  },
];

function defaultMap(): AppSettingsMap {
  return {
    ai_teacher_system_prompt: DEFAULT_AI_PROMPT,
    levenshtein_pass_threshold: '75',
    home_announcement_text:
      'Открыт набор на нулевой поток: первые 8 уроков бесплатно для гостей с лимитами.',
    home_announcement_active: 'true',
    welcome_video_url: '',
    zero_level_readme_text: DEFAULT_ZERO_README,
    lessons_content_json: JSON.stringify(DEFAULT_LESSONS_CONTENT),
  };
}

let settings: AppSettingsMap = defaultMap();
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export const appSettingsService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): AppSettingsMap {
    return { ...settings };
  },

  get(key: AppSettingKey): string {
    return settings[key] ?? defaultMap()[key];
  },

  getThresholdPercent(): number {
    const n = Number(settings.levenshtein_pass_threshold);
    if (Number.isNaN(n)) return 75;
    return Math.min(100, Math.max(50, Math.round(n)));
  },

  isAnnouncementActive(): boolean {
    return settings.home_announcement_active === 'true';
  },

  getLessonsContent(): LessonContentItem[] {
    try {
      const parsed = JSON.parse(settings.lessons_content_json) as LessonContentItem[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // fallthrough
    }
    return DEFAULT_LESSONS_CONTENT;
  },

  getLessonContentById(id: string): LessonContentItem | undefined {
    return this.getLessonsContent().find((l) => l.id === id);
  },

  async hydrate(): Promise<AppSettingsMap> {
    if (hydrated) return this.getSnapshot();
    const defaults = defaultMap();
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        settings = { ...defaults, ...(JSON.parse(raw) as Partial<AppSettingsMap>) };
      } else {
        settings = { ...defaults };
      }
    } catch {
      settings = { ...defaults };
    }

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase.from('app_settings').select('key, value');
      if (!error && data?.length) {
        for (const row of data) {
          const key = row.key as AppSettingKey;
          if (key in defaults) {
            settings[key] = row.value ?? defaults[key];
          }
        }
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(settings));
      }
    }

    hydrated = true;
    notify();
    return this.getSnapshot();
  },

  async refreshFromCloud(): Promise<void> {
    hydrated = false;
    await this.hydrate();
  },

  async setLocal(key: AppSettingKey, value: string): Promise<void> {
    settings = { ...settings, [key]: value };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(settings));
    notify();
  },

  async saveToCloud(key: AppSettingKey, value: string, adminLogin: string): Promise<{ ok: boolean; error?: string }> {
    await this.setLocal(key, value);

    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured) {
      return { ok: true, error: 'Сохранено локально (Supabase не настроен)' };
    }

    const { data, error } = await supabase.rpc('save_app_setting', {
      p_admin_login: adminLogin,
      p_key: key,
      p_value: value,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (data !== true) {
      return { ok: false, error: 'Нет прав администратора для записи' };
    }
    return { ok: true };
  },

  async saveManyToCloud(
    patch: Partial<AppSettingsMap>,
    adminLogin: string,
  ): Promise<{ ok: boolean; error?: string }> {
    for (const [key, value] of Object.entries(patch)) {
      const result = await this.saveToCloud(key as AppSettingKey, value as string, adminLogin);
      if (!result.ok) return result;
    }
    return { ok: true };
  },

  async resetAiPrompt(): Promise<void> {
    await this.setLocal('ai_teacher_system_prompt', DEFAULT_AI_PROMPT);
  },
};