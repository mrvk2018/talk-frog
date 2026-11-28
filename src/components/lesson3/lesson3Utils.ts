export const SPACE_TILE = '␣';

export function shuffleArray<T>(items: T[], seed?: string): T[] {
  const arr = [...items];
  let s = 0;
  if (seed) {
    for (let i = 0; i < seed.length; i += 1) s += seed.charCodeAt(i);
  } else {
    s = Math.floor(Math.random() * 1e6);
  }
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function targetToTiles(target: string, withSpaceTile: boolean): string[] {
  const chars = target.split('');
  return chars.map((ch) => (ch === ' ' && withSpaceTile ? SPACE_TILE : ch));
}

export function tilesToAnswer(slots: string[]): string {
  return slots.map((t) => (t === SPACE_TILE ? ' ' : t)).join('');
}

export function isAnswerCorrect(target: string, slots: string[]): boolean {
  return tilesToAnswer(slots).toLowerCase().trim() === target.toLowerCase().trim();
}