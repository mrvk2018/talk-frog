import { StyleSheet, Text, View } from 'react-native';
import { AnnouncementBanner } from '@/components/ui/AnnouncementBanner';
import { colors, radii, spacing } from '@/theme/theme';

type LessonProgressBarProps = {
  stageLabel: string;
  stepIndex: number;
  totalSteps: number;
  isFinalTest?: boolean;
};

export function LessonProgressBar({ stageLabel, stepIndex, totalSteps, isFinalTest }: LessonProgressBarProps) {
  const pct = totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;

  return (
    <View style={styles.wrap}>
      {isFinalTest ? (
        <AnnouncementBanner
          title="ФИНАЛЬНЫЙ ТЕСТ (A1)"
          message="Проверьте, что вы усвоили материал урока. Будьте внимательны!"
        />
      ) : (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{stageLabel}</Text>
          <Text style={styles.badgeSub}>
            Шаг {stepIndex + 1} из {totalSteps}
          </Text>
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  badge: {
    backgroundColor: colors.blue,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.blueDarker,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  badgeText: {
    color: colors.textOnBrand,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  badgeSub: {
    color: colors.textOnBrand,
    fontWeight: '600',
    fontSize: 13,
    marginTop: 2,
  },
  track: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.mastery.locked,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.mastery.lockedBorder,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: radii.pill,
  },
});