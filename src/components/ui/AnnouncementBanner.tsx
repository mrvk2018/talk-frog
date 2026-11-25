import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/theme/theme';

type AnnouncementBannerProps = {
  title: string;
  message: string;
};

export function AnnouncementBanner({ title, message }: AnnouncementBannerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.accentStrip} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bannerBackground,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: '#C62828',
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  accentStrip: {
    width: 6,
    backgroundColor: colors.bannerAccent,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    color: colors.bannerText,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  message: {
    color: colors.bannerText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});