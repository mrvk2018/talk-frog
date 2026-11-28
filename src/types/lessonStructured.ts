export type Lesson3PhraseCard = {
  id: string;
  english: string;
  ipa: string;
  translationRu: string;
  imageFile: string;
};

export type Lesson3TeacherRule = {
  id: 'rule1' | 'rule2' | 'rule3';
  title: string;
  bodyRu: string;
};

export type Lesson3Scenario = {
  id: string;
  contextRu: string;
  acceptablePhrases: string[];
  idealPhrase: string;
};

export type Lesson3QuizQuestion = {
  id: string;
  questionRu: string;
  options: string[];
  correctIndex: number;
};

export type Lesson3StructuredContent = {
  lessonId: 'z3';
  version: number;
  imageBaseUrl: string;
  phrases: Lesson3PhraseCard[];
  teacherRules: Lesson3TeacherRule[];
  scenarios: Lesson3Scenario[];
  quizQuestions: Lesson3QuizQuestion[];
};

export type StructuredLessonId = 'z3';