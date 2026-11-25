export type LessonMasteryLevel = 'not_started' | 'learning' | 'good' | 'mastered';

export type ZeroLevelLesson = {
  id: string;
  number: number;
  title: string;
  masteryLevel: LessonMasteryLevel;
  aiScorePercent: number;
  isLockedForGuest?: boolean;
};