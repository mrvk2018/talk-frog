import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { appSettingsService } from '@/services/AppSettingsService';
import type { LessonMasteryLevel } from '@/types/lesson';
import { calculatePronunciationScore, normalizePhrase } from '@/utils/levenshtein';

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

export type ScenarioTutorRequest = {
  lessonTitle: string;
  contextRu: string;
  spokenText: string;
  acceptablePhrases: string[];
  idealPhrase: string;
  passThreshold?: number;
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

function fallbackScenario(req: ScenarioTutorRequest): TutorResult {
  const threshold = req.passThreshold ?? appSettingsService.getThresholdPercent();
  let best = 0;
  let bestPhrase = req.idealPhrase;

  for (const phrase of req.acceptablePhrases) {
    const score = calculatePronunciationScore(phrase, req.spokenText, threshold);
    if (score.similarityPercent > best) {
      best = score.similarityPercent;
      bestPhrase = phrase;
    }
  }

  const idealNorm = normalizePhrase(req.idealPhrase);
  const saidNorm = normalizePhrase(req.spokenText);
  const isIdeal = saidNorm === idealNorm || best >= threshold;

  let feedbackRu = 'Хорошая попытка! Попробуйте короче и увереннее.';
  let tipRu = `Идеально звучит: «${req.idealPhrase}».`;
  let recommendedMastery: LessonMasteryLevel = 'learning';
  let finalScorePercent = best;

  if (isIdeal) {
    recommendedMastery = bestPhrase === req.idealPhrase ? 'good' : 'learning';
    feedbackRu =
      bestPhrase === req.idealPhrase
        ? 'Отличный ответ для ситуации! Формулировка уместна.'
        : `Ответ принят: «${bestPhrase}». Для этой ситуации особенно уместно: «${req.idealPhrase}».`;
    tipRu = 'Смотрите на контекст: формальность и время суток.';
    finalScorePercent = Math.max(best, threshold);
  } else if (best < 45) {
    feedbackRu = 'Пока не похоже на целевую фразу. Послушайте эталон и повторите.';
    tipRu = 'Говорите одну короткую фразу из урока — без лишних слов.';
  }

  return {
    feedbackRu,
    tipRu,
    recommendedMastery,
    finalScorePercent,
    usedCloud: false,
  };
}

export const aiTutorService = {
  async evaluateScenario(req: ScenarioTutorRequest): Promise<TutorResult> {
    const passThreshold = req.passThreshold ?? appSettingsService.getThresholdPercent();
    const targetPhrase = req.acceptablePhrases.join(' | ');
    const levenshteinPercent = fallbackScenario(req).finalScorePercent;

    const supabase = getSupabaseClient();
    const systemPrompt = appSettingsService.get('ai_teacher_system_prompt');

    if (!isSupabaseConfigured || !supabase) {
      return fallbackScenario(req);
    }

    const { data, error } = await supabase.functions.invoke('gemini-tutor', {
      body: {
        lessonTitle: req.lessonTitle,
        targetPhrase,
        spokenText: req.spokenText,
        levenshteinPercent,
        passThreshold,
        systemPrompt,
        studentQuestion: `${req.contextRu} Acceptable: ${targetPhrase}. Ideal: ${req.idealPhrase}`,
      },
    });

    if (error || !data) return fallbackScenario(req);
    const payload = data as Partial<TutorResult>;
    if (!payload.feedbackRu) return fallbackScenario(req);

    return {
      feedbackRu: payload.feedbackRu,
      tipRu: payload.tipRu ?? fallbackScenario(req).tipRu,
      recommendedMastery: payload.recommendedMastery ?? fallbackScenario(req).recommendedMastery,
      finalScorePercent: payload.finalScorePercent ?? levenshteinPercent,
      usedCloud: true,
    };
  },

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