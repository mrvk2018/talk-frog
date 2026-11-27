import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import type { AudioChoiceStep } from '@/types/lessonSteps';
import { colors, floatingShadow, radii, spacing } from '@/theme/theme';
import { playLessonAudio } from './playLessonAudio';
import { lessonCard } from './lessonStyles';

type Props = {
  step: AudioChoiceStep;
  onComplete: (scorePercent: number) => void;
};

export function AudioChoiceStepView({ step, onComplete }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<'idle' | 'ok' | 'bad'>('idle');

  const onPick = (index: number) => {
    if (result === 'ok') return;
    setPicked(index);
    if (index === step.correctIndex) {
      setResult('ok');
      setTimeout(() => onComplete(100), 600);
    } else {
      setResult('bad');
      setTimeout(() => {
        setResult('idle');
        setPicked(null);
      }, 700);
    }
  };

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{step.titleRu}</Text>
      {step.instructionsRu ? <Text style={lessonCard.instructions}>{step.instructionsRu}</Text> : null}

      <FloatingButton
        title="🔊 Прослушать звук"
        tone="blue"
        size="hero"
        onPress={() => playLessonAudio(step.speakText)}
      />
      {step.transcription && result !== 'ok' ? (
        <Text style={[lessonCard.hint, { opacity: 0.35 }]}>/ скрыто /</Text>
      ) : null}

      <View style={lessonCard.choiceRow}>
        {step.choices.map((choice, i) => {
          const isPicked = picked === i;
          const isOk = result === 'ok' && i === step.correctIndex;
          const isBad = result === 'bad' && isPicked;
          return (
            <Pressable
              key={choice + i}
              onPress={() => onPick(i)}
              style={[
                styles.choice,
                floatingShadow,
                isOk && lessonCard.choiceOk,
                isBad && lessonCard.choiceBad,
              ]}
            >
              <Text style={styles.choiceText}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  choice: {
    minWidth: 72,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.greenDark,
    backgroundColor: colors.green,
    alignItems: 'center',
  },
  choiceText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textOnBrand,
  },
});