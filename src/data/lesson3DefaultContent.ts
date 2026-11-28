import type { Lesson3StructuredContent } from '@/types/lessonStructured';

export const LESSON3_IMAGE_BASE =
  'https://ksoqgsnacngvgsdvqohw.supabase.co/storage/v1/object/public/lesson-assets/lesson-3/';

export const DEFAULT_LESSON3_CONTENT: Lesson3StructuredContent = {
  lessonId: 'z3',
  version: 1,
  imageBaseUrl: LESSON3_IMAGE_BASE,
  phrases: [
    {
      id: 'hello',
      english: 'Hello',
      ipa: '/həˈləʊ/',
      translationRu: 'Здравствуйте',
      imageFile: 'hello.webp',
    },
    { id: 'hi', english: 'Hi', ipa: '/haɪ/', translationRu: 'Привет', imageFile: 'hi.webp' },
    {
      id: 'goodbye',
      english: 'Goodbye',
      ipa: '/ˌɡʊdˈbaɪ/',
      translationRu: 'До свидания',
      imageFile: 'goodbye.webp',
    },
    { id: 'bye', english: 'Bye', ipa: '/baɪ/', translationRu: 'Пока', imageFile: 'bye-see-you.webp' },
    {
      id: 'see-you',
      english: 'See you',
      ipa: '/ˈsiː juː/',
      translationRu: 'Увидимся / До встречи',
      imageFile: 'bye-see-you.webp',
    },
    {
      id: 'good-morning',
      english: 'Good morning',
      ipa: '/ˌɡʊd ˈmɔː.nɪŋ/',
      translationRu: 'Доброе утро',
      imageFile: 'good-morning.webp',
    },
    {
      id: 'good-afternoon',
      english: 'Good afternoon',
      ipa: '/ˌɡʊd ˌɑːf.təˈnuːn/',
      translationRu: 'Добрый день',
      imageFile: 'good-afternoon.webp',
    },
    {
      id: 'good-evening',
      english: 'Good evening',
      ipa: '/ˌɡʊd ˈiːv.nɪŋ/',
      translationRu: 'Добрый вечер',
      imageFile: 'good-evening.webp',
    },
    {
      id: 'good-night',
      english: 'Good night',
      ipa: '/ˌɡʊd ˈnaɪt/',
      translationRu: 'Спокойной ночи',
      imageFile: 'good-night.webp',
    },
  ],
  teacherRules: [
    {
      id: 'rule1',
      title: 'Teacher Rule 1',
      bodyRu:
        '"Hello" — это "здравствуйте", говорим незнакомым людям или людям старше нас. "Hi" — именно "привет", говорим друзьям, семье (более неформальный вариант).',
    },
    {
      id: 'rule2',
      title: 'Teacher Rule 2',
      bodyRu:
        '"Goodbye" — так же, как и "Hello" (формально / незнакомым / старшим). "Bye" и "See you" — так же, как "Hi" (неформально / друзьям, семье).',
    },
    {
      id: 'rule3',
      title: 'Teacher Rule 3',
      bodyRu:
        'Универсальные фразы — можно говорить и незнакомым, и друзьям. "Good night" считается больше как прощание.',
    },
  ],
  scenarios: [
    {
      id: 'shop',
      contextRu: 'Вы зашли в магазин и здороваетесь с продавцом.',
      acceptablePhrases: ['Hello', 'Hi', 'Good morning', 'Good afternoon', 'Good evening'],
      idealPhrase: 'Hello',
    },
    {
      id: 'salon',
      contextRu: 'На часах 7 вечера, вы зашли в парикмахерскую.',
      acceptablePhrases: ['Good evening', 'Hello', 'Hi'],
      idealPhrase: 'Good evening',
    },
    {
      id: 'friend',
      contextRu: 'Вы прощаетесь с лучшим другом после прогулки.',
      acceptablePhrases: ['Bye', 'See you', 'Goodbye'],
      idealPhrase: 'Bye',
    },
  ],
  quizQuestions: [
    {
      id: 'q1',
      questionRu: 'Доброе утро',
      options: ['Good morning', 'Good night', 'Hi'],
      correctIndex: 0,
    },
    {
      id: 'q2',
      questionRu: 'До свидания',
      options: ['Goodbye', 'Bye', 'Hello'],
      correctIndex: 0,
    },
    { id: 'q3', questionRu: 'Привет', options: ['Hi', 'Hello', 'Good evening'], correctIndex: 0 },
  ],
};

export function phraseImageUrl(content: Lesson3StructuredContent, imageFile: string): string {
  const base = content.imageBaseUrl.endsWith('/') ? content.imageBaseUrl : `${content.imageBaseUrl}/`;
  return `${base}${imageFile}`;
}

export function findPhrase(content: Lesson3StructuredContent, id: string) {
  return content.phrases.find((p) => p.id === id);
}