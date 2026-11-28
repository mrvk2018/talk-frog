import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { PronunciationPracticeBlock } from '@/components/lesson/PronunciationPracticeBlock';
import { findPhrase, phraseImageUrl } from '@/data/lesson3DefaultContent';
import { aiTutorService } from '@/services/AiTutorService';
import type { Lesson3StructuredContent } from '@/types/lessonStructured';
import { speakBritish } from '@/utils/speech';
import { colors, floatingShadow, radii, spacing } from '@/theme/theme';
import { lessonCard } from '@/components/lesson/lessonStyles';
import { Lesson3LetterBuild } from './Lesson3LetterBuild';
import { Lesson3TeacherRule } from './Lesson3TeacherRule';
import { Lesson3WordCard } from './Lesson3WordCard';
import { shuffleArray } from './lesson3Utils';
import { lesson3IllustrationFrame } from './lesson3ImageStyles';

export function Lesson3TheoryStep({
  content,
  phraseIds,
  ruleId,
  titleRu,
  onComplete,
}: {
  content: Lesson3StructuredContent;
  phraseIds: string[];
  ruleId: Lesson3StructuredContent['teacherRules'][number]['id'];
  titleRu: string;
  onComplete: (score: number) => void;
}) {
  const phrases = phraseIds.map((id) => findPhrase(content, id)).filter(Boolean);
  const rule = content.teacherRules.find((r) => r.id === ruleId);

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{titleRu}</Text>
      <View style={styles.cardRow}>
        {phrases.map((p) => (
          <Lesson3WordCard key={p!.id} content={content} phrase={p!} />
        ))}
      </View>
      {rule ? <Lesson3TeacherRule title={rule.title} bodyRu={rule.bodyRu} /> : null}
      <FloatingButton title="Далее" tone="green" size="lg" onPress={() => onComplete(100)} />
    </View>
  );
}

