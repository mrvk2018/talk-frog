import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { FloatingButton } from '@/components/ui/FloatingButton';
import type { ListenRepeatStep } from '@/types/lessonSteps';
import { spacing } from '@/theme/theme';
import { MethodologyNotice } from './MethodologyNotice';
import { playLessonAudio } from './playLessonAudio';
import { PronunciationPracticeBlock } from './PronunciationPracticeBlock';
import { lessonCard } from './lessonStyles';

type Props = {
  step: ListenRepeatStep;
  passThreshold: number;
  onComplete: (scorePercent: number) => void;
};

export function ListenRepeatStepView({ step, passThreshold, onComplete }: Props) {
  const initialIndex = useMemo(() => {
    if (step.randomPick && step.items.length > 0) {
      return Math.floor(Math.random() * step.items.length);
    }
    return 0;
  }, [step.id, step.randomPick, step.items.length]);

  const [itemIndex, setItemIndex] = useState(initialIndex);
  const [listened, setListened] = useState(false);
  const [lastScore, setLastScore] = useState(70);

  const multi = !step.randomPick && step.items.length > 1;
  const item = step.items[itemIndex] ?? step.items[0];

  useEffect(() => {
    if (!item) onComplete(100);
  }, [item, onComplete]);

  if (!item) return null;

  const onListen = () => {
    playLessonAudio(item.speakText);
    setListened(true);
  };

  const goNextItem = () => {
    if (multi && itemIndex < step.items.length - 1) {
      setItemIndex((i) => i + 1);
      setListened(false);
      return;
    }
    onComplete(lastScore);
  };

  return (
    <View style={lessonCard.card}>
      <Text style={lessonCard.title}>{step.titleRu}</Text>
      {step.instructionsRu ? <Text style={lessonCard.instructions}>{step.instructionsRu}</Text> : null}

      <Text style={lessonCard.heroDisplay}>{item.display}</Text>
      {item.transcription ? <Text style={lessonCard.ipa}>{item.transcription}</Text> : null}
      {item.hintRu ? <Text style={lessonCard.hint}>{item.hintRu}</Text> : null}

      <FloatingButton title="🔊 Прослушать" tone="blue" size="lg" onPress={onListen} />

      <PronunciationPracticeBlock
        expectedText={item.speakText}
        passThreshold={passThreshold}
        onScore={(s) => setLastScore(s.similarityPercent)}
      />

      {multi ? (
        <Text style={lessonCard.hint}>
          Карточка {itemIndex + 1} / {step.items.length}
        </Text>
      ) : null}

      <FloatingButton
        title={multi && itemIndex < step.items.length - 1 ? 'Следующая карточка' : 'Далее'}
        tone="green"
        size="lg"
        onPress={goNextItem}
        disabled={!listened && step.isFinalTest}
      />
    </View>
  );
}