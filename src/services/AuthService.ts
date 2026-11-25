import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import {
  AuthProvider,
  LEGAL_VERSION,
  LegalConsents,
  UserProfile,
} from '@/types/auth';
import type { DbProfile } from '@/types/database';

const STORAGE_KEY = '@talkfrog/auth_profile_v1';

function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function isRemoteUserId(id: string): boolean {
  return !id.startsWith('local_');
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

function mapDbToProfile(row: DbProfile): UserProfile {
  const isGuest = row.auth_provider === 'guest' || row.role === 'guest';
  return {
    id: row.id,
    displayName: row.display_name ?? 'Ученик TalkFrog',
    provider: row.auth_provider,
    isGuest,
    guestLimitsActive: isGuest,
    createdAt: row.created_at,
    email: row.email,
    usesRemoteAuth: true,
    consents: {
      termsAndPrivacyAcceptedAt: row.terms_accepted_at,
      legalVersion: row.terms_accepted_at ? LEGAL_VERSION : null,
      voiceDataConsentAt: row.voice_consent_accepted_at,
      voiceConsentVersion: row.voice_consent_accepted_at ? LEGAL_VERSION : null,
    },
    microphonePermissionAskedAt: null,
    microphoneDeferred: false,
  };
}

async function fetchDbProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return mapDbToProfile(data as DbProfile);
}

async function syncConsentsToDb(userId: string, consents: LegalConsents, provider: AuthProvider, displayName: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase
    .from('profiles')
    .update({
      terms_accepted_at: consents.termsAndPrivacyAcceptedAt,
      voice_consent_accepted_at: consents.voiceDataConsentAt,
      auth_provider: provider === 'none' ? 'guest' : provider,
      display_name: displayName,
      role: provider === 'guest' ? 'guest' : 'student',
    })
    .eq('id', userId);
}

async function loadFromSession(session: Session | null): Promise<UserProfile | null> {
  if (!session?.user) return null;
  let profile = await fetchDbProfile(session.user.id);
  if (!profile) {
    profile = {
      id: session.user.id,
      displayName: session.user.email ?? 'Ученик TalkFrog',
      provider: session.user.is_anonymous ? 'guest' : 'email',
      isGuest: session.user.is_anonymous ?? false,
      guestLimitsActive: session.user.is_anonymous ?? false,
      createdAt: session.user.created_at,
      email: session.user.email,
      usesRemoteAuth: true,
      consents: cachedProfile?.consents ?? {
        termsAndPrivacyAcceptedAt: null,
        legalVersion: null,
        voiceDataConsentAt: null,
        voiceConsentVersion: null,
      },
      microphonePermissionAskedAt: cachedProfile?.microphonePermissionAskedAt ?? null,
      microphoneDeferred: cachedProfile?.microphoneDeferred ?? false,
    };
  }
  if (cachedProfile?.consents) {
    profile = { ...profile, consents: cachedProfile.consents, microphonePermissionAskedAt: cachedProfile.microphonePermissionAskedAt, microphoneDeferred: cachedProfile.microphoneDeferred };
  }
  await persist(profile);
  return profile;
}

