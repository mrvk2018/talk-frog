import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { adminAuthService } from '@/services/AdminAuthService';
import {
  appSettingsService,
  DEFAULT_AI_PROMPT,
  DEFAULT_LESSONS_CONTENT,
} from '@/services/AppSettingsService';
import type { LessonContentItem } from '@/types/appSettings';
import { lessonStructuredContentService } from '@/services/LessonStructuredContentService';
import { Lesson3StructuredEditor } from '@/components/admin/Lesson3StructuredEditor';
import { colors, floatingShadow, radii, spacing } from '@/theme/theme';

type SaveState = 'idle' | 'saving' | 'ok' | 'error';

type TabId = 'ai' | 'pron' | 'home' | 'lessons';

const TABS: { id: TabId; label: string }[] = [
  { id: 'ai', label: 'ИИ-учитель' },
  { id: 'pron', label: 'Левенштейн' },
  { id: 'home', label: 'Главная' },
  { id: 'lessons', label: 'Уроки' },
];

export function AdminWorkspace() {
  const [tab, setTab] = useState<TabId>('ai');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveMsg, setSaveMsg] = useState('');

  const [aiPrompt, setAiPrompt] = useState('');
  const [threshold, setThreshold] = useState(75);
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [announcementText, setAnnouncementText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [readmeText, setReadmeText] = useState('');
  const [lessons, setLessons] = useState<LessonContentItem[]>(DEFAULT_LESSONS_CONTENT);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [lesson3EditorOpen, setLesson3EditorOpen] = useState(false);
  const [lesson3Content, setLesson3Content] = useState(() => lessonStructuredContentService.getLesson3());

  const load = useCallback(async () => {
    await appSettingsService.hydrate();
    const s = appSettingsService.getSnapshot();
    setAiPrompt(s.ai_teacher_system_prompt);
    setThreshold(appSettingsService.getThresholdPercent());
    setAnnouncementActive(s.home_announcement_active === 'true');
    setAnnouncementText(s.home_announcement_text);
    setVideoUrl(s.welcome_video_url);
    setReadmeText(s.zero_level_readme_text);
    setLessons(appSettingsService.getLessonsContent());
    await lessonStructuredContentService.hydrate();
    setLesson3Content(lessonStructuredContentService.getLesson3());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const adminLogin = adminAuthService.getVerifiedAdminLogin() ?? 'eli_vlad';

  const runSave = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setSaveState('saving');
    setSaveMsg('');
    const res = await fn();
    if (res.ok) {
      setSaveState('ok');
      setSaveMsg('Сохранено в Supabase ✓');
    } else {
      setSaveState('error');
      setSaveMsg(res.error ?? 'Ошибка сохранения');
    }
    setTimeout(() => setSaveState('idle'), 2500);
  };

  const saveAi = () =>
    runSave(() => appSettingsService.saveToCloud('ai_teacher_system_prompt', aiPrompt.trim(), adminLogin));

  const saveThreshold = (value: number) => {
    const v = Math.min(100, Math.max(50, value));
    setThreshold(v);
    runSave(() => appSettingsService.saveToCloud('levenshtein_pass_threshold', String(v), adminLogin));
  };

  const saveHomeBlock = () =>
    runSave(() =>
      appSettingsService.saveManyToCloud(
        {
          home_announcement_active: announcementActive ? 'true' : 'false',
          home_announcement_text: announcementText.trim(),
          welcome_video_url: videoUrl.trim(),
          zero_level_readme_text: readmeText.trim(),
        },
        adminLogin,
      ),
    );

  const saveLessons = () =>
    runSave(() =>
      appSettingsService.saveToCloud('lessons_content_json', JSON.stringify(lessons), adminLogin),
    );

  const updateLesson = (patch: Partial<LessonContentItem>) => {
    setLessons((prev) => prev.map((l, i) => (i === lessonIdx ? { ...l, ...patch } : l)));
  };

  const lesson = lessons[lessonIdx];

  return (
    <View style={styles.wrap}>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tab, tab === t.id && styles.tabActive, floatingShadow]}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {saveState !== 'idle' ? (
        <Text style={[styles.saveStatus, saveState === 'error' && styles.saveError]}>{saveMsg || 'Сохранение…'}</Text>
      ) : null}

      {tab === 'ai' ? (
        <View style={[styles.section, floatingShadow]}>
          <Text style={styles.sectionTitle}>Gemini 3.8 — системный промпт</Text>
          <TextInput
            multiline
            value={aiPrompt}
            onChangeText={setAiPrompt}
            style={styles.multiline}
            placeholder="Характер ИИ, методика Эли и Влада…"
          />
          <FloatingButton
            title="Сбросить на базовый промпт"
            tone="blue"
            onPress={async () => {
              setAiPrompt(DEFAULT_AI_PROMPT);
              await appSettingsService.resetAiPrompt();
            }}
          />
          <FloatingButton title="Сохранить в облако" tone="green" onPress={saveAi} />
        </View>
      ) : null}

      {tab === 'pron' ? (
        <View style={[styles.section, floatingShadow]}>
          <Text style={styles.sectionTitle}>Порог прохождения: {threshold}%</Text>
          <Text style={styles.hint}>
            Чем выше порог — тем строже оценка произношения и сложнее «зелёный» цвет кувшинок.
          </Text>
          <View style={styles.row}>
            <FloatingButton title="-5%" tone="blue" onPress={() => saveThreshold(threshold - 5)} style={styles.mini} />
            <FloatingButton title="+5%" tone="blue" onPress={() => saveThreshold(threshold + 5)} style={styles.mini} />
          </View>
          <View style={styles.row}>
            <FloatingButton title="60% Мягко" tone="green" onPress={() => saveThreshold(60)} style={styles.flex} />
            <FloatingButton title="75% Стандарт" tone="green" onPress={() => saveThreshold(75)} style={styles.flex} />
            <FloatingButton title="90% Строго" tone="green" onPress={() => saveThreshold(90)} style={styles.flex} />
          </View>
        </View>
      ) : null}

      {tab === 'home' ? (
        <View style={[styles.section, floatingShadow]}>
          <Text style={styles.sectionTitle}>Главная и «Прочти меня»</Text>
          <Pressable
            onPress={() => setAnnouncementActive((v) => !v)}
            style={[styles.toggle, announcementActive && styles.toggleOn]}
          >
            <Text style={styles.toggleText}>
              Яркое объявление: {announcementActive ? 'Вкл' : 'Выкл'}
            </Text>
          </Pressable>
          <Text style={styles.label}>Текст объявления</Text>
          <TextInput multiline value={announcementText} onChangeText={setAnnouncementText} style={styles.multiline} />
          <Text style={styles.label}>Ссылка на видео-приветствие</Text>
          <TextInput value={videoUrl} onChangeText={setVideoUrl} style={styles.input} placeholder="https://…" />
          <Text style={styles.label}>Текст «Прочти меня» (нулевой уровень)</Text>
          <TextInput multiline value={readmeText} onChangeText={setReadmeText} style={styles.multiline} />
          <FloatingButton title="Сохранить в облако" tone="green" onPress={saveHomeBlock} />
        </View>
      ) : null}

      {tab === 'lessons' && lesson ? (
        <View style={[styles.section, floatingShadow]}>
          <Text style={styles.sectionTitle}>Редактор кувшинок</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lessonChips}>
            {lessons.map((l, i) => (
              <Pressable key={l.id} onPress={() => setLessonIdx(i)} style={[styles.chip, lessonIdx === i && styles.chipOn]}>
                <Text style={styles.chipText}>
                  {l.number}. {l.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.label}>Целевые фразы (по строке)</Text>
          <TextInput
            multiline
            value={lesson.targetPhrases.join('\n')}
            onChangeText={(t) => updateLesson({ targetPhrases: t.split('\n').map((s) => s.trim()).filter(Boolean) })}
            style={styles.multiline}
          />
          <Text style={styles.label}>Транскрипция / подсказка</Text>
          <TextInput value={lesson.phoneticHint} onChangeText={(t) => updateLesson({ phoneticHint: t })} style={styles.input} />
          <Text style={styles.label}>Методика Эли и Влада (RU)</Text>
          <TextInput
            multiline
            value={lesson.methodologyNoteRu}
            onChangeText={(t) => updateLesson({ methodologyNoteRu: t })}
            style={styles.multiline}
          />
          <FloatingButton title="Сохранить уроки в облако" tone="green" onPress={saveLessons} />
          {lesson.id === 'z3' ? (
            <FloatingButton
              title="Редактировать карточки и правила"
              tone="blue"
              onPress={() => setLesson3EditorOpen(true)}
            />
          ) : null}
        </View>
      ) : null}

      <Lesson3StructuredEditor
        visible={lesson3EditorOpen}
        adminLogin={adminLogin}
        initial={lesson3Content}
        onClose={() => setLesson3EditorOpen(false)}
        onSaved={async () => {
          await lessonStructuredContentService.refreshFromCloud();
          setLesson3Content(lessonStructuredContentService.getLesson3());
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.blueDark,
    backgroundColor: colors.backgroundAlt,
  },
  tabActive: { backgroundColor: colors.green, borderColor: colors.greenDark },
  tabText: { fontWeight: '700', color: colors.textSecondary, fontSize: 13 },
  tabTextActive: { color: colors.textOnBrand },
  section: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.greenDark,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  hint: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  multiline: {
    minHeight: 120,
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.md,
    padding: spacing.md,
    textAlignVertical: 'top',
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  row: { flexDirection: 'row', gap: spacing.sm },
  mini: { flex: 1 },
  flex: { flex: 1 },
  toggle: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.mastery.lockedBorder,
    backgroundColor: colors.background,
  },
  toggleOn: { borderColor: colors.greenDark, backgroundColor: colors.mastery.good },
  toggleText: { fontWeight: '700', color: colors.textPrimary },
  lessonChips: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.blueDark,
    backgroundColor: colors.background,
  },
  chipOn: { backgroundColor: colors.blue, borderColor: colors.blueDarker },
  chipText: { fontWeight: '700', color: colors.textPrimary, fontSize: 12 },
  saveStatus: {
    textAlign: 'center',
    fontWeight: '700',
    color: colors.greenDark,
    fontSize: 14,
  },
  saveError: { color: '#C62828' },
});