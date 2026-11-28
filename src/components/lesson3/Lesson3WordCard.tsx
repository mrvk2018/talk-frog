import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Lesson3PhraseCard, Lesson3StructuredContent } from '@/types/lessonStructured';
import { phraseImageUrl } from '@/data/lesson3DefaultContent';
import { speakBritish } from '@/utils/speech';
import { colors, floatingShadow, radii, spacing } from '@/theme/theme';
import { lesson3IllustrationFrame } from './lesson3ImageStyles';

type Props = {
  content: Lesson3StructuredContent;
  phrase: Lesson3PhraseCard;
  compact?: boolean;
};

export function Lesson3WordCard({ content, phrase, compact }: Props) {
  const uri = phraseImageUrl(content, phrase.imageFile);

  return (
    <View style={[styles.card, floatingShadow, compact && styles.compact]}>
      <View style={lesson3IllustrationFrame.frame}>
        <Image
          source={{ uri }}
          style={lesson3IllustrationFrame.image}
          resizeMode="contain"
          accessibilityLabel={phrase.english}
        />
      </View>
      <Text style={styles.word}>{phrase.english}</Text>
      <Text style={styles.ipa}>{phrase.ipa}</Text>
      <Text style={styles.ru}>{phrase.translationRu}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => speakBritish(phrase.english)}
        style={[styles.speaker, floatingShadow]}
      >
        <Text style={styles.speakerText}>🔊 UK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.greenDark,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'center',
    flex: 1,
    minWidth: 140,
  },
  compact: { minWidth: 120 },
  word: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  ipa: { fontSize: 16, fontWeight: '700', color: colors.blueDark },
  ru: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  speaker: {
    marginTop: spacing.xs,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  speakerText: { color: colors.textOnBrand, fontWeight: '800' },
});