import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '@/theme/theme';

type SecureTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** true — маскировать как пароль; для логина тоже можно переключать «глаз». */
  secureDefault?: boolean;
};

export function SecureTextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureDefault = false,
}: SecureTextFieldProps) {
  const [visible, setVisible] = useState(!secureDefault);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Скрыть' : 'Показать'}
          onPress={() => setVisible((v) => !v)}
          style={styles.eyeBtn}
        >
          <Text style={styles.eye}>{visible ? '🙈' : '👁'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundAlt,
    paddingRight: spacing.xs,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeBtn: {
    padding: spacing.sm,
    minWidth: 44,
    alignItems: 'center',
  },
  eye: {
    fontSize: 20,
  },
});