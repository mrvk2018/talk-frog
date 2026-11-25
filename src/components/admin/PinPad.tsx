import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/theme/theme';

type PinPadProps = {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
  title?: string;
  error?: string;
  attemptsLeft?: number;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'] as const;

export function PinPad({
  value,
  onChange,
  maxLength = 4,
  title,
  error,
  attemptsLeft,
}: PinPadProps) {
  const dots = Array.from({ length: maxLength }, (_, i) => i < value.length);

  const onKey = (key: string) => {
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === 'ok') return;
    if (value.length >= maxLength) return;
    onChange(value + key);
  };

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.dots}>
        {dots.map((filled, i) => (
          <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
        ))}
      </View>
      {attemptsLeft !== undefined ? (
        <Text style={styles.attempts}>Осталось попыток: {attemptsLeft}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.grid}>
        {KEYS.map((k) => (
          <Pressable
            key={k}
            style={[styles.key, (k === 'del' || k === 'ok') && styles.keyWide]}
            onPress={() => onKey(k)}
            disabled={k === 'ok'}
          >
            <Text style={styles.keyText}>
              {k === 'del' ? '⌫' : k === 'ok' ? '' : k}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.greenDark,
    backgroundColor: colors.background,
  },
  dotFilled: {
    backgroundColor: colors.green,
  },
  attempts: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  error: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '600',
    textAlign: 'center',
  },
  grid: {
    width: '100%',
    maxWidth: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  key: {
    width: 72,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.blueDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyWide: {
    width: 72,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textOnBrand,
  },
});