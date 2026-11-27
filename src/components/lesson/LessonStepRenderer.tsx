import type { LessonStep } from '@/types/lessonSteps';
import { AudioChoiceStepView } from './AudioChoiceStepView';
import { CategorySortStepView } from './CategorySortStepView';
import { CustomInputSpeakStepView } from './CustomInputSpeakStepView';
import { ListenRepeatStepView } from './ListenRepeatStepView';
import { PairMatchStepView } from './PairMatchStepView';
import { VisualChoiceStepView } from './VisualChoiceStepView';

type Props = {
  step: LessonStep;
  passThreshold: number;
  onComplete: (scorePercent: number) => void;
};

export function LessonStepRenderer({ step, passThreshold, onComplete }: Props) {
  switch (step.stepType) {
    case 'listen_repeat':
      return <ListenRepeatStepView step={step} passThreshold={passThreshold} onComplete={onComplete} />;
    case 'audio_choice':
      return <AudioChoiceStepView step={step} onComplete={onComplete} />;
    case 'visual_choice':
      return <VisualChoiceStepView step={step} onComplete={onComplete} />;
    case 'category_sort':
      return <CategorySortStepView step={step} onComplete={onComplete} />;
    case 'pair_match':
      return <PairMatchStepView step={step} onComplete={onComplete} />;
    case 'custom_input_speak':
      return <CustomInputSpeakStepView step={step} passThreshold={passThreshold} onComplete={onComplete} />;
    default:
      return null;
  }
}