import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { LilypadButton } from '@/components/ui/LilypadButton';
import { authService } from '@/services/AuthService';
import { billingService, type BillingPlan, type BillingPlanId } from '@/services/BillingService';
import { lessonsProgressService, SCORE_BY_MASTERY } from '@/services/LessonsProgressService';
import type { LessonMasteryLevel, ZeroLevelLesson } from '@/types/lesson';
import { colors, radii, spacing } from '@/theme/theme';

const LEFT_IDS = ['z1', 'z3', 'z5', 'z7'];
const RIGHT_IDS = ['z2', 'z4', 'z6', 'z8'];

const READ_ME = `Как проходить «Нулевой уровень» (Эли и Влад)

1. Выберите кувшинку-урок сверху вниз, но в своём темпе.
2. Проговаривайте вслух — TalkFrog слушает микрофон и помогает с произношением.
3. Цвет листа показывает, насколько материал усвоен: от голубого «старт» до насыщенного зелёного «отлично».
4. Гости проходят первые уроки с лимитами; полный доступ — в тарифах.

Главное — короткие сессии и радость от маленьких побед. Мы рядом!`;

const AI_SIM_LABELS: { label: string; level: LessonMasteryLevel }[] = [
  { label: 'Не пройдено', level: 'not_started' },
  { label: 'Начальный', level: 'learning' },
  { label: 'Хорошо', level: 'good' },
  { label: 'Отлично', level: 'mastered' },
];

