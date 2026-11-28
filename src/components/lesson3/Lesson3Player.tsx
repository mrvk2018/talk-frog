import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { LessonProgressBar } from '@/components/lesson/LessonProgressBar';
import { masteryFromScore } from '@/components/lesson/flattenLessonSteps';
import { lessonCard } from '@/components/lesson/lessonStyles';
import { lessonStructuredContentService } from '@/services/LessonStructuredContentService';
import { lessonsProgressService } from '@/services/LessonsProgressService';
import type { ZeroLevelLesson } from '@/types/lesson';
import type { Lesson3StructuredContent } from '@/types/lessonStructured';
import { colors, floatingShadow, getLessonMasteryColors, radii, spacing } from '@/theme/theme';
import { Lesson3LetterBuild } from './Lesson3LetterBuild';
import {
  Lesson3AiDialogueStep,
  Lesson3AudioNumberStep,
  Lesson3EnRuMatchStep,
  Lesson3ImagePhraseStep,
  Lesson3LetterSequenceStep,
  Lesson3QuizStep,
  Lesson3SpeakingStep,
  Lesson3TheoryStep,
} from './Lesson3StepViews';

const STEP_LABELS = [
  'Блок 1 · Теория Hello / Hi',
  'Блок 1 · Сборка Hello',
  'Блок 1 · Сборка Hi',
  'Блок 2 · Теория прощания',
  'Блок 2 · Сборка фраз',
  'Блок 2 · Пары перевода',
  'Блок 3 · Время суток',
  'Блок 3 · Картинки и фразы',
  'Блок 3 · Аудирование',
  'Блок 3 · Сборка времени суток',
  'Блок 4 · Говорение',
  'Блок 4 · Ситуации с ИИ',
  'Блок 4 · Квиз',
];

type Props = {
  progressLesson: ZeroLevelLesson;
  passThreshold: number;
  onExit: () => void;
};

