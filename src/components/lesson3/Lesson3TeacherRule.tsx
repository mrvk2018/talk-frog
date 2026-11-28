import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/theme/theme';

type Props = { title: string; bodyRu: string };

export function Lesson3TeacherRule({ title, bodyRu }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>★ {title}</Text>
      <Text style={styles.body}>{bodyRu}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFEB3B',
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: { fontWeight: '900', fontSize: 16, color: colors.black },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: colors.black },
});