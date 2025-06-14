'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import apiService from '@/services/apiService';

// Типы вопросов
enum QuestionType {
  TextInput = 0,
  MultipleChoice = 1,
  FillBlanks = 2
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('duels');
  
  // Состояния для формы создания вопроса
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.TextInput);
  const [questionText, setQuestionText] = useState<string>('');
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(1);
  const [category, setCategory] = useState<string>('C#');
  
  // Для вопросов с выбором вариантов
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  
  // Для вопросов с заполнением пропусков
  const [template, setTemplate] = useState<string>('');
  const [blanks, setBlanks] = useState<string[]>(['']);
  
  // Список категорий
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Проверяем, что пользователь авторизован и является админом
    if (!user || !isAdmin) {
      router.push('/auth/login');
    } else {
      // Загружаем категории вопросов
      loadCategories();
    }
  }, [user, isAdmin, router]);
  
  // Загрузка категорий вопросов
  const loadCategories = async () => {
    try {
      const categoriesData = await apiService.getQuestionCategories();
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setCategory(categoriesData[0]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке категорий:', error);
      setMessage('Не удалось загрузить категории вопросов');
      setIsError(true);
    }
  };

  const handleCompleteAllDuels = async () => {
    if (!user || !isAdmin) {
      setMessage('Только администратор может выполнить эту операцию');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await apiService.completeAllDuels();
      setMessage(response.message || 'Все активные дуэли успешно завершены');
      setIsError(false);
    } catch (error) {
      console.error('Ошибка при завершении дуэлей:', error);
      setMessage('Произошла ошибка при попытке завершить дуэли');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Обработчик добавления варианта ответа
  const handleAddOption = () => {
    setOptions([...options, '']);
  };
  
  // Обработчик удаления варианта ответа
  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setMessage('Должно быть минимум 2 варианта ответа');
      setIsError(true);
      return;
    }
    
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
    
    // Если удаляем правильный вариант, сбрасываем на первый
    if (correctOptionIndex === index) {
      setCorrectOptionIndex(0);
    } else if (correctOptionIndex > index) {
      // Если удаляем вариант перед правильным, корректируем индекс
      setCorrectOptionIndex(correctOptionIndex - 1);
    }
  };
  
  // Обработчик изменения варианта ответа
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  
  // Обработчик добавления пропуска
  const handleAddBlank = () => {
    setBlanks([...blanks, '']);
  };
  
  // Обработчик удаления пропуска
  const handleRemoveBlank = (index: number) => {
    if (blanks.length <= 1) {
      setMessage('Должен быть минимум 1 пропуск');
      setIsError(true);
      return;
    }
    
    const newBlanks = [...blanks];
    newBlanks.splice(index, 1);
    setBlanks(newBlanks);
  };
  
  // Обработчик изменения пропуска
  const handleBlankChange = (index: number, value: string) => {
    const newBlanks = [...blanks];
    newBlanks[index] = value;
    setBlanks(newBlanks);
  };
  
  // Сброс формы
  const resetForm = () => {
    setQuestionText('');
    setCorrectAnswer('');
    setExplanation('');
    setDifficulty(1);
    setOptions(['', '']);
    setCorrectOptionIndex(0);
    setTemplate('');
    setBlanks(['']);
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isAdmin) {
      setMessage('Только администратор может выполнить эту операцию');
      setIsError(true);
      return;
    }
    
    if (!questionText.trim()) {
      setMessage('Текст вопроса обязателен');
      setIsError(true);
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    setIsError(false);
    
    try {
      let response;
      
      switch (questionType) {
        case QuestionType.TextInput:
          if (!correctAnswer.trim()) {
            setMessage('Правильный ответ обязателен');
            setIsError(true);
            setIsLoading(false);
            return;
          }
          
          response = await apiService.createTextInputQuestion({
            text: questionText,
            correctAnswer,
            category,
            difficulty,
            explanation: explanation || undefined
          });
          break;
          
        case QuestionType.MultipleChoice:
          // Проверка на пустые варианты
          if (options.some(opt => !opt.trim())) {
            setMessage('Все варианты ответов должны быть заполнены');
            setIsError(true);
            setIsLoading(false);
            return;
          }
          
          response = await apiService.createMultipleChoiceQuestion({
            text: questionText,
            options,
            correctOptionIndex,
            category,
            difficulty,
            explanation: explanation || undefined
          });
          break;
          
        case QuestionType.FillBlanks:
          if (!template.trim()) {
            setMessage('Шаблон с пропусками обязателен');
            setIsError(true);
            setIsLoading(false);
            return;
          }
          
          // Проверка на пустые значения пропусков
          if (blanks.some(blank => !blank.trim())) {
            setMessage('Все значения пропусков должны быть заполнены');
            setIsError(true);
            setIsLoading(false);
            return;
          }
          
          if (!correctAnswer.trim()) {
            setMessage('Правильный ответ обязателен');
            setIsError(true);
            setIsLoading(false);
            return;
          }
          
          response = await apiService.createFillBlanksQuestion({
            text: questionText,
            template,
            blanks,
            correctAnswer,
            category,
            difficulty,
            explanation: explanation || undefined
          });
          break;
      }
      
      setMessage('Вопрос успешно создан');
      setIsError(false);
      resetForm();
    } catch (error) {
      console.error('Ошибка при создании вопроса:', error);
      setMessage('Произошла ошибка при создании вопроса');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !isAdmin) {
    return null; // Скрываем содержимое страницы до проверки авторизации
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Панель администратора</h1>
      
      {message && (
        <div 
          className={`${isError ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} 
                     border px-4 py-3 rounded mb-4`} 
          role="alert"
        >
          <span className="block sm:inline">{message}</span>
        </div>
      )}
      
      {/* Вкладки */}
      <div className="mb-4 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button 
              onClick={() => setActiveTab('duels')}
              className={`inline-block p-4 ${activeTab === 'duels' ? 
                'text-blue-600 border-b-2 border-blue-600' : 
                'text-gray-500 hover:text-gray-700'}`}
            >
              Управление дуэлями
            </button>
          </li>
          <li className="mr-2">
            <button 
              onClick={() => setActiveTab('questions')}
              className={`inline-block p-4 ${activeTab === 'questions' ? 
                'text-blue-600 border-b-2 border-blue-600' : 
                'text-gray-500 hover:text-gray-700'}`}
            >
              Добавление вопросов
            </button>
          </li>
        </ul>
      </div>
      
      {/* Содержимое вкладок */}
      {activeTab === 'duels' && (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Управление дуэлями</h2>
          <button 
            onClick={handleCompleteAllDuels}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isLoading ? 'Завершение...' : 'Завершить все активные дуэли'}
          </button>
          <p className="text-sm text-black-600 mt-2">
            Нажатие на эту кнопку принудительно завершит все текущие активные дуэли.
          </p>
        </div>
      )}
      
      {activeTab === 'questions' && (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Добавление вопросов</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Тип вопроса */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Тип вопроса
              </label>
              <select 
                value={questionType}
                onChange={(e) => setQuestionType(Number(e.target.value) as QuestionType)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value={QuestionType.TextInput}>Текстовый ввод</option>
                <option value={QuestionType.MultipleChoice}>Выбор варианта</option>
                <option value={QuestionType.FillBlanks}>Заполнение пропусков</option>
              </select>
            </div>
            
            {/* Текст вопроса */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Текст вопроса *
              </label>
              <textarea 
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={3}
                required
              />
            </div>
            
            {/* Категория */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Категория *
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* Сложность */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Сложность *
              </label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value={1}>Легкий (1)</option>
                <option value={2}>Средний (2)</option>
                <option value={3}>Сложный (3)</option>
              </select>
            </div>
            
            {/* Поля в зависимости от типа вопроса */}
            {questionType === QuestionType.TextInput && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Правильный ответ *
                </label>
                <input 
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            )}
            
            {questionType === QuestionType.MultipleChoice && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Варианты ответов *
                </label>
                {options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input 
                      type="radio"
                      checked={correctOptionIndex === index}
                      onChange={() => setCorrectOptionIndex(index)}
                      className="mr-2"
                    />
                    <input 
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="shadow appearance-none border rounded flex-grow py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder={`Вариант ${index + 1}`}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                    >
                      X
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={handleAddOption}
                  className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                >
                  Добавить вариант
                </button>
                <p className="text-sm text-gray-600 mt-1">
                  Выберите правильный вариант, отметив его радиокнопкой.
                </p>
              </div>
            )}
            
            {questionType === QuestionType.FillBlanks && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Шаблон с пропусками * (используйте __ для обозначения пропусков)
                  </label>
                  <textarea 
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows={3}
                    placeholder="Пример: n = Convert.ToInt32(__);"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Значения пропусков *
                  </label>
                  {blanks.map((blank, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input 
                        type="text"
                        value={blank}
                        onChange={(e) => handleBlankChange(index, e.target.value)}
                        className="shadow appearance-none border rounded flex-grow py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder={`Значение пропуска ${index + 1}`}
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveBlank(index)}
                        className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                      >
                        X
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={handleAddBlank}
                    className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                  >
                    Добавить пропуск
                  </button>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Правильный ответ *
                  </label>
                  <input 
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </>
            )}
            
            {/* Объяснение (для всех типов) */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Объяснение (необязательно)
              </label>
              <textarea 
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button 
                type="submit"
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {isLoading ? 'Создание...' : 'Создать вопрос'}
              </button>
              <button 
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Очистить форму
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 