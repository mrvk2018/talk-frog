export const APP_SETTING_KEYS = [
  'ai_teacher_system_prompt',
  'levenshtein_pass_threshold',
  'home_announcement_text',
  'home_announcement_active',
  'welcome_video_url',
  'zero_level_readme_text',
  'lessons_content_json',
] as const;

export type AppSettingKey = (typeof APP_SETTING_KEYS)[number];

export type LessonContentItem = {
  id: string;
  number: number;
  title: string;
  targetPhrases: string[];
  phoneticHint: string;
  methodologyNoteRu: string;
};

export type AppSettingsMap = Record<AppSettingKey, string>;