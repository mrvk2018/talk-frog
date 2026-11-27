import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { speechRecognitionService } from '@/services/SpeechRecognitionService';
import type { SpeechRecognitionStatus } from '@/types/speech';
import { colors, spacing } from '@/theme/theme';
import { calculatePronunciationScore, type PronunciationScore } from '@/utils/levenshtein';
import { lessonCard } from './lessonStyles';

type PronunciationPracticeBlockProps = {
  expectedText: string;
  passThreshold: number;
  onScore?: (score: PronunciationScore) => void;
  label?: string;
};

export function PronunciationPracticeBlock({
  expectedText,
  passThreshold,
  onScore,
  label = 'Практика произношения',
}: PronunciationPracticeBlockProps) {
  const [spokenText, setSpokenText] = useState('');
  const [useTyping, setUseTyping] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<SpeechRecognitionStatus>('idle');
  const [score, setScore] = useState<PronunciationScore | null>(null);

  useEffect(() => {
    const unsub = speechRecognitionService.subscribe((status) => setSpeechStatus(status));
    return unsub;
  }, []);

  const onListen = async () => {
    await speechRecognitionService.startListening((text) => setSpokenText(text));
  };

  const runCheck = () => {
    const expected = expectedText.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    const next = calculatePronunciationScore(expected, spokenText, passThreshold);
    setScore(next);
    onScore?.(next);
  };

  return (
    <View style={styles.wrap}>
      <Text style={lessonCard.title}>{label}</Text>
      <FloatingButton
        title={speechStatus === 'listening' ? 'Слушаю…' : '🎤 Нажать и сказать'}
        tone="green"
        onPress={onListen}
        disabled={speechStatus === 'listening'}
      />
      <FloatingButton
        title={useTyping ? 'Скрыть текстовый ввод' : '⌨️ Ввести текстом'}
        tone="blue"
        onPress={() => setUseTyping((v) => !v)}
      />
      {speechStatus === 'error' ? (
        <Text style={styles.err}>{speechRecognitionService.getLastError()}</Text>
      ) : null}
      {useTyping ? (
        <TextInput
          value={spokenText}
          onChangeText={setSpokenText}
          placeholder="What you said…"
          style={lessonCard.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : null}
      <FloatingButton title="Проверить" tone="green" onPress={runCheck} disabled={!spokenText.trim()} />
      {score ? (
        <Text style={[styles.score, score.isPassed ? styles.scoreOk : styles.scoreBad]}>
          Совпадение: {score.similarityPercent}% {score.isPassed ? '✓' : '· повторите'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  err: { color: '#C62828', fontWeight: '600', fontSize: 13 },
  score: { fontWeight: '800', fontSize: 16, textAlign: 'center' },
  scoreOk: { color: colors.greenDark },
  scoreBad: { color: '#C62828' },
});