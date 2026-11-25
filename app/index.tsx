import { useState } from 'react';
import { Video, ResizeMode } from 'expo-av';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AnnouncementBanner } from '@/components/ui/AnnouncementBanner';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/hooks/useAuth';
import { appSettingsService } from '@/services/AppSettingsService';
import { useLogoAdminEasterEgg } from '@/hooks/useLogoAdminEasterEgg';
import { authService } from '@/services/AuthService';
import { colors, radii, spacing } from '@/theme/theme';

const COURSES = [1, 2, 3, 4, 5, 6] as const;
const { height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { statusLabel } = useAuth();
  const { settings } = useAppSettings();
  const showAnnouncement =
    settings.home_announcement_active === 'true' && settings.home_announcement_text.trim().length > 0;
  const videoUrl = settings.welcome_video_url.trim();
  const hasVideo = /^https?:\/\//i.test(videoUrl);
  const { onLogoPress } = useLogoAdminEasterEgg();
  const [videoOpen, setVideoOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await authService.signOut();
    setProfileOpen(false);
    router.replace('/onboarding');
  };

  const handleDelete = async () => {
    await authService.deleteAccountAndResetOnboarding();
    setProfileOpen(false);
    router.replace('/onboarding');
  };

  const resetOnboarding = async () => {
    await authService.deleteAccountAndResetOnboarding();
    setProfileOpen(false);
    router.replace('/onboarding');
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={onLogoPress} style={styles.logoBlock}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoEmoji}>🐸</Text>
              <Text style={styles.logoHint}>PNG</Text>
            </View>
            <Text style={styles.appName}>TalkFrog</Text>
          </Pressable>

          <FloatingButton
            title="Видео"
            subtitle="Эли и Влад"
            tone="blue"
            size="md"
            onPress={() => setVideoOpen(true)}
            style={styles.videoBtn}
          />
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Методика с нуля</Text>
          <Text style={styles.infoText}>
            Короткие уроки, живое произношение и ИИ-преподаватель, который подстраивается под ваш темп. Начните с
            «Нулевого уровня» — это главный путь Эли и Влада.
          </Text>
          {showAnnouncement ? (
            <AnnouncementBanner title="Важно" message={settings.home_announcement_text.trim()} />
          ) : null}
        </View>

        <View style={[styles.heroZone, { minHeight: WINDOW_HEIGHT * 0.36 }]}>
          <FloatingButton
            title="Нулевой уровень"
            subtitle={"Старт методики Эли и Влада • ABC → I'm 20"}
            tone="green"
            size="hero"
            onPress={() => router.push('/zero-level')}
            style={styles.heroButton}
          />
        </View>

        <View style={styles.courseGrid}>
          {COURSES.map((n) => (
            <View key={n} style={styles.courseCell}>
              <FloatingButton
                title={`${n} курс`}
                subtitle="🔒 Скоро / По подписке"
                tone="green"
                disabled
                fillColor={colors.mastery.locked}
                borderColor={colors.mastery.lockedBorder}
                textColor={colors.textPrimary}
                onPress={() => {}}
                style={styles.courseBtn}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <Pressable accessibilityRole="button" style={styles.profileFab} onPress={() => setProfileOpen(true)}>
        <Text style={styles.profileFabText}>👤</Text>
      </Pressable>

      <Modal visible={videoOpen} animationType="fade" transparent onRequestClose={() => setVideoOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.videoModal}>
            <Text style={styles.modalTitle}>Приветствие от преподавателей</Text>
            {hasVideo ? (
              <Video
                source={{ uri: videoUrl }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderText}>Видео Эли и Влада</Text>
                <Text style={styles.videoSub}>
                  Задайте ссылку welcome_video_url в админке — превью появится здесь.
                </Text>
              </View>
            )}
            <FloatingButton title="Закрыть" tone="blue" onPress={() => setVideoOpen(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={profileOpen} animationType="slide" transparent onRequestClose={() => setProfileOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.profileModal}>
            <Text style={styles.modalTitle}>Профиль</Text>
            <Text style={styles.profileStatus}>Статус: {statusLabel}</Text>
            <FloatingButton title="Выйти" tone="blue" onPress={handleSignOut} style={styles.profileAction} />
            <FloatingButton title="Удалить аккаунт" tone="green" onPress={handleDelete} style={styles.profileAction} />
            <FloatingButton title="Сбросить онбординг (тест)" tone="blue" onPress={resetOnboarding} style={styles.profileAction} />
            <Pressable onPress={() => setProfileOpen(false)}>
              <Text style={styles.cancelLink}>Закрыть</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 56,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 22,
  },
  logoHint: {
    position: 'absolute',
    bottom: 2,
    fontSize: 8,
    color: colors.textOnBrand,
    fontWeight: '700',
    opacity: 0.85,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  videoBtn: {
    minWidth: 118,
  },
  infoBlock: {
    gap: spacing.md,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  heroZone: {
    justifyContent: 'center',
  },
  heroButton: {
    width: '100%',
    minHeight: 120,
  },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  courseCell: {
    width: '48%',
  },
  courseBtn: {
    width: '100%',
  },
  profileFab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.blueDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  profileFabText: {
    fontSize: 22,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,20,20,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  videoModal: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.blueDark,
  },
  profileModal: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.greenDark,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  videoPlayer: {
    width: '100%',
    height: 200,
    borderRadius: radii.lg,
    backgroundColor: colors.black,
  },
  videoPlaceholder: {
    height: 180,
    borderRadius: radii.lg,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
  },
  videoPlaceholderText: {
    color: colors.textOnBrand,
    fontWeight: '700',
    fontSize: 16,
  },
  videoSub: {
    color: '#B0BEC5',
    fontSize: 13,
    textAlign: 'center',
  },
  profileStatus: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  profileAction: {
    width: '100%',
  },
  cancelLink: {
    textAlign: 'center',
    marginTop: spacing.sm,
    color: colors.blueDark,
    fontWeight: '600',
  },
});