import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { useAppSettings } from '@/hooks/useAppSettings';
import { aiTutorService, type TutorResult } from '@/services/AiTutorService';
import { appSettingsService } from '@/services/AppSettingsService';
import { lessonsProgressService } from '@/services/LessonsProgressService';
import { speechRecognitionService } from '@/services/SpeechRecognitionService';
import { textToSpeechService } from '@/services/TextToSpeechService';
import type { LessonMasteryLevel } from '@/types/lesson';
import type { SpeechRecognitionStatus } from '@/types/speech';
import { calculatePronunciationScore, type PronunciationScore } from '@/utils/levenshtein';
import { colors, floatingShadow, getLessonMasteryColors, radii, spacing } from '@/theme/theme';
import { InteractiveLessonPlayer } from '@/components/lesson/InteractiveLessonPlayer';
import { resolveZeroLevelInteractiveLesson } from '@/data/zeroLevelLessonsContent';

function LegacyLessonScreen({
  lesson,
  content,
  passThreshold,
}: {
  lesson: NonNullable<ReturnType<typeof lessonsProgressService.getLessonById>>;
  content: ReturnType<typeof appSettingsService.getLessonContentById>;
  passThreshold: number;
}) {
  const router = useRouter();
  const phrases = content?.targetPhrases ?? [lesson.title ?? 'Hello'];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const activePhrase = phrases[phraseIndex] ?? phrases[0];

  const [spokenText, setSpokenText] = useState('');
  const [score, setScore] = useState<PronunciationScore | null>(null);
  const [tutor, setTutor] = useState<TutorResult | null>(null);
  const [speechStatus, setSpeechStatus] = useState<SpeechRecognitionStatus>('idle');
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = speechRecognitionService.subscribe((status, msg) => {
      setSpeechStatus(status);
      if (msg && status === 'error') setSpokenText((prev) => prev || '');
    });
    return unsub;
  }, []);

  const runAnalysis = useCallback(async () => {
    const nextScore = calculatePronunciationScore(activePhrase, spokenText, passThreshold);
    setScore(nextScore);
    setLoadingTutor(true);
    const result = await aiTutorService.evaluate({
      lessonTitle: lesson ? `${lesson.number}. ${lesson.title}` : 'Lesson',
      targetPhrase: activePhrase,
      spokenText,
      levenshteinPercent: nextScore.similarityPercent,
      passThreshold,
    });
    setTutor(result);
    setLoadingTutor(false);
  }, [activePhrase, spokenText, passThreshold, lesson]);

  const onListen = async () => {
    await speechRecognitionService.startListening((text) => {
      setSpokenText(text);
    });
  };

  const onSaveAndExit = async () => {
    setSaving(true);
    const mastery: LessonMasteryLevel =
      tutor?.recommendedMastery ??
      (score?.isPassed ? 'good' : score ? 'learning' : lesson.masteryLevel);
    const pct = tutor?.finalScorePercent ?? score?.similarityPercent ?? lesson.aiScorePercent;
    await lessonsProgressService.updateMastery(lesson.id, mastery, pct);
    setSaving(false);
    router.replace('/zero-level');
  };

  const masteryColor = getLessonMasteryColors(
    tutor?.recommendedMastery ?? (score?.isPassed ? 'good' : 'learning'),
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backText}>← К кувшинкам</Text>
        </Pressable>
        <Text style={styles.title}>
          {lesson.number}. {lesson.title}
        </Text>
        <Text style={styles.threshold}>Порог Левенштейна: {passThreshold}%</Text>
      </View>

      <View style={[styles.card, floatingShadow]}>
        <Text style={styles.cardTitle}>Методика Эли и Влад</Text>
        <Text style={styles.body}>{content?.methodologyNoteRu ?? 'Проговаривайте вслух короткими фразами.'}</Text>
        <Text style={styles.hint}>{content?.phoneticHint}</Text>
      </View>

      <View style={[styles.card, floatingShadow]}>
        <Text style={styles.cardTitle}>Фразы урока</Text>
        <View style={styles.chips}>
          {phrases.map((p, i) => (
            <Pressable key={p + i} onPress={() => setPhraseIndex(i)} style={[styles.chip, phraseIndex === i && styles.chipOn]}>
              <Text style={styles.chipText}>{p}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.card, floatingShadow]}>
        <Text style={styles.phraseLarge}>{activePhrase}</Text>
        <FloatingButton title="🔊 Прослушать эталон" tone="blue" onPress={() => textToSpeechService.speakEnglish(activePhrase)} />
        <FloatingButton
          title={speechStatus === 'listening' ? 'Слушаю…' : 'Нажать и сказать'}
          tone="green"
          onPress={onListen}
          disabled={speechStatus === 'listening'}
        />
        {speechStatus === 'error' ? (
          <Text style={styles.speechError}>{speechRecognitionService.getLastError()}</Text>
        ) : null}
        <Text style={styles.label}>Или ввести текстом для проверки</Text>
        <TextInput
          value={spokenText}
          onChangeText={setSpokenText}
          placeholder="Type what you said…"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <FloatingButton title="Проверить произношение" tone="green" onPress={runAnalysis} disabled={!spokenText.trim()} />
      </View>

      {score ? (
        <View style={[styles.card, floatingShadow, { borderColor: masteryColor.stroke }]}>
          <Text style={styles.cardTitle}>Результат</Text>
          <View style={styles.scoreBarTrack}>
            <View style={[styles.scoreBarFill, { width: `${score.similarityPercent}%`, backgroundColor: masteryColor.fill }]} />
          </View>
          <Text style={styles.scoreText}>
            Совпадение: {score.similarityPercent}% {score.isPassed ? '✓ Порог пройден' : '· Ниже порога'}
          </Text>
          <Text style={styles.meta}>Вы сказали: {spokenText || '—'}</Text>
          <Text style={styles.meta}>Нормализация: {score.normalizedSpoken || '—'}</Text>
        </View>
      ) : null}

      {loadingTutor ? (
        <ActivityIndicator color={colors.green} />
      ) : tutor ? (
        <View style={[styles.card, floatingShadow]}>
          <Text style={styles.cardTitle}>ИИ-учитель {tutor.usedCloud ? '(Gemini)' : '(локальный режим)'}</Text>
          <Text style={styles.aiFeedback}>{tutor.feedbackRu}</Text>
          <Text style={styles.aiTip}>{tutor.tipRu}</Text>
        </View>
      ) : null}

      <FloatingButton
        title={saving ? 'Сохраняю…' : 'Завершить урок и сохранить оценку'}
        tone="green"
        size="hero"
        onPress={onSaveAndExit}
        disabled={saving}
      />
    </ScrollView>
  );
}

