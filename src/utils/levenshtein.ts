export type PronunciationScore = {
  similarityPercent: number;
  distance: number;
  isPassed: boolean;
  normalizedExpected: string;
  normalizedSpoken: string;
};

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am',
  im: 'i am',
  "you're": 'you are',
  youre: 'you are',
  "it's": 'it is',
  its: 'it is',
  "don't": 'do not',
  dont: 'do not',
  thanks: 'thank you',
  thank: 'thank you',
};

const DIGIT_WORDS: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '10': 'ten',
  '20': 'twenty',
};

function expandContractions(token: string): string {
  const lower = token.toLowerCase();
  if (CONTRACTIONS[lower]) return CONTRACTIONS[lower];
  return lower;
}

function tokenizeNumbers(text: string): string {
  return text
    .split(/\s+/)
    .map((token) => {
      const bare = token.replace(/[^\w]/g, '');
      if (DIGIT_WORDS[bare]) return DIGIT_WORDS[bare];
      return token;
    })
    .join(' ');
}

/** Нормализация фразы перед сравнением. */
export function normalizePhrase(input: string): string {
  let text = input.toLowerCase();
  text = text.replace(/[?!.,;:'"()]/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  text = tokenizeNumbers(text);
  const tokens = text.split(' ').filter(Boolean).flatMap((t) => expandContractions(t).split(' '));
  return tokens.join(' ').replace(/\s+/g, ' ').trim();
}

/** Классическое расстояние Левенштейна. */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[] = new Array(cols);
  for (let j = 0; j < cols; j += 1) dp[j] = j;

  for (let i = 1; i < rows; i += 1) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j < cols; j += 1) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[cols - 1];
}

export function calculatePronunciationScore(
  expectedPhrase: string,
  spokenPhrase: string,
  passThresholdPercent = 75,
): PronunciationScore {
  const normalizedExpected = normalizePhrase(expectedPhrase);
  const normalizedSpoken = normalizePhrase(spokenPhrase);

  if (!normalizedExpected && !normalizedSpoken) {
    return {
      similarityPercent: 100,
      distance: 0,
      isPassed: true,
      normalizedExpected,
      normalizedSpoken,
    };
  }

  if (!normalizedExpected || !normalizedSpoken) {
    return {
      similarityPercent: 0,
      distance: Math.max(normalizedExpected.length, normalizedSpoken.length),
      isPassed: false,
      normalizedExpected,
      normalizedSpoken,
    };
  }

  const distance = levenshteinDistance(normalizedExpected, normalizedSpoken);
  const maxLen = Math.max(normalizedExpected.length, normalizedSpoken.length, 1);
  const similarityPercent = Math.round(100 - (distance / maxLen) * 100);
  const clamped = Math.min(100, Math.max(0, similarityPercent));

  return {
    similarityPercent: clamped,
    distance,
    isPassed: clamped >= passThresholdPercent,
    normalizedExpected,
    normalizedSpoken,
  };
}