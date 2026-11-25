import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthProvider,
  LEGAL_VERSION,
  LegalConsents,
  UserProfile,
} from '@/types/auth';

const STORAGE_KEY = '@talkfrog/auth_profile_v1';

function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

let cachedProfile: UserProfile | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

async function persist(profile: UserProfile | null): Promise<void> {
  cachedProfile = profile;
  if (profile) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
  notify();
}

export const authService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getProfile(): UserProfile | null {
    return cachedProfile;
  },

  isHydrated(): boolean {
    return hydrated;
  },

  async hydrate(): Promise<UserProfile | null> {
    if (hydrated) return cachedProfile;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      cachedProfile = raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      cachedProfile = null;
    }
    hydrated = true;
    notify();
    return cachedProfile;
  },

  hasAcceptedLegalConsents(): boolean {
    const c = cachedProfile?.consents;
    return Boolean(
      c?.termsAndPrivacyAcceptedAt &&
        c.voiceDataConsentAt &&
        c.legalVersion === LEGAL_VERSION &&
        c.voiceConsentVersion === LEGAL_VERSION,
    );
  },

  isOnboardingComplete(): boolean {
    if (!cachedProfile) return false;
    if (!this.hasAcceptedLegalConsents()) return false;
    return cachedProfile.provider !== 'none';
  },

  async acceptLegalConsents(): Promise<void> {
    const now = new Date().toISOString();
    const consents: LegalConsents = {
      termsAndPrivacyAcceptedAt: now,
      legalVersion: LEGAL_VERSION,
      voiceDataConsentAt: now,
      voiceConsentVersion: LEGAL_VERSION,
    };
    const base: UserProfile = cachedProfile ?? {
      id: generateId(),
      displayName: '',
      provider: 'none',
      isGuest: false,
      guestLimitsActive: false,
      createdAt: now,
      consents,
      microphonePermissionAskedAt: null,
      microphoneDeferred: false,
    };
    await persist({ ...base, consents });
  },

  async setConsentsPartial(
    patch: Partial<Pick<LegalConsents, 'termsAndPrivacyAcceptedAt' | 'voiceDataConsentAt'>> & {
      termsAccepted?: boolean;
      voiceAccepted?: boolean;
    },
  ): Promise<void> {
    const now = new Date().toISOString();
    const prev = cachedProfile?.consents ?? {
      termsAndPrivacyAcceptedAt: null,
      legalVersion: null,
      voiceDataConsentAt: null,
      voiceConsentVersion: null,
    };
    const consents: LegalConsents = {
      termsAndPrivacyAcceptedAt:
        patch.termsAccepted || patch.termsAndPrivacyAcceptedAt
          ? patch.termsAndPrivacyAcceptedAt ?? now
          : prev.termsAndPrivacyAcceptedAt,
      legalVersion: patch.termsAccepted ? LEGAL_VERSION : prev.legalVersion,
      voiceDataConsentAt:
        patch.voiceAccepted || patch.voiceDataConsentAt
          ? patch.voiceDataConsentAt ?? now
          : prev.voiceDataConsentAt,
      voiceConsentVersion: patch.voiceAccepted ? LEGAL_VERSION : prev.voiceConsentVersion,
    };
    const base: UserProfile = cachedProfile ?? {
      id: generateId(),
      displayName: '',
      provider: 'none',
      isGuest: false,
      guestLimitsActive: false,
      createdAt: now,
      consents,
      microphonePermissionAskedAt: null,
      microphoneDeferred: false,
    };
    await persist({ ...base, consents });
  },

  hasBothConsentsTicked(): boolean {
    const c = cachedProfile?.consents;
    return Boolean(c?.termsAndPrivacyAcceptedAt && c?.voiceDataConsentAt);
  },

  async signInDemo(provider: AuthProvider, displayName?: string): Promise<UserProfile> {
    const now = new Date().toISOString();
    const isGuest = provider === 'guest';
    const names: Record<AuthProvider, string> = {
      none: 'Пользователь',
      guest: 'Гость TalkFrog',
      email: displayName ?? 'Ученик (Email)',
      google: displayName ?? 'Ученик (Google)',
      apple: displayName ?? 'Ученик (Apple)',
      telegram: displayName ?? 'Ученик (Telegram)',
    };
    const consents = cachedProfile?.consents ?? {
      termsAndPrivacyAcceptedAt: null,
      legalVersion: null,
      voiceDataConsentAt: null,
      voiceConsentVersion: null,
    };
    const profile: UserProfile = {
      id: cachedProfile?.id ?? generateId(),
      displayName: names[provider],
      provider,
      isGuest,
      guestLimitsActive: isGuest,
      createdAt: cachedProfile?.createdAt ?? now,
      consents: {
        ...consents,
        legalVersion: consents.legalVersion ?? LEGAL_VERSION,
        voiceConsentVersion: consents.voiceConsentVersion ?? LEGAL_VERSION,
      },
      microphonePermissionAskedAt: cachedProfile?.microphonePermissionAskedAt ?? null,
      microphoneDeferred: cachedProfile?.microphoneDeferred ?? false,
    };
    await persist(profile);
    return profile;
  },

  async setMicrophoneStep(asked: boolean, deferred: boolean): Promise<void> {
    if (!cachedProfile) return;
    await persist({
      ...cachedProfile,
      microphonePermissionAskedAt: asked ? new Date().toISOString() : cachedProfile.microphonePermissionAskedAt,
      microphoneDeferred: deferred,
    });
  },

  async signOut(): Promise<void> {
    await persist(null);
    hydrated = true;
  },

  /** Удаление профиля / сброс онбординга (требование сторов) */
  async deleteAccountAndResetOnboarding(): Promise<void> {
    await persist(null);
    hydrated = true;
  },

  getStatusLabel(): string {
    if (!cachedProfile || cachedProfile.provider === 'none') return 'Не авторизован';
    if (cachedProfile.isGuest) return 'Гость (лимиты)';
    const labels: Record<AuthProvider, string> = {
      none: 'Не авторизован',
      guest: 'Гость',
      email: 'Аккаунт (Email)',
      google: 'Аккаунт (Google)',
      apple: 'Аккаунт (Apple)',
      telegram: 'Аккаунт (Telegram)',
    };
    return labels[cachedProfile.provider];
  },
};