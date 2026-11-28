-- Структурированный контент уроков (интерактивные сценарии z3+)
CREATE TABLE IF NOT EXISTS public.lesson_structured_content (
  lesson_id text PRIMARY KEY,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

DROP TRIGGER IF EXISTS lesson_structured_content_set_updated_at ON public.lesson_structured_content;
CREATE TRIGGER lesson_structured_content_set_updated_at
  BEFORE UPDATE ON public.lesson_structured_content
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lesson_structured_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_structured_content_read_all" ON public.lesson_structured_content;
CREATE POLICY "lesson_structured_content_read_all"
  ON public.lesson_structured_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.save_lesson_structured_content(
  p_admin_login text,
  p_lesson_id text,
  p_content jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  IF p_lesson_id IS NULL OR length(trim(p_lesson_id)) = 0 THEN
    RETURN false;
  END IF;

  SELECT count(*)::integer INTO admin_count FROM public.admin_credentials;

  IF admin_count > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_credentials WHERE login = trim(p_admin_login)
    ) THEN
      RETURN false;
    END IF;
  END IF;

  INSERT INTO public.lesson_structured_content (lesson_id, content, updated_by)
  VALUES (trim(p_lesson_id), p_content, trim(p_admin_login))
  ON CONFLICT (lesson_id) DO UPDATE
    SET content = EXCLUDED.content,
        updated_by = EXCLUDED.updated_by,
        updated_at = now();

  RETURN true;
END;
$$;

GRANT SELECT ON public.lesson_structured_content TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_lesson_structured_content(text, text, jsonb) TO anon, authenticated;

-- Сид: урок 3 Hello?
INSERT INTO public.lesson_structured_content (lesson_id, content, updated_by)
VALUES (
  'z3',
  '{
    "lessonId": "z3",
    "version": 1,
    "imageBaseUrl": "https://ksoqgsnacngvgsdvqohw.supabase.co/storage/v1/object/public/lesson-assets/lesson-3/",
    "phrases": [
      {"id": "hello", "english": "Hello", "ipa": "/həˈləʊ/", "translationRu": "Здравствуйте", "imageFile": "hello.webp"},
      {"id": "hi", "english": "Hi", "ipa": "/haɪ/", "translationRu": "Привет", "imageFile": "hi.webp"},
      {"id": "goodbye", "english": "Goodbye", "ipa": "/ˌɡʊdˈbaɪ/", "translationRu": "До свидания", "imageFile": "goodbye.webp"},
      {"id": "bye", "english": "Bye", "ipa": "/baɪ/", "translationRu": "Пока", "imageFile": "bye-see-you.webp"},
      {"id": "see-you", "english": "See you", "ipa": "/ˈsiː juː/", "translationRu": "Увидимся / До встречи", "imageFile": "bye-see-you.webp"},
      {"id": "good-morning", "english": "Good morning", "ipa": "/ˌɡʊd ˈmɔː.nɪŋ/", "translationRu": "Доброе утро", "imageFile": "good-morning.webp"},
      {"id": "good-afternoon", "english": "Good afternoon", "ipa": "/ˌɡʊd ˌɑːf.təˈnuːn/", "translationRu": "Добрый день", "imageFile": "good-afternoon.webp"},
      {"id": "good-evening", "english": "Good evening", "ipa": "/ˌɡʊd ˈiːv.nɪŋ/", "translationRu": "Добрый вечер", "imageFile": "good-evening.webp"},
      {"id": "good-night", "english": "Good night", "ipa": "/ˌɡʊd ˈnaɪt/", "translationRu": "Спокойной ночи", "imageFile": "good-night.webp"}
    ],
    "teacherRules": [
      {"id": "rule1", "title": "Teacher Rule 1", "bodyRu": "\"Hello\" — это \"здравствуйте\", говорим незнакомым людям или людям старше нас. \"Hi\" — именно \"привет\", говорим друзьям, семье (более неформальный вариант)."},
      {"id": "rule2", "title": "Teacher Rule 2", "bodyRu": "\"Goodbye\" — так же, как и \"Hello\" (формально / незнакомым / старшим). \"Bye\" и \"See you\" — так же, как \"Hi\" (неформально / друзьям, семье)."},
      {"id": "rule3", "title": "Teacher Rule 3", "bodyRu": "Универсальные фразы — можно говорить и незнакомым, и друзьям. \"Good night\" считается больше как прощание."}
    ],
    "scenarios": [
      {"id": "shop", "contextRu": "Вы зашли в магазин и здороваетесь с продавцом.", "acceptablePhrases": ["Hello", "Hi", "Good morning", "Good afternoon", "Good evening"], "idealPhrase": "Hello"},
      {"id": "salon", "contextRu": "На часах 7 вечера, вы зашли в парикмахерскую.", "acceptablePhrases": ["Good evening", "Hello", "Hi"], "idealPhrase": "Good evening"},
      {"id": "friend", "contextRu": "Вы прощаетесь с лучшим другом после прогулки.", "acceptablePhrases": ["Bye", "See you", "Goodbye"], "idealPhrase": "Bye"}
    ],
    "quizQuestions": [
      {"id": "q1", "questionRu": "Доброе утро", "options": ["Good morning", "Good night", "Hi"], "correctIndex": 0},
      {"id": "q2", "questionRu": "До свидания", "options": ["Goodbye", "Bye", "Hello"], "correctIndex": 0},
      {"id": "q3", "questionRu": "Привет", "options": ["Hi", "Hello", "Good evening"], "correctIndex": 0}
    ]
  }'::jsonb,
  'seed'
)
ON CONFLICT (lesson_id) DO NOTHING;