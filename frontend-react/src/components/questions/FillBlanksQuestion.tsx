import React, { useState, useEffect } from 'react';
import QuestionBase, { QuestionBaseProps } from './QuestionBase';

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
  
  // Функция для рендеринга шаблона с полями ввода
  const renderTemplate = () => {
    if (!question.template) return null;
    
    // Разбиваем шаблон на строки для сохранения переносов строк
    const lines = question.template.split('\n');
    const result: React.ReactNode[] = [];
    let blankIndex = 0;
    
    // Обрабатываем каждую строку отдельно
    lines.forEach((line, lineIndex) => {
      const parts = line.split('__');
      const lineElements: React.ReactNode[] = [];
      
      // Обрабатываем части строки
      for (let i = 0; i < parts.length; i++) {
        // Добавляем текст части шаблона с сохранением отступов
        lineElements.push(
          <span key={`part-${lineIndex}-${i}`} className="whitespace-pre">
            {parts[i]}
          </span>
        );
        
        // Добавляем поле ввода после каждой части, кроме последней
        if (i < parts.length - 1) {
          const currentBlankIndex = blankIndex;
          
          lineElements.push(
            <input
              key={`input-${lineIndex}-${i}`}
              type="text"
              className="mx-1 p-1 border border-gray-300 rounded w-20 sm:w-28 text-center text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={blankValues[currentBlankIndex] || ''}
              onChange={(e) => handleBlankChange(currentBlankIndex, e.target.value)}
              disabled={submitted || loading || timeLeft === 0}
              aria-label={`Поле ввода ${currentBlankIndex + 1}`}
            />
          );
          blankIndex++;
        }
      }
      
      // Добавляем строку с элементами
      result.push(
        <div key={`line-${lineIndex}`} className="flex flex-wrap items-center">
          {lineElements}
        </div>
      );
    });
    
    return (
      <div className="bg-gray-100 p-3 sm:p-4 rounded-lg font-mono text-base sm:text-lg mb-3 sm:mb-4 text-gray-800 overflow-x-auto">
        <div className="whitespace-pre-wrap">{result}</div>
      </div>
    );
  };

  return (
    <QuestionBase {...props}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-2">Заполните пропуски:</h3>
          
          {renderTemplate()}
          
          <div className="flex justify-center mt-6">
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
        </div>
      </form>
    </QuestionBase>
  );
};

export default FillBlanksQuestion; 