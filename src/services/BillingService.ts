import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@talkfrog/billing_v1';

export type BillingPlanId = 'guest' | 'monthly' | 'yearly' | 'family';

export type BillingPlan = {
  id: BillingPlanId;
  title: string;
  priceLabel: string;
  description: string;
  legalNote: string;
  storeSkuIos: string;
  storeSkuAndroid: string;
};

export type SubscriptionState = {
  activePlanId: BillingPlanId | null;
  renewedAt: string | null;
  expiresAt: string | null;
  source: 'none' | 'apple' | 'google' | 'demo';
};

const PLANS: BillingPlan[] = [
  {
    id: 'guest',
    title: 'Гость',
    priceLabel: 'Бесплатно',
    description: 'Первые уроки с лимитами. Прогресс сохраняется на устройстве.',
    legalNote: 'Без автопродления.',
    storeSkuIos: '',
    storeSkuAndroid: '',
  },
  {
    id: 'monthly',
    title: 'Месяц TalkFrog',
    priceLabel: '₽ / мес (демо)',
    description: 'Полный «Нулевой уровень» и ИИ-оценка произношения.',
    legalNote:
      'Подписка автоматически продлевается, пока не отменена в App Store / Google Play не позднее чем за 24 ч до конца периода.',
    storeSkuIos: 'talkfrog.monthly',
    storeSkuAndroid: 'talkfrog_monthly',
  },
  {
    id: 'yearly',
    title: 'Год TalkFrog',
    priceLabel: '₽ / год (демо)',
    description: 'Все курсы 1–6 по мере публикации, выгоднее на 30%.',
    legalNote: 'Автопродление согласно правилам Apple и Google. Управление — в настройках аккаунта магазина.',
    storeSkuIos: 'talkfrog.yearly',
    storeSkuAndroid: 'talkfrog_yearly',
  },
];

let subscription: SubscriptionState = {
  activePlanId: null,
  renewedAt: null,
  expiresAt: null,
  source: 'none',
};

let hydrated = false;

export const billingService = {
  async hydrate(): Promise<SubscriptionState> {
    if (hydrated) return { ...subscription };
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) subscription = JSON.parse(raw) as SubscriptionState;
    } catch {
      subscription = { activePlanId: null, renewedAt: null, expiresAt: null, source: 'none' };
    }
    hydrated = true;
    return { ...subscription };
  },

  getPlans(): BillingPlan[] {
    return PLANS.map((p) => ({ ...p }));
  },

  getSubscription(): SubscriptionState {
    return { ...subscription };
  },

  async syncToSupabase(_state: SubscriptionState): Promise<void> {
    /** Заглушка: на этапе Supabase — upsert в purchases/subscriptions. */
  },

  /** Демо-покупка. Далее: StoreKit 2 + Play Billing + верификация на сервере. */
  async purchasePlan(planId: BillingPlanId): Promise<SubscriptionState> {
    if (planId === 'guest') {
      return this.getSubscription();
    }
    const now = new Date();
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + (planId === 'yearly' ? 12 : 1));
    subscription = {
      activePlanId: planId,
      renewedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      source: 'demo',
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
    await this.syncToSupabase(subscription);
    return { ...subscription };
  },

  async restorePurchases(): Promise<SubscriptionState> {
    await this.hydrate();
    if (subscription.activePlanId) {
      return { ...subscription };
    }
    /** Демо: «восстановление» не находит покупок, пока не было purchasePlan. */
    return { ...subscription };
  },
};