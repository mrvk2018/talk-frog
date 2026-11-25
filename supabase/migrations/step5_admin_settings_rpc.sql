-- TalkFrog Step 5: RPC для сохранения настроек из админ-панели (PIN + login session)
-- Выполните в Supabase SQL Editor после основного schema.sql

INSERT INTO public.app_settings (key, value) VALUES
  ('zero_level_readme_text', 'Как проходить «Нулевой уровень» (Эли и Влад)

1. Выберите кувшинку-урок сверху вниз, но в своём темпе.
2. Проговаривайте вслух — TalkFrog слушает микрофон и помогает с произношением.
3. Цвет листа показывает, насколько материал усвоен.
4. Гости проходят первые уроки с лимитами; полный доступ — в тарифах.'),
  ('lessons_content_json', '[]')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.save_app_setting(p_admin_login text, p_key text, p_value text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
    RETURN false;
  END IF;

  SELECT count(*)::integer INTO admin_count FROM public.admin_credentials;

  -- Если учётки уже созданы — разрешаем только известный login
  IF admin_count > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_credentials WHERE login = trim(p_admin_login)
    ) THEN
      RETURN false;
    END IF;
  END IF;
  -- Если admin_credentials пуста — тестовый режим (разрешаем сохранение)

  INSERT INTO public.app_settings (key, value)
  VALUES (p_key, p_value)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_app_setting(text, text, text) TO anon, authenticated;