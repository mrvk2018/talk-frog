import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { VisualChoiceStep } from '@/types/lessonSteps';
import { colors, floatingShadow, radii, spacing } from '@/theme/theme';
import { lessonCard } from './lessonStyles';

type Props = {
  step: VisualChoiceStep;
  onComplete: (scorePercent: number) => void;
};

export function VisualChoiceStepView({ step, onComplete }: Props) {
  const [result, setResult] = useState<'idle' | 'ok' | 'bad'>('idle');

  const onPick = (index: number) => {
    if (result === 'ok') return;
    if (index === step.correctIndex) {
      setResult('ok');
      setTimeout(() => onComplete(100), 500);
    } else {
      setResult('bad');
      setTimeout(() => setResult('idle'), 650);
    }
  };

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{step.titleRu}</Text>
      <Text style={lessonCard.instructions}>Выберите такую же букву (без звука).</Text>
      <Text style={[lessonCard.heroDisplay, { fontSize: 64 }]}>{step.targetLetter}</Text>
      <View style={lessonCard.choiceRow}>
        {step.choices.map((choice, i) => (
          <Pressable
            key={choice + i}
            onPress={() => onPick(i)}
            style={[
              styles.choice,
              floatingShadow,
              result === 'ok' && i === step.correctIndex && lessonCard.choiceOk,
              result === 'bad' && lessonCard.choiceBad,
            ]}
          >
            <Text style={styles.choiceText}>{choice}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  choice: {
    minWidth: 72,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.blueDark,
    backgroundColor: colors.blue,
    alignItems: 'center',
  },
  choiceText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textOnBrand,
  },
});