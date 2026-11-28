import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { colors, floatingShadow, radii, spacing } from '@/theme/theme';
import {
  isAnswerCorrect,
  shuffleArray,
  SPACE_TILE,
  targetToTiles,
  tilesToAnswer,
} from './lesson3Utils';

type Props = {
  titleRu: string;
  promptRu: string;
  target: string;
  withSpaces?: boolean;
  onComplete: (scorePercent: number) => void;
};

export function Lesson3LetterBuild({ titleRu, promptRu, target, withSpaces, onComplete }: Props) {
  const pool = useMemo(
    () => shuffleArray(targetToTiles(target, Boolean(withSpaces)), target),
    [target, withSpaces],
  );
  const slotCount = target.length;
  const [slots, setSlots] = useState<string[]>(Array(slotCount).fill(''));
  const [poolLeft, setPoolLeft] = useState<string[]>(pool);
  const [ok, setOk] = useState(false);

  const pickTile = (tile: string, index: number) => {
    if (ok) return;
    const emptyIdx = slots.findIndex((s) => !s);
    if (emptyIdx < 0) return;
    const nextSlots = [...slots];
    nextSlots[emptyIdx] = tile;
    setSlots(nextSlots);
    setPoolLeft((p) => p.filter((_, i) => i !== index));
  };

  const clearSlot = (idx: number) => {
    if (ok) return;
    const tile = slots[idx];
    if (!tile) return;
    const next = [...slots];
    next[idx] = '';
    setSlots(next);
    setPoolLeft((p) => [...p, tile]);
  };

  const check = () => {
    if (isAnswerCorrect(target, slots)) {
      setOk(true);
      setTimeout(() => onComplete(100), 500);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{titleRu}</Text>
      <Text style={styles.prompt}>{promptRu}</Text>
      <View style={styles.slots}>
        {slots.map((ch, i) => (
          <Pressable key={i} onPress={() => clearSlot(i)} style={[styles.slot, ok && styles.slotOk]}>
            <Text style={styles.slotText}>{ch === SPACE_TILE ? '␣' : ch || '·'}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.preview}>{tilesToAnswer(slots) || '—'}</Text>
      <View style={styles.pool}>
        {poolLeft.map((tile, i) => (
          <Pressable key={`${tile}-${i}`} onPress={() => pickTile(tile, i)} style={[styles.tile, floatingShadow]}>
            <Text style={styles.tileText}>{tile === SPACE_TILE ? '␣' : tile}</Text>
          </Pressable>
        ))}
      </View>
      <FloatingButton title="Проверить" tone="green" onPress={check} disabled={slots.some((s) => !s)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  prompt: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  slot: {
    minWidth: 44,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.blueDark,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  slotOk: { borderColor: colors.greenDark, backgroundColor: colors.mastery.good },
  slotText: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  preview: { textAlign: 'center', fontWeight: '700', color: colors.textSecondary },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  tile: {
    borderWidth: 2,
    borderColor: colors.greenDark,
    backgroundColor: colors.green,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tileText: { fontSize: 18, fontWeight: '900', color: colors.textOnBrand },
});