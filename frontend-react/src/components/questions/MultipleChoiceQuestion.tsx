import React, { useState } from 'react';
import QuestionBase, { QuestionBaseProps } from './QuestionBase';

const MultipleChoiceQuestion: React.FC<Omit<QuestionBaseProps, 'children'>> = (props) => {
  const { question, onSubmitAnswer, submitted, loading, timeLeft } = props;
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOptionIndex === null || submitted || loading || timeLeft === 0) return;
    
    const selectedOptionValue = question.options?.[selectedOptionIndex];
    if (selectedOptionValue) {
      onSubmitAnswer(selectedOptionValue);
    }
  };

  return (
    <QuestionBase {...props}>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Выберите правильный вариант:</h3>
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div 
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedOptionIndex === index 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                } ${submitted || timeLeft === 0 ? 'opacity-70 pointer-events-none' : ''}`}
                onClick={() => !submitted && timeLeft > 0 && setSelectedOptionIndex(index)}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    id={`option-${index}`}
                    name="option"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    checked={selectedOptionIndex === index}
                    onChange={() => setSelectedOptionIndex(index)}
                    disabled={submitted || timeLeft === 0}
                  />
                  <label 
                    htmlFor={`option-${index}`} 
                    className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {option}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            className={`py-3 px-8 rounded-lg text-white font-bold text-lg ${
              selectedOptionIndex === null || submitted || loading || timeLeft === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={selectedOptionIndex === null || submitted || loading || timeLeft === 0}
          >
            {loading ? 'Отправка...' : submitted ? 'Ответ отправлен' : 'Отправить ответ'}
          </button>
        </div>
      </form>
    </QuestionBase>
  );
};

export default MultipleChoiceQuestion; 