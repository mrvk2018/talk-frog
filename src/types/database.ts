export type DbProfile = {
  id: string;
  role: 'guest' | 'student' | 'admin';
  auth_provider: 'guest' | 'email' | 'google' | 'apple' | 'telegram';
  email: string | null;
  display_name: string | null;
  terms_accepted_at: string | null;
  voice_consent_accepted_at: string | null;
  subscription_tier: 'free' | 'basic' | 'pro';
  created_at: string;
  updated_at: string;
};

export type DbLessonProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  mastery_level: 'not_started' | 'learning' | 'good' | 'mastered';
  ai_score_percent: number;
  updated_at: string;
};