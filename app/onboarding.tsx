import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { LegalDocModal } from '@/components/ui/LegalDocModal';
import { authService } from '@/services/AuthService';
import { permissionsService } from '@/services/PermissionsService';
import type { AuthProvider } from '@/types/auth';
import { colors, radii, spacing } from '@/theme/theme';

const TERMS_TEXT = `Пользовательское соглашение TalkFrog (демо-версия).

Вы соглашаетесь использовать приложение для обучения английскому языку. Контент предоставляется преподавателями Эли и Влад. Запрещено нарушать права третьих лиц и обходить технические ограничения гостевого доступа.

Политика конфиденциальности: мы обрабатываем минимум данных, необходимых для обучения и синхронизации прогресса. Полная юридическая редакция будет опубликована перед релизом в сторах.`;

const VOICE_TEXT = `Согласие на обработку голосовых данных.

Для оценки произношения TalkFrog запрашивает доступ к микрофону. Записи используются только для обучения и могут обрабатываться на защищённых серверах (в соответствии с PIPA, 152-ФЗ и требованиями App Store / Google Play). Вы можете отозвать согласие и удалить аккаунт в настройках профиля.`;

function CheckboxRow({
  checked,
  onToggle,
  label,
  linkText,
  onLink,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  linkText: string;
  onLink: () => void;
}) {
  return (
    <View style={styles.checkRow}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onToggle} style={styles.checkbox}>
        <View style={[styles.checkBoxInner, checked && styles.checkBoxInnerActive]}>
          {checked ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
      </Pressable>
      <Text style={styles.checkLabel}>
        {label}{' '}
        <Text onPress={onLink} style={styles.link}>
          {linkText}
        </Text>
      </Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [termsChecked, setTermsChecked] = useState(false);
  const [voiceChecked, setVoiceChecked] = useState(false);
  const [modal, setModal] = useState<'terms' | 'voice' | null>(null);
  const [micStep, setMicStep] = useState(false);
  const [micStatus, setMicStatus] = useState<string>('');

  const canSignIn = termsChecked && voiceChecked;

  useEffect(() => {
    authService.hydrate().then(() => {
      const c = authService.getProfile()?.consents;
      setTermsChecked(Boolean(c?.termsAndPrivacyAcceptedAt));
      setVoiceChecked(Boolean(c?.voiceDataConsentAt));
    });
  }, []);

  const persistTerms = useCallback(async (next: boolean) => {
    setTermsChecked(next);
    await authService.setConsentsPartial({ termsAccepted: next });
  }, []);

  const persistVoice = useCallback(async (next: boolean) => {
    setVoiceChecked(next);
    await authService.setConsentsPartial({ voiceAccepted: next });
  }, []);

  const finishOnboarding = () => {
    router.replace('/');
  };

  const handleSignIn = async (provider: AuthProvider) => {
    if (!canSignIn) return;
    await authService.signInDemo(provider);
    setMicStep(true);
    const snap = await permissionsService.checkAll();
    if (snap.microphone === 'granted') {
      await authService.setMicrophoneStep(true, false);
      finishOnboarding();
    }
  };

  const requestMic = async () => {
    const result = await permissionsService.request('microphone');
    await authService.setMicrophoneStep(true, false);
    setMicStatus(
      result === 'granted'
        ? 'Микрофон разрешён — можно проходить уроки с озвучкой.'
        : 'Доступ не получен. Вы сможете включить микрофон позже в настройках системы.',
    );
    setTimeout(finishOnboarding, 900);
  };

  const deferMic = async () => {
    await authService.setMicrophoneStep(true, true);
    finishOnboarding();
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>TalkFrog</Text>
      <Text style={styles.welcome}>
        Добро пожаловать! Эли и Влад проведут вас от нуля до уверенного английского — шаг за шагом, с заботой о
        произношении.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Юридические согласия</Text>
        <CheckboxRow
          checked={termsChecked}
          onToggle={() => persistTerms(!termsChecked)}
          label="Я принимаю"
          linkText="Пользовательское соглашение и Политику конфиденциальности"
          onLink={() => setModal('terms')}
        />
        <CheckboxRow
          checked={voiceChecked}
          onToggle={() => persistVoice(!voiceChecked)}
          label="Я даю отдельное согласие на"
          linkText="обработку голосовых данных"
          onLink={() => setModal('voice')}
        />
      </View>

      {!micStep ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Как войти</Text>
          <FloatingButton
            title="Попробовать как гость"
            subtitle="Прогресс сохранится на устройстве, действуют гостевые лимиты"
            tone="green"
            disabled={!canSignIn}
            onPress={() => handleSignIn('guest')}
            style={styles.authBtn}
          />
          <View style={styles.authGrid}>
            <FloatingButton title="Google" tone="blue" disabled={!canSignIn} onPress={() => handleSignIn('google')} style={styles.gridBtn} />
            <FloatingButton title="Apple ID" tone="blue" disabled={!canSignIn} onPress={() => handleSignIn('apple')} style={styles.gridBtn} />
            <FloatingButton title="Telegram" tone="blue" disabled={!canSignIn} onPress={() => handleSignIn('telegram')} style={styles.gridBtn} />
            <FloatingButton title="Email" tone="blue" disabled={!canSignIn} onPress={() => handleSignIn('email')} style={styles.gridBtn} />
          </View>
          {!canSignIn ? (
            <Text style={styles.hint}>Отметьте оба согласия, чтобы продолжить.</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Микрофон для уроков</Text>
          <Text style={styles.micText}>
            TalkFrog слушает ваше произношение, чтобы ИИ-преподаватель мог подсказать точнее. Система покажет своё
            окно разрешения — мы объясняем зачем это нужно.
          </Text>
          <FloatingButton title="Разрешить микрофон" tone="green" onPress={requestMic} style={styles.authBtn} />
          <FloatingButton title="Настроить позже" tone="blue" onPress={deferMic} style={styles.authBtn} />
          {micStatus ? <Text style={styles.micStatus}>{micStatus}</Text> : null}
        </View>
      )}

      <LegalDocModal
        visible={modal === 'terms'}
        title="Соглашение и конфиденциальность"
        body={TERMS_TEXT}
        onClose={() => setModal(null)}
      />
      <LegalDocModal visible={modal === 'voice'} title="Голосовые данные" body={VOICE_TEXT} onClose={() => setModal(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.green,
  },
  welcome: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#D5DCE2',
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    paddingTop: 2,
  },
  checkBoxInner: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.blueDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  checkBoxInnerActive: {
    backgroundColor: colors.green,
    borderColor: colors.greenDark,
  },
  checkMark: {
    color: colors.textOnBrand,
    fontWeight: '700',
    fontSize: 14,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  link: {
    color: colors.blueDark,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  authBtn: {
    width: '100%',
  },
  authGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  gridBtn: {
    width: '48%',
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  micText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  micStatus: {
    fontSize: 13,
    color: colors.greenDark,
    textAlign: 'center',
    fontWeight: '600',
  },
});