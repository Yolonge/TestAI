import React, { useState } from 'react';
import QuestionBase, { QuestionBaseProps } from './QuestionBase';

const TextInputQuestion: React.FC<Omit<QuestionBaseProps, 'children'>> = (props) => {
  const { onSubmitAnswer, submitted, loading, timeLeft } = props;
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || submitted || loading || timeLeft === 0) return;
    onSubmitAnswer(answer);
  };

  return (
    <QuestionBase {...props}>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="answer" className="block text-lg font-medium text-gray-700 mb-2">
            Ваш ответ:
          </label>
          <input
            type="text"
            id="answer"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitted || loading || timeLeft === 0}
            placeholder="Введите ответ здесь..."
          />
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            className={`py-3 px-8 rounded-lg text-white font-bold text-lg ${
              submitted || loading || timeLeft === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={submitted || loading || timeLeft === 0}
          >
            {loading ? 'Отправка...' : submitted ? 'Ответ отправлен' : 'Отправить ответ'}
          </button>
        </div>
      </form>
    </QuestionBase>
  );
};

export default TextInputQuestion; 