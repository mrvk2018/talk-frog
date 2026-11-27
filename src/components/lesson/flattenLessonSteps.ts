import type { LessonStep, ZeroLevelInteractiveLesson } from '@/types/lessonSteps';

export function flattenLessonSteps(lesson: ZeroLevelInteractiveLesson): LessonStep[] {
  return [...lesson.stages, ...(lesson.finalTest ?? [])];
}

export function getStageLabel(step: LessonStep, stepIndex: number, total: number): string {
  if (step.isFinalTest) return 'ФИНАЛЬНЫЙ ТЕСТ (A1)';
  const match = step.titleRu.match(/Этап\s*(\d+)/i);
  if (match) {
    return `Этап ${match[1]}`;
  }
  return `Шаг ${stepIndex + 1} из ${total}`;
}

export function masteryFromScore(
  avgPercent: number,
  passThreshold: number,
): 'learning' | 'good' | 'mastered' {
  if (avgPercent >= 92) return 'mastered';
  if (avgPercent >= passThreshold) return 'good';
  return 'learning';
}