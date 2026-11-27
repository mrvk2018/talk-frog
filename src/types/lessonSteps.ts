/**
 * Интерактивные шаги Нулевого уровня (шаг 1 из 2 — типы и контент).
 * Уроки 3–8 и админка по-прежнему используют LessonContentItem (appSettings).
 */

export type LessonStepType =
  | 'listen_repeat'
  | 'audio_choice'
  | 'visual_choice'
  | 'category_sort'
  | 'pair_match'
  | 'custom_input_speak';

export type LessonStepBase = {
  id: string;
  stepType: LessonStepType;
  titleRu: string;
  instructionsRu?: string;
  /** Блок «Тест (A1)» в конце урока */
  isFinalTest?: boolean;
};

export type ListenRepeatItem = {
  display: string;
  speakText: string;
  transcription?: string;
  hintRu?: string;
  upper?: string;
  lower?: string;
};

export type ListenRepeatStep = LessonStepBase & {
  stepType: 'listen_repeat';
  items: ListenRepeatItem[];
  /** Если true — UI выбирает одну случайную карточку из items */
  randomPick?: boolean;
};

export type AudioChoiceStep = LessonStepBase & {
  stepType: 'audio_choice';
  speakText: string;
  transcription?: string;
  choices: string[];
  correctIndex: number;
  /** Не показывать текст до выбора — только кнопка «слушать» */
  hideVisualHint?: boolean;
};

export type VisualChoiceStep = LessonStepBase & {
  stepType: 'visual_choice';
  /** Целевая буква без озвучки по умолчанию */
  targetLetter: string;
  choices: string[];
  correctIndex: number;
  isSilent?: boolean;
};

export type SoundCategoryId = 'i_long' | 'e_short' | 'ai_diphthong';

export type CategorySortStep = LessonStepBase & {
  stepType: 'category_sort';
  categories: {
    id: SoundCategoryId;
    labelRu: string;
    ipaLabel: string;
    letters: string[];
    prefilled: string[];
  }[];
  /** Все буквы, которые нужно распределить (кроме prefilled) */
  poolLetters: string[];
};

export type PairMatchItem = {
  id: string;
  leftLabel: string;
  rightLabel: string;
  leftSpeakText?: string;
  rightSpeakText?: string;
};

export type PairMatchStep = LessonStepBase & {
  stepType: 'pair_match';
  pairs: PairMatchItem[];
  /** Карточка-обзор перед сопоставлением (например Aa Bb Cc …) */
  overviewCard?: string;
  methodologyNoteRu?: string;
};

export type CustomInputSpeakStep = LessonStepBase & {
  stepType: 'custom_input_speak';
  inputLabelRu: string;
  placeholder: string;
  ruleNoteRu: string;
  /** Озвучивать ввод посимвольно (имя, телефон) */
  spellOutOnSpeak?: boolean;
  inputKind?: 'name' | 'phone';
};

export type LessonStep =
  | ListenRepeatStep
  | AudioChoiceStep
  | VisualChoiceStep
  | CategorySortStep
  | PairMatchStep
  | CustomInputSpeakStep;

/** Связь с lilypad: z1…z8 в LessonsProgressService */
export type ZeroLessonProgressId = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | 'z6' | 'z7' | 'z8';

export type ZeroLevelInteractiveLesson = {
  /** Короткий id контента ('1', '2' …) */
  contentId: '1' | '2';
  lessonProgressId: 'z1' | 'z2';
  titleEn: string;
  titleRu: string;
  subtitleRu?: string;
  referenceLexicon?: ListenRepeatItem[];
  stages: LessonStep[];
  /** Финальный блок «Тест (A1)» */
  finalTest?: LessonStep[];
};