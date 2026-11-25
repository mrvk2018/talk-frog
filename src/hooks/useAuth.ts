import { useEffect, useState } from 'react';
import { authService } from '@/services/AuthService';
import type { UserProfile } from '@/types/auth';

export function useAuth() {
  const [profile, setProfile] = useState<UserProfile | null>(authService.getProfile());
  const [ready, setReady] = useState(authService.isHydrated());

  useEffect(() => {
    let mounted = true;
    authService.hydrate().then((p) => {
      if (mounted) {
        setProfile(p);
        setReady(true);
      }
    });
    const unsub = authService.subscribe(() => {
      setProfile(authService.getProfile());
      setReady(authService.isHydrated());
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return {
    profile,
    ready,
    isOnboardingComplete: authService.isOnboardingComplete(),
    statusLabel: authService.getStatusLabel(),
  };
}