export default function LessonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = Array.isArray(id) ? id[0] : id ?? '';

  const { settings } = useAppSettings();
  const passThreshold = appSettingsService.getThresholdPercent();

  const lesson = useMemo(() => lessonsProgressService.getLessonById(lessonId), [lessonId]);
  const content = useMemo(
    () => (lessonId ? appSettingsService.getLessonContentById(lessonId) : undefined),
    [lessonId, settings.lessons_content_json],
  );
  const interactiveLesson = useMemo(
    () => (lessonId ? resolveZeroLevelInteractiveLesson(lessonId) : undefined),
    [lessonId],
  );

  useEffect(() => {
    lessonsProgressService.hydrate();
    appSettingsService.hydrate();
  }, []);

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Урок не найден.</Text>
        <FloatingButton title="← К кувшинкам" tone="green" onPress={() => router.replace('/zero-level')} />
      </View>
    );
  }

  if (interactiveLesson) {
    return (
      <InteractiveLessonPlayer
        lesson={interactiveLesson}
        progressLesson={lesson}
        passThreshold={passThreshold}
        onExit={() => router.replace('/zero-level')}
      />
    );
  }

  return <LegacyLessonScreen lesson={lesson} content={content} passThreshold={passThreshold} />;
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
  error: { color: '#C62828', textAlign: 'center' },
  header: { gap: spacing.xs },
  backLink: { alignSelf: 'flex-start' },
  backText: { color: colors.blueDark, fontWeight: '700', fontSize: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.greenDark },
  threshold: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.greenDark,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  hint: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
  },
  chipOn: { backgroundColor: colors.blue, borderColor: colors.blueDarker },
  chipText: { fontWeight: '700', color: colors.textPrimary, fontSize: 13 },
  phraseLarge: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: {
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
  speechError: { color: '#C62828', fontSize: 13, fontWeight: '600' },
  scoreBarTrack: {
    height: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.mastery.locked,
    overflow: 'hidden',
  },
  scoreBarFill: { height: '100%', borderRadius: radii.pill },
  scoreText: { fontWeight: '700', fontSize: 16, color: colors.textPrimary },
  meta: { fontSize: 13, color: colors.textSecondary },
  aiFeedback: { fontSize: 15, lineHeight: 22, color: colors.textPrimary, fontWeight: '600' },
  aiTip: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});