import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import type { CategorySortStep } from '@/types/lessonSteps';
import { colors, floatingShadow, radii, spacing } from '@/theme/theme';
import { MethodologyNotice } from './MethodologyNotice';
import { lessonCard } from './lessonStyles';

type Props = {
  step: CategorySortStep;
  onComplete: (scorePercent: number) => void;
};

export function CategorySortStepView({ step, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const shake = useRef(new Animated.Value(0)).current;

  const pool = useMemo(
    () => step.poolLetters.filter((l) => !Object.values(placed).includes(l)),
    [step.poolLetters, placed],
  );

  const runShake = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const tryPlace = (categoryId: string) => {
    if (!selected) return;
    const cat = step.categories.find((c) => c.id === categoryId);
    if (!cat) return;

    if (cat.letters.includes(selected)) {
      const nextPlaced = { ...placed, [selected]: categoryId };
      setPlaced(nextPlaced);
      setSelected(null);
      const allDone = step.poolLetters.every((l) => l in nextPlaced);
      if (allDone) {
        setTimeout(() => onComplete(100), 400);
      }
    } else {
      setWrongFlash(categoryId);
      runShake();
      setTimeout(() => setWrongFlash(null), 500);
    }
  };

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{step.titleRu}</Text>
      {step.instructionsRu ? <Text style={lessonCard.instructions}>{step.instructionsRu}</Text> : null}
      <MethodologyNotice
        title="Рифма"
        text="Буквы с похожим звучанием попадают в одну колонку — как рифма в стишке."
      />

      <View style={styles.columns}>
        {step.categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => tryPlace(cat.id)}
            style={[
              styles.column,
              wrongFlash === cat.id && styles.columnBad,
            ]}
          >
            <Text style={styles.colTitle}>{cat.labelRu}</Text>
            <Text style={styles.colIpa}>{cat.ipaLabel}</Text>
            <View style={styles.chips}>
              {cat.prefilled.map((l) => (
                <View key={`pf-${l}`} style={[styles.chip, styles.chipLocked]}>
                  <Text style={styles.chipText}>{l}</Text>
                </View>
              ))}
              {Object.entries(placed)
                .filter(([, cid]) => cid === cat.id)
                .map(([letter]) => (
                  <View key={letter} style={[styles.chip, styles.chipOk]}>
                    <Text style={styles.chipText}>{letter}</Text>
                  </View>
                ))}
            </View>
          </Pressable>
        ))}
      </View>

      <Animated.View style={[styles.pool, { transform: [{ translateX: shake }] }]}>
        <Text style={lessonCard.title}>Банк букв</Text>
        <View style={styles.chips}>
          {pool.map((l) => (
            <Pressable
              key={l}
              onPress={() => setSelected(l)}
              style={[styles.chip, selected === l && styles.chipSelected]}
            >
              <Text style={styles.chipText}>{l}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={lessonCard.hint}>
          {selected ? `Выбрано: ${selected}. Нажмите колонку.` : 'Нажмите букву, затем колонку.'}
        </Text>
      </Animated.View>

      {pool.length === 0 ? (
        <FloatingButton title="Готово" tone="green" size="lg" onPress={() => onComplete(100)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  column: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.blueDark,
    padding: spacing.sm,
    gap: spacing.xs,
    ...floatingShadow,
  },
  columnBad: {
    borderColor: '#C62828',
    backgroundColor: '#FFEBEE',
  },
  colTitle: { fontWeight: '800', fontSize: 13, color: colors.textPrimary, textAlign: 'center' },
  colIpa: { fontWeight: '700', fontSize: 12, color: colors.blueDark, textAlign: 'center' },
  pool: { gap: spacing.sm, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  chip: {
    borderWidth: 2,
    borderColor: colors.greenDark,
    borderRadius: radii.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.green,
    minWidth: 36,
    alignItems: 'center',
  },
  chipLocked: { backgroundColor: colors.mastery.locked, borderColor: colors.mastery.lockedBorder },
  chipOk: { backgroundColor: colors.mastery.good, borderColor: colors.mastery.goodBorder },
  chipSelected: { borderColor: colors.black, borderWidth: 3, transform: [{ scale: 1.05 }] },
  chipText: { fontWeight: '900', fontSize: 16, color: colors.textPrimary },
});