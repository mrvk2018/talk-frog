import { StyleSheet } from 'react-native';
import { colors, floatingShadow, radii, spacing } from '@/theme/theme';

export const lessonCard = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.greenDark,
    padding: spacing.md,
    gap: spacing.sm,
    ...floatingShadow,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  instructions: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  heroDisplay: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  ipa: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.blueDark,
    textAlign: 'center',
  },
  hint: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    fontSize: 16,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  choiceOk: {
    borderColor: colors.greenDarker,
    backgroundColor: colors.mastery.good,
  },
  choiceBad: {
    borderColor: '#C62828',
    backgroundColor: '#FFCDD2',
  },
  methodologyWrap: {
    marginBottom: spacing.xs,
  },
});