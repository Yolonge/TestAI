import React, { useState, useEffect } from 'react';
import QuestionBase, { QuestionBaseProps } from './QuestionBase';
import CodeEditor from '../CodeEditor';

const FillBlanksQuestion: React.FC<Omit<QuestionBaseProps, 'children'>> = (props) => {
  const { question, onSubmitAnswer, submitted, loading, timeLeft } = props;
  const [blankValues, setBlankValues] = useState<string[]>([]);
  
  // Инициализация массива пустых значений при загрузке компонента
  useEffect(() => {
    if (question.blanks && question.blanks.length > 0) {
      setBlankValues(Array(question.blanks.length).fill(''));
    }
  }, [question.blanks]);
  
  const handleBlankChange = (index: number, value: string) => {
    const newValues = [...blankValues];
    newValues[index] = value;
    setBlankValues(newValues);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем, что все поля заполнены
    if (blankValues.some(val => !val.trim()) || submitted || loading || timeLeft === 0) return;
    
    // Формируем строку ответа, соединяя значения пропусков
    // Это более совместимо с ожидаемым форматом на бэкенде
    const formattedAnswer = blankValues.join(';');
    onSubmitAnswer(formattedAnswer);
  };
  
  // Определяем язык программирования из вопроса или используем Python по умолчанию
  const getLanguage = () => {
    // Определяем язык из текста вопроса
    const questionText = question.text?.toLowerCase() || '';
    
    if (questionText.includes('python')) return 'python';
    if (questionText.includes('javascript')) return 'javascript';
    if (questionText.includes('java')) return 'java';
    if (questionText.includes('c++')) return 'cpp';
    if (questionText.includes('c#')) return 'csharp';
    
    // По умолчанию используем Python
    return 'python';
  };

  return (
    <QuestionBase {...props}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-2">Заполните пропуски:</h3>
          
          {/* Используем новый компонент CodeEditor вместо простого шаблона */}
          {question.template && (
            <div className="mb-4">
              <CodeEditor
                code={question.template}
                language={getLanguage()}
                blanks={question.blanks || []}
                blankValues={blankValues}
                onBlankChange={handleBlankChange}
                readOnly={submitted || loading || timeLeft === 0}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            className={`py-2 px-4 sm:py-3 sm:px-8 rounded-lg text-white font-bold text-sm sm:text-base ${
              blankValues.some(val => !val.trim()) || submitted || loading || timeLeft === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={blankValues.some(val => !val.trim()) || submitted || loading || timeLeft === 0}
          >
            {loading ? 'Отправка...' : submitted ? 'Ответ отправлен' : 'Отправить ответ'}
          </button>
        </div>
      </form>
    </QuestionBase>
  );
};

export default FillBlanksQuestion; 