export function Lesson3Player({ progressLesson, passThreshold, onExit }: Props) {
  const [content, setContent] = useState<Lesson3StructuredContent>(
    lessonStructuredContentService.getLesson3(),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    lessonStructuredContentService.hydrate().then(() => {
      setContent(lessonStructuredContentService.getLesson3());
    });
  }, []);

  const total = STEP_LABELS.length;
  const avgPercent = useMemo(() => {
    if (!scores.length) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [scores]);

  const onStepComplete = useCallback(
    (scorePercent: number) => {
      setScores((prev) => [...prev, scorePercent]);
      if (stepIndex >= total - 1) setFinished(true);
      else setStepIndex((i) => i + 1);
    },
    [stepIndex, total],
  );

  const saveAndLeave = async () => {
    setSaving(true);
    const mastery = masteryFromScore(avgPercent, passThreshold);
    await lessonsProgressService.updateMastery(progressLesson.id, mastery, avgPercent);
    setSaving(false);
    onExit();
  };

  const timeIds = ['good-morning', 'good-afternoon', 'good-evening', 'good-night'];

  let stepUi: ReactNode = null;

  switch (stepIndex) {
    case 0:
      stepUi = (
        <Lesson3TheoryStep
          content={content}
          phraseIds={['hello', 'hi']}
          ruleId="rule1"
          titleRu="Шаг 1.1 — Hello и Hi"
          onComplete={onStepComplete}
        />
      );
      break;
    case 1:
      stepUi = (
        <View style={lessonCard.card}>
          <Lesson3LetterBuild
            titleRu="Шаг 1.2"
            promptRu='Соберите из букв слово «здравствуйте» (Hello)'
            target="hello"
            onComplete={onStepComplete}
          />
        </View>
      );
      break;
    case 2:
      stepUi = (
        <View style={lessonCard.card}>
          <Lesson3LetterBuild
            titleRu="Шаг 1.3"
            promptRu='Соберите из букв слово «привет» (Hi)'
            target="hi"
            onComplete={onStepComplete}
          />
        </View>
      );
      break;
    case 3:
      stepUi = (
        <Lesson3TheoryStep
          content={content}
          phraseIds={['goodbye', 'bye', 'see-you']}
          ruleId="rule2"
          titleRu="Шаг 2.1 — Goodbye, Bye, See you"
          onComplete={onStepComplete}
        />
      );
      break;
    case 4:
      stepUi = (
        <Lesson3LetterSequenceStep
          titleRu="Шаг 2.2"
          targets={[
            { promptRu: 'Соберите Goodbye', target: 'goodbye' },
            { promptRu: 'Соберите Bye', target: 'bye' },
            { promptRu: 'Соберите See you (с пробелом)', target: 'see you', withSpaces: true },
          ]}
          onComplete={onStepComplete}
        />
      );
      break;
    case 5:
      stepUi = (
        <Lesson3EnRuMatchStep
          content={content}
          titleRu="Шаг 2.3 — Соедините пары"
          phraseIds={['goodbye', 'bye', 'see-you']}
          onComplete={onStepComplete}
        />
      );
      break;
    case 6:
      stepUi = (
        <Lesson3TheoryStep
          content={content}
          phraseIds={timeIds}
          ruleId="rule3"
          titleRu="Шаг 3.1 — Время суток"
          onComplete={onStepComplete}
        />
      );
      break;
    case 7:
      stepUi = (
        <Lesson3ImagePhraseStep
          content={content}
          titleRu="Шаг 3.2 — Картинка и фраза"
          phraseIds={timeIds}
          onComplete={onStepComplete}
        />
      );
      break;
    case 8:
      stepUi = (
        <Lesson3AudioNumberStep
          content={content}
          titleRu="Шаг 3.3 — Аудирование"
          phraseIds={timeIds}
          onComplete={onStepComplete}
        />
      );
      break;
    case 9:
      stepUi = (
        <Lesson3LetterSequenceStep
          titleRu="Шаг 3.4"
          targets={[
            { promptRu: 'Good morning', target: 'good morning', withSpaces: true },
            { promptRu: 'Good afternoon', target: 'good afternoon', withSpaces: true },
            { promptRu: 'Good evening', target: 'good evening', withSpaces: true },
            { promptRu: 'Good night', target: 'good night', withSpaces: true },
          ]}
          onComplete={onStepComplete}
        />
      );
      break;
    case 10:
      stepUi = (
        <Lesson3SpeakingStep
          content={content}
          passThreshold={passThreshold}
          titleRu="Шаг 4.1 — Проговорите вслух"
          onComplete={onStepComplete}
        />
      );
      break;
    case 11:
      stepUi = (
        <Lesson3AiDialogueStep
          content={content}
          passThreshold={passThreshold}
          titleRu="Шаг 4.2 — Ситуации с ИИ"
          onComplete={onStepComplete}
        />
      );
      break;
    case 12:
      stepUi = (
        <Lesson3QuizStep content={content} titleRu="Шаг 4.3 — Квиз перевода" onComplete={onStepComplete} />
      );
      break;
    default:
      stepUi = null;
  }

  if (finished) {
    const mastery = masteryFromScore(avgPercent, passThreshold);
    const masteryColors = getLessonMasteryColors(mastery);
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <View style={[styles.result, floatingShadow, { borderColor: masteryColors.stroke }]}>
          <Text style={styles.resultTitle}>3. Hello? — урок завершён</Text>
          <Text style={styles.frog}>
            🐸 {avgPercent >= passThreshold ? 'Отличная работа! Кувшинка сияет ярче.' : 'Повторите урок — лягушонок верит в вас!'}
          </Text>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${avgPercent}%`, backgroundColor: masteryColors.fill }]} />
          </View>
          <Text style={styles.score}>Точность: {avgPercent}%</Text>
        </View>
        <FloatingButton
          title={saving ? 'Сохраняю…' : 'К кувшинкам'}
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
        <Text style={styles.backText}>← Назад</Text>
      </Pressable>
      <Text style={styles.title}>3. Hello?</Text>
      <LessonProgressBar
        stageLabel={STEP_LABELS[stepIndex] ?? `Шаг ${stepIndex + 1}`}
        stepIndex={stepIndex}
        totalSteps={total}
      />
      <View style={styles.stepWrap}>{stepUi}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  back: { alignSelf: 'flex-start' },
  backText: { color: colors.blueDark, fontWeight: '700', fontSize: 16 },
  title: { fontSize: 26, fontWeight: '900', color: colors.greenDark },
  stepWrap: { gap: spacing.sm },
  result: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: spacing.lg,
    gap: spacing.md,
  },
  resultTitle: { fontSize: 22, fontWeight: '900' },
  frog: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  bar: {
    height: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.mastery.locked,
    overflow: 'hidden',
  },
  barFill: { height: '100%' },
  score: { fontSize: 20, fontWeight: '900', color: colors.greenDark },
});