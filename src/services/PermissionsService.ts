import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export type PermissionKind = 'microphone';

export type PermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'unavailable';

export type PermissionSnapshot = {
  microphone: PermissionStatus;
};

const cache: PermissionSnapshot = {
  microphone: 'undetermined',
};

async function checkWebMicrophone(): Promise<PermissionStatus> {
  if (typeof navigator === 'undefined') return 'unavailable';
  try {
    const perms = navigator.permissions;
    if (perms?.query) {
      const result = await perms.query({ name: 'microphone' as PermissionName });
      if (result.state === 'granted') return 'granted';
      if (result.state === 'denied') return 'denied';
      return 'undetermined';
    }
  } catch {
    // Safari may not support permissions.query for microphone
  }
  return 'undetermined';
}

async function requestWebMicrophone(): Promise<PermissionStatus> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unavailable';
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    cache.microphone = 'granted';
    return 'granted';
  } catch {
    cache.microphone = 'denied';
    return 'denied';
  }
}

export const permissionsService = {
  getCached(): PermissionSnapshot {
    return { ...cache };
  },

  async check(kind: PermissionKind): Promise<PermissionStatus> {
    if (kind !== 'microphone') return 'unavailable';

    if (Platform.OS === 'web') {
      const status = await checkWebMicrophone();
      cache.microphone = status;
      return status;
    }

    try {
      const { status, granted, canAskAgain } = await Audio.getPermissionsAsync();
      if (granted) {
        cache.microphone = 'granted';
        return 'granted';
      }
      if (status === 'denied' && !canAskAgain) {
        cache.microphone = 'denied';
        return 'denied';
      }
      cache.microphone = 'undetermined';
      return 'undetermined';
    } catch {
      cache.microphone = 'unavailable';
      return 'unavailable';
    }
  },

  async request(kind: PermissionKind): Promise<PermissionStatus> {
    if (kind !== 'microphone') return 'unavailable';

    if (Platform.OS === 'web') {
      return requestWebMicrophone();
    }

    try {
      const { granted, canAskAgain, status } = await Audio.requestPermissionsAsync();
      if (granted) {
        cache.microphone = 'granted';
        return 'granted';
      }
      if (status === 'denied' && !canAskAgain) {
        cache.microphone = 'denied';
        return 'denied';
      }
      cache.microphone = canAskAgain ? 'undetermined' : 'denied';
      return cache.microphone;
    } catch {
      cache.microphone = 'denied';
      return 'denied';
    }
  },

  /** Точка расширения для будущих разрешений (камера, уведомления и т.д.) */
  async checkAll(): Promise<PermissionSnapshot> {
    const microphone = await this.check('microphone');
    return { microphone };
  },
};