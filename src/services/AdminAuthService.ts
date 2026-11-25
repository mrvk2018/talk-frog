import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_DEMO_LOGIN, ADMIN_DEMO_PASSWORD } from '@/config/admin';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/utils/secureStorage';

const PIN_HASH_KEY = '@talkfrog/admin_pin_hash';
const PIN_ATTEMPTS_KEY = '@talkfrog/admin_pin_attempts';
const MAX_PIN_ATTEMPTS = 5;

let pinHash: string | null = null;
let pinAttempts = 0;
let sessionUnlocked = false;
let hydrated = false;

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `talkfrog:${pin}`);
}

export const adminAuthService = {
  isHydrated(): boolean {
    return hydrated;
  },

  hasPin(): boolean {
    return Boolean(pinHash);
  },

  isSessionUnlocked(): boolean {
    return sessionUnlocked;
  },

  getPinAttempts(): number {
    return pinAttempts;
  },

  async hydrate(): Promise<void> {
    if (hydrated) return;
    pinHash = await getSecureItem(PIN_HASH_KEY);
    const attemptsRaw = await AsyncStorage.getItem(PIN_ATTEMPTS_KEY);
    pinAttempts = attemptsRaw ? Number(attemptsRaw) : 0;
    if (pinAttempts >= MAX_PIN_ATTEMPTS) {
      await this.clearPinAndAttempts();
    }
    hydrated = true;
  },

  async verifyCredentials(login: string, password: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('verify_admin_login', {
        p_login: login.trim(),
        p_password: password,
      });
      if (!error && data === true) {
        return true;
      }
    }
    return login.trim() === ADMIN_DEMO_LOGIN && password === ADMIN_DEMO_PASSWORD;
  },

  async savePin(pin: string): Promise<void> {
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('PIN должен состоять из 4 цифр');
    }
    const hash = await hashPin(pin);
    await setSecureItem(PIN_HASH_KEY, hash);
    pinHash = hash;
    pinAttempts = 0;
    await AsyncStorage.setItem(PIN_ATTEMPTS_KEY, '0');
    sessionUnlocked = true;
  },

  async verifyPin(pin: string): Promise<boolean> {
    if (!pinHash) return false;
    const hash = await hashPin(pin);
    if (hash === pinHash) {
      pinAttempts = 0;
      await AsyncStorage.setItem(PIN_ATTEMPTS_KEY, '0');
      sessionUnlocked = true;
      return true;
    }
    pinAttempts += 1;
    await AsyncStorage.setItem(PIN_ATTEMPTS_KEY, String(pinAttempts));
    if (pinAttempts >= MAX_PIN_ATTEMPTS) {
      await this.clearPinAndAttempts();
      sessionUnlocked = false;
    }
    return false;
  },

  async clearPinAndAttempts(): Promise<void> {
    await deleteSecureItem(PIN_HASH_KEY);
    pinHash = null;
    pinAttempts = 0;
    sessionUnlocked = false;
    await AsyncStorage.setItem(PIN_ATTEMPTS_KEY, '0');
  },

  signOut(): void {
    sessionUnlocked = false;
  },

  initialRoute(): 'login' | 'pin' | 'dashboard' {
    if (sessionUnlocked) return 'dashboard';
    if (pinHash) return 'pin';
    return 'login';
  },
};