export function Lesson3EnRuMatchStep({
  content,
  titleRu,
  phraseIds,
  onComplete,
}: {
  content: Lesson3StructuredContent;
  titleRu: string;
  phraseIds: string[];
  onComplete: (score: number) => void;
}) {
  const pairs = phraseIds.map((id) => findPhrase(content, id)).filter(Boolean);
  const [left, setLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const rights = useMemo(
    () => shuffleArray(pairs.map((p) => ({ id: p!.id, label: p!.translationRu }))),
    [phraseIds.join(',')],
  );

  const pickRight = (id: string) => {
    if (!left || matched.has(id)) return;
    if (left === id) {
      const next = new Set(matched);
      next.add(id);
      setMatched(next);
      setLeft(null);
      if (next.size >= pairs.length) setTimeout(() => onComplete(100), 400);
    } else {
      setLeft(null);
    }
  };

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{titleRu}</Text>
      <View style={styles.matchCols}>
        <View style={styles.col}>
          {pairs.map((p) => (
            <Pressable
              key={p!.id}
              disabled={matched.has(p!.id)}
              onPress={() => setLeft(p!.id)}
              style={[styles.tile, floatingShadow, matched.has(p!.id) && styles.tileOk, left === p!.id && styles.tileOn]}
            >
              <Text style={styles.tileText}>{p!.english}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.col}>
          {rights.map((r) => (
            <Pressable
              key={r.id}
              disabled={matched.has(r.id)}
              onPress={() => pickRight(r.id)}
              style={[styles.tile, floatingShadow, matched.has(r.id) && styles.tileOk]}
            >
              <Text style={styles.tileText}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

export function Lesson3ImagePhraseStep({
  content,
  titleRu,
  phraseIds,
  onComplete,
}: {
  content: Lesson3StructuredContent;
  titleRu: string;
  phraseIds: string[];
  onComplete: (score: number) => void;
}) {
  const phrases = phraseIds.map((id) => findPhrase(content, id)).filter(Boolean);
  const [imgPick, setImgPick] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());

  const tryPhrase = (id: string) => {
    if (!imgPick || matched.has(id)) return;
    if (imgPick === id) {
      const n = new Set(matched);
      n.add(id);
      setMatched(n);
      setImgPick(null);
      if (n.size >= phrases.length) setTimeout(() => onComplete(100), 400);
    }
  };

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{titleRu}</Text>
      <View style={styles.imageMatchGrid}>
        {phrases.map((p) => (
          <Pressable
            key={`img-${p!.id}`}
            disabled={matched.has(p!.id)}
            onPress={() => setImgPick(p!.id)}
            style={[
              lesson3IllustrationFrame.frameGrid,
              styles.imgTilePressable,
              imgPick === p!.id && styles.tileOn,
              matched.has(p!.id) && styles.tileOk,
            ]}
          >
            <Image
              source={{ uri: phraseImageUrl(content, p!.imageFile) }}
              style={lesson3IllustrationFrame.image}
              resizeMode="contain"
            />
          </Pressable>
        ))}
      </View>
      <View style={styles.cardRow}>
        {phrases.map((p) => (
          <Pressable
            key={`ph-${p!.id}`}
            disabled={matched.has(p!.id)}
            onPress={() => tryPhrase(p!.id)}
            style={[styles.tile, floatingShadow, matched.has(p!.id) && styles.tileOk]}
          >
            <Text style={styles.tileText}>{p!.english}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Lesson3AudioNumberStep({
  content,
  titleRu,
  phraseIds,
  onComplete,
}: {
  content: Lesson3StructuredContent;
  titleRu: string;
  phraseIds: string[];
  onComplete: (score: number) => void;
}) {
  const phrases = phraseIds.map((id) => findPhrase(content, id)).filter(Boolean);
  const audioOrder = useMemo(
  () =>
      shuffleArray(
        ['Good night', 'Good morning', 'Good afternoon', 'Good evening'],
        'lesson3-audio',
      ),
    [],
  );
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [activeNum, setActiveNum] = useState<number | null>(null);

  const allAssigned = phrases.every((p) => assignments[p!.english] !== undefined);
  const correct =
    allAssigned &&
    phrases.every((p) => {
      const num = assignments[p!.english];
      const heard = audioOrder[num - 1];
      return heard?.toLowerCase() === p!.english.toLowerCase();
    });

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{titleRu}</Text>
      <Text style={lessonCard.instructions}>Слушайте и сопоставьте номер с фразой.</Text>
      <View style={styles.audioRow}>
        {audioOrder.map((phrase, i) => (
          <FloatingButton
            key={phrase}
            title={`${i + 1}. 🔊`}
            tone="blue"
            onPress={() => {
              speakBritish(phrase);
              setActiveNum(i + 1);
            }}
            style={styles.audioBtn}
          />
        ))}
      </View>
      {phrases.map((p) => (
        <View key={p!.id} style={styles.assignRow}>
          <Text style={styles.assignLabel}>{p!.english}</Text>
          <View style={styles.numRow}>
            {[1, 2, 3, 4].map((n) => (
              <Pressable
                key={n}
                onPress={() => setAssignments((a) => ({ ...a, [p!.english]: n }))}
                style={[
                  styles.numChip,
                  assignments[p!.english] === n && styles.numOn,
                  activeNum === n && styles.numActive,
                ]}
              >
                <Text style={styles.numText}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <FloatingButton
        title="Проверить"
        tone="green"
        onPress={() => onComplete(correct ? 100 : 60)}
        disabled={!allAssigned}
      />
    </View>
  );
}

export function Lesson3LetterSequenceStep({
  titleRu,
  targets,
  onComplete,
}: {
  titleRu: string;
  targets: { promptRu: string; target: string; withSpaces?: boolean }[];
  onComplete: (score: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const current = targets[idx];

  const onOne = (score: number) => {
    const next = [...scores, score];
    setScores(next);
    if (idx >= targets.length - 1) {
      const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
      onComplete(avg);
    } else {
      setIdx((i) => i + 1);
    }
  };

  return (
    <View style={lessonCard.card}>
      <Lesson3LetterBuild
        titleRu={titleRu}
        promptRu={current.promptRu}
        target={current.target}
        withSpaces={current.withSpaces}
        onComplete={onOne}
      />
      <Text style={lessonCard.hint}>
        {idx + 1} / {targets.length}
      </Text>
    </View>
  );
}

export function Lesson3SpeakingStep({
  content,
  passThreshold,
  titleRu,
  onComplete,
}: {
  content: Lesson3StructuredContent;
  passThreshold: number;
  titleRu: string;
  onComplete: (score: number) => void;
}) {
  const picks = useMemo(() => shuffleArray(content.phrases, 'speak').slice(0, 3), [content]);
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const phrase = picks[idx];

  const onScore = (pct: number) => {
    const next = [...scores, pct];
    setScores(next);
    if (idx >= picks.length - 1) {
      onComplete(Math.round(next.reduce((a, b) => a + b, 0) / next.length));
    } else {
      setIdx((i) => i + 1);
    }
  };

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{titleRu}</Text>
      <Lesson3WordCard content={content} phrase={phrase} />
      <PronunciationPracticeBlock
        key={phrase.id}
        expectedText={phrase.english}
        passThreshold={passThreshold}
        onScore={(s) => onScore(s.similarityPercent)}
      />
    </View>
  );
}

export function Lesson3AiDialogueStep({
  content,
  passThreshold,
  titleRu,
  onComplete,
}: {
  content: Lesson3StructuredContent;
  passThreshold: number;
  titleRu: string;
  onComplete: (score: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [spoken, setSpoken] = useState('');
  const [feedback, setFeedback] = useState('');
  const [scores, setScores] = useState<number[]>([]);
  const scenario = content.scenarios[idx];

  const submit = async () => {
    const result = await aiTutorService.evaluateScenario({
      lessonTitle: '3. Hello?',
      contextRu: scenario.contextRu,
      spokenText: spoken,
      acceptablePhrases: scenario.acceptablePhrases,
      idealPhrase: scenario.idealPhrase,
      passThreshold,
    });
    setFeedback(`${result.feedbackRu}\n${result.tipRu}`);
    const next = [...scores, result.finalScorePercent];
    setScores(next);
    if (idx >= content.scenarios.length - 1) {
      onComplete(Math.round(next.reduce((a, b) => a + b, 0) / next.length));
    } else {
      setIdx((i) => i + 1);
      setSpoken('');
      setFeedback('');
    }
  };

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{titleRu}</Text>
      <Lesson3TeacherRule title="Ситуация" bodyRu={scenario.contextRu} />
      <PronunciationPracticeBlock
        key={scenario.id}
        expectedText={scenario.idealPhrase}
        passThreshold={passThreshold}
        label="Ваш ответ по-английски"
        onSpokenTextChange={setSpoken}
        onScore={(s) => setSpoken(s.normalizedSpoken || spoken)}
      />
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      <FloatingButton title="Отправить на оценку ИИ" tone="green" onPress={submit} disabled={!spoken.trim()} />
      <Text style={lessonCard.hint}>
        Ситуация {idx + 1} / {content.scenarios.length}
      </Text>
    </View>
  );
}

export function Lesson3QuizStep({
  content,
  titleRu,
  onComplete,
}: {
  content: Lesson3StructuredContent;
  titleRu: string;
  onComplete: (score: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const q = content.quizQuestions[idx];

  const pick = (i: number) => {
    const hit = i === q.correctIndex;
    const nextCorrect = correct + (hit ? 1 : 0);
    setCorrect(nextCorrect);
    if (idx >= content.quizQuestions.length - 1) {
      const pct = Math.round((nextCorrect / content.quizQuestions.length) * 100);
      onComplete(pct);
    } else setIdx((n) => n + 1);
  };

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{titleRu}</Text>
      <Text style={styles.quizQ}>{q.questionRu}</Text>
      {q.options.map((opt, i) => (
        <FloatingButton key={opt} title={opt} tone="blue" onPress={() => pick(i)} />
      ))}
      <Text style={lessonCard.hint}>
        Вопрос {idx + 1} / {content.quizQuestions.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  imageMatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  imgTilePressable: {
    borderWidth: 2,
    borderColor: colors.greenDark,
  },
  matchCols: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1, gap: spacing.sm },
  tile: {
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.blue,
  },
  tileText: { fontWeight: '800', color: colors.textOnBrand, textAlign: 'center' },
  tileOk: { backgroundColor: colors.mastery.good, borderColor: colors.mastery.goodBorder },
  tileOn: { borderColor: colors.black, borderWidth: 3 },
  audioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  audioBtn: { minWidth: 72 },
  assignRow: { gap: spacing.xs },
  assignLabel: { fontWeight: '800', fontSize: 16 },
  numRow: { flexDirection: 'row', gap: spacing.sm },
  numChip: {
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.md,
    padding: spacing.sm,
    minWidth: 40,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  numOn: { backgroundColor: colors.green, borderColor: colors.greenDark },
  numActive: { borderColor: colors.black },
  numText: { fontWeight: '900', color: colors.textPrimary },
  feedback: { fontWeight: '600', lineHeight: 20, color: colors.textPrimary },
  quizQ: { fontSize: 20, fontWeight: '900', textAlign: 'center', color: colors.textPrimary },
});