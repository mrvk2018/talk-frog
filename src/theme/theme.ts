/**
 * TalkFrog — единая дизайн-система (фон, бренд, кнопки, усвоение ИИ).
 */

export const colors = {
  /** Основной фон всех экранов */
  background: '#E8ECEF',
  backgroundAlt: '#EAECEF',

  /** Фирменная палитра */
  green: '#2FA84F',
  greenDark: '#248A3D',
  greenDarker: '#1D6E31',
  blue: '#2B9FD9',
  blueDark: '#1F7FB3',
  blueDarker: '#176694',
  black: '#141414',
  textPrimary: '#141414',
  textSecondary: '#4A4F54',
  textOnBrand: '#FFFFFF',

  /** Яркие системные объявления */
  bannerBackground: '#FF3B30',
  bannerText: '#FFFFFF',
  bannerAccent: '#FFD60A',

  /** Цвета листьев кувшинки по оценке усвоения ИИ */
  mastery: {
    locked: '#B8C2C8',
    lockedBorder: '#9AA5AD',
    new: '#7DD3FC',
    newBorder: '#5BB8E8',
    learning: '#FBBF24',
    learningBorder: '#D9A01A',
    good: '#4ADE80',
    goodBorder: '#2FA84F',
    mastered: '#22C55E',
    masteredBorder: '#1D6E31',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Мягкая объёмная тень для «парящих» кнопок */
export const floatingShadow = {
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.14,
  shadowRadius: 10,
  elevation: 6,
} as const;

export type BrandTone = 'green' | 'blue';

/** Рамка на 1–2 тона темнее заливки (обязательное правило кнопок) */
export function getInteractiveBorder(tone: BrandTone): string {
  return tone === 'green' ? colors.greenDark : colors.blueDark;
}

export function getInteractiveFill(tone: BrandTone): string {
  return tone === 'green' ? colors.green : colors.blue;
}

/** Стили кликабельной кнопки / карточки */
export function getFloatingButtonStyle(tone: BrandTone) {
  const backgroundColor = getInteractiveFill(tone);
  const borderColor = getInteractiveBorder(tone);
  return {
    backgroundColor,
    borderColor,
    borderWidth: 2,
    borderRadius: radii.lg,
    ...floatingShadow,
  };
}

export const theme = {
  colors,
  spacing,
  radii,
  floatingShadow,
  getInteractiveBorder,
  getInteractiveFill,
  getFloatingButtonStyle,
} as const;

export type Theme = typeof theme;

export type MasteryLevel = 'locked' | 'new' | 'learning' | 'good' | 'mastered';