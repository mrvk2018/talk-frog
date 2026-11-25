import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { colors, spacing } from '@/theme/theme';

export default function AdminStubScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Админ-панель</Text>
      <Text style={styles.text}>
        Скрытый вход для Эли и Влада. На следующих этапах здесь будут логин, PIN и управление контентом.
      </Text>
      <FloatingButton title="Вернуться на главную" tone="blue" onPress={() => router.replace('/')} />
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
});