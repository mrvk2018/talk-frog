import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PinPad } from '@/components/admin/PinPad';
import { SecureTextField } from '@/components/admin/SecureTextField';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { ADMIN_DEMO_LOGIN } from '@/config/admin';
import { adminAuthService } from '@/services/AdminAuthService';
import { colors, floatingShadow, radii, spacing } from '@/theme/theme';

type AdminMode = 'loading' | 'login' | 'create_pin' | 'confirm_pin' | 'pin' | 'dashboard';

const SECTIONS = [
  'Промпты ИИ-учителя (Gemini 3.8)',
  'Настройка произношения (Порог Левенштейна %)',
  'Управление уроками и объявлениями',
  'Пользователи и тарифы',
] as const;

const MAX_PIN_ATTEMPTS = 5;

export default function AdminScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AdminMode>('loading');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_PIN_ATTEMPTS);

  const syncMode = useCallback(() => {
    const route = adminAuthService.initialRoute();
    setMode(route === 'login' ? 'login' : route === 'pin' ? 'pin' : 'dashboard');
    setAttemptsLeft(MAX_PIN_ATTEMPTS - adminAuthService.getPinAttempts());
  }, []);

  useEffect(() => {
    adminAuthService.hydrate().then(syncMode);
  }, [syncMode]);

  const submitLogin = async () => {
    setLoginError('');
    const ok = await adminAuthService.verifyCredentials(login, password);
    if (!ok) {
      setLoginError('Неверный логин или пароль.');
      return;
    }
    setPin('');
    setPinConfirm('');
    setMode('create_pin');
  };

  const submitCreatePin = () => {
    if (!/^\d{4}$/.test(pin)) {
      setPinError('PIN должен содержать 4 цифры.');
      return;
    }
    setPinError('');
    setMode('confirm_pin');
    setPinConfirm('');
  };

  const submitConfirmPin = async () => {
    if (pinConfirm !== pin) {
      setPinError('PIN не совпал. Попробуйте снова.');
      setMode('create_pin');
      setPin('');
      return;
    }
    await adminAuthService.savePin(pin);
    setMode('dashboard');
  };

  useEffect(() => {
    if (mode !== 'pin' || pin.length < 4) return;
    (async () => {
      const ok = await adminAuthService.verifyPin(pin);
      if (ok) {
        setPin('');
        setPinError('');
        setMode('dashboard');
        return;
      }
      setPin('');
      const attempts = adminAuthService.getPinAttempts();
      if (attempts >= MAX_PIN_ATTEMPTS) {
        setPinError('Превышен лимит попыток. Требуется вход по логину и паролю.');
        setMode('login');
        setAttemptsLeft(MAX_PIN_ATTEMPTS);
        return;
      }
      setAttemptsLeft(MAX_PIN_ATTEMPTS - attempts);
      setPinError('Неверный PIN.');
    })();
  }, [mode, pin]);

  const resetPinFlow = async () => {
    await adminAuthService.clearPinAndAttempts();
    setPin('');
    setPinError('');
    setMode('login');
  };

  const signOut = () => {
    adminAuthService.signOut();
    setMode(adminAuthService.hasPin() ? 'pin' : 'login');
  };

  if (mode === 'loading') {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Загрузка админки…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
      <Text style={styles.brand}>TalkFrog Admin</Text>
      <Text style={styles.hint}>Доступ: 5 тапов по логотипу на главной</Text>

      {mode === 'login' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Вход Эли и Влад</Text>
          <SecureTextField
            label="Логин"
            value={login}
            onChangeText={setLogin}
            placeholder={ADMIN_DEMO_LOGIN}
            secureDefault={false}
          />
          <SecureTextField
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureDefault
          />
          {loginError ? <Text style={styles.error}>{loginError}</Text> : null}
          <Text style={styles.demoNote}>
            Демо: логин и пароль из EXPO_PUBLIC_ADMIN_DEMO_* или значения по умолчанию в src/config/admin.ts
          </Text>
          <FloatingButton title="Войти" tone="blue" onPress={submitLogin} />
          <FloatingButton title="На главную" tone="green" onPress={() => router.replace('/')} />
        </View>
      ) : null}

      {mode === 'create_pin' ? (
        <View style={styles.card}>
          <PinPad value={pin} onChange={setPin} title="Придумайте 4-значный PIN-код" error={pinError} />
          <FloatingButton title="Далее" tone="green" onPress={submitCreatePin} disabled={pin.length < 4} />
        </View>
      ) : null}

      {mode === 'confirm_pin' ? (
        <View style={styles.card}>
          <PinPad value={pinConfirm} onChange={setPinConfirm} title="Повторите PIN-код" error={pinError} />
          <FloatingButton title="Сохранить PIN" tone="green" onPress={submitConfirmPin} disabled={pinConfirm.length < 4} />
        </View>
      ) : null}

      {mode === 'pin' ? (
        <View style={styles.card}>
          <PinPad
            value={pin}
            onChange={setPin}
            title="Введите PIN-код"
            error={pinError}
            attemptsLeft={attemptsLeft}
          />
          <FloatingButton title="Сбросить PIN / Войти по паролю" tone="blue" onPress={resetPinFlow} />
          <FloatingButton title="На главную" tone="green" onPress={() => router.replace('/')} />
        </View>
      ) : null}

      {mode === 'dashboard' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Рабочее пространство</Text>
          {SECTIONS.map((title) => (
            <View key={title} style={[styles.sectionCard, floatingShadow]}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionHint}>Контент раздела — на следующих шагах</Text>
            </View>
          ))}
          <FloatingButton title="Выйти из админки" tone="blue" onPress={signOut} />
          <FloatingButton title="На главную" tone="green" onPress={() => router.replace('/')} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.black,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.blueDark,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  error: {
    color: '#C62828',
    fontWeight: '600',
    fontSize: 14,
  },
  demoNote: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.greenDark,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.textPrimary,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});