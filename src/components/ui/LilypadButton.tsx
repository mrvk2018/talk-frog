import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import type { LessonMasteryLevel } from '@/types/lesson';
import { colors, floatingShadow, getLessonMasteryColors } from '@/theme/theme';

type LilypadButtonProps = {
  side: 'left' | 'right';
  number: number;
  title: string;
  masteryLevel: LessonMasteryLevel;
  locked?: boolean;
  onPress?: () => void;
};

const PAD_WIDTH = 168;
const PAD_HEIGHT = 108;

/** Лист с узким «хвостом» к центру экрана */
const LILY_PATH =
  'M 18 54 C 20 18, 95 6, 138 36 C 168 58, 160 88, 118 98 C 82 106, 42 96, 22 74 C 10 62, 12 68, 18 54 Z';

const LILY_PATH_RIGHT =
  'M 150 54 C 148 18, 73 6, 30 36 C 0 58, 8 88, 50 98 C 86 106, 126 96, 146 74 C 158 62, 156 68, 150 54 Z';

export function LilypadButton({
  side,
  number,
  title,
  masteryLevel,
  locked = false,
  onPress,
}: LilypadButtonProps) {
  const palette = locked
    ? { fill: colors.mastery.locked, stroke: colors.mastery.lockedBorder }
    : getLessonMasteryColors(masteryLevel);
  const path = side === 'left' ? LILY_PATH : LILY_PATH_RIGHT;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={locked}
      style={({ pressed }) => [
        styles.wrap,
        side === 'left' ? styles.sideLeft : styles.sideRight,
        floatingShadow,
        pressed && !locked && styles.pressed,
        locked && styles.lockedWrap,
      ]}
    >
      <Svg width={PAD_WIDTH} height={PAD_HEIGHT} viewBox={`0 0 ${PAD_WIDTH} ${PAD_HEIGHT}`}>
        <G>
          <Path d={path} fill={palette.fill} stroke={palette.stroke} strokeWidth={2.5} />
          <Ellipse
            cx={PAD_WIDTH / 2}
            cy={PAD_HEIGHT / 2 + 4}
            rx={26}
            ry={18}
            fill={colors.greenDarker}
            opacity={0.14}
          />
          <Ellipse cx={PAD_WIDTH / 2 - 10} cy={PAD_HEIGHT / 2 - 2} rx={7} ry={9} fill={colors.greenDarker} opacity={0.13} />
          <Ellipse cx={PAD_WIDTH / 2 + 12} cy={PAD_HEIGHT / 2 - 2} rx={7} ry={9} fill={colors.greenDarker} opacity={0.13} />
        </G>
      </Svg>
      <View style={styles.labelOverlay} pointerEvents="none">
        <Text style={styles.number}>{number}.</Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {locked ? <Text style={styles.lock}>🔒 Гость</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: PAD_WIDTH,
    height: PAD_HEIGHT,
    marginVertical: 10,
  },
  sideLeft: {
    alignSelf: 'flex-start',
  },
  sideRight: {
    alignSelf: 'flex-end',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  lockedWrap: {
    opacity: 0.82,
  },
  labelOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 6,
  },
  number: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
  lock: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});