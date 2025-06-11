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
    
    let parts = question.template.split('__');
    let result = [];
    
    for (let i = 0; i < parts.length; i++) {
      // Добавляем текст части шаблона
      result.push(<span key={`part-${i}`}>{parts[i]}</span>);
      
      // Добавляем поле ввода после каждой части, кроме последней
      if (i < parts.length - 1) {
        result.push(
          <input
            key={`input-${i}`}
            type="text"
            className="mx-1 p-1 border border-gray-300 rounded w-24 text-center"
            value={blankValues[i] || ''}
            onChange={(e) => handleBlankChange(i, e.target.value)}
            disabled={submitted || loading || timeLeft === 0}
            placeholder={question.blanks?.[i] || '...'}
          />
        );
      }
    }
    
    return <div className="bg-gray-100 p-4 rounded-lg font-mono text-lg mb-4">{result}</div>;
  };

  return (
    <QuestionBase {...props}>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Заполните пропуски:</h3>
          
          {renderTemplate()}
          
          <div className="mt-6">
            {question.blanks?.map((blank, index) => (
              <div key={index} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {blank}:
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={blankValues[index] || ''}
                  onChange={(e) => handleBlankChange(index, e.target.value)}
                  disabled={submitted || loading || timeLeft === 0}
                  placeholder={`Введите ${blank}`}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            className={`py-3 px-8 rounded-lg text-white font-bold text-lg ${
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