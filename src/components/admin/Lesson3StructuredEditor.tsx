import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import { lessonStructuredContentService } from '@/services/LessonStructuredContentService';
import type { Lesson3StructuredContent } from '@/types/lessonStructured';
import { colors, floatingShadow, radii, spacing } from '@/theme/theme';

type Props = {
  visible: boolean;
  adminLogin: string;
  initial: Lesson3StructuredContent;
  onClose: () => void;
  onSaved: () => void;
};

export function Lesson3StructuredEditor({ visible, adminLogin, initial, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState(initial);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const updatePhrase = (index: number, field: keyof (typeof draft.phrases)[0], value: string) => {
    setDraft((d) => ({
      ...d,
      phrases: d.phrases.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  const updateRule = (index: number, field: 'title' | 'bodyRu', value: string) => {
    setDraft((d) => ({
      ...d,
      teacherRules: d.teacherRules.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }));
  };

  const save = async () => {
    setSaving(true);
    const res = await lessonStructuredContentService.saveLesson3ToCloud(draft, adminLogin);
    setSaving(false);
    setMsg(res.ok ? 'Сохранено в базу ✓' : res.error ?? 'Ошибка');
    if (res.ok) onSaved();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.shell}>
        <Pressable onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>✕ Закрыть</Text>
        </Pressable>
        <Text style={styles.h1}>Урок 3 — карточки и Teacher Rules</Text>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.h2}>9 карточек фраз</Text>
          {draft.phrases.map((p, i) => (
            <View key={p.id} style={[styles.card, floatingShadow]}>
              <Text style={styles.label}>{p.id}</Text>
              <TextInput
                style={styles.input}
                value={p.english}
                onChangeText={(t) => updatePhrase(i, 'english', t)}
                placeholder="English"
              />
              <TextInput
                style={styles.input}
                value={p.ipa}
                onChangeText={(t) => updatePhrase(i, 'ipa', t)}
                placeholder="IPA"
              />
              <TextInput
                style={styles.input}
                value={p.translationRu}
                onChangeText={(t) => updatePhrase(i, 'translationRu', t)}
                placeholder="Перевод RU"
              />
              <TextInput
                style={styles.input}
                value={p.imageFile}
                onChangeText={(t) => updatePhrase(i, 'imageFile', t)}
                placeholder="hello.webp"
              />
            </View>
          ))}

          <Text style={styles.h2}>Teacher Rules</Text>
          {draft.teacherRules.map((r, i) => (
            <View key={r.id} style={[styles.card, floatingShadow]}>
              <TextInput style={styles.input} value={r.title} onChangeText={(t) => updateRule(i, 'title', t)} />
              <TextInput
                style={styles.multiline}
                multiline
                value={r.bodyRu}
                onChangeText={(t) => updateRule(i, 'bodyRu', t)}
              />
            </View>
          ))}
        </ScrollView>
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}
        <FloatingButton title={saving ? 'Сохраняю…' : 'Сохранить в базу'} tone="green" onPress={save} disabled={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.sm },
  close: { alignSelf: 'flex-start' },
  closeText: { fontWeight: '800', color: colors.blueDark, fontSize: 16 },
  h1: { fontSize: 20, fontWeight: '900', color: colors.greenDark },
  h2: { fontSize: 16, fontWeight: '800', marginTop: spacing.sm },
  scroll: { gap: spacing.sm, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.greenDark,
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: { fontWeight: '800', color: colors.textSecondary },
  input: {
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
  multiline: {
    minHeight: 80,
    borderWidth: 2,
    borderColor: colors.blueDark,
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  msg: { textAlign: 'center', fontWeight: '700', color: colors.greenDark },
});