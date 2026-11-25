import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { colors, spacing } from '@/theme/theme';

export default function ZeroLevelStubScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Нулевой уровень</Text>
      <Text style={styles.text}>
        Здесь появятся «листья кувшинки» с уроками ABC, 123, Hello? и др. (следующий этап разработки).
      </Text>
      <FloatingButton title="Назад на главную" tone="green" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.greenDark,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
});