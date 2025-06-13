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
    <div className="bg-gray-50 p-3 sm:p-4 md:p-6 rounded-lg mb-4 sm:mb-6">
      <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-gray-900">Вопрос:</h2>
      <div className="text-base sm:text-lg whitespace-pre-wrap text-gray-900 mb-4 sm:mb-6">{question.text}</div>
      
      {children}
      
      {submitted && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-100 text-green-700 rounded-lg text-center">
          <p className="font-medium text-sm sm:text-base">Ваш ответ принят. Ожидаем ответа оппонента или завершения таймера.</p>
        </div>
      )}
    </div>
  );
};

export default QuestionBase; 