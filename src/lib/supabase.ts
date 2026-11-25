import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

function canUseBrowserAuth(): boolean {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined';
  }
  return true;
}

/** Ленивая инициализация: без window (SSR static export) клиент не создаётся. */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !canUseBrowserAuth()) {
    return null;
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }
  return client;
}
