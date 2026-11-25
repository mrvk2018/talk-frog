import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SecureTextField } from '@/components/admin/SecureTextField';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { colors, radii, spacing } from '@/theme/theme';

type EmailAuthModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { email: string; password: string; isSignUp: boolean }) => Promise<void>;
};

export function EmailAuthModal({ visible, onClose, onSubmit }: EmailAuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await onSubmit({ email, password, isSignUp });
      setEmail('');
      setPassword('');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Email</Text>
          <View style={styles.tabs}>
            <Pressable onPress={() => setIsSignUp(true)} style={[styles.tab, isSignUp && styles.tabActive]}>
              <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>Регистрация</Text>
            </Pressable>
            <Pressable onPress={() => setIsSignUp(false)} style={[styles.tab, !isSignUp && styles.tabActive]}>
              <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>Вход</Text>
            </Pressable>
          </View>
          <SecureTextField label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" secureDefault={false} />
          <SecureTextField label="Пароль" value={password} onChangeText={setPassword} placeholder="••••••••" secureDefault />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <FloatingButton title={loading ? 'Подождите…' : isSignUp ? 'Создать аккаунт' : 'Войти'} tone="blue" onPress={handleSubmit} disabled={loading} />
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Отмена</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,20,20,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.blueDark,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.mastery.lockedBorder,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: colors.greenDark,
    backgroundColor: colors.green,
  },
  tabText: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textOnBrand,
  },
  error: {
    color: '#C62828',
    fontWeight: '600',
    fontSize: 14,
  },
  cancel: {
    textAlign: 'center',
    color: colors.blueDark,
    fontWeight: '600',
  },
});