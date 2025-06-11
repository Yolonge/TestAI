import React from 'react';
import { Question } from '@/services/apiService';
import TextInputQuestion from './TextInputQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import FillBlanksQuestion from './FillBlanksQuestion';

interface QuestionContainerProps {
  question: Question;
  onSubmitAnswer: (
    answer: string | { 
      answer?: string; 
      selectedOptionIndex?: number; 
      blankValues?: string[] 
    }
  ) => Promise<void>;
  submitted: boolean;
  loading: boolean;
  timeLeft: number;
}

const QuestionContainer: React.FC<QuestionContainerProps> = (props) => {
  const { question } = props;

  // Выбираем компонент в зависимости от типа вопроса
  switch (question.questionType) {
    case 'MultipleChoice':
      return <MultipleChoiceQuestion {...props} />;
    case 'FillBlanks':
      return <FillBlanksQuestion {...props} />;
    case 'TextInput':
    default:
      return <TextInputQuestion {...props} />;
  }
};

export default QuestionContainer; 