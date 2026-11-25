export const LEGAL_VERSION = '1.0.0';

export type AuthProvider =
  | 'none'
  | 'guest'
  | 'email'
  | 'google'
  | 'apple'
  | 'telegram';

export type LegalConsents = {
  termsAndPrivacyAcceptedAt: string | null;
  legalVersion: string | null;
  voiceDataConsentAt: string | null;
  voiceConsentVersion: string | null;
};

export type UserProfile = {
  id: string;
  displayName: string;
  provider: AuthProvider;
  isGuest: boolean;
  guestLimitsActive: boolean;
  createdAt: string;
  consents: LegalConsents;
  microphonePermissionAskedAt: string | null;
  microphoneDeferred: boolean;
  /** true — id из Supabase Auth; false — локальный резерв */
  usesRemoteAuth: boolean;
  email?: string | null;
};

export type AuthState = {
  profile: UserProfile | null;
  hydrated: boolean;
};