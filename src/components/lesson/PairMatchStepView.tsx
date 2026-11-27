import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import type { PairMatchStep } from '@/types/lessonSteps';
import { colors, floatingShadow, radii, spacing } from '@/theme/theme';
import { MethodologyNotice } from './MethodologyNotice';
import { playLessonAudio } from './playLessonAudio';
import { lessonCard } from './lessonStyles';

type Props = {
  step: PairMatchStep;
  onComplete: (scorePercent: number) => void;
};

export function PairMatchStepView({ step, onComplete }: Props) {
  const [leftPick, setLeftPick] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(false);

  const isOverview = step.pairs.length === 0 && Boolean(step.overviewCard);
  const rights = useMemo(() => {
    const items = step.pairs.map((p) => ({ id: p.id, label: p.rightLabel }));
    return [...items].sort((a, b) => a.label.localeCompare(b.label) + (a.id > b.id ? 1 : -1) * 0.001);
  }, [step.pairs]);

  const tryRight = (pairId: string) => {
    if (!leftPick || matched.has(pairId)) return;
    if (pairId === leftPick) {
      const next = new Set(matched);
      next.add(pairId);
      setMatched(next);
      setLeftPick(null);
      if (next.size >= step.pairs.length) {
        onComplete(100);
      }
    } else {
      setWrong(true);
      setTimeout(() => {
        setWrong(false);
        setLeftPick(null);
      }, 500);
    }
  };

  if (isOverview) {
    return (
      <View style={lessonCard.card}>
        <Text style={lessonCard.title}>{step.titleRu}</Text>
        {step.instructionsRu ? <Text style={lessonCard.instructions}>{step.instructionsRu}</Text> : null}
        <Text style={[lessonCard.heroDisplay, { fontSize: 22, lineHeight: 32 }]}>{step.overviewCard}</Text>
        <FloatingButton title="Перейти к парам" tone="green" size="lg" onPress={() => onComplete(100)} />
      </View>
    );
  }

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{step.titleRu}</Text>
      {step.instructionsRu ? <Text style={lessonCard.instructions}>{step.instructionsRu}</Text> : null}
      {step.methodologyNoteRu ? (
        <MethodologyNotice title="Правило" text={step.methodologyNoteRu} />
      ) : null}

      <View style={styles.cols}>
        <View style={styles.col}>
          <Text style={styles.colHead}>Слева</Text>
          {step.pairs.map((p) => {
            const done = matched.has(p.id);
            const active = leftPick === p.id;
            return (
              <Pressable
                key={p.id}
                disabled={done}
                onPress={() => setLeftPick(p.id)}
                style={[
                  styles.tile,
                  floatingShadow,
                  done && styles.tileOk,
                  active && styles.tileActive,
                ]}
              >
                <Text style={styles.tileText}>{p.leftLabel}</Text>
                {p.leftSpeakText ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      playLessonAudio(p.leftSpeakText!);
                    }}
                    hitSlop={8}
                  >
                    <Text style={styles.play}>🔊</Text>
                  </Pressable>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.col}>
          <Text style={styles.colHead}>Справа</Text>
          {rights.map((r) => {
            const done = matched.has(r.id);
            return (
              <Pressable
                key={r.id + r.label}
                disabled={done}
                onPress={() => tryRight(r.id)}
                style={[styles.tile, floatingShadow, done && styles.tileOk, wrong && styles.tileBad]}
              >
                <Text style={styles.tileText}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cols: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1, gap: spacing.sm },
  colHead: { fontWeight: '800', textAlign: 'center', color: colors.textSecondary },
  tile: {
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileText: { fontWeight: '800', color: colors.textOnBrand, fontSize: 15, flexShrink: 1 },
  play: { fontSize: 18 },
  tileOk: { backgroundColor: colors.mastery.good, borderColor: colors.mastery.goodBorder },
  tileActive: { borderColor: colors.black, borderWidth: 3 },
  tileBad: { borderColor: '#C62828' },
});