export default function ZeroLevelScreen() {
  const router = useRouter();
  const [lessons, setLessons] = useState<ZeroLevelLesson[]>([]);
  const [readOpen, setReadOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscriptionLabel, setSubscriptionLabel] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<ZeroLevelLesson | null>(null);
  const [restoreMsg, setRestoreMsg] = useState('');

  const refreshLessons = useCallback(() => {
    setLessons(lessonsProgressService.getLessons());
  }, []);

  useEffect(() => {
    lessonsProgressService.hydrate().then(refreshLessons);
    const unsub = lessonsProgressService.subscribe(refreshLessons);
    return unsub;
  }, [refreshLessons]);

  const openPlans = async () => {
    await billingService.hydrate();
    setPlans(billingService.getPlans());
    const sub = billingService.getSubscription();
    setSubscriptionLabel(
      sub.activePlanId ? `Активен план: ${sub.activePlanId} (${sub.source})` : 'Подписка не активна (демо)',
    );
    setPlansOpen(true);
  };

  const leftLessons = useMemo(
    () => LEFT_IDS.map((id) => lessons.find((l) => l.id === id)).filter(Boolean) as ZeroLevelLesson[],
    [lessons],
  );
  const rightLessons = useMemo(
    () => RIGHT_IDS.map((id) => lessons.find((l) => l.id === id)).filter(Boolean) as ZeroLevelLesson[],
    [lessons],
  );

  const isGuest = authService.getProfile()?.isGuest ?? false;

  const onLilyPress = (lesson: ZeroLevelLesson) => {
    const locked = Boolean(isGuest && lesson.isLockedForGuest);
    if (locked) {
      setSelectedLesson(lesson);
      return;
    }
    setSelectedLesson(lesson);
  };

  const applyAiSim = async (level: LessonMasteryLevel) => {
    if (!selectedLesson) return;
    await lessonsProgressService.updateMastery(selectedLesson.id, level, SCORE_BY_MASTERY[level]);
    setSelectedLesson(null);
  };

  const purchase = async (id: BillingPlanId) => {
    const state = await billingService.purchasePlan(id);
    setSubscriptionLabel(
      state.activePlanId ? `Активен план: ${state.activePlanId}` : 'Подписка не активна',
    );
  };

  const restore = async () => {
    const state = await billingService.restorePurchases();
    setRestoreMsg(
      state.activePlanId
        ? `Восстановлено: ${state.activePlanId}`
        : 'Покупки не найдены (демо). Сначала оформите тариф в этом окне.',
    );
  };

  const renderColumn = (items: ZeroLevelLesson[], side: 'left' | 'right') =>
    items.map((lesson) => {
      const locked = Boolean(isGuest && lesson.isLockedForGuest);
      return (
        <LilypadButton
          key={lesson.id}
          side={side}
          number={lesson.number}
          title={lesson.title}
          masteryLevel={lesson.masteryLevel}
          locked={locked}
          onPress={() => onLilyPress(lesson)}
        />
      );
    });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.replace('/')} style={styles.backBtn}>
            <Text style={styles.backText}>← Главная</Text>
          </Pressable>
          <Text style={styles.screenTitle}>Нулевой уровень</Text>
        </View>

        <View style={styles.topActions}>
          <FloatingButton title="Прочти меня" tone="green" onPress={() => setReadOpen(true)} style={styles.halfBtn} />
          <FloatingButton title="Тарифные планы" tone="blue" onPress={openPlans} style={styles.halfBtn} />
        </View>

        <View style={styles.pond}>
          <View style={styles.colLeft}>{renderColumn(leftLessons, 'left')}</View>
          <View style={styles.colRight}>{renderColumn(rightLessons, 'right')}</View>
        </View>
      </ScrollView>

      <Modal visible={readOpen} animationType="fade" transparent onRequestClose={() => setReadOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Прочти меня</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>{READ_ME}</Text>
            </ScrollView>
            <FloatingButton title="Понятно" tone="green" onPress={() => setReadOpen(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={plansOpen} animationType="slide" transparent onRequestClose={() => setPlansOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Тарифные планы</Text>
            <Text style={styles.subStatus}>{subscriptionLabel}</Text>
            <ScrollView style={styles.modalScroll}>
              {plans
                .filter((p) => p.id !== 'guest')
                .map((plan) => (
                  <View key={plan.id} style={styles.planCard}>
                    <Text style={styles.planTitle}>
                      {plan.title} — {plan.priceLabel}
                    </Text>
                    <Text style={styles.planDesc}>{plan.description}</Text>
                    <Text style={styles.planLegal}>{plan.legalNote}</Text>
                    <FloatingButton
                      title="Оформить (демо)"
                      tone="blue"
                      onPress={() => purchase(plan.id)}
                      style={styles.planBtn}
                    />
                  </View>
                ))}
            </ScrollView>
            <FloatingButton title="Восстановить покупки" tone="green" onPress={restore} />
            {restoreMsg ? <Text style={styles.restoreMsg}>{restoreMsg}</Text> : null}
            <Pressable onPress={() => setPlansOpen(false)}>
              <Text style={styles.cancelLink}>Закрыть</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(selectedLesson)}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedLesson(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedLesson ? (
              <>
                <Text style={styles.modalTitle}>
                  Урок {selectedLesson.number}. {selectedLesson.title}
                </Text>
                {isGuest && selectedLesson.isLockedForGuest ? (
                  <Text style={styles.lockHint}>
                    Для гостя этот урок закрыт. Оформите тариф или войдите в аккаунт.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.previewText}>
                      Предпросмотр урока (без Gemini). Симулируйте оценку ИИ — цвет кувшинки обновится на сетке.
                    </Text>
                    <Text style={styles.score}>
                      Текущий балл: {selectedLesson.aiScorePercent}% ({selectedLesson.masteryLevel})
                    </Text>
                    <View style={styles.simGrid}>
                      {AI_SIM_LABELS.map((item) => (
                        <FloatingButton
                          key={item.level}
                          title={item.label}
                          tone="green"
                          size="md"
                          onPress={() => applyAiSim(item.level)}
                          style={styles.simBtn}
                        />
                      ))}
                    </View>
                  </>
                )}
                <FloatingButton title="Закрыть" tone="blue" onPress={() => setSelectedLesson(null)} />
              </>
            ) : null}
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
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backText: {
    color: colors.blueDark,
    fontWeight: '700',
    fontSize: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.greenDark,
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  halfBtn: {
    flex: 1,
  },
  pond: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xs,
    minHeight: 720,
  },
  colLeft: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  colRight: {
    flex: 1,
    paddingTop: 54,
    paddingLeft: spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,20,20,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.greenDark,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '88%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalScroll: {
    maxHeight: 320,
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  subStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  planCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#D0D8DE',
    gap: spacing.xs,
  },
  planTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: 16,
  },
  planDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  planLegal: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  planBtn: {
    marginTop: spacing.sm,
  },
  restoreMsg: {
    fontSize: 13,
    color: colors.greenDark,
    textAlign: 'center',
    fontWeight: '600',
  },
  cancelLink: {
    textAlign: 'center',
    color: colors.blueDark,
    fontWeight: '600',
  },
  previewText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  score: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  simGrid: {
    gap: spacing.sm,
  },
  simBtn: {
    width: '100%',
  },
  lockHint: {
    fontSize: 14,
    color: '#C62828',
    lineHeight: 20,
    fontWeight: '600',
  },
});