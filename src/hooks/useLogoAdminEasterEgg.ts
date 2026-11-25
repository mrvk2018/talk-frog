import { useRef } from 'react';
import { useRouter } from 'expo-router';

const TAP_GOAL = 5;
const WINDOW_MS = 2200;

export function useLogoAdminEasterEgg() {
  const router = useRouter();
  const countRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onLogoPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    countRef.current += 1;

    if (countRef.current >= TAP_GOAL) {
      countRef.current = 0;
      router.push('/admin');
      return;
    }

    timerRef.current = setTimeout(() => {
      countRef.current = 0;
    }, WINDOW_MS);
  };

  return { onLogoPress };
}