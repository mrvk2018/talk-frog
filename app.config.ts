import type { ConfigContext, ExpoConfig } from 'expo/config';

/** Локально EXPO_PUBLIC_BASE_URL пустой → корень `/`. GitHub Pages: `/talk-frog`. */
function getBaseUrl(): string | undefined {
  const raw = process.env.EXPO_PUBLIC_BASE_URL?.trim() ?? '';
  return raw ? raw.replace(/\/$/, '') : undefined;
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TalkFrog',
  slug: 'talkfrog',
  scheme: 'talkfrog',
  experiments: {
    ...(config.experiments ?? {}),
    typedRoutes: true,
    baseUrl: getBaseUrl(),
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
});