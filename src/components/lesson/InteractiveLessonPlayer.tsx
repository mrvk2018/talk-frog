import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { lessonsProgressService } from '@/services/LessonsProgressService';
import type { ZeroLevelLesson } from '@/types/lesson';
import type { ZeroLevelInteractiveLesson } from '@/types/lessonSteps';
import { colors, floatingShadow, getLessonMasteryColors, radii, spacing } from '@/theme/theme';
import { flattenLessonSteps, getStageLabel, masteryFromScore } from './flattenLessonSteps';
import { LessonProgressBar } from './LessonProgressBar';
import { LessonStepRenderer } from './LessonStepRenderer';

type Props = {
  lesson: ZeroLevelInteractiveLesson;
  progressLesson: ZeroLevelLesson;
  passThreshold: number;
  onExit: () => void;
};

export function InteractiveLessonPlayer({ lesson, progressLesson, passThreshold, onExit }: Props) {
  const steps = useMemo(() => flattenLessonSteps(lesson), [lesson]);
  const [stepIndex, setStepIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = steps[stepIndex];
  const avgPercent = useMemo(() => {
    if (!scores.length) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [scores]);

  const onStepComplete = useCallback(
    (scorePercent: number) => {
      setScores((prev) => [...prev, scorePercent]);
      if (stepIndex >= steps.length - 1) {
        setFinished(true);
      } else {
        setStepIndex((i) => i + 1);
      }
    },
    [stepIndex, steps.length],
  );

  const saveAndLeave = async () => {
    setSaving(true);
    const mastery = masteryFromScore(avgPercent, passThreshold);
    await lessonsProgressService.updateMastery(progressLesson.id, mastery, avgPercent);
    setSaving(false);
    onExit();
  };

  if (!current && !finished) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Нет шагов в сценарии.</Text>
        <FloatingButton title="← Назад" tone="blue" onPress={onExit} />
      </View>
    );
  }

  if (finished) {
    const mastery = masteryFromScore(avgPercent, passThreshold);
    const masteryColors = getLessonMasteryColors(mastery);
    const praise =
      avgPercent >= 92
        ? '🐸 Блистательно! Лягушонок TalkFrog аплодирует — вы настоящий полиглот нуля!'
        : avgPercent >= passThreshold
          ? '🐸 Отлично! Кувшинка засияет ярче — так держать!'
          : '🐸 Неплохое начало! Повторите урок — и лягушонок угощает вас виртуальной мухой.';

    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <View style={[styles.resultCard, floatingShadow, { borderColor: masteryColors.stroke }]}>
          <Text style={styles.resultTitle}>
            {progressLesson.number}. {lesson.titleRu}
          </Text>
          <Text style={styles.frog}>{praise}</Text>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${avgPercent}%`, backgroundColor: masteryColors.fill }]} />
          </View>
          <Text style={styles.scoreLabel}>Точность: {avgPercent}%</Text>
          <Text style={styles.meta}>
            Пройдено шагов: {scores.length}. Порог: {passThreshold}%.
          </Text>
        </View>
        <FloatingButton
          title={saving ? 'Сохраняю…' : 'На карту кувшинок'}
          tone="green"
          size="hero"
          onPress={saveAndLeave}
          disabled={saving}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Pressable onPress={onExit} style={styles.back}>
        <Text style={styles.backText}>← К кувшинкам</Text>
      </Pressable>
      <Text style={styles.title}>
        {progressLesson.number}. {lesson.titleRu}
      </Text>
      {lesson.subtitleRu ? <Text style={styles.subtitle}>{lesson.subtitleRu}</Text> : null}

      <LessonProgressBar
        stageLabel={getStageLabel(current, stepIndex, steps.length)}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        isFinalTest={current.isFinalTest}
      />

      <LessonStepRenderer key={current.id} step={current} passThreshold={passThreshold} onComplete={onStepComplete} />

      {saving ? <ActivityIndicator color={colors.green} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  error: { color: '#C62828', textAlign: 'center', fontWeight: '700' },
  back: { alignSelf: 'flex-start' },
  backText: { color: colors.blueDark, fontWeight: '700', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '900', color: colors.greenDark },
  subtitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  resultCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: spacing.lg,
    gap: spacing.md,
  },
  resultTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  frog: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: colors.textPrimary },
  scoreTrack: {
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.mastery.locked,
    overflow: 'hidden',
  },
  scoreFill: { height: '100%', borderRadius: radii.pill },
  scoreLabel: { fontSize: 20, fontWeight: '900', color: colors.greenDark },
  meta: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
});