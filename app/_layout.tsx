import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { authService } from '@/services/AuthService';
import { colors } from '@/theme/theme';

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubAuth = authService.initAuthListener();
    authService.hydrate().finally(() => setReady(true));
    return () => unsubAuth?.();
  }, []);

  useEffect(() => {
    if (!ready) return;

    const root = segments[0];
    const onOnboarding = root === 'onboarding';
    const isPublicRoute = onOnboarding || root === 'admin';
    const complete = authService.isOnboardingComplete();

    if (!complete && !isPublicRoute) {
      router.replace('/onboarding');
      return;
    }

    if (complete && onOnboarding) {
      router.replace('/');
    }
  }, [ready, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <NavigationGuard>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </NavigationGuard>
  );
}