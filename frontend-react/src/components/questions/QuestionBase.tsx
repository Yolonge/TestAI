import React, { ReactNode } from 'react';
import { Question } from '@/services/apiService';

export interface QuestionBaseProps {
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
  children?: ReactNode;
}

const QuestionBase: React.FC<QuestionBaseProps> = ({ 
  question, 
  onSubmitAnswer, 
  submitted, 
  loading, 
  timeLeft,
  children
}) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Вопрос:</h2>
      <div className="text-lg whitespace-pre-wrap text-gray-900 mb-6">{question.text}</div>
      
      {children}
      
      {submitted && (
        <div className="mt-6 p-4 bg-green-100 text-green-700 rounded-lg text-center">
          <p className="font-medium">Ваш ответ принят. Ожидаем ответа оппонента или завершения таймера.</p>
        </div>
      )}
    </div>
  );
};

export default QuestionBase; 