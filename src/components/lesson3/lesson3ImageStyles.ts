import { StyleSheet } from 'react-native';
import { colors, radii } from '@/theme/theme';

/** Вертикальные иллюстрации 3:4 — без обрезки (contain). */
export const lesson3IllustrationFrame = StyleSheet.create({
  frame: {
    width: '100%',
    maxWidth: 260,
    alignSelf: 'center',
    aspectRatio: 3 / 4,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#F4F7F9',
    borderWidth: 1,
    borderColor: colors.mastery.lockedBorder,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  frameGrid: {
    width: '47%',
    maxWidth: 200,
    aspectRatio: 3 / 4,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#F4F7F9',
    borderWidth: 1,
    borderColor: colors.mastery.lockedBorder,
  },
});