import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import type { CustomInputSpeakStep } from '@/types/lessonSteps';
import { MethodologyNotice } from './MethodologyNotice';
import { spellOutText } from '@/utils/speech';
import { PronunciationPracticeBlock } from './PronunciationPracticeBlock';
import { lessonCard } from './lessonStyles';

type Props = {
  step: CustomInputSpeakStep;
  passThreshold: number;
  onComplete: (scorePercent: number) => void;
};

export function CustomInputSpeakStepView({ step, passThreshold, onComplete }: Props) {
  const [value, setValue] = useState('');
  const [scorePercent, setScorePercent] = useState(0);
  const [checked, setChecked] = useState(false);

  const onListenSpell = () => {
    if (!value.trim()) return;
    spellOutText(value);
  };

  const expectedForMic =
    step.inputKind === 'phone'
      ? value.replace(/[^\d+]/g, '')
      : value.replace(/\s+/g, ' ').trim();

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{step.titleRu}</Text>
      <MethodologyNotice text={step.ruleNoteRu} title="Как говорить" />

      <Text style={lessonCard.instructions}>{step.inputLabelRu}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={step.placeholder}
        style={lessonCard.input}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={step.inputKind === 'phone' ? 'phone-pad' : 'default'}
      />

      <FloatingButton
        title="🔊 Послушать по буквам / цифрам"
        tone="blue"
        size="lg"
        onPress={onListenSpell}
        disabled={!value.trim()}
      />

      {value.trim() ? (
        <PronunciationPracticeBlock
          expectedText={expectedForMic}
          passThreshold={passThreshold}
          label="Произнесите вслух"
          onScore={(s) => {
            setScorePercent(s.similarityPercent);
            setChecked(s.isPassed);
          }}
        />
      ) : null}

      <FloatingButton
        title="Засчитать / Далее"
        tone="green"
        size="lg"
        onPress={() => onComplete(checked ? scorePercent : Math.max(scorePercent, 55))}
        disabled={!value.trim()}
      />
    </View>
  );
}