async function signInLocalFallback(provider: AuthProvider, displayName?: string): Promise<UserProfile> {
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
    id: cachedProfile?.id && !isRemoteUserId(cachedProfile.id) ? cachedProfile.id : generateId(),
    displayName: names[provider],
    provider,
    isGuest,
    guestLimitsActive: isGuest,
    createdAt: cachedProfile?.createdAt ?? now,
    usesRemoteAuth: false,
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

  isUsingSupabase(): boolean {
    return isSupabaseConfigured;
  },

  getRemoteUserId(): string | null {
    const id = cachedProfile?.id;
    if (!id || !cachedProfile?.usesRemoteAuth) return null;
    return id;
  },

  async hydrate(): Promise<UserProfile | null> {
    if (hydrated) return cachedProfile;

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as UserProfile) : null;
      if (parsed && parsed.usesRemoteAuth === undefined) {
        parsed.usesRemoteAuth = isRemoteUserId(parsed.id);
      }
      cachedProfile = parsed;
    } catch {
      cachedProfile = null;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await loadFromSession(data.session);
      }
    }

    hydrated = true;
    notify();
    return cachedProfile;
  },

  initAuthListener(): (() => void) | undefined {
    const supabase = getSupabaseClient();
    if (!supabase) return undefined;
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await loadFromSession(session);
      } else if (cachedProfile?.usesRemoteAuth) {
        await persist(null);
      }
    });
    return () => data.subscription.unsubscribe();
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
      usesRemoteAuth: false,
      consents,
      microphonePermissionAskedAt: null,
      microphoneDeferred: false,
    };
    await persist({ ...base, consents });
  },

  async signInWithProvider(
    provider: AuthProvider,
    options?: { email?: string; password?: string; isSignUp?: boolean },
  ): Promise<UserProfile> {
    const consents = cachedProfile?.consents;
    if (!consents?.termsAndPrivacyAcceptedAt || !consents?.voiceDataConsentAt) {
      throw new Error('Сначала примите соглашения.');
    }

    const supabase = getSupabaseClient();
    if (!isSupabaseConfigured || !supabase) {
      return signInLocalFallback(provider, options?.email);
    }

    let user: User | null = null;

    if (provider === 'guest') {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      user = data.user;
    } else if (provider === 'email') {
      const email = options?.email?.trim();
      const password = options?.password;
      if (!email || !password) throw new Error('Введите email и пароль.');
      if (options?.isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        user = data.user;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        user = data.user;
      }
    } else if (provider === 'google' || provider === 'apple') {
      const oauthProvider = provider === 'google' ? 'google' : 'apple';
      const redirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: oauthProvider,
        options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
      });
      if (error) throw error;
      throw new Error(
        Platform.OS === 'web'
          ? 'Откроется окно Google / Apple. После входа вернитесь в приложение.'
          : 'OAuth: настройте deep link / Expo AuthSession на нативных платформах.',
      );
    } else if (provider === 'telegram') {
      throw new Error('Вход через Telegram будет подключён через Supabase Edge Function.');
    }

    if (!user?.id) {
      throw new Error('Не удалось получить пользователя Supabase.');
    }

    await new Promise((r) => setTimeout(r, 400));
    const displayName =
      provider === 'email' ? options?.email ?? 'Ученик (Email)' : provider === 'guest' ? 'Гость TalkFrog' : 'Ученик TalkFrog';

    await syncConsentsToDb(user.id, consents, provider, displayName);

    const profile = (await fetchDbProfile(user.id)) ?? {
      id: user.id,
      displayName,
      provider,
      isGuest: provider === 'guest',
      guestLimitsActive: provider === 'guest',
      createdAt: user.created_at,
      email: user.email,
      usesRemoteAuth: true,
      consents,
      microphonePermissionAskedAt: cachedProfile?.microphonePermissionAskedAt ?? null,
      microphoneDeferred: cachedProfile?.microphoneDeferred ?? false,
    };

    await persist(profile);
    return profile;
  },

  /** @deprecated используйте signInWithProvider */
  async signInDemo(provider: AuthProvider, displayName?: string): Promise<UserProfile> {
    return this.signInWithProvider(provider, { email: displayName });
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
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    await persist(null);
    hydrated = true;
  },

  async deleteAccountAndResetOnboarding(): Promise<void> {
    const userId = this.getRemoteUserId();
    const supabase = getSupabaseClient();
    if (supabase && userId && isRemoteUserId(userId)) {
      const { error } = await supabase.rpc('delete_own_account');
      if (error) {
        console.warn('delete_own_account:', error.message);
      }
      await supabase.auth.signOut();
    }
    await persist(null);
    hydrated = true;
  },

  getStatusLabel(): string {
    if (!cachedProfile || cachedProfile.provider === 'none') return 'Не авторизован';
    if (!isSupabaseConfigured) return `${cachedProfile.isGuest ? 'Гость (офлайн)' : 'Локальный режим'}`;
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