import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { appSettingsService } from '@/services/AppSettingsService';
import type { LessonMasteryLevel } from '@/types/lesson';

export type TutorResult = {
  feedbackRu: string;
  tipRu: string;
  recommendedMastery: LessonMasteryLevel;
  finalScorePercent: number;
  usedCloud: boolean;
};

export type TutorRequest = {
  lessonTitle: string;
  targetPhrase: string;
  spokenText: string;
  levenshteinPercent: number;
  passThreshold?: number;
  studentQuestion?: string;
};

function fallbackTutor(req: TutorRequest): TutorResult {
  const threshold = req.passThreshold ?? appSettingsService.getThresholdPercent();
  const pct = req.levenshteinPercent;

  let recommendedMastery: LessonMasteryLevel = 'learning';
  let feedbackRu = 'Хорошее начало! Сравните произношение с эталоном и повторите ещё раз.';
  let tipRu = 'Слушайте эталон, затем говорите чуть медленнее и чётче.';

  if (pct < 40) {
    recommendedMastery = 'not_started';
    feedbackRu = 'Пока далеко от эталона, но это нормально на старте. Эли и Влад советуют повторить по слогам.';
    tipRu = 'Разбейте фразу на 2–3 части и проговорите каждую отдельно.';
  } else if (pct >= threshold && pct < threshold + 12) {
    recommendedMastery = 'good';
    feedbackRu = 'Отлично! Порог Левенштейна пройден — вы близки к уверенному произношению.';
    tipRu = 'Добавьте естественную интонацию, как в коротком диалоге.';
  } else if (pct >= threshold + 12) {
    recommendedMastery = 'mastered';
    feedbackRu = 'Превосходно! Фраза звучит очень близко к эталону.';
    tipRu = 'Закрепите успех, повторив фразу ещё два раза вслух.';
  }

  return {
    feedbackRu,
    tipRu,
    recommendedMastery,
    finalScorePercent: pct,
    usedCloud: false,
  };
}

export const aiTutorService = {
  async evaluate(req: TutorRequest): Promise<TutorResult> {
    const supabase = getSupabaseClient();
    const passThreshold = req.passThreshold ?? appSettingsService.getThresholdPercent();
    const systemPrompt = appSettingsService.get('ai_teacher_system_prompt');

    if (!isSupabaseConfigured || !supabase) {
      return fallbackTutor({ ...req, passThreshold });
    }

    const { data, error } = await supabase.functions.invoke('gemini-tutor', {
      body: {
        lessonTitle: req.lessonTitle,
        targetPhrase: req.targetPhrase,
        spokenText: req.spokenText,
        levenshteinPercent: req.levenshteinPercent,
        passThreshold,
        systemPrompt,
        studentQuestion: req.studentQuestion ?? '',
      },
    });

    if (error || !data) {
      return fallbackTutor({ ...req, passThreshold });
    }

    const payload = data as Partial<TutorResult>;
    if (!payload.feedbackRu) {
      return fallbackTutor({ ...req, passThreshold });
    }

    return {
      feedbackRu: payload.feedbackRu,
      tipRu: payload.tipRu ?? 'Продолжайте тренироваться вслух.',
      recommendedMastery: payload.recommendedMastery ?? fallbackTutor(req).recommendedMastery,
      finalScorePercent: payload.finalScorePercent ?? req.levenshteinPercent,
      usedCloud: true,
    };
  },
};