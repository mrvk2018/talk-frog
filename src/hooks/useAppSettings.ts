import { useEffect, useState } from 'react';
import { appSettingsService } from '@/services/AppSettingsService';
import type { AppSettingsMap } from '@/types/appSettings';

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettingsMap>(appSettingsService.getSnapshot());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    appSettingsService.hydrate().then((s) => {
      setSettings(s);
      setReady(true);
    });
    const unsub = appSettingsService.subscribe(() => {
      setSettings(appSettingsService.getSnapshot());
    });
    return unsub;
  }, []);

  return { settings, ready, refresh: () => appSettingsService.refreshFromCloud() };
}